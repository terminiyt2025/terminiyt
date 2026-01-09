-- Migration: Add login_attempts table for account lockout functionality
-- This table tracks failed login attempts and implements account lockout after 5 failed attempts for 30 minutes
-- 
-- To run this migration:
-- 1. Connect to your PostgreSQL database
-- 2. Execute this SQL script
-- OR
-- 2. Use Prisma: npx prisma migrate dev --name add_login_attempts

CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lockedUntil" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on email (already enforced by UNIQUE constraint, but explicit for clarity)
CREATE UNIQUE INDEX IF NOT EXISTS "login_attempts_email_key" ON "login_attempts"("email");

-- Create index on lockedUntil for faster queries when checking lockout status
CREATE INDEX IF NOT EXISTS "login_attempts_lockedUntil_idx" ON "login_attempts"("lockedUntil");

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "login_attempts_email_idx" ON "login_attempts"("email");

-- Add comment to table
COMMENT ON TABLE "login_attempts" IS 'Tracks failed login attempts and implements account lockout after 5 failed attempts for 30 minutes';

-- Optional: If you need to drop the table (for rollback), uncomment the line below:
-- DROP TABLE IF EXISTS "login_attempts" CASCADE;

