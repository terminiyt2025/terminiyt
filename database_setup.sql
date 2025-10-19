-- Complete Database Setup for Booking System
-- Run this SQL in your Supabase SQL editor

-- Create enum for booking status
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Create categories table
CREATE TABLE "categories" (
    "id" SMALLSERIAL PRIMARY KEY,
    "name" VARCHAR UNIQUE NOT NULL,
    "slug" VARCHAR UNIQUE NOT NULL,
    "icon" VARCHAR,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create businesses table
CREATE TABLE "businesses" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR UNIQUE NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "owner_name" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "city" VARCHAR NOT NULL,
    "state" VARCHAR NOT NULL,
    "google_maps_link" VARCHAR,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "website" VARCHAR,
    "instagram" VARCHAR,
    "facebook" VARCHAR,
    "logo" VARCHAR,
    "business_images" VARCHAR,
    "account_email" VARCHAR NOT NULL,
    "account_password" VARCHAR NOT NULL,
    "operating_hours" JSONB,
    "services" JSONB,
    "staff" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create business_locations table
CREATE TABLE "business_locations" (
    "id" SERIAL PRIMARY KEY,
    "business_id" INTEGER NOT NULL,
    "city" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create bookings table
CREATE TABLE "bookings" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER,
    "business_id" INTEGER NOT NULL,
    "service_name" VARCHAR,
    "staff_name" VARCHAR,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "appointment_time" VARCHAR NOT NULL,
    "customer_name" VARCHAR NOT NULL,
    "customer_email" VARCHAR NOT NULL,
    "customer_phone" VARCHAR NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "total_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create blocked_slots table
CREATE TABLE "blocked_slots" (
    "id" SERIAL PRIMARY KEY,
    "business_id" INTEGER NOT NULL,
    "staff_name" VARCHAR,
    "date" DATE NOT NULL,
    "start_time" VARCHAR NOT NULL,
    "end_time" VARCHAR NOT NULL,
    "reason" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_pattern" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create super_admins table
CREATE TABLE "super_admins" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR UNIQUE NOT NULL,
    "password" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "businesses_category_id_idx" ON "businesses"("category_id");
CREATE INDEX "businesses_slug_idx" ON "businesses"("slug");
CREATE INDEX "businesses_is_active_idx" ON "businesses"("is_active");
CREATE INDEX "business_locations_business_id_idx" ON "business_locations"("business_id");
CREATE INDEX "bookings_business_id_idx" ON "bookings"("business_id");
CREATE INDEX "bookings_appointment_date_idx" ON "bookings"("appointment_date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "blocked_slots_business_id_idx" ON "blocked_slots"("business_id");
CREATE INDEX "blocked_slots_date_idx" ON "blocked_slots"("date");
CREATE INDEX "blocked_slots_staff_name_idx" ON "blocked_slots"("staff_name");

-- Insert sample categories
INSERT INTO "categories" ("name", "slug", "icon") VALUES
('Restorante', 'restorante', '🍽️'),
('Salon bukurie', 'salon-bukurie', '💅'),
('Fitness', 'fitness', '💪'),
('Mjekësi', 'mjekesi', '🏥'),
('Edukim', 'edukim', '📚'),
('Auto', 'auto', '🚗'),
('Teknologji', 'teknologji', '💻'),
('Tjeter', 'tjeter', '📋');

-- Insert sample super admin (password: admin123 - you should change this)
INSERT INTO "super_admins" ("email", "password", "name") VALUES
('admin@terminyt.com', '$2b$10$rQZ8K9mXvF2nH3jL4pQ5Ou6rS7tU8vW9xY0zA1bC2dE3fG4hI5jK6lM7nO8pQ', 'Super Admin');

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blocked_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "super_admins" ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON "categories" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "businesses" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "business_locations" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "bookings" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "blocked_slots" FOR SELECT USING (true);

-- Create policies for business owners (adjust as needed)
CREATE POLICY "Enable all access for business owners" ON "businesses" FOR ALL USING (true);
CREATE POLICY "Enable all access for business owners" ON "business_locations" FOR ALL USING (true);
CREATE POLICY "Enable all access for business owners" ON "bookings" FOR ALL USING (true);
CREATE POLICY "Enable all access for business owners" ON "blocked_slots" FOR ALL USING (true);

-- Create policies for super admins
CREATE POLICY "Enable all access for super admins" ON "super_admins" FOR ALL USING (true);
CREATE POLICY "Enable all access for super admins" ON "categories" FOR ALL USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
