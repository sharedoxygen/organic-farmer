-- Update farm settings to include location
-- This script adds location to the settings JSON for existing farms

-- Update Curry Island Microgreens (Naples, FL based on customer addresses in seed data)
UPDATE farms 
SET settings = COALESCE(settings::jsonb, '{}'::jsonb) || '{"location": "Naples, FL"}'::jsonb,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000010';

-- Update any other farms that don't have location set
-- Default to farm name location or a sensible default
UPDATE farms 
SET settings = COALESCE(settings::jsonb, '{}'::jsonb) || '{"location": "United States"}'::jsonb,
    updated_at = NOW()
WHERE settings IS NULL 
   OR settings::text NOT LIKE '%location%';
