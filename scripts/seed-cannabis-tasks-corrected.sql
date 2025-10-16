-- Cannabis Task Management Seed Data for Shared Oxygen Farms - CORRECTED
-- This script creates realistic cannabis cultivation tasks across all growth stages

BEGIN;

-- Cannabis Cultivation Tasks for Shared Oxygen Farms
-- Farm ID: 00000000-0000-0000-0000-000000000020

-- Daily/Recurring Tasks
INSERT INTO tasks (
    id, title, description, "createdAt", "updatedAt", "actualDuration", 
    "assignedBy", "assignedTo", category, "completedAt", "completedBy", 
    "completionNotes", dependencies, "dueDate", "estimatedDuration", 
    "relatedBatchId", "relatedEquipmentId", priority, status, farm_id
) VALUES 

-- DAILY MONITORING TASKS
('task-001', 'Daily Environmental Check - Propagation Room A', 'Check temperature, humidity, and lighting in propagation room A. Ensure seedlings are healthy.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 hours', 30, 'batch-001', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-002', 'Morning Watering - Seedling Trays', 'Water all seedling trays in propagation rooms. Check for proper drainage and moisture levels.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'WATERING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 hour', 45, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-003', 'pH and TDS Testing - Nutrient Solutions', 'Test pH and TDS levels of all nutrient solutions. Adjust as needed for optimal growing conditions.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'QUALITY_CHECK', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 hours', 20, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-004', 'Inspect Blue Dream Vegetative Plants', 'Check Blue Dream plants in veg room for pest issues, nutrient deficiencies, and overall health.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '4 hours', 60, 'batch-009', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-005', 'Harvest Quality Check - Ready Batches', 'Inspect plants ready for harvest. Check trichome development and overall plant condition.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'QUALITY_CHECK', NULL, NULL, NULL, '[]', NOW() + INTERVAL '6 hours', 90, 'batch-024', NULL, 'URGENT', 'PENDING', '00000000-0000-0000-0000-000000000020'),

-- WEEKLY TASKS
('task-006', 'Clean and Sanitize Propagation Equipment', 'Deep clean all propagation trays, tools, and equipment. Sanitize with approved cleaning agents.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'CLEANING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 day', 120, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-007', 'LED Light Maintenance - Flower Room A', 'Check all LED grow lights for proper function. Clean light panels and adjust hanging heights as needed.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 days', 90, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-008', 'Nutrient Solution Preparation', 'Prepare fresh nutrient solutions for all growing zones. Mix appropriate concentrations for each growth stage.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'FEEDING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 days', 150, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-009', 'Transplant Seedlings to Vegetative Pots', 'Transplant healthy seedlings from propagation trays to 3-gallon smart pots for vegetative growth.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'TRANSPLANTING', NULL, NULL, NULL, '["task-001"]', NOW() + INTERVAL '5 days', 180, 'batch-003', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-010', 'Harvest White Widow Batch', 'Harvest mature White Widow plants. Cut, trim, and prepare for drying process.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'HARVESTING', NULL, NULL, NULL, '["task-005"]', NOW() + INTERVAL '1 day', 240, 'batch-026', NULL, 'URGENT', 'PENDING', '00000000-0000-0000-0000-000000000020'),

-- PROCESSING TASKS
('task-011', 'Trim Dried Cannabis - Northern Lights', 'Hand-trim dried Northern Lights buds. Remove fan leaves and excess plant material.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'PROCESSING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 days', 300, 'batch-021', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-012', 'Package Cured Girl Scout Cookies', 'Package cured Girl Scout Cookies into 1oz glass jars. Add humidity packs and compliance labels.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'PACKAGING', NULL, NULL, NULL, '["task-011"]', NOW() + INTERVAL '4 days', 120, 'batch-048', NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-013', 'Move Plants to Flower Room - OG Kush', 'Transfer OG Kush plants from vegetative room to flowering room. Adjust lighting schedule to 12/12.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'TRANSPLANTING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '6 days', 90, 'batch-010', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-014', 'IPM Inspection - All Growing Areas', 'Conduct Integrated Pest Management inspection across all growing areas. Look for signs of pests or diseases.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 day', 120, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-015', 'Equipment Calibration - pH and TDS Meters', 'Calibrate all pH and TDS meters using proper calibration solutions. Document results.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '7 days', 60, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

-- COMPLETED TASKS (for demonstration)
('task-016', 'Morning Environmental Check - Flower Room B', 'Checked temperature (75°F), humidity (50%), and CO2 levels. All within optimal range.', NOW() - INTERVAL '2 hours', NOW(), 25, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'MONITORING', NOW() - INTERVAL '30 minutes', '00000000-0000-0000-0000-000000000203', 'All environmental parameters within optimal range. Plants looking healthy.', '[]', NOW() - INTERVAL '3 hours', 30, 'batch-016', NULL, 'HIGH', 'COMPLETED', '00000000-0000-0000-0000-000000000020'),

('task-017', 'Replace Carbon Filter - Flower Room C', 'Replaced old carbon filter with new 6-inch filter. System now running efficiently.', NOW() - INTERVAL '1 day', NOW(), 45, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000202', 'Filter replacement completed. Air quality significantly improved.', '[]', NOW() - INTERVAL '1 day', 60, NULL, NULL, 'MEDIUM', 'COMPLETED', '00000000-0000-0000-0000-000000000020'),

('task-018', 'Water Purple Kush Seedlings', 'Watered all Purple Kush seedlings with pH-balanced water (6.0 pH). Good germination rate observed.', NOW() - INTERVAL '4 hours', NOW(), 20, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'WATERING', NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000204', 'All seedlings watered. 95% germination rate observed. Very healthy batch.', '[]', NOW() - INTERVAL '5 hours', 30, 'batch-004', NULL, 'HIGH', 'COMPLETED', '00000000-0000-0000-0000-000000000020'),

-- IN-PROGRESS TASKS
('task-019', 'Defoliate Flowering Blue Dream Plants', 'Remove excess fan leaves from flowering Blue Dream plants to improve light penetration and air flow.', NOW() - INTERVAL '30 minutes', NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'PRUNING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 hour', 90, 'batch-014', NULL, 'HIGH', 'IN_PROGRESS', '00000000-0000-0000-0000-000000000020'),

('task-020', 'Dry Harvested Sour Diesel', 'Monitor drying process for recently harvested Sour Diesel. Maintain 60-65°F and 50-60% humidity.', NOW() - INTERVAL '2 days', NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'DRYING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '5 days', 60, 'batch-029', NULL, 'HIGH', 'IN_PROGRESS', '00000000-0000-0000-0000-000000000020'),

-- SCHEDULED FUTURE TASKS
('task-021', 'Flip Vegetative Plants to Flower', 'Move selected vegetative plants to flowering room and change light cycle to 12/12 for flower induction.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'FLOWERING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '10 days', 120, 'batch-011', NULL, 'HIGH', 'SCHEDULED', '00000000-0000-0000-0000-000000000020'),

('task-022', 'Cure Harvested Jack Herer', 'Begin curing process for dried Jack Herer. Place in glass jars with humidity packs.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'CURING', NULL, NULL, NULL, '["task-020"]', NOW() + INTERVAL '14 days', 90, 'batch-030', NULL, 'MEDIUM', 'SCHEDULED', '00000000-0000-0000-0000-000000000020'),

('task-023', 'Clone Mother Plants', 'Take cuttings from healthy mother plants for propagation. Prepare rooting medium and maintain humid environment.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'PROPAGATION', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 days', 150, 'batch-051', NULL, 'MEDIUM', 'SCHEDULED', '00000000-0000-0000-0000-000000000020'),

('task-024', 'Weekly Facility Deep Clean', 'Perform weekly deep cleaning of all growing areas, tools, and equipment. Sanitize all surfaces.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000204', 'CLEANING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '7 days', 180, NULL, NULL, 'MEDIUM', 'SCHEDULED', '00000000-0000-0000-0000-000000000020'),

('task-025', 'Nutrient Flush - Week 8 Flower Plants', 'Begin nutrient flush for plants in week 8 of flowering. Use plain pH-balanced water only.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000203', 'FEEDING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '5 days', 60, 'batch-018', NULL, 'HIGH', 'SCHEDULED', '00000000-0000-0000-0000-000000000020'),

-- MAINTENANCE TASKS
('task-026', 'Replace Inline Fan - Veg Room A', 'Replace malfunctioning inline fan in vegetative room A. Ensure proper air circulation is restored.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 day', 90, NULL, NULL, 'URGENT', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-027', 'Recalibrate Environmental Controllers', 'Recalibrate all environmental control systems. Verify temperature and humidity sensor accuracy.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 days', 120, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-028', 'Inspect and Clean Light Reflectors', 'Clean all light reflectors and inspect for damage. Replace any damaged reflective surfaces.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '5 days', 75, NULL, NULL, 'LOW', 'PENDING', '00000000-0000-0000-0000-000000000020'),

-- QUALITY CONTROL TASKS
('task-029', 'Lab Test Sample Collection', 'Collect samples from ready-to-harvest plants for cannabinoid and terpene testing.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'QUALITY_CHECK', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 days', 45, 'batch-025', NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020'),

('task-030', 'Final Quality Inspection - Packaged Products', 'Perform final quality inspection on packaged products before distribution. Check for compliance.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000205', 'QUALITY_CHECK', NULL, NULL, NULL, '["task-012"]', NOW() + INTERVAL '6 days', 90, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000020');

COMMIT; 