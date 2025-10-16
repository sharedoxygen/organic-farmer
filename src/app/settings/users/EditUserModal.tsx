'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import { useAuth } from '@/components/AuthProvider';
import styles from './EditUserModal.module.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  employeeId?: string;
  isActive: boolean;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { currentFarm } = useTenant();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is owner or admin
  const isOwner = currentUser?.role === 'OWNER';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADMINISTRATOR';

  // Debug logging
  console.log('EditUserModal - Current User:', currentUser?.email, 'Role:', currentUser?.role);
  console.log('EditUserModal - Is Owner:', isOwner, 'Is Admin:', isAdmin);
  console.log('EditUserModal - Editing User:', user.email, 'Role:', user.role);
  
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'TEAM_MEMBER',
    department: user.department || '',
    position: user.position || '',
    employeeId: user.employeeId || '',
    isActive: user.isActive
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFarm?.id) {
      setError('No farm context available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Farm-ID': currentFarm.id,
          'Authorization': `Bearer ${currentUser?.id}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit User</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            {/* Personal Information */}
            <div className={styles.formSection}>
              <h3>Personal Information</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Enter first name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">
                    Last Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Work Information */}
            <div className={styles.formSection}>
              <h3>Work Information</h3>

              <div className={styles.formGroup}>
                <label htmlFor="role">
                  Role <span className={styles.required}>*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  {/* Owner role - Only show if user is already an owner, and disable it */}
                  {user.role === 'OWNER' && (
                    <option value="OWNER" disabled>
                      Owner (Cannot be reassigned)
                    </option>
                  )}
                  
                  {/* Admin role - Only owners can assign, or if editing existing admin */}
                  {(isOwner || user.role === 'ADMIN' || user.role === 'ADMINISTRATOR') && (
                    <option value="ADMIN" disabled={!isOwner && (user.role === 'ADMIN' || user.role === 'ADMINISTRATOR')}>
                      Administrator {!isOwner && (user.role === 'ADMIN' || user.role === 'ADMINISTRATOR') ? '(Contact Owner to change)' : ''}
                    </option>
                  )}
                  
                  {/* Standard roles - Available to all managers */}
                  <option value="FARM_MANAGER">Farm Manager</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="PRODUCTION_LEAD">Production Lead</option>
                  <option value="QUALITY_LEAD">Quality Lead</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="SPECIALIST">Specialist</option>
                </select>
                {!isOwner && !isAdmin && (
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    ℹ️ Owner and Administrator roles can only be assigned by farm owners
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  <option value="Production">Production</option>
                  <option value="Quality">Quality & Compliance</option>
                  <option value="Sales">Sales & Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Management">Management</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="position">Position/Title</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Senior Grower"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP-001"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={styles.formSection}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Active User</span>
                <small>Inactive users cannot log in to the system</small>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
