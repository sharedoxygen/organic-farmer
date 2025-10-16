// Data Integrity Types
// CRITICAL: Required for database integrity verification per AI_DEVELOPMENT_GUIDE.md

export interface IntegrityViolation {
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    table: string;
    field?: string;
    description: string;
    fixRequired: boolean;
    recordCount?: number;
    constraint?: string;
}

export interface IntegrityWarning {
    id: string;
    type: string;
    table: string;
    field?: string;
    description: string;
    recommendation: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IntegrityCheckResult {
    passed: boolean;
    violations: IntegrityViolation[];
    warnings: IntegrityWarning[];
    summary: string;
    timestamp?: Date;
    executionTime?: number;
}

export interface OrphanedRecord {
    table: string;
    field: string;
    recordId: string;
    referencedTable: string;
    referencedField: string;
    orphanedValue: string;
}

export interface OrphanDetectionResult {
    hasOrphans: boolean;
    orphanedRecords: OrphanedRecord[];
    summary: string;
    totalCount: number;
}

export interface DatabaseHealthResult {
    overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    integrity: IntegrityCheckResult;
    orphans: OrphanDetectionResult;
    performance?: {
        queryTime: number;
        connectionStatus: string;
    };
    recommendations: string[];
}

export interface DeletionSafetyCheck {
    safe: boolean;
    dependentRecords: {
        table: string;
        count: number;
        action: 'CASCADE' | 'PREVENT' | 'SET_NULL';
    }[];
    warnings: string[];
} 