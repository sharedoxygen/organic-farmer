import React, { useState } from 'react';
import { Role } from '@/types/roles';
import {
    canCreateUserWithRole,
    FARM_ROLE_DISPLAY_NAMES,
    DEPARTMENT_STRUCTURE,
    getTypicalDepartments,
    validateRoleTransition,
    getEffectiveRole
} from '@/lib/utils/roleHelpers';
import { User } from './UserManagement';
import styles from './UserCreateModal.module.css'; // Reuse the same styles

interface UserEditModalProps {
    user: User;
    onClose: () => void;
    onSuccess: (userId: string, userData: any) => Promise<void>;
    currentUserRole: Role;
    existingUsers: User[];
}

export function UserEditModal({
    user,
    onClose,
    onSuccess,
    currentUserRole,
    existingUsers
}: UserEditModalProps) {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        roles: user.roles || [Role.TEAM_MEMBER],
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        employeeId: user.employeeId || '',
        managerId: user.managerId || '',
        isActive: user.isActive,
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Check if email already exists (excluding current user)
        if (formData.email && existingUsers.some(u =>
            u.id !== user.id && u.email.toLowerCase() === formData.email.toLowerCase()
        )) {
            newErrors.email = 'Email address already exists';
        }

        // Employee ID is read-only and shouldn't change

        // Password validation (only if password is provided)
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Role validation
        if (formData.roles.length === 0) {
            newErrors.roles = 'At least one role is required';
        } else {
            // Check if all selected roles are valid
            for (const role of formData.roles) {
                const roleValidation = validateRoleTransition(
                    getEffectiveRole(user.roles), // Check against highest current role
                    role,
                    currentUserRole
                );
                if (!roleValidation.valid) {
                    newErrors.roles = roleValidation.reason || `Invalid role: ${FARM_ROLE_DISPLAY_NAMES[role]}`;
                    break;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const updateData: any = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                roles: formData.roles,
                department: formData.department,
                position: formData.position.trim(),
                phone: formData.phone.trim() || undefined,
                employeeId: user.employeeId, // Keep original Employee ID unchanged
                managerId: formData.managerId || undefined,
                isActive: formData.isActive
            };

            // Only include password if it was provided
            if (formData.password) {
                updateData.password = formData.password;
            }

            await onSuccess(user.id, updateData);
        } catch (error) {
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to update user'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleRoleToggle = (role: Role) => {
        setFormData(prev => {
            const currentRoles = prev.roles;
            const newRoles = currentRoles.includes(role)
                ? currentRoles.filter(r => r !== role)
                : [...currentRoles, role];

            return {
                ...prev,
                roles: newRoles,
                // Auto-suggest department based on highest role if department is empty
                department: prev.department || getTypicalDepartments(getEffectiveRole(newRoles))[0] || prev.department
            };
        });
        if (errors.roles) {
            setErrors(prev => ({ ...prev, roles: '' }));
        }
    };

    const availableRoles = Object.values(Role).filter(role => {
        // User can keep their current roles
        if (user.roles.includes(role)) return true;
        // Or transition to roles they have permission for
        return canCreateUserWithRole(currentUserRole, role);
    });

    const canEditProfile = currentUserRole === Role.ADMIN || user.id === 'current-user-id'; // TODO: Get current user ID

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Edit Team Member</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Personal Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Personal Information</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="editFirstName">First Name *</label>
                                <input
                                    id="editFirstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={e => handleInputChange('firstName', e.target.value)}
                                    className={errors.firstName ? styles.error : ''}
                                    placeholder="Enter first name"
                                    disabled={!canEditProfile}
                                />
                                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="editLastName">Last Name *</label>
                                <input
                                    id="editLastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={e => handleInputChange('lastName', e.target.value)}
                                    className={errors.lastName ? styles.error : ''}
                                    placeholder="Enter last name"
                                    disabled={!canEditProfile}
                                />
                                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="editEmail">Email Address *</label>
                                <input
                                    id="editEmail"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleInputChange('email', e.target.value)}
                                    className={errors.email ? styles.error : ''}
                                    placeholder="user@ofms.com"
                                    disabled={!canEditProfile}
                                />
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="editPhone">Phone Number</label>
                                <input
                                    id="editPhone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => handleInputChange('phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                    disabled={!canEditProfile}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Work Information</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Roles * (Can select multiple)</label>
                                <div className={styles.rolesGrid}>
                                    {availableRoles.map(role => (
                                        <label key={role} className={styles.roleCheckbox}>
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(role)}
                                                onChange={() => handleRoleToggle(role)}
                                                disabled={currentUserRole !== Role.ADMIN && currentUserRole !== Role.MANAGER}
                                            />
                                            <span className={styles.roleLabel}>
                                                {FARM_ROLE_DISPLAY_NAMES[role]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.roles && <span className={styles.errorText}>{errors.roles}</span>}
                                <div className={styles.fieldHelp}>
                                    Select all roles this person should have. Highest role determines primary permissions.
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="editDepartment">Department *</label>
                                <select
                                    id="editDepartment"
                                    value={formData.department}
                                    onChange={e => handleInputChange('department', e.target.value)}
                                    className={errors.department ? styles.error : ''}
                                    disabled={!canEditProfile}
                                >
                                    <option value="">Select Department</option>
                                    {Object.entries(DEPARTMENT_STRUCTURE).map(([key, value]) => (
                                        <option key={key} value={value}>{value}</option>
                                    ))}
                                </select>
                                {errors.department && <span className={styles.errorText}>{errors.department}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="editPosition">Position/Title *</label>
                                <input
                                    id="editPosition"
                                    type="text"
                                    value={formData.position}
                                    onChange={e => handleInputChange('position', e.target.value)}
                                    className={errors.position ? styles.error : ''}
                                    placeholder="e.g., Production Supervisor"
                                    disabled={!canEditProfile}
                                />
                                {errors.position && <span className={styles.errorText}>{errors.position}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="editEmployeeId">Employee ID</label>
                                <input
                                    id="editEmployeeId"
                                    type="text"
                                    value={formData.employeeId}
                                    readOnly
                                    className={styles.readOnlyField}
                                    title="Employee ID cannot be changed"
                                />
                                <span className={styles.fieldHelp}>Employee ID is permanent and cannot be modified</span>
                            </div>
                        </div>

                        {/* Manager Assignment */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="editManager">Reports To (Manager)</label>
                                <select
                                    id="editManager"
                                    value={formData.managerId}
                                    onChange={e => handleInputChange('managerId', e.target.value)}
                                    disabled={currentUserRole !== Role.ADMIN && currentUserRole !== Role.MANAGER}
                                >
                                    <option value="">No Manager (Top Level)</option>
                                    {existingUsers
                                        .filter(u => u.id !== user.id && u.isActive) // Can't report to self
                                        .filter(u => u.roles.some(role => [Role.ADMIN, Role.MANAGER, Role.TEAM_LEAD].includes(role))) // Only managers can be selected
                                        .map(manager => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.name} ({manager.roles.map(r => FARM_ROLE_DISPLAY_NAMES[r]).join(', ')})
                                            </option>
                                        ))}
                                </select>
                                <div className={styles.fieldHelp}>
                                    Select who this person reports to in the organizational hierarchy
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        {currentUserRole === Role.ADMIN && (
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => handleInputChange('isActive', e.target.checked)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        Active User
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Security - Only show if user can edit */}
                    {canEditProfile && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Change Password (Optional)</h3>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label htmlFor="editPassword">New Password</label>
                                    <input
                                        id="editPassword"
                                        type="password"
                                        value={formData.password}
                                        onChange={e => handleInputChange('password', e.target.value)}
                                        className={errors.password ? styles.error : ''}
                                        placeholder="Leave blank to keep current password"
                                    />
                                    {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="editConfirmPassword">Confirm New Password</label>
                                    <input
                                        id="editConfirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={e => handleInputChange('confirmPassword', e.target.value)}
                                        className={errors.confirmPassword ? styles.error : ''}
                                        placeholder="Re-enter new password"
                                    />
                                    {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {errors.submit && (
                        <div className={styles.submitError}>
                            {errors.submit}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 