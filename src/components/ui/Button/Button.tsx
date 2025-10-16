import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    children: ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    disabled,
    children,
    ...props
}: ButtonProps) {
    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        disabled && styles.disabled,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            className={buttonClasses}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {!loading && icon && iconPosition === 'left' && (
                <span className={styles.iconLeft}>{icon}</span>
            )}
            <span className={styles.content}>{children}</span>
            {!loading && icon && iconPosition === 'right' && (
                <span className={styles.iconRight}>{icon}</span>
            )}
        </button>
    );
} 