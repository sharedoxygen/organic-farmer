-- Database Health Check SQL
-- Validates database connectivity and basic table integrity

SELECT 'Database Connection Test' as check_type, 'PASSED' as status, NOW() as timestamp;

-- Check table counts to ensure data integrity
SELECT 
    'Table Count Check' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN 'PASSED'
        ELSE 'WARNING - No users found'
    END as status,
    NOW() as timestamp;

-- Verify foreign key relationships
SELECT 
    'Foreign Key Integrity' as check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM batches b 
            LEFT JOIN users u ON b."createdBy" = u.id 
            WHERE u.id IS NULL
        ) = 0 THEN 'PASSED'
        ELSE 'FAILED - Orphaned batch records found'
    END as status,
    NOW() as timestamp;

SELECT 'Health Check Complete' as check_type, 'SUCCESS' as status, NOW() as timestamp; 