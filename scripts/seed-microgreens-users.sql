-- Create Users for Curry Island Microgreens Farm
-- This script creates users specific to microgreens operations

BEGIN;

-- Create Users for Curry Island Microgreens
INSERT INTO users (
    id, email, "firstName", "lastName", password, department, position, roles, permissions, "hireDate", "createdAt", "updatedAt"
) VALUES 
('00000000-0000-0000-0000-000000000301', '

'manager@curryisland.com', 'Emma', 'Rodriguez', '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ', 'Operations', 'Farm Manager', 'MANAGER', 'ALL', NOW() - INTERVAL '1 year', NOW(), NOW()),
('00000000-0000-0000-0000-000000000302', 'grower@curryisland.com', 'James', 'Kim', '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ', 'Production', 'Lead Grower', 'TEAM_LEAD', 'PRODUCTION_WRITE', NOW() - INTERVAL '8 months', NOW(), NOW()),
('00000000-0000-0000-0000-000000000303', 'harvest@curryisland.com', 'Maria', 'Santos', '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ', 'Production', 'Harvest Specialist', 'TEAM_MEMBER', 'PRODUCTION_READ', NOW() - INTERVAL '6 months', NOW(), NOW()),
('00000000-0000-0000-0000-000000000304', 'maintenance@curryisland.com', 'David', 'Chen', '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ', 'Maintenance', 'Equipment Technician', 'SPECIALIST', 'EQUIPMENT_WRITE', NOW() - INTERVAL '4 months', NOW(), NOW()),
('00000000-0000-0000-0000-000000000305', 'packaging@curryisland.com', 'Lisa', 'Thompson', '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ', 'Production', 'Packaging Specialist', 'TEAM_MEMBER', 'PRODUCTION_READ', NOW() - INTERVAL '3 months', NOW(), NOW());

-- Assign Users to Curry Island Microgreens Farm
INSERT INTO farm_users (
    farm_id, user_id, role, joined_at, is_active
) VALUES 
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000301', 'MANAGER', NOW(), true),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000302', 'TEAM_LEAD', NOW(), true),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000303', 'TEAM_MEMBER', NOW(), true),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000304', 'SPECIALIST', NOW(), true),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000305', 'TEAM_MEMBER', NOW(), true);

COMMIT; 