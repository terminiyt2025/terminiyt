import { prisma } from '@/lib/database-prisma'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 10

/**
 * Check if an email is currently locked out
 * @param email - The email to check
 * @returns Object with isLocked status and remaining minutes if locked
 */
export async function checkLoginLockout(email: string): Promise<{
  isLocked: boolean
  remainingMinutes?: number
}> {
  // Use raw SQL query as fallback if Prisma client hasn't been regenerated
  try {
    // Use SQL to explicitly check for NULL lockedUntil
    const attempts = await prisma.$queryRaw<Array<{
      id: number
      email: string
      attempts: number
      lockedUntil: Date | null
      created_at: Date
      updated_at: Date
    }>>`
      SELECT * FROM "login_attempts" 
      WHERE "email" = ${email} 
        AND "lockedUntil" IS NOT NULL
        AND "lockedUntil" > NOW()
      LIMIT 1
    `

    const attempt = attempts[0]

    if (!attempt) {
      return { isLocked: false }
    }

    const now = new Date()
    const lockedUntil = new Date(attempt.lockedUntil!)
    
    const remainingMs = lockedUntil.getTime() - now.getTime()
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
    return {
      isLocked: true,
      remainingMinutes
    }

    // Lockout expired, reset attempts
    await prisma.$executeRaw`
      DELETE FROM "login_attempts" WHERE "email" = ${email}
    `

    return { isLocked: false }
  } catch (error) {
    // If table doesn't exist yet, return not locked
    console.error('Error checking login lockout:', error)
    return { isLocked: false }
  }
}

/**
 * Record a failed login attempt
 * @param email - The email that failed to login
 * @returns Object with isLocked status and remaining minutes if locked
 */
export async function recordFailedAttempt(email: string): Promise<{
  isLocked: boolean
  remainingMinutes?: number
  attemptsRemaining?: number
}> {
  try {
    // Use raw SQL query as fallback if Prisma client hasn't been regenerated
    const attempts = await prisma.$queryRaw<Array<{
      id: number
      email: string
      attempts: number
      lockedUntil: Date | null
      created_at: Date
      updated_at: Date
    }>>`
      SELECT * FROM "login_attempts" WHERE "email" = ${email} LIMIT 1
    `

    const attempt = attempts[0]
    const now = new Date()
    let newAttempts = 1
    let lockedUntil: Date | null = null

    console.log(`[DEBUG] recordFailedAttempt for ${email}:`, {
      hasAttempt: !!attempt,
      currentAttempts: attempt?.attempts,
      lockedUntil: attempt?.lockedUntil
    })

    if (attempt) {
      // Check if lockout has expired
      if (attempt.lockedUntil) {
        const lockedUntilDate = new Date(attempt.lockedUntil)
        console.log(`[DEBUG] Account has lockedUntil: ${lockedUntilDate}, now: ${now}, isLocked: ${lockedUntilDate > now}`)
        if (lockedUntilDate > now) {
          const remainingMs = lockedUntilDate.getTime() - now.getTime()
          const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
          return {
            isLocked: true,
            remainingMinutes
          }
        }
      }

      // If lockout expired, reset
      if (attempt.lockedUntil && new Date(attempt.lockedUntil) <= now) {
        console.log(`[DEBUG] Lockout expired, resetting attempts`)
        await prisma.$executeRaw`
          DELETE FROM "login_attempts" WHERE "email" = ${email}
        `
        newAttempts = 1
      } else {
        // Increment attempts - this is the normal flow when no lockout exists
        // Ensure attempts is a number (SQL might return it as string)
        const currentAttempts = typeof attempt.attempts === 'number' ? attempt.attempts : parseInt(String(attempt.attempts || '0'), 10)
        newAttempts = currentAttempts + 1
        console.log(`[DEBUG] Incrementing attempts: ${currentAttempts} -> ${newAttempts}`)
      }
    } else {
      console.log(`[DEBUG] No existing attempt record, starting with 1`)
    }

    // Check if we should lock the account
    // Lockout happens AFTER the 5th failed attempt (attempts 1-4 are allowed)
    // When newAttempts reaches 5, we lock the account
    // IMPORTANT: We only lock when newAttempts is EXACTLY 5 or more
    console.log(`[DEBUG] Checking lockout: newAttempts=${newAttempts}, MAX_ATTEMPTS=${MAX_ATTEMPTS}, shouldLock=${newAttempts >= MAX_ATTEMPTS}`)
    if (newAttempts >= MAX_ATTEMPTS) {
      lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
      console.log(`[DEBUG] Setting lockout until: ${lockedUntil}`)
    }

    // Update or create the attempt record using raw SQL
    // Handle NULL for lockedUntil explicitly
    if (attempt) {
      if (lockedUntil) {
        await prisma.$executeRaw`
          UPDATE "login_attempts" 
          SET "attempts" = ${newAttempts}, 
              "lockedUntil" = ${lockedUntil},
              "updated_at" = ${now}
          WHERE "email" = ${email}
        `
      } else {
        await prisma.$executeRaw`
          UPDATE "login_attempts" 
          SET "attempts" = ${newAttempts}, 
              "lockedUntil" = NULL,
              "updated_at" = ${now}
          WHERE "email" = ${email}
        `
      }
    } else {
      if (lockedUntil) {
        await prisma.$executeRaw`
          INSERT INTO "login_attempts" ("email", "attempts", "lockedUntil", "created_at", "updated_at")
          VALUES (${email}, ${newAttempts}, ${lockedUntil}, ${now}, ${now})
        `
      } else {
        await prisma.$executeRaw`
          INSERT INTO "login_attempts" ("email", "attempts", "lockedUntil", "created_at", "updated_at")
          VALUES (${email}, ${newAttempts}, NULL, ${now}, ${now})
        `
      }
    }

    // Only return locked if we actually set lockedUntil
    // This ensures we only lock after MAX_ATTEMPTS (5) failed attempts
    if (lockedUntil) {
      console.log(`[Login Attempts] Account ${email} locked after ${newAttempts} attempts`)
      return {
        isLocked: true,
        remainingMinutes: LOCKOUT_DURATION_MINUTES,
        attemptsRemaining: 0
      }
    }

    const attemptsRemaining = MAX_ATTEMPTS - newAttempts
    console.log(`[Login Attempts] Account ${email} has ${newAttempts} failed attempts, ${attemptsRemaining} remaining before lockout`)
    return {
      isLocked: false,
      attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0
    }
  } catch (error) {
    // If table doesn't exist yet, return not locked
    console.error('Error recording failed attempt:', error)
    return {
      isLocked: false,
      attemptsRemaining: MAX_ATTEMPTS - 1
    }
  }
}

/**
 * Clear failed login attempts on successful login
 * @param email - The email that successfully logged in
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM "login_attempts" WHERE "email" = ${email}
    `
  } catch (error) {
    // Ignore if table doesn't exist or record doesn't exist
    console.error('Error clearing failed attempts:', error)
  }
}

