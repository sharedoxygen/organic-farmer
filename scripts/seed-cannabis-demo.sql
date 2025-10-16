-- Cannabis Cultivation Demo Data for Shared Oxygen Farms
-- This script creates a realistic cannabis cultivation operation with 50+ batches

-- Farm ID for Shared Oxygen Farms
-- Farm ID: 00000000-0000-0000-0000-000000000020

-- First, let's add cannabis seed varieties (strains)
INSERT INTO seed_varieties (
    id, name, "scientificName", supplier, stockQuantity, minStockLevel, unit, 
    costPerUnit, germinationRate, daysToGermination, daysToHarvest, storageTemp, 
    storageHumidity, lightExposure, status, isOrganic, lotNumber, auditTrail, 
    usdaCompliant, createdAt, updatedAt, createdBy, updatedBy, farm_id, seedSource
) VALUES 
-- Indica Strains
('strain-001', 'Purple Kush', 'Cannabis indica', 'Premier Cannabis Seeds', 100, 20, 'seeds', 15.00, 0.95, 3, 70, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'PK-2025-001', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-002', 'Northern Lights', 'Cannabis indica', 'Premier Cannabis Seeds', 150, 30, 'seeds', 12.00, 0.92, 3, 65, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'NL-2025-002', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-003', 'Granddaddy Purple', 'Cannabis indica', 'Premier Cannabis Seeds', 80, 15, 'seeds', 18.00, 0.90, 4, 72, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'GDP-2025-003', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-004', 'Bubba Kush', 'Cannabis indica', 'Premier Cannabis Seeds', 120, 25, 'seeds', 16.00, 0.88, 3, 68, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'BK-2025-004', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),

-- Sativa Strains
('strain-005', 'Sour Diesel', 'Cannabis sativa', 'Premier Cannabis Seeds', 90, 20, 'seeds', 20.00, 0.93, 3, 78, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'SD-2025-005', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-006', 'Jack Herer', 'Cannabis sativa', 'Premier Cannabis Seeds', 110, 25, 'seeds', 17.00, 0.91, 3, 75, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'JH-2025-006', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-007', 'Green Crack', 'Cannabis sativa', 'Premier Cannabis Seeds', 85, 18, 'seeds', 19.00, 0.89, 3, 80, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'GC-2025-007', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-008', 'Durban Poison', 'Cannabis sativa', 'Premier Cannabis Seeds', 95, 20, 'seeds', 21.00, 0.94, 3, 82, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'DP-2025-008', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),

-- Hybrid Strains
('strain-009', 'Blue Dream', 'Cannabis hybrid', 'Premier Cannabis Seeds', 200, 40, 'seeds', 14.00, 0.96, 3, 73, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'BD-2025-009', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-010', 'White Widow', 'Cannabis hybrid', 'Premier Cannabis Seeds', 130, 25, 'seeds', 16.50, 0.92, 3, 71, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'WW-2025-010', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-011', 'OG Kush', 'Cannabis hybrid', 'Premier Cannabis Seeds', 180, 35, 'seeds', 15.50, 0.90, 3, 70, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'OG-2025-011', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-012', 'Girl Scout Cookies', 'Cannabis hybrid', 'Premier Cannabis Seeds', 140, 28, 'seeds', 18.50, 0.88, 3, 69, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'GSC-2025-012', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),

-- High-CBD Strains
('strain-013', 'Charlotte''s Web', 'Cannabis hybrid (CBD)', 'Premier Cannabis Seeds', 60, 12, 'seeds', 25.00, 0.85, 3, 75, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'CW-2025-013', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-014', 'Harlequin', 'Cannabis hybrid (CBD)', 'Premier Cannabis Seeds', 75, 15, 'seeds', 22.00, 0.87, 3, 73, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'HQ-2025-014', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator'),
('strain-015', 'ACDC', 'Cannabis hybrid (CBD)', 'Premier Cannabis Seeds', 45, 10, 'seeds', 28.00, 0.82, 3, 77, 2.0, 55.0, 'DARK', 'ACTIVE', true, 'ACDC-2025-015', 'Created for demo', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020', 'Licensed Cultivator');

-- Cannabis-specific inventory items
INSERT INTO inventory_items (
    id, name, category, sku, "currentStock", "minStockLevel", "maxStockLevel", 
    unit, "costPerUnit", supplier, location, status, createdAt, updatedAt, 
    createdBy, updatedBy, farm_id
) VALUES 
-- Growing Medium
('inv-001', 'Coco Coir Premium Grade', 'GROWING_MEDIUM', 'CC-PREM-001', 500, 100, 1000, 'cubic_feet', 12.50, 'Cannabis Cultivation Supply Co.', 'Warehouse A-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-002', 'Perlite Horticultural Grade', 'GROWING_MEDIUM', 'PERL-HG-002', 300, 75, 500, 'cubic_feet', 8.75, 'Cannabis Cultivation Supply Co.', 'Warehouse A-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-003', 'Rockwool Starter Cubes', 'GROWING_MEDIUM', 'RW-SC-003', 2000, 500, 5000, 'pieces', 0.25, 'Cannabis Cultivation Supply Co.', 'Warehouse A-2', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Nutrients
('inv-004', 'Cal-Mag Supplement', 'FERTILIZER', 'CAL-MAG-004', 48, 12, 100, 'liters', 35.00, 'Advanced Nutrients', 'Warehouse B-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-005', 'Bloom Booster NPK', 'FERTILIZER', 'BB-NPK-005', 65, 15, 120, 'liters', 42.50, 'Advanced Nutrients', 'Warehouse B-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-006', 'Vegetative Growth Formula', 'FERTILIZER', 'VG-FORM-006', 72, 18, 150, 'liters', 38.00, 'Advanced Nutrients', 'Warehouse B-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-007', 'Root Stimulator', 'FERTILIZER', 'ROOT-STIM-007', 24, 6, 50, 'liters', 55.00, 'Advanced Nutrients', 'Warehouse B-1', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Equipment
('inv-008', 'LED Grow Light 600W Full Spectrum', 'EQUIPMENT', 'LED-600W-008', 25, 5, 50, 'units', 285.00, 'Cannabis Tech Solutions', 'Equipment Room A', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-009', 'Carbon Filter 6inch', 'EQUIPMENT', 'CF-6IN-009', 15, 3, 30, 'units', 125.00, 'Cannabis Tech Solutions', 'Equipment Room A', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-010', 'Inline Fan 6inch 440CFM', 'EQUIPMENT', 'IF-6IN-010', 12, 2, 25, 'units', 95.00, 'Cannabis Tech Solutions', 'Equipment Room A', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-011', 'pH Meter Digital', 'EQUIPMENT', 'PH-METER-011', 8, 2, 15, 'units', 75.00, 'Cannabis Tech Solutions', 'Equipment Room B', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-012', 'TDS Meter', 'EQUIPMENT', 'TDS-METER-012', 10, 2, 20, 'units', 45.00, 'Cannabis Tech Solutions', 'Equipment Room B', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Containers
('inv-013', 'Smart Pot 5 Gallon', 'CONTAINERS', 'SP-5GAL-013', 150, 30, 300, 'units', 8.50, 'Cannabis Cultivation Supply Co.', 'Warehouse A-3', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-014', 'Smart Pot 3 Gallon', 'CONTAINERS', 'SP-3GAL-014', 200, 40, 400, 'units', 6.25, 'Cannabis Cultivation Supply Co.', 'Warehouse A-3', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-015', 'Propagation Trays', 'CONTAINERS', 'PROP-TRAY-015', 80, 20, 150, 'units', 12.00, 'Cannabis Cultivation Supply Co.', 'Warehouse A-3', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Packaging & Processing
('inv-016', 'Trimming Scissors Professional', 'TOOLS', 'TRIM-SCIS-016', 35, 8, 60, 'units', 25.00, 'Cannabis Processing Tools', 'Processing Room', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-017', 'Drying Racks Stainless Steel', 'EQUIPMENT', 'DRY-RACK-017', 20, 4, 40, 'units', 185.00, 'Cannabis Processing Tools', 'Drying Room', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-018', 'Humidity Packs 62%', 'PACKAGING', 'HUMID-62-018', 500, 100, 1000, 'units', 1.25, 'Cannabis Processing Tools', 'Packaging Room', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-019', 'Glass Jars 1oz', 'PACKAGING', 'GLASS-1OZ-019', 1000, 200, 2000, 'units', 2.50, 'Cannabis Processing Tools', 'Packaging Room', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('inv-020', 'Labels Compliance', 'PACKAGING', 'LABEL-COMP-020', 2500, 500, 5000, 'units', 0.15, 'Cannabis Processing Tools', 'Packaging Room', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020');

-- Now let's create 50+ batches in various stages
-- We'll create batches across different strains and growth stages

-- Function to generate batch data across different dates and stages
-- Seedling Stage (1-14 days)
INSERT INTO batches (
    id, "batchNumber", "seedVarietyId", quantity, unit, "plantDate", "seedingDate", 
    "expectedHarvestDate", status, "growingZone", "plantingMethod", notes, 
    createdAt, updatedAt, "createdBy", "updatedBy", farm_id
) VALUES 
-- Recent seedlings (1-7 days old)
('batch-001', 'SO-BD-2025-001', 'strain-009', 24, 'plants', '2025-01-05', '2025-01-05', '2025-03-19', 'SEEDLING', 'Propagation Room A', 'DIRECT_SEED', 'Blue Dream - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-002', 'SO-OG-2025-002', 'strain-011', 18, 'plants', '2025-01-06', '2025-01-06', '2025-03-17', 'SEEDLING', 'Propagation Room A', 'DIRECT_SEED', 'OG Kush - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-003', 'SO-WW-2025-003', 'strain-010', 20, 'plants', '2025-01-07', '2025-01-07', '2025-03-19', 'SEEDLING', 'Propagation Room B', 'DIRECT_SEED', 'White Widow - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-004', 'SO-PK-2025-004', 'strain-001', 16, 'plants', '2025-01-08', '2025-01-08', '2025-03-18', 'SEEDLING', 'Propagation Room B', 'DIRECT_SEED', 'Purple Kush - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-005', 'SO-GSC-2025-005', 'strain-012', 22, 'plants', '2025-01-09', '2025-01-09', '2025-03-18', 'SEEDLING', 'Propagation Room C', 'DIRECT_SEED', 'Girl Scout Cookies - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Week 2 seedlings
('batch-006', 'SO-SD-2025-006', 'strain-005', 25, 'plants', '2024-12-29', '2024-12-29', '2025-03-17', 'SEEDLING', 'Propagation Room C', 'DIRECT_SEED', 'Sour Diesel - Week 2', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-007', 'SO-JH-2025-007', 'strain-006', 19, 'plants', '2024-12-30', '2024-12-30', '2025-03-15', 'SEEDLING', 'Propagation Room D', 'DIRECT_SEED', 'Jack Herer - Week 2', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-008', 'SO-NL-2025-008', 'strain-002', 21, 'plants', '2024-12-31', '2024-12-31', '2025-03-07', 'SEEDLING', 'Propagation Room D', 'DIRECT_SEED', 'Northern Lights - Week 2', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Vegetative Stage (2-8 weeks)
('batch-009', 'SO-BD-2024-009', 'strain-009', 24, 'plants', '2024-12-15', '2024-12-15', '2025-03-05', 'VEGETATIVE', 'Veg Room A', 'TRANSPLANT', 'Blue Dream - Week 4 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-010', 'SO-OG-2024-010', 'strain-011', 18, 'plants', '2024-12-10', '2024-12-10', '2025-02-28', 'VEGETATIVE', 'Veg Room A', 'TRANSPLANT', 'OG Kush - Week 5 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-011', 'SO-WW-2024-011', 'strain-010', 20, 'plants', '2024-12-05', '2024-12-05', '2025-02-25', 'VEGETATIVE', 'Veg Room B', 'TRANSPLANT', 'White Widow - Week 6 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-012', 'SO-PK-2024-012', 'strain-001', 16, 'plants', '2024-12-01', '2024-12-01', '2025-02-20', 'VEGETATIVE', 'Veg Room B', 'TRANSPLANT', 'Purple Kush - Week 7 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-013', 'SO-GSC-2024-013', 'strain-012', 22, 'plants', '2024-11-25', '2024-11-25', '2025-02-15', 'VEGETATIVE', 'Veg Room C', 'TRANSPLANT', 'Girl Scout Cookies - Week 8 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-014', 'SO-SD-2024-014', 'strain-005', 25, 'plants', '2024-11-20', '2024-11-20', '2025-02-15', 'VEGETATIVE', 'Veg Room C', 'TRANSPLANT', 'Sour Diesel - Week 8 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-015', 'SO-JH-2024-015', 'strain-006', 19, 'plants', '2024-11-18', '2024-11-18', '2025-02-10', 'VEGETATIVE', 'Veg Room D', 'TRANSPLANT', 'Jack Herer - Week 9 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Flowering Stage (8-12 weeks)
('batch-016', 'SO-BD-2024-016', 'strain-009', 24, 'plants', '2024-10-15', '2024-10-15', '2025-01-15', 'FLOWERING', 'Flower Room A', 'TRANSPLANT', 'Blue Dream - Week 4 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-017', 'SO-OG-2024-017', 'strain-011', 18, 'plants', '2024-10-10', '2024-10-10', '2025-01-10', 'FLOWERING', 'Flower Room A', 'TRANSPLANT', 'OG Kush - Week 5 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-018', 'SO-WW-2024-018', 'strain-010', 20, 'plants', '2024-10-05', '2024-10-05', '2025-01-05', 'FLOWERING', 'Flower Room B', 'TRANSPLANT', 'White Widow - Week 6 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-019', 'SO-PK-2024-019', 'strain-001', 16, 'plants', '2024-10-01', '2024-10-01', '2025-01-01', 'FLOWERING', 'Flower Room B', 'TRANSPLANT', 'Purple Kush - Week 7 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-020', 'SO-GSC-2024-020', 'strain-012', 22, 'plants', '2024-09-25', '2024-09-25', '2024-12-25', 'FLOWERING', 'Flower Room C', 'TRANSPLANT', 'Girl Scout Cookies - Week 8 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-021', 'SO-SD-2024-021', 'strain-005', 25, 'plants', '2024-09-20', '2024-09-20', '2024-12-20', 'FLOWERING', 'Flower Room C', 'TRANSPLANT', 'Sour Diesel - Week 9 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-022', 'SO-JH-2024-022', 'strain-006', 19, 'plants', '2024-09-15', '2024-09-15', '2024-12-15', 'FLOWERING', 'Flower Room D', 'TRANSPLANT', 'Jack Herer - Week 10 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-023', 'SO-NL-2024-023', 'strain-002', 21, 'plants', '2024-09-10', '2024-09-10', '2024-12-10', 'FLOWERING', 'Flower Room D', 'TRANSPLANT', 'Northern Lights - Week 11 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Ready to Harvest (Week 12+ Flower)
('batch-024', 'SO-BD-2024-024', 'strain-009', 24, 'plants', '2024-08-15', '2024-08-15', '2024-11-15', 'READY_TO_HARVEST', 'Flower Room A', 'TRANSPLANT', 'Blue Dream - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-025', 'SO-OG-2024-025', 'strain-011', 18, 'plants', '2024-08-10', '2024-08-10', '2024-11-10', 'READY_TO_HARVEST', 'Flower Room A', 'TRANSPLANT', 'OG Kush - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-026', 'SO-WW-2024-026', 'strain-010', 20, 'plants', '2024-08-05', '2024-08-05', '2024-11-05', 'READY_TO_HARVEST', 'Flower Room B', 'TRANSPLANT', 'White Widow - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-027', 'SO-PK-2024-027', 'strain-001', 16, 'plants', '2024-08-01', '2024-08-01', '2024-11-01', 'READY_TO_HARVEST', 'Flower Room B', 'TRANSPLANT', 'Purple Kush - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Drying Stage
('batch-028', 'SO-GSC-2024-028', 'strain-012', 22, 'plants', '2024-07-25', '2024-07-25', '2024-10-25', 'DRYING', 'Drying Room A', 'HARVESTED', 'Girl Scout Cookies - Drying Day 5', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-029', 'SO-SD-2024-029', 'strain-005', 25, 'plants', '2024-07-20', '2024-07-20', '2024-10-20', 'DRYING', 'Drying Room A', 'HARVESTED', 'Sour Diesel - Drying Day 8', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-030', 'SO-JH-2024-030', 'strain-006', 19, 'plants', '2024-07-15', '2024-07-15', '2024-10-15', 'DRYING', 'Drying Room B', 'HARVESTED', 'Jack Herer - Drying Day 10', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-031', 'SO-NL-2024-031', 'strain-002', 21, 'plants', '2024-07-10', '2024-07-10', '2024-10-10', 'DRYING', 'Drying Room B', 'HARVESTED', 'Northern Lights - Drying Day 12', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Curing Stage
('batch-032', 'SO-BD-2024-032', 'strain-009', 24, 'plants', '2024-06-15', '2024-06-15', '2024-09-15', 'CURING', 'Curing Room A', 'HARVESTED', 'Blue Dream - Curing Week 3', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-033', 'SO-OG-2024-033', 'strain-011', 18, 'plants', '2024-06-10', '2024-06-10', '2024-09-10', 'CURING', 'Curing Room A', 'HARVESTED', 'OG Kush - Curing Week 4', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-034', 'SO-WW-2024-034', 'strain-010', 20, 'plants', '2024-06-05', '2024-06-05', '2024-09-05', 'CURING', 'Curing Room B', 'HARVESTED', 'White Widow - Curing Week 5', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-035', 'SO-PK-2024-035', 'strain-001', 16, 'plants', '2024-06-01', '2024-06-01', '2024-09-01', 'CURING', 'Curing Room B', 'HARVESTED', 'Purple Kush - Curing Week 6', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Completed/Harvested
('batch-036', 'SO-GSC-2024-036', 'strain-012', 22, 'plants', '2024-05-25', '2024-05-25', '2024-08-25', 'COMPLETED', 'Processing Room', 'HARVESTED', 'Girl Scout Cookies - Completed & Packaged', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-037', 'SO-SD-2024-037', 'strain-005', 25, 'plants', '2024-05-20', '2024-05-20', '2024-08-20', 'COMPLETED', 'Processing Room', 'HARVESTED', 'Sour Diesel - Completed & Packaged', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-038', 'SO-JH-2024-038', 'strain-006', 19, 'plants', '2024-05-15', '2024-05-15', '2024-08-15', 'COMPLETED', 'Processing Room', 'HARVESTED', 'Jack Herer - Completed & Packaged', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-039', 'SO-NL-2024-039', 'strain-002', 21, 'plants', '2024-05-10', '2024-05-10', '2024-08-10', 'COMPLETED', 'Processing Room', 'HARVESTED', 'Northern Lights - Completed & Packaged', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- High-CBD Strains in various stages
('batch-040', 'SO-CW-2025-040', 'strain-013', 12, 'plants', '2025-01-01', '2025-01-01', '2025-03-17', 'SEEDLING', 'Propagation Room A', 'DIRECT_SEED', 'Charlotte''s Web - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-041', 'SO-HQ-2024-041', 'strain-014', 15, 'plants', '2024-12-01', '2024-12-01', '2025-02-20', 'VEGETATIVE', 'Veg Room A', 'TRANSPLANT', 'Harlequin - Week 6 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-042', 'SO-ACDC-2024-042', 'strain-015', 10, 'plants', '2024-10-01', '2024-10-01', '2025-01-01', 'FLOWERING', 'Flower Room A', 'TRANSPLANT', 'ACDC - Week 7 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-043', 'SO-CW-2024-043', 'strain-013', 12, 'plants', '2024-08-01', '2024-08-01', '2024-11-01', 'READY_TO_HARVEST', 'Flower Room B', 'TRANSPLANT', 'Charlotte''s Web - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-044', 'SO-HQ-2024-044', 'strain-014', 15, 'plants', '2024-07-01', '2024-07-01', '2024-10-01', 'DRYING', 'Drying Room A', 'HARVESTED', 'Harlequin - Drying Day 7', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-045', 'SO-ACDC-2024-045', 'strain-015', 10, 'plants', '2024-06-01', '2024-06-01', '2024-09-01', 'CURING', 'Curing Room A', 'HARVESTED', 'ACDC - Curing Week 4', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),

-- Additional mixed strains to reach 50+
('batch-046', 'SO-GDP-2025-046', 'strain-003', 14, 'plants', '2025-01-03', '2025-01-03', '2025-03-18', 'SEEDLING', 'Propagation Room B', 'DIRECT_SEED', 'Granddaddy Purple - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-047', 'SO-BK-2025-047', 'strain-004', 17, 'plants', '2025-01-04', '2025-01-04', '2025-03-15', 'SEEDLING', 'Propagation Room B', 'DIRECT_SEED', 'Bubba Kush - Week 1', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-048', 'SO-GC-2025-048', 'strain-007', 23, 'plants', '2024-12-25', '2024-12-25', '2025-03-10', 'SEEDLING', 'Propagation Room C', 'DIRECT_SEED', 'Green Crack - Week 2', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-049', 'SO-DP-2025-049', 'strain-008', 26, 'plants', '2024-12-20', '2024-12-20', '2025-03-12', 'SEEDLING', 'Propagation Room C', 'DIRECT_SEED', 'Durban Poison - Week 3', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-050', 'SO-GDP-2024-050', 'strain-003', 14, 'plants', '2024-11-15', '2024-11-15', '2025-02-05', 'VEGETATIVE', 'Veg Room D', 'TRANSPLANT', 'Granddaddy Purple - Week 9 Veg', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-051', 'SO-BK-2024-051', 'strain-004', 17, 'plants', '2024-09-01', '2024-09-01', '2024-12-01', 'FLOWERING', 'Flower Room C', 'TRANSPLANT', 'Bubba Kush - Week 12 Flower', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-052', 'SO-GC-2024-052', 'strain-007', 23, 'plants', '2024-08-15', '2024-08-15', '2024-11-20', 'READY_TO_HARVEST', 'Flower Room D', 'TRANSPLANT', 'Green Crack - Ready for Harvest', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-053', 'SO-DP-2024-053', 'strain-008', 26, 'plants', '2024-07-05', '2024-07-05', '2024-10-08', 'DRYING', 'Drying Room B', 'HARVESTED', 'Durban Poison - Drying Day 14', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-054', 'SO-GDP-2024-054', 'strain-003', 14, 'plants', '2024-06-15', '2024-06-15', '2024-09-20', 'CURING', 'Curing Room B', 'HARVESTED', 'Granddaddy Purple - Curing Week 8', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-055', 'SO-BK-2024-055', 'strain-004', 17, 'plants', '2024-05-01', '2024-05-01', '2024-08-05', 'COMPLETED', 'Processing Room', 'HARVESTED', 'Bubba Kush - Completed & Packaged', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020');

-- Add some mother plants for breeding/cloning
INSERT INTO batches (
    id, "batchNumber", "seedVarietyId", quantity, unit, "plantDate", "seedingDate", 
    "expectedHarvestDate", status, "growingZone", "plantingMethod", notes, 
    createdAt, updatedAt, "createdBy", "updatedBy", farm_id
) VALUES 
('batch-056', 'SO-MOTHER-BD-001', 'strain-009', 1, 'plants', '2024-03-01', '2024-03-01', NULL, 'MOTHER_PLANT', 'Mother Room', 'TRANSPLANT', 'Blue Dream Mother - Clone Source', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-057', 'SO-MOTHER-OG-001', 'strain-011', 1, 'plants', '2024-03-01', '2024-03-01', NULL, 'MOTHER_PLANT', 'Mother Room', 'TRANSPLANT', 'OG Kush Mother - Clone Source', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-058', 'SO-MOTHER-WW-001', 'strain-010', 1, 'plants', '2024-03-01', '2024-03-01', NULL, 'MOTHER_PLANT', 'Mother Room', 'TRANSPLANT', 'White Widow Mother - Clone Source', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-059', 'SO-MOTHER-GSC-001', 'strain-012', 1, 'plants', '2024-03-01', '2024-03-01', NULL, 'MOTHER_PLANT', 'Mother Room', 'TRANSPLANT', 'Girl Scout Cookies Mother - Clone Source', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020'),
('batch-060', 'SO-MOTHER-CW-001', 'strain-013', 1, 'plants', '2024-03-01', '2024-03-01', NULL, 'MOTHER_PLANT', 'Mother Room', 'TRANSPLANT', 'Charlotte''s Web Mother - CBD Clone Source', NOW(), NOW(), '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000020');

COMMIT; 