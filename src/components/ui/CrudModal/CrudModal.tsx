'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../index';
import styles from './CrudModal.module.css';

export interface CrudField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
    fullWidth?: boolean;
    showWhen?: (data: any) => boolean;
    validation?: (value: any) => string | null;
}

export interface CrudModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    mode: 'view' | 'edit' | 'create';
    data?: any;
    fields: CrudField[];
    onSave?: (data: any) => Promise<void>;
    onDelete?: () => Promise<void>;
    viewRenderer?: (data: any) => React.ReactNode;
    sections?: { title: string; fields: string[] }[];
}

export function CrudModal({
    isOpen,
    onClose,
    title,
    mode: initialMode,
    data,
    fields,
    onSave,
    onDelete,
    viewRenderer,
    sections
}: CrudModalProps) {
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState<any>(data || {});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens/closes or data changes
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setFormData(data || {});
            setErrors({});
            setLoading(false);
        }
    }, [isOpen, initialMode, data]);

    // Handle mode switching
    const handleSwitchToEdit = () => {
        setMode('edit');
        setErrors({});
    };

    const handleCancelEdit = () => {
        setMode('view');
        setFormData(data || {});
        setErrors({});
    };

    // Form validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        fields.forEach(field => {
            if (field.showWhen && !field.showWhen(formData)) return;

            const value = formData[field.name];

            // Required field validation
            if (field.required && (!value || value === '')) {
                newErrors[field.name] = `${field.label} is required`;
                return;
            }

            // Custom validation
            if (field.validation && value) {
                const validationError = field.validation(value);
                if (validationError) {
                    newErrors[field.name] = validationError;
                    return;
                }
            }

            // Type-specific validation
            if (value) {
                switch (field.type) {
                    case 'email':
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            newErrors[field.name] = 'Please enter a valid email address';
                        }
                        break;
                    case 'number':
                        if (isNaN(Number(value))) {
                            newErrors[field.name] = 'Please enter a valid number';
                        } else {
                            const numValue = Number(value);
                            if (field.min !== undefined && numValue < field.min) {
                                newErrors[field.name] = `Value must be at least ${field.min}`;
                            }
                            if (field.max !== undefined && numValue > field.max) {
                                newErrors[field.name] = `Value must be at most ${field.max}`;
                            }
                        }
                        break;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!onSave) return;

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save failed:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to save. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!onDelete) return;

        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await onDelete();
            onClose();
        } catch (error) {
            console.error('Delete failed:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to delete. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (fieldName: string, value: any) => {
        setFormData((prev: Record<string, any>) => ({
            ...prev,
            [fieldName]: value
        }));

        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors((prev: Record<string, string>) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    // Render form field
    const renderField = (field: CrudField) => {
        if (field.showWhen && !field.showWhen(formData)) {
            return null;
        }

        const value = formData[field.name] || '';
        const hasError = !!errors[field.name];

        const fieldClass = `${styles.formField} ${hasError ? styles.hasError : ''} ${field.fullWidth ? styles.fullWidth : ''}`;

        switch (field.type) {
            case 'select':
                return (
                    <div key={field.name} className={fieldClass}>
                        <label htmlFor={field.name} className={styles.fieldLabel}>
                            {field.label}
                            {field.required && <span className={styles.required}>*</span>}
                        </label>
                        <select
                            id={field.name}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={styles.fieldInput}
                            disabled={loading}
                        >
                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                            {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {hasError && <span className={styles.fieldError}>{errors[field.name]}</span>}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name} className={fieldClass}>
                        <label htmlFor={field.name} className={styles.fieldLabel}>
                            {field.label}
                            {field.required && <span className={styles.required}>*</span>}
                        </label>
                        <textarea
                            id={field.name}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={styles.fieldTextarea}
                            placeholder={field.placeholder}
                            rows={field.rows || 3}
                            disabled={loading}
                        />
                        {hasError && <span className={styles.fieldError}>{errors[field.name]}</span>}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className={fieldClass}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                                className={styles.checkboxInput}
                                disabled={loading}
                            />
                            <span className={styles.checkboxText}>
                                {field.label}
                                {field.required && <span className={styles.required}>*</span>}
                            </span>
                        </label>
                        {hasError && <span className={styles.fieldError}>{errors[field.name]}</span>}
                    </div>
                );

            default:
                return (
                    <div key={field.name} className={fieldClass}>
                        <label htmlFor={field.name} className={styles.fieldLabel}>
                            {field.label}
                            {field.required && <span className={styles.required}>*</span>}
                        </label>
                        <input
                            id={field.name}
                            type={field.type}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={styles.fieldInput}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            disabled={loading}
                        />
                        {hasError && <span className={styles.fieldError}>{errors[field.name]}</span>}
                    </div>
                );
        }
    };

    // Render view mode
    const renderViewMode = () => {
        if (viewRenderer) {
            return viewRenderer(data);
        }

        return (
            <div className={styles.viewContent}>
                {sections ? (
                    sections.map(section => (
                        <div key={section.title} className={styles.viewSection}>
                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                            <div className={styles.viewGrid}>
                                {section.fields.map(fieldName => {
                                    const field = fields.find(f => f.name === fieldName);
                                    if (!field) return null;

                                    const value = data?.[field.name];
                                    let displayValue = value;

                                    if (field.type === 'checkbox') {
                                        displayValue = value ? 'Yes' : 'No';
                                    } else if (field.type === 'select' && field.options) {
                                        const option = field.options.find(opt => opt.value === value);
                                        displayValue = option ? option.label : value;
                                    } else if (field.type === 'date' && value) {
                                        displayValue = new Date(value).toLocaleDateString();
                                    } else if (field.type === 'datetime-local' && value) {
                                        displayValue = new Date(value).toLocaleString();
                                    }

                                    return (
                                        <div key={field.name} className={styles.viewItem}>
                                            <label className={styles.viewLabel}>{field.label}:</label>
                                            <span className={styles.viewValue}>
                                                {displayValue || '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.viewGrid}>
                        {fields.map(field => {
                            const value = data?.[field.name];
                            let displayValue = value;

                            if (field.type === 'checkbox') {
                                displayValue = value ? 'Yes' : 'No';
                            } else if (field.type === 'select' && field.options) {
                                const option = field.options.find(opt => opt.value === value);
                                displayValue = option ? option.label : value;
                            } else if (field.type === 'date' && value) {
                                displayValue = new Date(value).toLocaleDateString();
                            } else if (field.type === 'datetime-local' && value) {
                                displayValue = new Date(value).toLocaleString();
                            }

                            return (
                                <div key={field.name} className={styles.viewItem}>
                                    <label className={styles.viewLabel}>{field.label}:</label>
                                    <span className={styles.viewValue}>
                                        {displayValue || '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <Card className={styles.modal} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {mode === 'view' ? (
                    <>
                        <div className={styles.modalContent}>
                            {renderViewMode()}
                        </div>
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={onClose}>
                                Close
                            </Button>
                            {onSave && (
                                <Button
                                    variant="primary"
                                    onClick={handleSwitchToEdit}
                                >
                                    ✏️ Edit
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.modalContent}>
                            {errors.submit && (
                                <div className={styles.submitError}>
                                    ⚠️ {errors.submit}
                                </div>
                            )}

                            {sections ? (
                                <div className={styles.formSections}>
                                    {sections.map(section => (
                                        <div key={section.title} className={styles.formSection}>
                                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                                            <div className={styles.formGrid}>
                                                {section.fields.map(fieldName => {
                                                    const field = fields.find(f => f.name === fieldName);
                                                    return field ? renderField(field) : null;
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.formGrid}>
                                    {fields.map(renderField)}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            {mode === 'edit' && onDelete && (
                                <Button
                                    variant="danger"
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className={styles.deleteButton}
                                >
                                    🗑️ Delete
                                </Button>
                            )}
                            <div className={styles.rightActions}>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={mode === 'edit' ? handleCancelEdit : onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? '💾 Saving...' : mode === 'create' ? '✅ Create' : '💾 Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
} 