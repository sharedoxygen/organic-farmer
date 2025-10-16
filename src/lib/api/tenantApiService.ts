import { Farm, FarmUser, MultiTenantUser, Subscription } from '@/types';

// Update the return type for getFarmUsage to include more properties
interface FarmUsageData {
    userCount: number;
    batchCount: number;
    orderCount: number;
    storageUsed: number;
    revenue?: number;
    lastActivity?: Date;
    hasActiveSubscription?: boolean;
}

export class TenantApiService {
    private baseUrl: string;
    private farmId: string | null = null;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Set current farm context for all API calls
     */
    setFarmContext(farmId: string) {
        this.farmId = farmId;
    }

    /**
     * Get headers with tenant context
     */
    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.farmId) {
            headers['X-Farm-ID'] = this.farmId;
        }

        // Add auth token if available
        const user = localStorage.getItem('ofms_user');
        if (user) {
            const userData = JSON.parse(user);
            headers['Authorization'] = `Bearer ${userData.id}`;
        }

        return headers;
    }

    /**
     * Make API request with tenant context
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
            credentials: 'include',
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // ===== FARM MANAGEMENT =====

    /**
     * Get user's available farms
     */
    async getUserFarms(userId: string): Promise<Farm[]> {
        return this.request<Farm[]>(`/farms/user/${userId}`);
    }

    /**
     * Get farm details
     */
    async getFarm(farmId: string): Promise<Farm> {
        return this.request<Farm>(`/farms/${farmId}`);
    }

    /**
     * Create new farm
     */
    async createFarm(farmData: Partial<Farm>): Promise<Farm> {
        return this.request<Farm>('/farms', {
            method: 'POST',
            body: JSON.stringify(farmData),
        });
    }

    /**
     * Update farm
     */
    async updateFarm(farmId: string, farmData: Partial<Farm>): Promise<Farm> {
        return this.request<Farm>(`/farms/${farmId}`, {
            method: 'PUT',
            body: JSON.stringify(farmData),
        });
    }

    /**
     * Delete farm
     */
    async deleteFarm(farmId: string): Promise<void> {
        return this.request<void>(`/farms/${farmId}`, {
            method: 'DELETE',
        });
    }

    // ===== USER-FARM RELATIONSHIPS =====

    /**
     * Get farm users
     */
    async getFarmUsers(farmId: string): Promise<FarmUser[]> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<FarmUser[]>('/farm-users');
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Add user to farm
     */
    async addUserToFarm(farmId: string, userId: string, role: string, permissions?: any): Promise<FarmUser> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<FarmUser>('/farm-users', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    role,
                    permissions,
                }),
            });
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Update user role in farm
     */
    async updateUserFarmRole(farmId: string, userId: string, role: string, permissions?: any): Promise<FarmUser> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<FarmUser>(`/farm-users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    role,
                    permissions,
                }),
            });
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Remove user from farm
     */
    async removeUserFromFarm(farmId: string, userId: string): Promise<void> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<void>(`/farm-users/${userId}`, {
                method: 'DELETE',
            });
        } finally {
            this.farmId = tempFarmId;
        }
    }

    // ===== FARM SWITCHING =====

    /**
     * Switch to different farm
     */
    async switchFarm(farmId: string): Promise<{ farm: Farm; userRole: string }> {
        const response = await this.request<{ farm: Farm; userRole: string }>(`/farms/${farmId}/switch`, {
            method: 'POST',
        });

        // Update current farm context
        this.setFarmContext(farmId);

        return response;
    }

    // ===== SUBSCRIPTION MANAGEMENT =====

    /**
     * Get farm subscription
     */
    async getFarmSubscription(farmId: string): Promise<Subscription | null> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<Subscription | null>('/subscription');
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Update subscription
     */
    async updateSubscription(farmId: string, subscriptionData: Partial<Subscription>): Promise<Subscription> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<Subscription>('/subscription', {
                method: 'PUT',
                body: JSON.stringify(subscriptionData),
            });
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(farmId: string): Promise<void> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            return this.request<void>('/subscription', {
                method: 'DELETE',
            });
        } finally {
            this.farmId = tempFarmId;
        }
    }

    // ===== TENANT-SCOPED DATA OPERATIONS =====

    /**
     * Get batches for current farm
     */
    async getBatches(): Promise<any[]> {
        return this.request<any[]>('/batches');
    }

    /**
     * Get customers for current farm
     */
    async getCustomers(): Promise<any[]> {
        return this.request<any[]>('/customers');
    }

    /**
     * Get orders for current farm
     */
    async getOrders(): Promise<any[]> {
        return this.request<any[]>('/orders');
    }

    /**
     * Get seed varieties for current farm
     */
    async getSeedVarieties(): Promise<any[]> {
        return this.request<any[]>('/seed-varieties');
    }

    /**
     * Get quality checks for current farm
     */
    async getQualityChecks(): Promise<any[]> {
        return this.request<any[]>('/quality-checks');
    }

    /**
     * Get tasks for current farm
     */
    async getTasks(): Promise<any[]> {
        return this.request<any[]>('/tasks');
    }

    /**
     * Create new record in current farm context
     */
    async create<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update record in current farm context
     */
    async update<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete record in current farm context
     */
    async delete(endpoint: string): Promise<void> {
        return this.request<void>(endpoint, {
            method: 'DELETE',
        });
    }

    // ===== ANALYTICS & REPORTING =====

    /**
     * Get farm analytics
     */
    async getFarmAnalytics(farmId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
        const tempFarmId = this.farmId;
        this.setFarmContext(farmId);
        try {
            const params = dateRange
                ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
                : '';
            return this.request<any>(`/analytics${params}`);
        } finally {
            this.farmId = tempFarmId;
        }
    }

    /**
     * Get farm usage metrics
     */
    async getFarmUsage(farmId: string): Promise<FarmUsageData> {
        try {
            const response = await this.request<FarmUsageData>(`/farms/${farmId}/usage`);
            return response;
        } catch (error) {
            console.error('Failed to fetch farm usage:', error);
            // Return default values if API fails
            return {
                userCount: 0,
                batchCount: 0,
                orderCount: 0,
                storageUsed: 0,
                revenue: 0,
                lastActivity: new Date(),
                hasActiveSubscription: false
            };
        }
    }

    // Get all farms (for system administrators)
    async getAllFarms(): Promise<Farm[]> {
        try {
            const response = await this.request<Farm[]>('/farms');
            return response;
        } catch (error) {
            console.error('Failed to fetch all farms:', error);
            throw error;
        }
    }
}

// Singleton instance
export const tenantApiService = new TenantApiService(); 