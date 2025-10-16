import React, { useState } from 'react';
import { Role } from '@/types/roles';
import {
    canCreateUserWithRole,
    FARM_ROLE_DISPLAY_NAMES,
    DEPARTMENT_STRUCTURE,
    getTypicalDepartments
} from '@/lib/utils/roleHelpers';
import { User } from './UserManagement';
import styles from './UserCreateModal.module.css';

interface UserCreateModalProps {
    onClose: () => void;
    onSuccess: (userData: any) => Promise<void>;
    currentUserRole: Role;
    existingUsers: User[];
}

export function UserCreateModal({
    onClose,
    onSuccess,
    currentUserRole,
    existingUsers
}: UserCreateModalProps) {
    // Generate next Employee ID automatically
    const generateNextEmployeeId = () => {
        const existingIds = existingUsers
            .map(user => user.employeeId)
            .filter((id): id is string => Boolean(id && id.startsWith('EMP')))
            .map(id => parseInt(id.replace('EMP', ''), 10))
            .filter(num => !isNaN(num));

        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = maxId + 1;
        return `EMP${nextId.toString().padStart(3, '0')}`;
    };

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: Role.TEAM_MEMBER,
        department: '',
        position: '',
        phone: '',
        employeeId: generateNextEmployeeId(),
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
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Check if email already exists
        if (formData.email && existingUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
            newErrors.email = 'Email address already exists';
        }

        // Employee ID is auto-generated, no validation needed

        // Password validation
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Role validation
        if (!canCreateUserWithRole(currentUserRole, formData.role)) {
            newErrors.role = `You cannot create users with ${FARM_ROLE_DISPLAY_NAMES[formData.role]} role`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSuccess({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                role: formData.role,
                department: formData.department,
                position: formData.position.trim(),
                phone: formData.phone.trim() || undefined,
                employeeId: formData.employeeId, // Always include auto-generated Employee ID
                password: formData.password
            });
        } catch (error) {
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to create user'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleRoleChange = (role: Role) => {
        setFormData(prev => ({
            ...prev,
            role,
            // Auto-suggest department based on role
            department: prev.department || getTypicalDepartments(role)[0] || ''
        }));
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: '' }));
        }
    };

    const availableRoles = Object.values(Role).filter(role =>
        canCreateUserWithRole(currentUserRole, role)
    );

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Add New Team Member</h2>
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
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={e => handleInputChange('firstName', e.target.value)}
                                    className={errors.firstName ? styles.error : ''}
                                    placeholder="Enter first name"
                                />
                                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={e => handleInputChange('lastName', e.target.value)}
                                    className={errors.lastName ? styles.error : ''}
                                    placeholder="Enter last name"
                                />
                                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="email">Email Address *</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleInputChange('email', e.target.value)}
                                    className={errors.email ? styles.error : ''}
                                    placeholder="user@ofms.com"
                                />
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => handleInputChange('phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Work Information</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="role">Role *</label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={e => handleRoleChange(e.target.value as Role)}
                                    className={errors.role ? styles.error : ''}
                                >
                                    {availableRoles.map(role => (
                                        <option key={role} value={role}>
                                            {FARM_ROLE_DISPLAY_NAMES[role]}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <span className={styles.errorText}>{errors.role}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="department">Department *</label>
                                <select
                                    id="department"
                                    value={formData.department}
                                    onChange={e => handleInputChange('department', e.target.value)}
                                    className={errors.department ? styles.error : ''}
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
                                <label htmlFor="position">Position/Title *</label>
                                <input
                                    id="position"
                                    type="text"
                                    value={formData.position}
                                    onChange={e => handleInputChange('position', e.target.value)}
                                    className={errors.position ? styles.error : ''}
                                    placeholder="e.g., Production Supervisor"
                                />
                                {errors.position && <span className={styles.errorText}>{errors.position}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="employeeId">Employee ID (Auto-generated)</label>
                                <input
                                    id="employeeId"
                                    type="text"
                                    value={formData.employeeId}
                                    readOnly
                                    className={styles.readOnlyField}
                                    title="Employee ID is automatically generated"
                                />
                                <span className={styles.fieldHelp}>Automatically assigned when user is created</span>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Account Security</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="password">Password *</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => handleInputChange('password', e.target.value)}
                                    className={errors.password ? styles.error : ''}
                                    placeholder="Minimum 8 characters"
                                />
                                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="confirmPassword">Confirm Password *</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                                    className={errors.confirmPassword ? styles.error : ''}
                                    placeholder="Re-enter password"
                                />
                                {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                            </div>
                        </div>
                    </div>

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
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 