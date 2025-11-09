# Staff Authentication Setup Guide

## Struktura e re e Staff JSON

Pas migration, çdo staff member në `business.staff` JSON do të ketë këtë strukturë:

```json
{
  "name": "John Doe",
  "email": "john@business.com",
  "password": "$2b$10$hashedPasswordHere", // Hash i password-it (bcrypt)
  "phone": "+383 44 123 456",
  "services": ["Service 1", "Service 2"],
  "role": "STAFF", // ose "MANAGER"
  "isActive": true,
  "operatingHours": { /* orari specifik */ },
  "breakTimes": [ /* kohët e pauzës */ ]
}
```

## Role Types

- **STAFF**: Shikon vetëm rezervimet e tyre
- **MANAGER**: Shikon të gjitha rezervimet e biznesit (si business owner)

## Hapat për Setup

### 1. Run Migration në Supabase

1. Hap Supabase Dashboard
2. Shko te **SQL Editor**
3. Kopjo përmbajtjen e `migration_add_staff_password_role.sql`
4. Ekzekuto query-në

### 2. Set Password për Staff Ekzistues

Pas migration, staff members do të kenë `password: null`. Duhet të vendosni password për çdo staff:

**Opsioni A: Nëpërmjet Admin Panel**
- Krijo një formular në admin panel për të vendosur password për staff

**Opsioni B: Nëpërmjet SQL (për test)**
```sql
-- Përditëso password për një staff specifik
UPDATE businesses
SET staff = (
  SELECT jsonb_agg(
    CASE 
      WHEN staff_member->>'email' = 'staff@example.com' 
      THEN staff_member || jsonb_build_object(
        'password', '$2b$10$YourHashedPasswordHere'
      )
      ELSE staff_member
    END
  )
  FROM jsonb_array_elements(staff) AS staff_member
)
WHERE id = 1; -- Business ID
```

**Opsioni C: Nëpërmjet API (rekomanduar)**
- Krijo API endpoint për të përditësuar password të staff

### 3. Struktura e Password Hash

Password duhet të jetë hash me bcrypt (10 rounds):
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('plainPassword', 10);
// Rezultati: $2b$10$...
```

## API Endpoints që duhen krijuar

1. **POST `/api/staff/login`** - Login për staff
2. **PUT `/api/staff/[id]/password`** - Update password për staff
3. **GET `/api/staff/[id]`** - Get staff details

## Frontend Changes

1. **`components/login-form.tsx`** - Shto staff login check
2. **`app/rezervimet/page.tsx`** - Filtro rezervimet sipas role
3. **`components/header.tsx`** - Shfaq user type (business/staff)

## Notes

- Staff me `password: null` nuk mund të bëjnë login
- Business owner përdor `accountEmail` dhe `accountPassword` (si tani)
- Staff përdor `email` dhe `password` nga JSON
- Nëse staff ka `role: 'MANAGER'`, shikon të gjitha rezervimet

