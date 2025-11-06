-- Add driving license and address fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS driving_license TEXT,
ADD COLUMN IF NOT EXISTS driving_experience TEXT;