import { tenantApiService } from './tenantApiService';

interface CrudApiOptions {
    endpoint: string;
    farmScoped?: boolean;
    transformForApi?: (data: any) => any;
    transformFromApi?: (data: any) => any;
}

export class CrudApiService {
    private endpoint: string;
    private farmScoped: boolean;
    private transformForApi?: (data: any) => any;
    private transformFromApi?: (data: any) => any;

    constructor(options: CrudApiOptions) {
        this.endpoint = options.endpoint;
        this.farmScoped = options.farmScoped ?? true;
        this.transformForApi = options.transformForApi;
        this.transformFromApi = options.transformFromApi;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        if (this.farmScoped) {
            const farmId = localStorage.getItem('ofms_current_farm');

            // ✅ CRITICAL FIX: No hardcoded fallbacks - fail if no farm context
            if (!farmId) {
                throw new Error('Farm context required but not available. Please select a farm.');
            }

            headers['X-Farm-ID'] = farmId;
        }

        // ✅ CRITICAL FIX: Add Authorization header
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

    private validateFarmContext(): void {
        if (this.farmScoped) {
            const farmId = localStorage.getItem('ofms_current_farm');
            if (!farmId) {
                throw new Error('Farm context required but not available. Please select a farm.');
            }
        }
    }

    async list(params?: Record<string, any>): Promise<any[]> {
        this.validateFarmContext();

        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
        }

        const url = `${this.endpoint}${queryParams.toString() ? `?${queryParams}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch items: ${response.statusText}`);
        }

        const result = await response.json();
        const items = result.data || result;

        if (this.transformFromApi && Array.isArray(items)) {
            return items.map(item => this.transformFromApi!(item));
        }

        return items;
    }

    async get(id: string): Promise<any> {
        this.validateFarmContext();

        const response = await fetch(`${this.endpoint}/${id}`, {
            method: 'GET',
            headers: this.getHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Item not found');
            }
            throw new Error(`Failed to fetch item: ${response.statusText}`);
        }

        const item = await response.json();
        return this.transformFromApi ? this.transformFromApi(item) : item;
    }

    async create(data: any): Promise<any> {
        this.validateFarmContext();

        const transformedData = this.transformForApi ? this.transformForApi(data) : data;

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(transformedData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Creation failed' }));
            throw new Error(error.error || `Failed to create item: ${response.statusText}`);
        }

        const item = await response.json();
        return this.transformFromApi ? this.transformFromApi(item) : item;
    }

    async update(id: string, data: any): Promise<any> {
        this.validateFarmContext();

        const transformedData = this.transformForApi ? this.transformForApi(data) : data;

        const response = await fetch(`${this.endpoint}/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(transformedData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Update failed' }));
            throw new Error(error.error || `Failed to update item: ${response.statusText}`);
        }

        const item = await response.json();
        return this.transformFromApi ? this.transformFromApi(item) : item;
    }

    async delete(id: string): Promise<void> {
        this.validateFarmContext();

        const response = await fetch(`${this.endpoint}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Deletion failed' }));
            throw new Error(error.error || `Failed to delete item: ${response.statusText}`);
        }
    }

    async bulkUpdate(ids: string[], data: any): Promise<any[]> {
        let payload = data;
        if (this.transformForApi) {
            payload = this.transformForApi(data);
        }

        const response = await fetch(`${this.endpoint}/bulk-update`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ ids, data: payload })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `Failed to bulk update items: ${response.statusText}`);
        }

        const result = await response.json();
        const items = result.data || result;

        if (this.transformFromApi && Array.isArray(items)) {
            return items.map(item => this.transformFromApi!(item));
        }

        return items;
    }

    async bulkDelete(ids: string[]): Promise<void> {
        const response = await fetch(`${this.endpoint}/bulk-delete`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({ ids })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `Failed to bulk delete items: ${response.statusText}`);
        }
    }
}

export const crudService = {
    users: new CrudApiService({ endpoint: '/api/users' }),
    batches: new CrudApiService({ endpoint: '/api/batches' }),
    customers: new CrudApiService({ endpoint: '/api/customers' }),
    equipment: new CrudApiService({ endpoint: '/api/equipment' }),
    inventory: new CrudApiService({ endpoint: '/api/inventory' }),
    orders: new CrudApiService({ endpoint: '/api/orders' }),
    tasks: new CrudApiService({ endpoint: '/api/tasks' }),
    assignments: new CrudApiService({ endpoint: '/api/assignments' }),
    workOrders: new CrudApiService({ endpoint: '/api/work-orders' }),
    qualityChecks: new CrudApiService({ endpoint: '/api/quality-checks' }),
    seedVarieties: new CrudApiService({ endpoint: '/api/seed-varieties' }),
    environments: new CrudApiService({ endpoint: '/api/environments' }),
    zones: new CrudApiService({ endpoint: '/api/zones' }),
    cropPlans: new CrudApiService({ endpoint: '/api/crop-plans' }),
    forecasts: new CrudApiService({ endpoint: '/api/forecasts' }),

    // Global services (not farm-scoped)
    farms: new CrudApiService({ endpoint: '/api/farms', farmScoped: false }),
};

// Factory function to create new CRUD service instances
export function createCrudService(endpoint: string, options?: Partial<CrudApiOptions>): CrudApiService {
    return new CrudApiService({
        endpoint: `/api/${endpoint}`,
        farmScoped: true,
        ...options
    });
} 