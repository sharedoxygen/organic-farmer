/**
 * Batch Status Utilities for OFMS
 * Handles status mapping for both standard and cannabis-specific batch statuses
 */

export type BatchStatus =
  // Standard statuses
  | 'PLANTED'
  | 'GERMINATING'
  | 'GROWING'
  | 'READY_TO_HARVEST'
  | 'HARVESTED'
  | 'FAILED'
  // Cannabis-specific statuses
  | 'VEGETATIVE'
  | 'FLOWERING_WEEK_1'
  | 'FLOWERING_WEEK_2'
  | 'FLOWERING_WEEK_3'
  | 'FLOWERING_WEEK_4'
  | 'FLOWERING_WEEK_5'
  | 'FLOWERING_WEEK_6'
  | 'FLOWERING_WEEK_7'
  | 'FLOWERING_WEEK_8';

/**
 * Get all active batch statuses (both standard and cannabis-specific)
 */
export function getActiveBatchStatuses(): BatchStatus[] {
  return [
    'PLANTED', 'GERMINATING', 'GROWING', 'READY_TO_HARVEST',
    // Cannabis-specific active statuses
    'VEGETATIVE', 'FLOWERING_WEEK_1', 'FLOWERING_WEEK_2', 'FLOWERING_WEEK_3',
    'FLOWERING_WEEK_4', 'FLOWERING_WEEK_5', 'FLOWERING_WEEK_6', 'FLOWERING_WEEK_7', 'FLOWERING_WEEK_8'
  ];
}

/**
 * Check if a batch status is considered "active" (growing)
 */
export function isBatchStatusActive(status: string): boolean {
  const activeStatuses = getActiveBatchStatuses();
  return activeStatuses.includes(status as BatchStatus);
}

/**
 * Check if a batch status is "ready to harvest"
 */
export function isBatchStatusReadyToHarvest(status: string): boolean {
  return status === 'READY_TO_HARVEST';
}

/**
 * Check if a batch status is "harvested"
 */
export function isBatchStatusHarvested(status: string): boolean {
  return status === 'HARVESTED';
}

/**
 * Check if a batch status is "failed"
 */
export function isBatchStatusFailed(status: string): boolean {
  return status === 'FAILED';
}

/**
 * Get display-friendly status label
 */
export function getStatusDisplayLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'PLANTED': 'Planted',
    'GERMINATING': 'Germinating',
    'GROWING': 'Growing',
    'READY_TO_HARVEST': 'Ready to Harvest',
    'HARVESTED': 'Harvested',
    'FAILED': 'Failed',
    'VEGETATIVE': 'Vegetative',
    'FLOWERING_WEEK_1': 'Flowering Week 1',
    'FLOWERING_WEEK_2': 'Flowering Week 2',
    'FLOWERING_WEEK_3': 'Flowering Week 3',
    'FLOWERING_WEEK_4': 'Flowering Week 4',
    'FLOWERING_WEEK_5': 'Flowering Week 5',
    'FLOWERING_WEEK_6': 'Flowering Week 6',
    'FLOWERING_WEEK_7': 'Flowering Week 7',
    'FLOWERING_WEEK_8': 'Flowering Week 8'
  };

  return statusLabels[status] || status.replace(/_/g, ' ');
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'PLANTED': '#6b7280', // gray
    'GERMINATING': '#f59e0b', // amber
    'GROWING': '#10b981', // emerald
    'READY_TO_HARVEST': '#3b82f6', // blue
    'HARVESTED': '#22c55e', // green
    'FAILED': '#ef4444', // red
    'VEGETATIVE': '#10b981', // emerald (same as growing)
    'FLOWERING_WEEK_1': '#8b5cf6', // violet
    'FLOWERING_WEEK_2': '#8b5cf6', // violet
    'FLOWERING_WEEK_3': '#8b5cf6', // violet
    'FLOWERING_WEEK_4': '#8b5cf6', // violet
    'FLOWERING_WEEK_5': '#8b5cf6', // violet
    'FLOWERING_WEEK_6': '#8b5cf6', // violet
    'FLOWERING_WEEK_7': '#8b5cf6', // violet
    'FLOWERING_WEEK_8': '#8b5cf6'  // violet
  };

  return statusColors[status] || '#6b7280'; // default gray
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    'PLANTED': '🌱',
    'GERMINATING': '🌿',
    'GROWING': '🌾',
    'READY_TO_HARVEST': '✅',
    'HARVESTED': '📦',
    'FAILED': '❌',
    'VEGETATIVE': '🌿',
    'FLOWERING_WEEK_1': '🌸',
    'FLOWERING_WEEK_2': '🌸',
    'FLOWERING_WEEK_3': '🌸',
    'FLOWERING_WEEK_4': '🌸',
    'FLOWERING_WEEK_5': '🌸',
    'FLOWERING_WEEK_6': '🌸',
    'FLOWERING_WEEK_7': '🌸',
    'FLOWERING_WEEK_8': '🌸'
  };

  return statusIcons[status] || '📋';
}

/**
 * Filter batches by status category
 */
export function filterBatchesByStatus(batches: any[], statusFilter: string): any[] {
  switch (statusFilter) {
    case 'active':
      return batches.filter(batch => isBatchStatusActive(batch.status));
    case 'ready':
      return batches.filter(batch => isBatchStatusReadyToHarvest(batch.status));
    case 'harvested':
      return batches.filter(batch => isBatchStatusHarvested(batch.status));
    case 'failed':
      return batches.filter(batch => isBatchStatusFailed(batch.status));
    default:
      return batches;
  }
}

