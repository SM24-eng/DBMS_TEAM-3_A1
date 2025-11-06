-- Add vehicle_type column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'car';

-- Update existing vehicles to set proper vehicle types
UPDATE vehicles SET vehicle_type = 'suv' WHERE model IN ('Creta', 'Fortuner', 'Innova', 'Scorpio', 'Venue', 'Seltos', 'XUV700');
UPDATE vehicles SET vehicle_type = 'sedan' WHERE model IN ('Swift', 'Baleno', 'City', '3 Series', 'A4');
UPDATE vehicles SET vehicle_type = 'sports_car' WHERE model IN ('F8 Tributo', 'Huracan', '911 Carrera');
UPDATE vehicles SET vehicle_type = 'bike' WHERE brand IN ('Royal Enfield', 'Harley Davidson', 'Yamaha', 'KTM');