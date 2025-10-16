'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Modal } from '@/components/ui/Modal/Modal';
import {
  InputField,
  SelectField,
  TextareaField,
  DateField,
  NumberField
} from '@/components/ui/FormComponents/FormComponents';
import Button from '@/components/ui/Button/Button';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  dueDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  relatedBatchId?: string;
  relatedEquipmentId?: string;
  users_tasks_assignedToTousers?: {
    firstName: string;
    lastName: string;
  };
  batches?: {
    batchNumber: string;
    seed_varieties?: {
      name: string;
    };
  };
}

export default function DailyTasksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { currentFarm } = useTenant();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating new task
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WATERING',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    estimatedHours: 1,
    assignedTo: '',
    batchId: '',
    equipmentId: '',
    notes: ''
  });

  const loadTasks = useCallback(async () => {
    if (!currentFarm?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tasks?limit=100', {
        headers: {
          'X-Farm-ID': currentFarm.id,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setTasks(data.data);
      } else {
        console.error('Failed to load tasks:', data.error);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentFarm?.id]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated && currentFarm?.id) {
        loadTasks();
      } else if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [isAuthLoading, isAuthenticated, currentFarm?.id, router, loadTasks]);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      case 'SCHEDULED': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getTaskTypeIcon = (category: string) => {
    switch (category) {
      case 'WATERING': return '💧';
      case 'QUALITY_CHECK': return '🔍';
      case 'HARVESTING': return '✂️';
      case 'MAINTENANCE': return '🔧';
      case 'FEEDING': return '🌱';
      case 'MONITORING': return '👁️';
      case 'CLEANING': return '🧹';
      case 'PROCESSING': return '⚙️';
      case 'PACKAGING': return '📦';
      case 'TRANSPLANTING': return '🌿';
      case 'PRUNING': return '✂️';
      case 'DRYING': return '🌡️';
      case 'CURING': return '🏺';
      case 'FLOWERING': return '🌸';
      case 'PROPAGATION': return '🌱';
      default: return '📋';
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!currentFarm?.id) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Farm-ID': currentFarm.id,
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
          ...(newStatus === 'COMPLETED' && { actualDuration: 60 }) // Default 60 minutes
        }),
      });

      if (response.ok) {
        // Refresh tasks after update
        loadTasks();
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const markComplete = (taskId: string) => {
    updateTaskStatus(taskId, 'COMPLETED');
  };

  const startTask = (taskId: string) => {
    updateTaskStatus(taskId, 'IN_PROGRESS');
  };

  const viewTaskDetails = async (taskId: string) => {
    if (!currentFarm?.id) {
      console.error('No farm context available');
      return;
    }

    setLoadingDetails(true);
    setShowDetailsModal(true);
    setSelectedTask(null);

    try {
      console.log('Fetching task details for:', taskId);
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'X-Farm-ID': currentFarm.id,
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const taskData = await response.json();
        console.log('Task data received:', taskData);
        setSelectedTask(taskData);
      } else {
        const errorData = await response.json();
        console.error('Failed to load task details:', response.status, errorData);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      setSelectedTask(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!currentFarm?.id) {
      setError('No farm context available');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Combine date and time for due date
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Farm-ID': currentFarm.id
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          priority: formData.priority,
          dueDate: dueDateTime.toISOString(),
          estimatedHours: formData.estimatedHours,
          assignedTo: formData.assignedTo || undefined,
          batchId: formData.batchId || undefined,
          equipmentId: formData.equipmentId || undefined,
          notes: formData.notes.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        type: 'WATERING',
        priority: 'MEDIUM',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        estimatedHours: 1,
        assignedTo: '',
        batchId: '',
        equipmentId: '',
        notes: ''
      });
      setShowCreateModal(false);

      // Reload tasks
      await loadTasks();

    } catch (error) {
      console.error('Error creating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' ? Number(value) : value
    }));
  };

  if (loading) return <div className={styles.container}>Loading tasks...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Tasks</h1>
          <p className={styles.subtitle}>Manage your daily farm operations</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className={styles.primaryButton}
        >
          Add Task
        </Button>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'ALL' ? styles.active : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'PENDING' ? styles.active : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending ({tasks.filter(t => t.status === 'PENDING').length})
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'IN_PROGRESS' ? styles.active : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'COMPLETED' ? styles.active : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      <div className={styles.tasksGrid}>
        {filteredTasks.map((task) => (
          <div key={task.id} className={styles.taskCard}>
            <div className={styles.cardHeader}>
              <div className={styles.taskInfo}>
                <span className={styles.taskIcon}>{getTaskTypeIcon(task.category)}</span>
                <div>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <p className={styles.taskType}>{task.category.replace('_', ' ')}</p>
                </div>
              </div>
              <div className={styles.badges}>
                <span
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(task.status) }}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.description}>{task.description}</p>

              <div className={styles.taskDetails}>
                <div className={styles.detail}>
                  <span className={styles.label}>Assigned to:</span>
                  <span className={styles.value}>
                    {task.users_tasks_assignedToTousers
                      ? `${task.users_tasks_assignedToTousers.firstName} ${task.users_tasks_assignedToTousers.lastName}`
                      : 'Unassigned'
                    }
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Due Date:</span>
                  <span className={styles.value}>{formatTime(task.dueDate)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Estimated Time:</span>
                  <span className={styles.value}>{task.estimatedDuration} min</span>
                </div>
                {task.batches && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Batch:</span>
                    <span className={styles.value}>
                      {task.batches.batchNumber} - {task.batches.seed_varieties?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                {task.actualDuration && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Actual Time:</span>
                    <span className={styles.value}>{task.actualDuration} min</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.actionButton}
                onClick={() => viewTaskDetails(task.id)}
              >
                View Details
              </button>
              {task.status === 'PENDING' && (
                <button
                  className={styles.startButton}
                  onClick={() => startTask(task.id)}
                >
                  Start Task
                </button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button
                  className={styles.completeButton}
                  onClick={() => markComplete(task.id)}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tasks found for the selected filter.</p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal
          title="Create New Task"
          subtitle="Add a new task to your daily schedule"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="large"
        >
          <form onSubmit={handleCreateTask} className={styles.createForm}>
            <div className={styles.formSection}>
              <h4>Task Details</h4>
              <div className={styles.formRow}>
                <InputField
                  label="Task Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter task title"
                />
              </div>

              <TextareaField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />

              <div className={styles.formRow}>
                <SelectField
                  label="Task Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={[
                    { value: '', label: 'Select task type' },
                    { value: 'WATERING', label: '💧 Watering' },
                    { value: 'QUALITY_CHECK', label: '🔍 Quality Check' },
                    { value: 'HARVESTING', label: '✂️ Harvesting' },
                    { value: 'MAINTENANCE', label: '🔧 Maintenance' },
                    { value: 'FEEDING', label: '🌱 Feeding' },
                    { value: 'MONITORING', label: '👁️ Monitoring' },
                    { value: 'CLEANING', label: '🧹 Cleaning' },
                    { value: 'PROCESSING', label: '⚙️ Processing' },
                    { value: 'PACKAGING', label: '📦 Packaging' },
                    { value: 'TRANSPLANTING', label: '🌿 Transplanting' },
                    { value: 'PRUNING', label: '✂️ Pruning' },
                    { value: 'DRYING', label: '🌡️ Drying' },
                    { value: 'CURING', label: '🏺 Curing' },
                    { value: 'FLOWERING', label: '🌸 Flowering' },
                    { value: 'PROPAGATION', label: '🌱 Propagation' },
                    { value: 'GENERAL', label: '📋 General' }
                  ]}
                  required
                />

                <SelectField
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'LOW', label: '🟢 Low' },
                    { value: 'MEDIUM', label: '🟡 Medium' },
                    { value: 'HIGH', label: '🟠 High' },
                    { value: 'URGENT', label: '🔴 Urgent' }
                  ]}
                  required
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h4>Scheduling</h4>
              <div className={styles.formRow}>
                <DateField
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />

                <InputField
                  label="Due Time"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  required
                />

                <NumberField
                  label="Estimated Hours"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                  min="0.5"
                  step="0.5"
                  unit="hours"
                  required
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h4>Assignment & Resources</h4>
              <div className={styles.formRow}>
                <InputField
                  label="Assigned To"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Leave blank for current user"
                />

                <InputField
                  label="Batch ID"
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  placeholder="Optional batch ID"
                />

                <InputField
                  label="Equipment ID"
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  placeholder="Optional equipment ID"
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Additional notes or instructions"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && (
        <Modal
          title="Task Details"
          subtitle={selectedTask?.title || 'Loading...'}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTask(null);
          }}
          size="large"
        >
          {loadingDetails ? (
            <div className={styles.loadingDetails}>Loading task details...</div>
          ) : selectedTask ? (
            <div className={styles.detailsContent}>
              <div className={styles.detailsSection}>
                <h4>General Information</h4>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Title</span>
                    <span className={styles.detailValue}>{selectedTask.title}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Description</span>
                    <span className={styles.detailValue}>{selectedTask.description || 'No description'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Category</span>
                    <span className={styles.detailValue}>
                      {getTaskTypeIcon(selectedTask.category)} {selectedTask.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Priority</span>
                    <span
                      className={styles.detailBadge}
                      style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span
                      className={styles.detailBadge}
                      style={{ backgroundColor: getStatusColor(selectedTask.status) }}
                    >
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Assignment & Scheduling</h4>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Assigned To</span>
                    <span className={styles.detailValue}>
                      {selectedTask.users_tasks_assignedToTousers
                        ? `${selectedTask.users_tasks_assignedToTousers.firstName} ${selectedTask.users_tasks_assignedToTousers.lastName}`
                        : 'Unassigned'
                      }
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Due Date</span>
                    <span className={styles.detailValue}>
                      {new Date(selectedTask.dueDate).toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estimated Duration</span>
                    <span className={styles.detailValue}>{selectedTask.estimatedDuration} minutes</span>
                  </div>
                  {selectedTask.actualDuration && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Actual Duration</span>
                      <span className={styles.detailValue}>{selectedTask.actualDuration} minutes</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTask.batches && (
                <div className={styles.detailsSection}>
                  <h4>Related Batch</h4>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Batch Number</span>
                      <span className={styles.detailValue}>{selectedTask.batches.batchNumber}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Variety</span>
                      <span className={styles.detailValue}>
                        {selectedTask.batches.seed_varieties?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Close
                </Button>
                {selectedTask.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      startTask(selectedTask.id);
                      setShowDetailsModal(false);
                      setSelectedTask(null);
                    }}
                  >
                    Start Task
                  </Button>
                )}
                {selectedTask.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      markComplete(selectedTask.id);
                      setShowDetailsModal(false);
                      setSelectedTask(null);
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.errorDetails}>
              <p>Failed to load task details. Please try again.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
