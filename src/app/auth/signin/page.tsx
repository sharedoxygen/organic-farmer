'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

interface SignInFormData {
    email: string;
    password: string;
}

export default function SignInPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();
    const [formData, setFormData] = useState<SignInFormData>({
        email: '',
        password: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof SignInFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (error) {
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Use AuthProvider login - now connects to API
            console.log('🔐 Starting login process for:', formData.email);
            const success = await login(formData.email, formData.password);

            if (success) {
                console.log('✅ Login successful, preparing to redirect...');

                // Don't set submitting to false - keep the loading state
                // until navigation completes to prevent multiple submissions

                // Give auth state time to propagate before redirecting
                setTimeout(() => {
                    console.log('🚀 Redirecting to dashboard...');
                    // Use Next.js router for proper navigation instead of window.location
                    router.push('/dashboard');
                }, 200); // Increased delay to ensure state propagation
            } else {
                console.log('❌ Login failed - invalid credentials');
                setError('Invalid email or password');
                setSubmitting(false);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            setError('Login failed. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.signInCard}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>🌱</div>
                        <div className={styles.logoText}>
                            <h1>OFMS</h1>
                            <p>Organic Farm Management</p>
                        </div>
                    </div>
                </div>

                <div className={styles.formContainer}>
                    <h2 className={styles.title}>Sign In</h2>
                    <p className={styles.subtitle}>
                        Access your farm management dashboard
                    </p>

                    {error && (
                        <div className={styles.error}>
                            <span className={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={styles.input}
                                placeholder="Enter your email address"
                                disabled={submitting || isLoading}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={styles.input}
                                placeholder="Enter your password"
                                disabled={submitting || isLoading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={submitting || isLoading}
                        >
                            {submitting ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            Need help? Contact your farm administrator for access.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 