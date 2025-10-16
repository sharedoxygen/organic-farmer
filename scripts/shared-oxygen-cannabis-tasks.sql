-- Cannabis Task Management for Shared Oxygen Farms
-- Comprehensive cannabis cultivation tasks covering all growth stages
-- Based on Cannabis Module workflows

BEGIN;

-- Clear existing tasks for cannabis-specific ones
DELETE FROM tasks WHERE farm_id = '2';

-- Cannabis Cultivation Tasks for Shared Oxygen Farms
INSERT INTO tasks (
  id, title, description, "createdAt", "updatedAt", "assignedBy", 
  "assignedTo", category, "dueDate", "estimatedDuration", 
  "relatedBatchId", priority, status, farm_id
) VALUES 

-- DAILY MONITORING TASKS
('task-daily-env-check', 'Daily Environmental Check - All Rooms', 'Monitor temperature, humidity, CO2, and lighting in all growing environments. Record readings in compliance logs.', NOW(), NOW(), 'admin', 'cultivation-manager', 'MONITORING', NOW() + INTERVAL '2 hours', 45, NULL, 'HIGH', 'PENDING', '2'),

('task-plant-health-inspect', 'Plant Health Inspection', 'Visual inspection of all plants for pests, diseases, nutrient deficiencies, and overall health. Photo documentation required.', NOW(), NOW(), 'admin', 'cultivation-manager', 'QUALITY_CHECK', NOW() + INTERVAL '1 hour', 60, NULL, 'HIGH', 'PENDING', '2'),

('task-irrigation-check', 'Irrigation System Check', 'Test all irrigation lines, check pH and EC levels of nutrient solutions, verify proper drainage.', NOW(), NOW(), 'admin', 'cultivation-tech', 'MAINTENANCE', NOW() + INTERVAL '3 hours', 30, NULL, 'MEDIUM', 'PENDING', '2'),

-- WEEKLY GROWTH MONITORING
('task-flower-room-metrics', 'Flower Room 1 - Weekly Metrics', 'Measure plant heights, check trichome development, assess flowering progress. Update batch records.', NOW(), NOW(), 'admin', 'cultivation-manager', 'MONITORING', NOW() + INTERVAL '1 day', 90, 'batch-bd-flower-01', 'HIGH', 'PENDING', '2'),

('task-veg-room-metrics', 'Veg Room 1 - Weekly Metrics', 'Measure vegetative growth, check for training needs, assess nutrient uptake. Plan flowering transitions.', NOW(), NOW(), 'admin', 'cultivation-tech', 'MONITORING', NOW() + INTERVAL '2 days', 75, 'batch-gsc-veg-01', 'MEDIUM', 'PENDING', '2'),

('task-mother-plant-maintenance', 'Mother Plant Maintenance', 'Prune mother plants, take clones for propagation, maintain genetic stability. Update clone records.', NOW(), NOW(), 'admin', 'propagation-specialist', 'MAINTENANCE', NOW() + INTERVAL '3 days', 120, 'batch-mother-plants', 'MEDIUM', 'PENDING', '2'),

-- BATCH-SPECIFIC TASKS
('task-blue-dream-harvest-prep', 'Blue Dream Harvest Preparation', 'Prepare Blue Dream batch BD-FL-001 for harvest. Set up drying racks, schedule lab testing, prepare compliance documentation.', NOW(), NOW(), 'admin', 'harvest-manager', 'HARVEST_PREP', NOW() + INTERVAL '7 days', 180, 'batch-bd-flower-01', 'HIGH', 'PENDING', '2'),

('task-og-kush-final-flush', 'OG Kush Final Flush', 'Begin final 7-day flush for OG Kush batch OG-FL-001. Switch to plain water, monitor trichome development.', NOW(), NOW(), 'admin', 'cultivation-manager', 'HARVEST_PREP', NOW() + INTERVAL '1 day', 45, 'batch-og-flower-01', 'HIGH', 'PENDING', '2'),

('task-gsc-flower-transition', 'Girl Scout Cookies - Flowering Transition', 'Transition GSC batch GSC-VG-001 from vegetative to flowering stage. Change light schedule to 12/12, switch nutrients.', NOW(), NOW(), 'admin', 'cultivation-manager', 'STAGE_TRANSITION', NOW() + INTERVAL '5 days', 90, 'batch-gsc-veg-01', 'HIGH', 'PENDING', '2'),

-- COMPLIANCE AND TESTING TASKS
('task-compliance-plant-count', 'Weekly Plant Count & Compliance Check', 'Conduct mandatory plant count, update BCC tracking system, verify compliance with license limits.', NOW(), NOW(), 'admin', 'compliance-officer', 'COMPLIANCE', NOW() + INTERVAL '1 day', 60, NULL, 'HIGH', 'PENDING', '2'),

('task-harvest-testing', 'Schedule Harvest Testing', 'Schedule mandatory testing for harvested batches: potency, pesticides, microbials, heavy metals, mycotoxins.', NOW(), NOW(), 'admin', 'lab-coordinator', 'TESTING', NOW() + INTERVAL '2 days', 30, 'batch-bd-harvest-01', 'HIGH', 'PENDING', '2'),

('task-metrc-updates', 'METRC System Updates', 'Update California state tracking system (METRC) with plant movements, harvest data, and inventory changes.', NOW(), NOW(), 'admin', 'compliance-officer', 'COMPLIANCE', NOW() + INTERVAL '1 day', 45, NULL, 'HIGH', 'PENDING', '2'),

-- HARVEST AND POST-HARVEST TASKS
('task-harvest-og-kush', 'Harvest OG Kush Batch', 'Harvest OG Kush batch OG-FL-001. Wet trim, weigh, and move to drying room. Document weights for compliance.', NOW(), NOW(), 'admin', 'harvest-team', 'HARVESTING', NOW() + INTERVAL '3 days', 360, 'batch-og-flower-01', 'HIGH', 'PENDING', '2'),

('task-cure-monitoring', 'Curing Process Monitoring', 'Monitor Blue Dream batch during curing process. Check humidity levels, rotate jars, assess curing progress.', NOW(), NOW(), 'admin', 'post-harvest-tech', 'CURING', NOW() + INTERVAL '1 day', 30, 'batch-bd-harvest-01', 'MEDIUM', 'PENDING', '2'),

-- FACILITY MAINTENANCE TASKS
('task-hvac-maintenance', 'HVAC System Maintenance', 'Monthly maintenance of all HVAC systems. Clean filters, check temperatures, calibrate sensors.', NOW(), NOW(), 'admin', 'facility-manager', 'MAINTENANCE', NOW() + INTERVAL '7 days', 240, NULL, 'MEDIUM', 'PENDING', '2'),

('task-security-check', 'Security System Check', 'Weekly security system check. Test cameras, alarms, access controls. Update security logs.', NOW(), NOW(), 'admin', 'security-manager', 'SECURITY', NOW() + INTERVAL '2 days', 90, NULL, 'MEDIUM', 'PENDING', '2'),

('task-equipment-calibration', 'Equipment Calibration', 'Calibrate pH meters, EC meters, scales, and environmental sensors. Document calibration records.', NOW(), NOW(), 'admin', 'cultivation-tech', 'MAINTENANCE', NOW() + INTERVAL '14 days', 120, NULL, 'MEDIUM', 'PENDING', '2'),

-- INVENTORY MANAGEMENT TASKS
('task-inventory-audit', 'Monthly Inventory Audit', 'Complete monthly inventory audit of all cannabis products, nutrients, supplies. Update inventory records.', NOW(), NOW(), 'admin', 'inventory-manager', 'INVENTORY', NOW() + INTERVAL '30 days', 180, NULL, 'MEDIUM', 'PENDING', '2'),

('task-nutrient-restocking', 'Restock Bloom Nutrients', 'Reorder bloom nutrients before stock runs low. Verify supplier compliance certifications.', NOW(), NOW(), 'admin', 'purchasing-manager', 'PURCHASING', NOW() + INTERVAL '7 days', 30, NULL, 'LOW', 'PENDING', '2'),

-- TRAINING AND DEVELOPMENT
('task-staff-training', 'Monthly Cannabis Cultivation Training', 'Conduct monthly training session on best practices, compliance updates, safety procedures.', NOW(), NOW(), 'admin', 'head-cultivator', 'TRAINING', NOW() + INTERVAL '15 days', 120, NULL, 'MEDIUM', 'PENDING', '2'),

('task-compliance-review', 'Quarterly Compliance Review', 'Review all compliance procedures, update SOPs, prepare for potential inspections.', NOW(), NOW(), 'admin', 'compliance-officer', 'COMPLIANCE', NOW() + INTERVAL '90 days', 240, NULL, 'MEDIUM', 'PENDING', '2');

COMMIT;

-- Success message
SELECT 'Cannabis Task Management Setup Complete!' as message,
       'Comprehensive cultivation tasks added for all growth stages' as details;
