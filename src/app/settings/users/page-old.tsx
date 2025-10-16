'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import UserManagement from '@/components/admin/UserManagement';
import { Role } from '@/types/roles';
import styles from './page.module.css';

export default function UserManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentFarm } = useTenant();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state during auth check
  if (isLoading || !isAuthenticated) {
    return null; // ConditionalLayout handles loading
  }

  // Show error if no farm context
  if (!currentFarm) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>No Farm Context</h2>
          <p>Please select a farm to manage users.</p>
          <button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <UserManagement
        currentUserRole={user?.role as Role || Role.ADMIN}
        currentUserId={user?.id || "1"}
      />
    </div>
  );
}
