'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, CrudModal, CrudField } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { crudService } from '@/lib/api/crudService';
import styles from './page.module.css';

interface QualityCheck {
  id: string;
  batchId: string;
  batchNumber: string;
  checkType: 'germination' | 'growth' | 'harvest' | 'final';
  status: 'pending' | 'passed' | 'failed';
  checkedBy: string;
  checkedAt: string;
  ph?: number;
  ecLevel?: number;
  pestsDetected?: boolean;
  diseaseDetected?: boolean;
  uniformityScore?: number;
  colorScore?: number;
  sizeScore?: number;
  weightPerTray?: number;
  notes?: string;
}

interface QualityFilters {
  status: string;
  checkType: string;
  search: string;
}

// Use existing quality checks service
const qualityCheckService = crudService.qualityChecks;

// Define form fields
const qualityCheckFields: CrudField[] = [
  {
    name: 'batchId',
    label: 'Batch',
    type: 'select',
    required: true,
    options: [] // Will be populated dynamically
  },
  {
    name: 'checkType',
    label: 'Check Type',
    type: 'select',
    required: true,
    options: [
      { value: 'germination', label: 'Germination Check' },
      { value: 'growth', label: 'Growth Check' },
      { value: 'harvest', label: 'Harvest Check' },
      { value: 'final', label: 'Final Quality Check' }
    ]
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'passed', label: 'Passed' },
      { value: 'failed', label: 'Failed' }
    ]
  },
  {
    name: 'checkedAt',
    label: 'Check Date',
    type: 'date',
    required: true
  },
  {
    name: 'ph',
    label: 'pH Level',
    type: 'number',
    min: 0,
    max: 14,
    step: 0.1,
    placeholder: 'e.g., 6.5'
  },
  {
    name: 'ecLevel',
    label: 'EC Level (mS/cm)',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'e.g., 1.5'
  },
  {
    name: 'pestsDetected',
    label: 'Pests Detected',
    type: 'checkbox'
  },
  {
    name: 'diseaseDetected',
    label: 'Disease Detected',
    type: 'checkbox'
  },
  {
    name: 'uniformityScore',
    label: 'Uniformity Score (1-10)',
    type: 'number',
    min: 1,
    max: 10,
    showWhen: (data) => data.checkType === 'growth' || data.checkType === 'harvest'
  },
  {
    name: 'colorScore',
    label: 'Color Score (1-10)',
    type: 'number',
    min: 1,
    max: 10,
    showWhen: (data) => data.checkType === 'harvest' || data.checkType === 'final'
  },
  {
    name: 'sizeScore',
    label: 'Size Score (1-10)',
    type: 'number',
    min: 1,
    max: 10,
    showWhen: (data) => data.checkType === 'harvest' || data.checkType === 'final'
  },
  {
    name: 'weightPerTray',
    label: 'Weight per Tray (oz)',
    type: 'number',
    min: 0,
    step: 0.1,
    showWhen: (data) => data.checkType === 'harvest' || data.checkType === 'final'
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    rows: 3,
    fullWidth: true,
    placeholder: 'Any observations or issues...'
  }
];

export default function QualityControlPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { currentFarm } = useTenant();

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [filteredChecks, setFilteredChecks] = useState<QualityCheck[]>([]);
  const [filters, setFilters] = useState<QualityFilters>({
    status: 'all',
    checkType: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [modalOpen, setModalOpen] = useState(false);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([]);

  const loadQualityChecks = useCallback(async () => {
    setLoading(true);
    try {
      const checks = await qualityCheckService.list();
      setQualityChecks(checks);
    } catch (error) {
      console.error('Error loading quality checks:', error);
      setQualityChecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      // ✅ CRITICAL FIX: Proper farm context validation
      if (!currentFarm?.id) {
        throw new Error('No farm context available. Please select a farm.');
      }

      // Get user data for authorization
      const userData = localStorage.getItem('ofms_user');
      const headers: Record<string, string> = {
        'X-Farm-ID': currentFarm.id
      };

      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch('/api/batches?status=active', {
        headers
      });
      const data = await response.json();
      if (data.success) {
        const options = data.data.map((batch: any) => ({
          value: batch.id,
          label: `${batch.batchNumber} - ${batch.seed_varieties?.name || 'Unknown'}`
        }));
        setBatchOptions(options);

        // Update field options
        const batchField = qualityCheckFields.find(f => f.name === 'batchId');
        if (batchField) {
          batchField.options = options;
        }
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  }, [currentFarm]);

  const applyFilters = useCallback(() => {
    let filtered = [...qualityChecks];
    if (filters.status !== 'all') {
      filtered = filtered.filter(check => check.status === filters.status);
    }
    if (filters.checkType !== 'all') {
      filtered = filtered.filter(check => check.checkType === filters.checkType);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(check =>
        check.batchNumber.toLowerCase().includes(searchLower) ||
        check.checkedBy.toLowerCase().includes(searchLower)
      );
    }
    setFilteredChecks(filtered);
  }, [qualityChecks, filters]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        loadQualityChecks();
        loadBatches();
      } else {
        router.push('/auth/signin');
      }
    }
  }, [isAuthLoading, isAuthenticated, router, loadQualityChecks, loadBatches]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reload when farm changes
  useEffect(() => {
    if (currentFarm && isAuthenticated) {
      loadQualityChecks();
      loadBatches();
    }
  }, [currentFarm?.id, isAuthenticated, loadQualityChecks, loadBatches]);

  // Listen for mode switch events
  useEffect(() => {
    const handleModeSwitch = (event: CustomEvent) => {
      if (event.detail.mode === 'edit' && selectedCheck) {
        setModalMode('edit');
      }
    };

    window.addEventListener('crudModalSwitchMode', handleModeSwitch as EventListener);
    return () => {
      window.removeEventListener('crudModalSwitchMode', handleModeSwitch as EventListener);
    };
  }, [selectedCheck]);

  const handleFilterChange = (filterType: keyof QualityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      default: return '📋';
    }
  };

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'germination': return '🌱';
      case 'growth': return '🌿';
      case 'harvest': return '🌾';
      case 'final': return '🌼';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateCheck = () => {
    setSelectedCheck(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewCheck = (check: QualityCheck) => {
    setSelectedCheck(check);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditCheck = (check: QualityCheck) => {
    setSelectedCheck(check);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleRetestCheck = (check: QualityCheck) => {
    // Create a new check based on the failed one
    const retestData = {
      ...check,
      id: undefined,
      status: 'pending',
      checkedAt: new Date().toISOString(),
      notes: `Retest of failed check from ${formatDate(check.checkedAt)}`
    };
    setSelectedCheck(retestData as any);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      // Add current user as checker
      const checkData = {
        ...data,
        checkedBy: user?.name || 'Unknown'
      };

      if (modalMode === 'create') {
        await qualityCheckService.create(checkData);
      } else {
        await qualityCheckService.update(selectedCheck!.id, checkData);
      }
      await loadQualityChecks();
    } catch (error) {
      console.error('Failed to save quality check:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedCheck) return;
    try {
      await qualityCheckService.delete(selectedCheck.id);
      await loadQualityChecks();
    } catch (error) {
      console.error('Failed to delete quality check:', error);
      throw error;
    }
  };

  const passCount = filteredChecks.filter(check => check.status === 'passed').length;
  const failCount = filteredChecks.filter(check => check.status === 'failed').length;
  const averageGrade = filteredChecks.filter(check => check.status === 'passed').length > 0 ?
    (filteredChecks.filter(check => check.status === 'passed').length / filteredChecks.length * 100).toFixed(0) : 0;

  if (loading || isAuthLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h1>🔍 Loading Quality Control...</h1>
          <p>Getting quality assurance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔍 Quality Control</h1>
        <p className={styles.subtitle}>Monitor and manage quality checks across all batches</p>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={handleCreateCheck}>
            + New Quality Check
          </Button>
        </div>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersContent}>
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search checks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterSection}>
            <select
              value={filters.checkType}
              onChange={(e) => handleFilterChange('checkType', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="germination">Germination</option>
              <option value="growth">Growth</option>
              <option value="harvest">Harvest</option>
              <option value="final">Final</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🔍</div>
          <div className={styles.statValue}>{filteredChecks.length}</div>
          <div className={styles.statLabel}>Total Checks</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{passCount}</div>
          <div className={styles.statLabel}>Passed</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statValue}>{failCount}</div>
          <div className={styles.statLabel}>Failed</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statValue}>{averageGrade}%</div>
          <div className={styles.statLabel}>Pass Rate</div>
        </Card>
      </div>

      <div className={styles.checksGrid}>
        {filteredChecks.map((check) => (
          <Card key={check.id} className={styles.checkCard}>
            <div className={styles.checkHeader}>
              <div className={styles.checkInfo}>
                <div className={styles.checkType}>
                  <span className={styles.typeIcon}>{getCheckTypeIcon(check.checkType)}</span>
                  <span className={styles.typeName}>{check.checkType.replace('_', ' ')}</span>
                </div>
                <div className={styles.batchNumber}>{check.batchNumber}</div>
              </div>
              <div className={styles.checkBadges}>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(check.status) }}
                >
                  {getStatusIcon(check.status)} {check.status}
                </span>
              </div>
            </div>

            <div className={styles.checkContent}>
              <div className={styles.checkMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Checked By:</span>
                  <span className={styles.metaValue}>{check.checkedBy}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Date:</span>
                  <span className={styles.metaValue}>
                    {formatDate(check.checkedAt)} at {formatTime(check.checkedAt)}
                  </span>
                </div>
              </div>

              {check.notes && (
                <div className={styles.notes}>
                  <strong>Notes:</strong> {check.notes}
                </div>
              )}
            </div>

            <div className={styles.checkActions}>
              <Button variant="secondary" size="sm" onClick={() => handleViewCheck(check)}>
                View Details
              </Button>
              {check.status === 'failed' && (
                <Button variant="primary" size="sm" onClick={() => handleRetestCheck(check)}>
                  Schedule Retest
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredChecks.length === 0 && (
        <Card className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No quality checks found</h3>
          <p>Try adjusting your filters or create a new quality check to get started.</p>
          <Button variant="primary" onClick={handleCreateCheck}>
            Create First Quality Check
          </Button>
        </Card>
      )}

      <CrudModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'New Quality Check'
            : modalMode === 'edit'
              ? 'Edit Quality Check'
              : `Quality Check: ${selectedCheck?.batchNumber || ''}`
        }
        mode={modalMode}
        data={selectedCheck}
        fields={qualityCheckFields}
        onSave={handleSave}
        onDelete={modalMode === 'edit' ? handleDelete : undefined}
        sections={[
          { title: 'Basic Information', fields: ['batchId', 'checkType', 'status', 'checkedAt'] },
          { title: 'Measurements', fields: ['ph', 'ecLevel', 'pestsDetected', 'diseaseDetected'] },
          { title: 'Quality Scores', fields: ['uniformityScore', 'colorScore', 'sizeScore', 'weightPerTray'] },
          { title: 'Additional Information', fields: ['notes'] }
        ]}
      />
    </div>
  );
}
