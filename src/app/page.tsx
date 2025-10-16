'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        // Only redirect if user is authenticated and not loading
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleSignIn = () => {
        router.push('/auth/signin');
    };

    const handleGetStarted = () => {
        router.push('/auth/signin');
    };

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>🌱 Loading OFMS...</h1>
                    <p>Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show marketing content for unauthenticated users
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.logoSection}>
                        <div className={styles.logo}>🌱</div>
                        <h1 className={styles.title}>Organic Farm Management System</h1>
                        <p className={styles.subtitle}>
                            Complete farm-to-table management for organic microgreens operations
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGetStarted}
                            className={styles.primaryButton}
                        >
                            Get Started
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleSignIn}
                            className={styles.secondaryButton}
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className={styles.features}>
                <div className={styles.featuresGrid}>
                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>📊</div>
                        <h3>Production Management</h3>
                        <p>Track batches from seed to harvest with complete traceability</p>
                    </Card>

                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>🔍</div>
                        <h3>Quality Control</h3>
                        <p>USDA organic compliance with comprehensive quality tracking</p>
                    </Card>

                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>📈</div>
                        <h3>Analytics & Insights</h3>
                        <p>Real-time analytics and AI-powered insights for optimization</p>
                    </Card>

                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>👥</div>
                        <h3>Team Management</h3>
                        <p>Multi-role team coordination with task assignment and tracking</p>
                    </Card>

                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>🎯</div>
                        <h3>Inventory Control</h3>
                        <p>Smart inventory management with automated reorder points</p>
                    </Card>

                    <Card className={styles.featureCard}>
                        <div className={styles.featureIcon}>💰</div>
                        <h3>Financial Tracking</h3>
                        <p>Complete financial management with profitability analysis</p>
                    </Card>
                </div>
            </div>

            {/* Benefits Section */}
            <div className={styles.benefits}>
                <div className={styles.benefitsContent}>
                    <h2>Why Choose OFMS?</h2>
                    <div className={styles.benefitsList}>
                        <div className={styles.benefit}>
                            <span className={styles.checkmark}>✅</span>
                            <div>
                                <h4>USDA Organic Compliant</h4>
                                <p>Built-in compliance with USDA organic standards and regulations</p>
                            </div>
                        </div>
                        <div className={styles.benefit}>
                            <span className={styles.checkmark}>✅</span>
                            <div>
                                <h4>Complete Traceability</h4>
                                <p>Track every batch from seed to sale with complete chain of custody</p>
                            </div>
                        </div>
                        <div className={styles.benefit}>
                            <span className={styles.checkmark}>✅</span>
                            <div>
                                <h4>Enterprise Security</h4>
                                <p>Bank-level security with role-based access and audit trails</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerLogo}>
                        <span className={styles.logoIcon}>🌱</span>
                        <span>OFMS</span>
                    </div>
                    <p>&copy; 2025 Organic Farm Management System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
} 