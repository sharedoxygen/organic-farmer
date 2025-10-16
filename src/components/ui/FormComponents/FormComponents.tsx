import React from 'react';
import styles from './FormComponents.module.css';

// Input Field Component
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    required?: boolean;
    helpText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    error,
    required,
    helpText,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${className}`}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <input
                className={`${styles.input} ${error ? styles.error : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
};

// Select Field Component
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    error?: string;
    required?: boolean;
    helpText?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
    label,
    options,
    error,
    required,
    helpText,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${className}`}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <select
                className={`${styles.select} ${error ? styles.error : ''}`}
                {...props}
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
};

// Textarea Field Component
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    required?: boolean;
    helpText?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
    label,
    error,
    required,
    helpText,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${className}`}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <textarea
                className={`${styles.textarea} ${error ? styles.error : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
};

// Checkbox Field Component
interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helpText?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
    label,
    error,
    helpText,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${styles.checkboxGroup} ${className}`}>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    className={`${styles.checkbox} ${error ? styles.error : ''}`}
                    {...props}
                />
                <span className={styles.checkboxText}>{label}</span>
            </label>
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
};

// Date Field Component
interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    required?: boolean;
    helpText?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
    label,
    error,
    required,
    helpText,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${className}`}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <input
                type="date"
                className={`${styles.input} ${styles.dateInput} ${error ? styles.error : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
};

// Number Field Component
interface NumberFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    required?: boolean;
    helpText?: string;
    unit?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
    label,
    error,
    required,
    helpText,
    unit,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.fieldGroup} ${className}`}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            <div className={styles.inputGroup}>
                <input
                    type="number"
                    className={`${styles.input} ${unit ? styles.hasUnit : ''} ${error ? styles.error : ''}`}
                    {...props}
                />
                {unit && <span className={styles.unit}>{unit}</span>}
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
            {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
}; 