-- Shared Oxygen Cannabis Cultivation Setup - Complete Cannabis Operation
-- Based on Cannabis Module Documentation and AI Use Cases
-- Legal Cannabis Cultivation for California BCC Compliance

BEGIN;

-- First, update the farm profile to reflect cannabis cultivation
UPDATE farms SET 
  farm_name = 'Shared Oxygen Farms',
  business_name = 'Shared Oxygen Cannabis Cultivation LLC',
  subscription_plan = 'ENTERPRISE_CANNABIS',
  settings = '{
    "farm_type": "CANNABIS_CULTIVATION",
    "state": "CALIFORNIA",
    "license_number": "BCC-LIC-SHOX-2024-001",
    "license_type": "Adult-Use Cultivation",
    "canopy_size_sqft": 5000,
    "compliance_level": "BCC_COMPLIANT",
    "testing_required": true,
    "seed_to_consumer_tracking": true,
    "tax_calculation_mode": "california_cannabis",
    "cultivation_tax_per_oz": 9.65,
    "excise_tax_rate": 0.15,
    "state_sales_tax": 0.0725,
    "local_tax_rate": 0.035
  }'
WHERE id = '2';

-- Clear existing incorrect seed varieties for Shared Oxygen (farm_id = 2)
DELETE FROM seed_varieties WHERE farm_id = '2';

-- Add Cannabis Strains Based on Cannabis Module Documentation
INSERT INTO seed_varieties (
  id, name, "scientificName", supplier, "stockQuantity", "minStockLevel", unit, 
  "costPerUnit", "germinationRate", "daysToGermination", "daysToHarvest", "storageTemp", 
  "storageHumidity", "lightExposure", status, "isOrganic", "lotNumber", "auditTrail", 
  "usdaCompliant", "createdAt", "updatedAt", "createdBy", "updatedBy", farm_id, "seedSource"
) VALUES 

-- Premium Cannabis Strains (From Cannabis Module)
('strain-blue-dream', 'Blue Dream', 'Cannabis sativa x indica', 'California Cannabis Genetics', 50, 10, 'SEEDS', 25.00, 0.95, 3, 70, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-BD-2025-001', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator'),

('strain-og-kush', 'OG Kush', 'Cannabis indica', 'California Cannabis Genetics', 40, 8, 'SEEDS', 30.00, 0.92, 3, 63, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-OG-2025-002', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator'),

('strain-girl-scout-cookies', 'Girl Scout Cookies', 'Cannabis indica x sativa', 'California Cannabis Genetics', 35, 7, 'SEEDS', 35.00, 0.90, 4, 70, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-GSC-2025-003', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator'),

('strain-jack-herer', 'Jack Herer', 'Cannabis sativa', 'California Cannabis Genetics', 45, 9, 'SEEDS', 28.00, 0.94, 3, 67, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-JH-2025-004', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator'),

-- Additional Premium Strains for Diversity
('strain-wedding-cake', 'Wedding Cake', 'Cannabis indica', 'California Cannabis Genetics', 30, 6, 'SEEDS', 40.00, 0.88, 4, 65, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-WC-2025-005', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator'),

('strain-gorilla-glue', 'Gorilla Glue #4', 'Cannabis indica x sativa', 'California Cannabis Genetics', 25, 5, 'SEEDS', 32.00, 0.91, 3, 68, 2.0, 50.0, 'CONTROLLED', 'ACTIVE', true, 'CCG-GG4-2025-006', 'Licensed California Cannabis Strain', true, NOW(), NOW(), 'admin', 'admin', '2', 'Licensed Cultivator');

-- Clear existing growing environments for cannabis-specific ones
DELETE FROM growing_environments WHERE farm_id = '2';

-- Add Cannabis Growing Environments (From Cannabis Module)
INSERT INTO growing_environments (
  id, name, type, description, capacity, "currentUtilization", "optimalTemp", 
  "optimalHumidity", "lightingSchedule", "co2Levels", "airCirculation", 
  "irrigationSystem", "nutrientProfile", "phLevel", "ecLevel", location, 
  status, "lastMaintenance", "nextMaintenance", "maintenanceSchedule", 
  "environmentalLogs", "createdAt", "updatedAt", farm_id
) VALUES

-- Flower Room 1 - Flowering Stage Cultivation
('env-flower-room-1', 'Flower Room 1', 'FLOWER_ROOM', 'Primary flowering cultivation room for mature cannabis plants', 200, 180, 73.0, 45.0, '12/12 (Flowering)', 1350, 'High circulation every 15 min', 'Automated drip system', 'Bloom nutrients - high P/K', 6.3, 1.6, 'Building A - Room 1', 'ACTIVE', '2024-12-15', '2025-01-15', 'Monthly deep clean and calibration', '[]', NOW(), NOW(), '2'),

-- Veg Room 1 - Vegetative Growth
('env-veg-room-1', 'Veg Room 1', 'VEG_ROOM', 'Vegetative growth room for cannabis plants', 300, 285, 78.0, 60.0, '18/6 (Vegetative)', 1100, 'Continuous low circulation', 'Automated flood and drain', 'Vegetative nutrients - high N', 6.1, 1.4, 'Building A - Room 2', 'ACTIVE', '2024-12-15', '2025-01-15', 'Weekly maintenance and monitoring', '[]', NOW(), NOW(), '2'),

-- Propagation Room - Seedlings and Clones
('env-propagation', 'Propagation Room', 'PROPAGATION', 'Climate controlled room for seedlings and clone propagation', 500, 420, 75.0, 65.0, '24/0 (Propagation)', 800, 'Gentle circulation', 'Misting system', 'Seedling nutrients - low concentration', 5.8, 0.8, 'Building A - Room 3', 'ACTIVE', '2024-12-15', '2025-01-15', 'Weekly cleaning and monitoring', '[]', NOW(), NOW(), '2'),

-- Drying/Curing Room - Post-Harvest Processing
('env-drying-curing', 'Drying & Curing Room', 'DRYING_CURING', 'Post-harvest drying and curing facility', 50, 30, 65.0, 60.0, 'No artificial lighting', 400, 'Air exchange every 15 min', 'No irrigation', 'No nutrients', 6.5, 0.0, 'Building B - Room 1', 'ACTIVE', '2024-12-15', '2025-01-15', 'Daily monitoring during harvest season', '[]', NOW(), NOW(), '2'),

-- Mother Plant Room - Genetic Preservation
('env-mother-room', 'Mother Plant Room', 'MOTHER_ROOM', 'Room for maintaining mother plants for cloning', 50, 35, 76.0, 55.0, '18/6 (Vegetative)', 1000, 'Moderate circulation', 'Hand watering', 'Low nitrogen maintenance feed', 6.2, 1.2, 'Building A - Room 4', 'ACTIVE', '2024-12-15', '2025-01-15', 'Weekly pruning and maintenance', '[]', NOW(), NOW(), '2');

-- Clear existing batches for cannabis ones
DELETE FROM batches WHERE farm_id = '2';

-- Add Cannabis Batches with Seed-to-Consumer Tracking
INSERT INTO batches (
  id, "batchNumber", "seedVarietyId", "plantingDate", "expectedHarvestDate", 
  "actualHarvestDate", quantity, unit, "growingEnvironmentId", status, 
  "qualityScore", "yieldPerPlant", "totalYield", "harvestWeight", 
  "moistureContent", "actualDuration", "estimatedDuration", notes, 
  "createdAt", "updatedAt", farm_id, "createdBy", "updatedBy"
) VALUES

-- Current Active Batches - Different Growth Stages
('batch-bd-flower-01', 'BD-FL-001', 'strain-blue-dream', '2024-11-01', '2025-01-10', NULL, 25, 'PLANTS', 'env-flower-room-1', 'GROWING', 85, NULL, NULL, NULL, NULL, NULL, 70, 'Blue Dream flowering batch - Week 6. Trichomes developing well. Expected harvest in 2-3 weeks.', NOW(), NOW(), '2', 'admin', 'admin'),

('batch-og-flower-01', 'OG-FL-001', 'strain-og-kush', '2024-10-25', '2025-01-03', NULL, 20, 'PLANTS', 'env-flower-room-1', 'GROWING', 92, NULL, NULL, NULL, NULL, NULL, 63, 'OG Kush flowering batch - Week 7. Ready for harvest soon. Excellent resin production.', NOW(), NOW(), '2', 'admin', 'admin'),

('batch-gsc-veg-01', 'GSC-VG-001', 'strain-girl-scout-cookies', '2024-11-15', '2025-02-15', NULL, 30, 'PLANTS', 'env-veg-room-1', 'GROWING', 78, NULL, NULL, NULL, NULL, NULL, 70, 'Girl Scout Cookies vegetative batch - Week 4. Healthy growth, preparing for flowering transition.', NOW(), NOW(), '2', 'admin', 'admin'),

('batch-jh-veg-01', 'JH-VG-001', 'strain-jack-herer', '2024-12-01', '2025-03-01', NULL, 28, 'PLANTS', 'env-veg-room-1', 'GROWING', 82, NULL, NULL, NULL, NULL, NULL, 67, 'Jack Herer vegetative batch - Week 2. Strong sativa growth pattern observed.', NOW(), NOW(), '2', 'admin', 'admin'),

('batch-wc-prop-01', 'WC-PR-001', 'strain-wedding-cake', '2024-12-10', '2025-04-01', NULL, 50, 'SEEDLINGS', 'env-propagation', 'GERMINATING', 90, NULL, NULL, NULL, NULL, NULL, 65, 'Wedding Cake propagation batch - Week 1. Germination rate 90%. Healthy seedling development.', NOW(), NOW(), '2', 'admin', 'admin'),

-- Recently Harvested Batches for Seed-to-Consumer Tracking
('batch-bd-harvest-01', 'BD-HV-001', 'strain-blue-dream', '2024-08-15', '2024-10-24', '2024-10-24', 22, 'PLANTS', 'env-drying-curing', 'HARVESTED', 95, 2.3, 50.6, 45.8, 12.5, 70, 70, 'Blue Dream harvest - 45.8oz total yield. Currently curing. Lab testing scheduled.', NOW(), NOW(), '2', 'admin', 'admin'),

('batch-og-harvest-01', 'OG-HV-001', 'strain-og-kush', '2024-08-08', '2024-10-10', '2024-10-10', 18, 'PLANTS', 'env-drying-curing', 'HARVESTED', 88, 2.1, 37.8, 34.2, 11.8, 63, 63, 'OG Kush harvest - 34.2oz total yield. Currently at testing lab for cannabinoid analysis.', NOW(), NOW(), '2', 'admin', 'admin'),

-- Mother Plants for Genetic Preservation
('batch-mother-plants', 'MOTHER-001', 'strain-blue-dream', '2024-06-01', NULL, NULL, 8, 'MOTHER_PLANTS', 'env-mother-room', 'GROWING', 95, NULL, NULL, NULL, NULL, NULL, NULL, 'Mother plants for Blue Dream strain. Source for clones. Maintained in vegetative state.', NOW(), NOW(), '2', 'admin', 'admin');

-- Clear existing inventory for cannabis-specific items
DELETE FROM inventory_items WHERE farm_id = '2';

-- Add Cannabis-Specific Inventory Items
INSERT INTO inventory_items (
  id, name, category, sku, description, "currentStock", "minStockLevel", 
  "maxStockLevel", unit, "costPerUnit", supplier, location, 
  "expirationDate", status, "lastRestocked", "createdAt", "updatedAt", farm_id
) VALUES

-- Cannabis Nutrients & Fertilizers
('inv-bloom-nutrients', 'Advanced Bloom Nutrients', 'NUTRIENTS', 'BLOOM-001', 'High phosphorus/potassium bloom nutrients for flowering stage', 45, 10, 100, 'LITERS', 85.00, 'Advanced Nutrients Inc.', 'Storage Room A - Shelf 1', '2025-12-01', 'ACTIVE', '2024-11-01', NOW(), NOW(), '2'),

('inv-veg-nutrients', 'Vegetative Growth Nutrients', 'NUTRIENTS', 'VEG-001', 'High nitrogen nutrients for vegetative growth stage', 38, 8, 80, 'LITERS', 75.00, 'Advanced Nutrients Inc.', 'Storage Room A - Shelf 1', '2025-12-01', 'ACTIVE', '2024-11-01', NOW(), NOW(), '2'),

('inv-cal-mag', 'Cal-Mag Supplement', 'NUTRIENTS', 'CAL-MAG-001', 'Calcium and magnesium supplement for healthy plant development', 25, 5, 50, 'LITERS', 45.00, 'General Hydroponics', 'Storage Room A - Shelf 2', '2025-10-01', 'ACTIVE', '2024-10-15', NOW(), NOW(), '2'),

-- Growing Mediums
('inv-coco-coir', 'Coco Coir Growing Medium', 'GROWING_MEDIUM', 'COCO-001', 'Premium coco coir blocks for cannabis cultivation', 150, 30, 300, 'BLOCKS', 12.50, 'Canna Coco', 'Storage Room B - Stack A', '2026-01-01', 'ACTIVE', '2024-11-15', NOW(), NOW(), '2'),

('inv-perlite', 'Horticultural Perlite', 'GROWING_MEDIUM', 'PERL-001', 'Expanded perlite for drainage and aeration', 80, 15, 150, 'BAGS', 18.00, 'Premier Peat', 'Storage Room B - Stack B', '2027-01-01', 'ACTIVE', '2024-10-20', NOW(), NOW(), '2'),

-- Containers & Pots
('inv-smart-pots-7gal', '7-Gallon Smart Pots', 'CONTAINERS', 'POT-7GAL-001', 'Fabric smart pots for optimal root development', 200, 40, 400, 'PIECES', 8.50, 'Smart Pot Inc.', 'Storage Room C - Shelf 1', NULL, 'ACTIVE', '2024-11-01', NOW(), NOW(), '2'),

('inv-seedling-trays', 'Seedling Propagation Trays', 'CONTAINERS', 'TRAY-001', '72-cell propagation trays for seedlings', 45, 10, 100, 'TRAYS', 3.25, 'Hydrofarm', 'Storage Room C - Shelf 2', NULL, 'ACTIVE', '2024-11-10', NOW(), NOW(), '2'),

-- Harvesting & Processing Supplies
('inv-trimming-scissors', 'Precision Trimming Scissors', 'HARVEST_TOOLS', 'TRIM-001', 'Professional cannabis trimming scissors', 25, 5, 50, 'PIECES', 35.00, 'Fiskars Professional', 'Tool Storage A', NULL, 'ACTIVE', '2024-09-15', NOW(), NOW(), '2'),

('inv-drying-racks', 'Cannabis Drying Racks', 'HARVEST_TOOLS', 'RACK-001', 'Multi-level mesh drying racks for cannabis harvest', 12, 3, 25, 'RACKS', 125.00, 'Harvest Supply Co.', 'Drying Room Storage', NULL, 'ACTIVE', '2024-08-20', NOW(), NOW(), '2'),

-- Testing & Compliance Supplies
('inv-test-kits', 'Cannabis Testing Kits', 'TESTING', 'TEST-001', 'THC/CBD testing kits for compliance monitoring', 15, 3, 30, 'KITS', 65.00, 'Green Scientific', 'Lab Storage', '2025-06-01', 'ACTIVE', '2024-11-05', NOW(), NOW(), '2'),

('inv-compliance-tags', 'BCC Compliance Tags', 'COMPLIANCE', 'TAG-001', 'State-required tracking tags for cannabis plants', 500, 100, 1000, 'TAGS', 0.75, 'California BCC', 'Office Storage', NULL, 'ACTIVE', '2024-12-01', NOW(), NOW(), '2');

-- Add Cannabis Customers (Dispensaries and Collectives)
DELETE FROM customers WHERE farm_id = '2';

INSERT INTO customers (
  id, name, email, phone, address, city, state, "zipCode", 
  "customerType", "taxId", "licenseNumber", "paymentTerms", 
  "creditLimit", "currentBalance", notes, status, "createdAt", "updatedAt", farm_id
) VALUES

-- Licensed Dispensaries
('cust-green-leaf-disp', 'Green Leaf Dispensary', 'purchasing@greenleaf.com', '(415) 555-0123', '123 Cannabis Ave', 'San Francisco', 'CA', '94102', 'B2B_DISPENSARY', '12-3456789', 'BCC-DISP-2024-001', 'NET_30', 50000.00, 12500.00, 'Premium cannabis dispensary in SF. High-volume buyer of top-shelf flower.', 'ACTIVE', NOW(), NOW(), '2'),

('cust-coastal-cannabis', 'Coastal Cannabis Co.', 'orders@coastalcannabis.com', '(831) 555-0145', '456 Ocean Blvd', 'Monterey', 'CA', '93940', 'B2B_DISPENSARY', '98-7654321', 'BCC-DISP-2024-002', 'NET_15', 35000.00, 8750.00, 'Boutique dispensary focusing on organic, sun-grown cannabis. Regular Blue Dream orders.', 'ACTIVE', NOW(), NOW(), '2'),

('cust-valley-wellness', 'Valley Wellness Center', 'procurement@valleywellness.com', '(209) 555-0167', '789 Wellness Way', 'Stockton', 'CA', '95202', 'B2B_MEDICAL', '45-1237890', 'BCC-MED-2024-003', 'NET_30', 25000.00, 6200.00, 'Medical cannabis collective serving Central Valley patients. Focus on CBD strains.', 'ACTIVE', NOW(), NOW(), '2'),

-- Testing Laboratory
('cust-cannabis-lab', 'California Cannabis Labs', 'testing@calcannabislabs.com', '(916) 555-0189', '321 Science Dr', 'Sacramento', 'CA', '95811', 'B2B_TESTING', '67-8901234', 'BCC-LAB-2024-001', 'NET_15', 15000.00, 2800.00, 'State-certified testing laboratory for compliance testing and cannabinoid analysis.', 'ACTIVE', NOW(), NOW(), '2');

COMMIT;

-- Success message
SELECT 'Shared Oxygen Cannabis Setup Complete!' as message,
       'Cannabis strains, growing environments, batches, and compliance setup installed' as details;
