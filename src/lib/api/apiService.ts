// Centralized API Service for OFMS
// Handles all API communication with proper error handling and type safety

interface ApiResponse<T> {
    data: T;
    success: boolean;
    error?: string;
}

interface ApiError {
    message: string;
    code: string;
    status: number;
}

/**
 * ✅ FIXED: Core API service with proper farm isolation
 * Ensures all requests include X-Farm-ID header when farm context is available
 */
class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    private getFarmContext(): string | null {
        // Prefer cookie to persist across reloads and SSR
        try {
            const match = document.cookie.match(/(?:^|; )ofms_farm=([^;]+)/)
            if (match) return decodeURIComponent(match[1])
        } catch {}
        return localStorage.getItem('ofms_current_farm');
    }

    private getHeaders(requireFarmContext = true): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add farm context if available
        const farmId = this.getFarmContext();
        if (farmId) {
            headers['X-Farm-ID'] = farmId;
        } else if (requireFarmContext) {
            throw new Error('Farm context required but not available. Please select a farm.');
        }

        // Add auth token if available
        const user = localStorage.getItem('ofms_user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                if (userData.id) {
                    headers['Authorization'] = `Bearer ${userData.id}`;
                }
            } catch (error) {
                console.warn('Failed to parse user data for auth header:', error);
            }
        }

        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        requireFarmContext = true
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}/api${endpoint}`;
            const config: RequestInit = {
                headers: {
                    ...this.getHeaders(requireFarmContext),
                    ...options.headers,
                },
                ...options,
                credentials: 'include',
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const error: ApiError = {
                    message: data.message || data.error || 'An error occurred',
                    code: data.code || 'UNKNOWN_ERROR',
                    status: response.status,
                };
                throw error;
            }

            return {
                data,
                success: true,
            };
        } catch (error) {
            console.error('API Request Error:', error);

            if (error instanceof Error && error.message.includes('Farm context required')) {
                throw error; // Re-throw farm context errors
            }

            return {
                data: null as T,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // Farm-scoped operations
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Global operations (no farm context required)
    async getGlobal<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' }, false);
    }

    async postGlobal<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }, false);
    }

    // Farm context management
    setFarmContext(farmId: string): void {
        localStorage.setItem('ofms_current_farm', farmId);
    }

    clearFarmContext(): void {
        localStorage.removeItem('ofms_current_farm');
    }

    getCurrentFarmId(): string | null {
        return this.getFarmContext();
    }
}

export const apiService = new ApiService();
export type { ApiResponse, ApiError }; 