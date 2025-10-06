-- Add serviceDuration column to bookings table
ALTER TABLE bookings 
ADD COLUMN service_duration INTEGER;

-- Add comment to the column
COMMENT ON COLUMN bookings.service_duration IS 'Service duration in minutes';

-- Update existing bookings to have a default service duration of 30 minutes
-- This ensures all existing bookings have a duration for time slot blocking logic
UPDATE bookings 
SET service_duration = 30 
WHERE service_duration IS NULL;

-- Update existing PENDING bookings to ACTIVE status
UPDATE bookings 
SET status = 'ACTIVE' 
WHERE status = 'PENDING';

-- Add ACTIVE to the BookingStatus enum
-- First, create a new enum with ACTIVE included
CREATE TYPE booking_status_new AS ENUM ('PENDING', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Update the column to use the new enum
ALTER TABLE bookings 
ALTER COLUMN status TYPE booking_status_new 
USING status::text::booking_status_new;

-- Drop the old enum and rename the new one
DROP TYPE booking_status;
ALTER TYPE booking_status_new RENAME TO booking_status;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('service_duration', 'status');

-- Show updated enum values
SELECT unnest(enum_range(NULL::booking_status)) AS booking_status_values;
