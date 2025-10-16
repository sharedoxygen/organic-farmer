-- Microgreens Task Management Seed Data for Curry Island Microgreens
-- This script creates realistic microgreens cultivation tasks across all growth stages

BEGIN;

-- Microgreens Cultivation Tasks for Curry Island Microgreens
-- Farm ID: 00000000-0000-0000-0000-000000000010

-- Daily/Recurring Tasks for Microgreens Operations
INSERT INTO tasks (
    id, title, description, "createdAt", "updatedAt", "actualDuration", 
    "assignedBy", "assignedTo", category, "completedAt", "completedBy", 
    "completionNotes", dependencies, "dueDate", "estimatedDuration", 
    "relatedBatchId", "relatedEquipmentId", priority, status, farm_id
) VALUES 

-- DAILY SEEDING AND PLANTING TASKS
('task-mg-001', 'Soak Arugula Seeds - Tray A1-A5', 'Soak arugula seeds for 4-6 hours before planting. Use filtered water at room temperature.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'SEEDING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 hours', 30, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000010'),

('task-mg-002', 'Plant Soaked Kale Seeds', 'Plant pre-soaked kale seeds in prepared trays with growing medium. Ensure even distribution.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'SEEDING', NULL, NULL, NULL, '["task-mg-001"]', NOW() + INTERVAL '6 hours', 45, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-003', 'Morning Misting - Growing Trays', 'Mist all growing trays with fine spray. Ensure soil moisture without waterlogging.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'WATERING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 hour', 20, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-004', 'Evening Misting - Growing Trays', 'Evening misting session for all active growing trays. Check for proper drainage.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'WATERING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '10 hours', 20, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-005', 'Germination Check - Day 2-3 Trays', 'Check seed germination progress on trays planted 2-3 days ago. Document germination rates.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 hours', 15, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- BLACKOUT PERIOD TASKS
('task-mg-006', 'Cover Newly Seeded Trays', 'Cover newly seeded trays with blackout covers for 2-3 day blackout period.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NULL, NULL, NULL, '["task-mg-002"]', NOW() + INTERVAL '8 hours', 15, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-007', 'Remove Blackout Covers - Broccoli Trays', 'Remove blackout covers from broccoli trays after 3-day germination period. Introduce to light.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '5 hours', 10, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- GROWING PERIOD TASKS (Days 4-10)
('task-mg-008', 'Adjust Growing Lights - Zone 1', 'Adjust LED growing lights to optimal height (12-18 inches) for microgreens in Zone 1.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000304', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '4 hours', 20, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-009', 'Bottom Watering - Mature Trays', 'Perform bottom watering for trays with established microgreens. Avoid overhead watering.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'WATERING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '6 hours', 25, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-010', 'Trim Test Samples - Ready Varieties', 'Take small test samples from nearly ready microgreens to check taste and texture.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'QUALITY_CHECK', NULL, NULL, NULL, '[]', NOW() + INTERVAL '7 hours', 15, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- HARVESTING TASKS
('task-mg-011', 'Harvest Mature Arugula - Trays B1-B10', 'Harvest mature arugula microgreens. Cut just above soil level with clean scissors.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'HARVESTING', NULL, NULL, NULL, '["task-mg-010"]', NOW() + INTERVAL '3 hours', 60, NULL, NULL, 'URGENT', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-012', 'Harvest Kale Microgreens - Morning Batch', 'Harvest fresh kale microgreens for morning orders. Ensure clean cutting and immediate cooling.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'HARVESTING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 hour', 45, NULL, NULL, 'URGENT', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- POST-HARVEST PROCESSING
('task-mg-013', 'Wash and Pack Harvested Microgreens', 'Gently wash harvested microgreens in cold water and pack in breathable containers.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'PROCESSING', NULL, NULL, NULL, '["task-mg-011"]', NOW() + INTERVAL '4 hours', 40, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-014', 'Label and Store Packaged Microgreens', 'Apply harvest date labels and store packaged microgreens in refrigerated storage.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'PACKAGING', NULL, NULL, NULL, '["task-mg-013"]', NOW() + INTERVAL '5 hours', 30, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- TRAY PREPARATION AND CLEANING
('task-mg-015', 'Clean and Sanitize Empty Trays', 'Clean harvested trays with food-safe sanitizer. Prepare for next planting cycle.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'CLEANING', NULL, NULL, NULL, '["task-mg-011"]', NOW() + INTERVAL '6 hours', 35, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-016', 'Prepare Growing Medium - Fresh Trays', 'Mix and prepare organic growing medium for new planting trays. Check pH and moisture.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'SEEDING', NULL, NULL, NULL, '["task-mg-015"]', NOW() + INTERVAL '8 hours', 45, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- QUALITY CONTROL AND MONITORING
('task-mg-017', 'Check Growing Environment Temperature', 'Monitor and record temperature in all growing zones. Optimal range: 65-75°F.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 hours', 10, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-018', 'Inspect for Mold or Disease', 'Visual inspection of all growing trays for signs of mold, disease, or pest issues.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'QUALITY_CHECK', NULL, NULL, NULL, '[]', NOW() + INTERVAL '9 hours', 25, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021'),

-- COMPLETED TASKS (for demonstration)
('task-mg-019', 'Morning Germination Check - Radish Trays', 'Checked radish seed germination. 95% germination rate achieved. Excellent batch quality.', NOW() - INTERVAL '2 hours', NOW(), 12, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NOW() - INTERVAL '30 minutes', '00000000-0000-0000-0000-000000000302', 'Excellent germination rate. Seedlings healthy and uniform. Ready for light exposure.', '[]', NOW() - INTERVAL '3 hours', 15, NULL, NULL, 'MEDIUM', 'COMPLETED', '00000000-0000-0000-0000-000000000021'),

('task-mg-020', 'Harvest Sunflower Microgreens', 'Harvested 2.5 lbs of sunflower microgreens for restaurant orders. Quality excellent.', NOW() - INTERVAL '4 hours', NOW(), 35, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'HARVESTING', NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000305', 'Perfect harvest timing. Microgreens at optimal size and flavor. All orders fulfilled.', '[]', NOW() - INTERVAL '5 hours', 40, NULL, NULL, 'URGENT', 'COMPLETED', '00000000-0000-0000-0000-000000000021'),

('task-mg-021', 'Clean Harvesting Tools', 'Sanitized all harvesting scissors and tools with food-safe cleaning solution.', NOW() - INTERVAL '3 hours', NOW(), 15, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'CLEANING', NOW() - INTERVAL '45 minutes', '00000000-0000-0000-0000-000000000303', 'All tools properly cleaned and stored. Ready for next harvest session.', '[]', NOW() - INTERVAL '4 hours', 20, NULL, NULL, 'MEDIUM', 'COMPLETED', '00000000-0000-0000-0000-000000000021'),

-- IN-PROGRESS TASKS
('task-mg-022', 'Package Mixed Microgreen Salads', 'Creating custom mixed microgreen packages for local restaurant orders.', NOW() - INTERVAL '20 minutes', NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'PACKAGING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '40 minutes', 50, NULL, NULL, 'HIGH', 'IN_PROGRESS', '00000000-0000-0000-0000-000000000021'),

('task-mg-023', 'Monitor New Pea Shoot Plantings', 'Monitoring newly planted pea shoots for proper germination and growth conditions.', NOW() - INTERVAL '1 hour', NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'MONITORING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 hours', 30, NULL, NULL, 'MEDIUM', 'IN_PROGRESS', '00000000-0000-0000-0000-000000000021'),

-- SCHEDULED FUTURE TASKS
('task-mg-024', 'Plant Next Batch of Arugula Seeds', 'Plant new arugula batch to maintain continuous harvest schedule. Soak seeds first.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000302', 'SEEDING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 day', 45, NULL, NULL, 'HIGH', 'SCHEDULED', '00000000-0000-0000-0000-000000000021'),

('task-mg-025', 'Delivery Preparation - Restaurant Orders', 'Prepare all packaged microgreens for restaurant delivery route.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'DELIVERY', NULL, NULL, NULL, '["task-mg-022"]', NOW() + INTERVAL '2 hours', 30, NULL, NULL, 'HIGH', 'SCHEDULED', '00000000-0000-0000-0000-000000000021'),

('task-mg-026', 'Weekly Deep Clean - Growing Area', 'Complete sanitization of all growing areas, shelving, and equipment.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'CLEANING', NULL, NULL, NULL, '[]', NOW() + INTERVAL '3 days', 90, NULL, NULL, 'MEDIUM', 'SCHEDULED', '00000000-0000-0000-0000-000000000021'),

('task-mg-027', 'Inventory Check - Seeds and Supplies', 'Check inventory levels of all seed varieties and growing supplies. Update reorder list.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000304', 'ADMINISTRATIVE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '2 days', 60, NULL, NULL, 'LOW', 'SCHEDULED', '00000000-0000-0000-0000-000000000021'),

-- EQUIPMENT MAINTENANCE TASKS
('task-mg-028', 'Check LED Light Performance', 'Test all LED growing lights for proper function and replace any burned out bulbs.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000304', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '1 day', 30, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-029', 'Calibrate Misting System', 'Check and calibrate automatic misting system timers and nozzle function.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000304', 'MAINTENANCE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '5 days', 45, NULL, NULL, 'MEDIUM', 'PENDING', '00000000-0000-0000-0000-000000000021'),

('task-mg-030', 'Customer Order Fulfillment Check', 'Review and prepare all pending customer orders for next day delivery.', NOW(), NOW(), NULL, '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000305', 'ADMINISTRATIVE', NULL, NULL, NULL, '[]', NOW() + INTERVAL '12 hours', 40, NULL, NULL, 'HIGH', 'PENDING', '00000000-0000-0000-0000-000000000021');

COMMIT; 