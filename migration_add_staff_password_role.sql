-- =====================================================
-- Migration: Add password and role to staff JSON
-- =====================================================
-- Description: Adds 'password' and 'role' fields to existing staff JSON objects
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Update all existing staff JSON to include password and role
DO $$
DECLARE
    business_record RECORD;
    staff_array JSONB;
    updated_staff JSONB;
    staff_member JSONB;
    i INTEGER;
BEGIN
    -- Loop through all businesses that have staff
    FOR business_record IN 
        SELECT id, staff 
        FROM businesses 
        WHERE staff IS NOT NULL 
        AND jsonb_typeof(staff) = 'array'
        AND jsonb_array_length(staff) > 0
    LOOP
        updated_staff := '[]'::JSONB;
        staff_array := business_record.staff;
        
        -- Loop through each staff member
        FOR i IN 0..jsonb_array_length(staff_array) - 1 LOOP
            staff_member := staff_array->i;
            
            -- Add password field if it doesn't exist (set to NULL - must be set manually)
            IF NOT (staff_member ? 'password') OR staff_member->>'password' IS NULL OR staff_member->>'password' = '' THEN
                staff_member := staff_member || jsonb_build_object('password', NULL);
            END IF;
            
            -- Add role field if it doesn't exist (default to 'STAFF')
            IF NOT (staff_member ? 'role') OR staff_member->>'role' IS NULL OR staff_member->>'role' = '' THEN
                staff_member := staff_member || jsonb_build_object('role', 'STAFF');
            END IF;
            
            -- Ensure isActive exists (default to true)
            IF NOT (staff_member ? 'isActive') THEN
                staff_member := staff_member || jsonb_build_object('isActive', true);
            END IF;
            
            -- Add to updated array
            updated_staff := updated_staff || jsonb_build_array(staff_member);
        END LOOP;
        
        -- Update the business with updated staff array
        UPDATE businesses 
        SET staff = updated_staff,
            updated_at = NOW()
        WHERE id = business_record.id;
        
        RAISE NOTICE 'Updated business ID: % (Name: %) with % staff members', 
            business_record.id, 
            (SELECT name FROM businesses WHERE id = business_record.id),
            jsonb_array_length(updated_staff);
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Step 2: Verify the update - Check a few businesses
SELECT 
    id,
    name,
    jsonb_array_length(staff) as staff_count,
    jsonb_pretty(
        jsonb_array_elements(staff)
    ) as staff_member_sample
FROM businesses 
WHERE staff IS NOT NULL 
AND jsonb_typeof(staff) = 'array'
AND jsonb_array_length(staff) > 0
LIMIT 3;

-- Step 3: Count businesses with staff that need password setup
SELECT 
    COUNT(*) as businesses_with_staff,
    SUM(
        (SELECT COUNT(*) 
         FROM jsonb_array_elements(staff) as staff_member
         WHERE (staff_member->>'password') IS NULL 
         OR (staff_member->>'password') = '')
    ) as staff_members_needing_password
FROM businesses 
WHERE staff IS NOT NULL 
AND jsonb_typeof(staff) = 'array'
AND jsonb_array_length(staff) > 0;

