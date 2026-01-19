import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTenant } from '@/components/TenantProvider';

interface FetchOptions {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnMount?: boolean;
}

// Generic hook for fetching farm-scoped data with caching
export function useFarmQuery<T>(
    key: string | string[],
    endpoint: string,
    options: FetchOptions = {}
) {
    const { currentFarm } = useTenant();
    const farmId = currentFarm?.id;

    const queryKey = Array.isArray(key) ? [...key, farmId] : [key, farmId];

    return useQuery<T>(
        queryKey,
        async () => {
            if (!farmId) throw new Error('No farm selected');

            const response = await fetch(endpoint, {
                headers: {
                    'X-Farm-ID': farmId,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data || data;
        },
        {
            enabled: !!farmId && (options.enabled !== false),
            staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
            cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes default
            refetchOnMount: options.refetchOnMount ?? false,
            refetchOnWindowFocus: false,
        }
    );
}

// Hook for mutations with automatic cache invalidation
export function useFarmMutation<TData, TVariables>(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    invalidateKeys?: string[]
) {
    const { currentFarm } = useTenant();
    const queryClient = useQueryClient();
    const farmId = currentFarm?.id;

    return useMutation<TData, Error, TVariables>(
        async (variables) => {
            if (!farmId) throw new Error('No farm selected');

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'X-Farm-ID': farmId,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(variables),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `API error: ${response.status}`);
            }

            return response.json();
        },
        {
            onSuccess: () => {
                // Invalidate related queries to refetch fresh data
                if (invalidateKeys) {
                    invalidateKeys.forEach(key => {
                        queryClient.invalidateQueries([key, farmId]);
                    });
                }
            },
        }
    );
}

// Prefetch data for faster navigation
export function usePrefetch() {
    const queryClient = useQueryClient();
    const { currentFarm } = useTenant();
    const farmId = currentFarm?.id;

    const prefetch = async (key: string, endpoint: string) => {
        if (!farmId) return;

        await queryClient.prefetchQuery(
            [key, farmId],
            async () => {
                const response = await fetch(endpoint, {
                    headers: {
                        'X-Farm-ID': farmId,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                const data = await response.json();
                return data.data || data;
            },
            {
                staleTime: 5 * 60 * 1000,
            }
        );
    };

    return { prefetch };
}

// Common query keys for consistency
export const QueryKeys = {
    BATCHES: 'batches',
    SEED_VARIETIES: 'seed-varieties',
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
    TASKS: 'tasks',
    QUALITY_CHECKS: 'quality-checks',
    INVENTORY: 'inventory',
    ZONES: 'zones',
    CROP_PLANS: 'crop-plans',
    SUPPLIERS: 'suppliers',
    EQUIPMENT: 'equipment',
} as const;
