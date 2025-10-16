'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Modal } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { tenantApiService } from '@/lib/api/tenantApiService';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface Farm {
    id: string;
    farm_name: string;
    business_name: string;
    subdomain?: string;
    owner_id: string;
    subscription_plan: string;
    subscription_status: string;
    settings: any;
    created_at: string;
    updated_at: string;
}

interface CreateFarmData {
    farm_name: string;
    business_name: string;
    owner_email: string;
    owner_name: string;
    owner_phone: string;
    subdomain: string;
    subscription_plan: string;
    timezone: string;
    currency: string;
    locale: string;
    cannabis_module: boolean;
}

interface EditFarmData {
    farm_name: string;
    business_name: string;
    subdomain: string;
    subscription_plan: string;
    subscription_status: string;
    timezone: string;
    currency: string;
    locale: string;
    cannabis_module: boolean;
}

export default function AdminFarmsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { availableFarms } = useTenant();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for creating new farm
    const [createFormData, setCreateFormData] = useState<CreateFarmData>({
        farm_name: '',
        business_name: '',
        owner_email: '',
        owner_name: '',
        owner_phone: '',
        subdomain: '',
        subscription_plan: 'starter',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        locale: 'en-US',
        cannabis_module: false
    });

    // Form state for editing farm
    const [editFormData, setEditFormData] = useState<EditFarmData>({
        farm_name: '',
        business_name: '',
        subdomain: '',
        subscription_plan: 'starter',
        subscription_status: 'active',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        locale: 'en-US',
        cannabis_module: false
    });

    // ✅ CLEAN: Check if user is system admin (NO HARDCODED DATA)
    const isGlobalAdmin = isSystemAdmin(user);

    useEffect(() => {
        loadFarms();
    }, []);

    const loadFarms = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/farms/all', { credentials: 'include' });
            const data = await response.json();

            if (data.success) {
                setFarms(data.farms);
            } else {
                setError('Failed to load farms');
            }
        } catch (error) {
            console.error('Error loading farms:', error);
            setError('Failed to load farms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFarm = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!createFormData.farm_name || !createFormData.owner_email) {
            setError('Farm name and owner email are required');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            const response = await fetch('/api/farms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    farm_name: createFormData.farm_name,
                    business_name: createFormData.business_name || createFormData.farm_name,
                    owner_email: createFormData.owner_email,
                    owner_name: createFormData.owner_name,
                    owner_phone: createFormData.owner_phone,
                    subdomain: createFormData.subdomain,
                    subscription_plan: createFormData.subscription_plan,
                    timezone: createFormData.timezone,
                    currency: createFormData.currency,
                    locale: createFormData.locale,
                    cannabis_module: createFormData.cannabis_module
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create farm');
            }

            // Reset form and close modal
            setCreateFormData({
                farm_name: '',
                business_name: '',
                owner_email: '',
                owner_name: '',
                owner_phone: '',
                subdomain: '',
                subscription_plan: 'starter',
                timezone: 'America/Los_Angeles',
                currency: 'USD',
                locale: 'en-US',
                cannabis_module: false
            });
            setShowCreateModal(false);

            // Reload farms list
            await loadFarms();

        } catch (error) {
            console.error('Error creating farm:', error);
            setError(error instanceof Error ? error.message : 'Failed to create farm');
        } finally {
            setCreating(false);
        }
    };

    const handleEditFarm = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingFarm || !editFormData.farm_name) {
            setError('Farm name is required');
            return;
        }

        try {
            setUpdating(true);
            setError(null);

            const response = await fetch('/api/farms', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingFarm.id,
                    farm_name: editFormData.farm_name,
                    business_name: editFormData.business_name,
                    subdomain: editFormData.subdomain,
                    subscription_plan: editFormData.subscription_plan,
                    subscription_status: editFormData.subscription_status,
                    settings: {
                        timezone: editFormData.timezone,
                        currency: editFormData.currency,
                        locale: editFormData.locale,
                        features: {
                            cannabis_module: editFormData.cannabis_module
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update farm');
            }

            // Close modal and reload farms
            setShowEditModal(false);
            setEditingFarm(null);
            await loadFarms();

        } catch (error) {
            console.error('Error updating farm:', error);
            setError(error instanceof Error ? error.message : 'Failed to update farm');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeactivateFarm = async (farm: Farm) => {
        const newStatus = farm.subscription_status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';

        if (!confirm(`Are you sure you want to ${action} "${farm.farm_name}"?`)) {
            return;
        }

        try {
            const response = await fetch('/api/farms', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: farm.id,
                    subscription_status: newStatus
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${action} farm`);
            }

            await loadFarms();
        } catch (error) {
            console.error(`Error ${action}ing farm:`, error);
            setError(error instanceof Error ? error.message : `Failed to ${action} farm`);
        }
    };

    const handleDeleteFarm = async (farm: Farm) => {
        if (!confirm(`Are you sure you want to DELETE "${farm.farm_name}"? This action cannot be undone and will remove all data associated with this farm.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/farms?id=${farm.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete farm');
            }

            await loadFarms();
        } catch (error) {
            console.error('Error deleting farm:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete farm');
        }
    };

    const openEditModal = (farm: Farm) => {
        setEditingFarm(farm);

        // Parse settings if they exist
        const settings = typeof farm.settings === 'string' ? JSON.parse(farm.settings) : farm.settings || {};

        setEditFormData({
            farm_name: farm.farm_name,
            business_name: farm.business_name,
            subdomain: farm.subdomain || '',
            subscription_plan: farm.subscription_plan,
            subscription_status: farm.subscription_status,
            timezone: settings.timezone || 'America/Los_Angeles',
            currency: settings.currency || 'USD',
            locale: settings.locale || 'en-US',
            cannabis_module: settings.features?.cannabis_module || false
        });

        setShowEditModal(true);
    };

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (!isGlobalAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to manage farms.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Farm Management</h1>
                    <p>Manage all farms in the system</p>
                </div>
                <div className={styles.headerRight}>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className={styles.createButton}
                    >
                        + Add New Farm
                    </Button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>
                    <p>Loading farms...</p>
                </div>
            ) : (
                <div className={styles.farmsGrid}>
                    {farms.map(farm => (
                        <Card key={farm.id} className={styles.farmCard}>
                            <div className={styles.farmHeader}>
                                <h3>{farm.farm_name}</h3>
                                <span className={`${styles.statusBadge} ${styles[farm.subscription_status]}`}>
                                    {farm.subscription_status}
                                </span>
                            </div>
                            <div className={styles.farmDetails}>
                                <p><strong>Business:</strong> {farm.business_name}</p>
                                <p><strong>Plan:</strong> {farm.subscription_plan}</p>
                                {farm.subdomain && (
                                    <p><strong>Subdomain:</strong> {farm.subdomain}</p>
                                )}
                                <p><strong>Created:</strong> {formatDate(farm.created_at)}</p>
                            </div>
                            <div className={styles.farmActions}>
                                <Button
                                    onClick={() => router.push(`/admin/farms/${farm.id}`)}
                                    size="sm"
                                >
                                    View Details
                                </Button>
                                <Button
                                    onClick={() => openEditModal(farm)}
                                    size="sm"
                                    variant="outline"
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleDeactivateFarm(farm)}
                                    size="sm"
                                    variant={farm.subscription_status === 'active' ? 'secondary' : 'primary'}
                                >
                                    {farm.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                    onClick={() => handleDeleteFarm(farm)}
                                    size="sm"
                                    variant="danger"
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {farms.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    <Card>
                        <h3>No Farms Found</h3>
                        <p>No farms have been created yet. Create your first farm to get started.</p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            Create First Farm
                        </Button>
                    </Card>
                </div>
            )}

            {/* Create Farm Modal */}
            {showCreateModal && (
                <Modal
                    title="Create New Farm"
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                >
                    <form onSubmit={handleCreateFarm} className={styles.createForm}>
                        <div className={styles.formSection}>
                            <h4>Farm Information</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="farm_name">Farm Name *</label>
                                <input
                                    type="text"
                                    id="farm_name"
                                    name="farm_name"
                                    value={createFormData.farm_name}
                                    onChange={handleCreateInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="business_name">Business Name</label>
                                <input
                                    type="text"
                                    id="business_name"
                                    name="business_name"
                                    value={createFormData.business_name}
                                    onChange={handleCreateInputChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="subdomain">Subdomain</label>
                                <input
                                    type="text"
                                    id="subdomain"
                                    name="subdomain"
                                    value={createFormData.subdomain}
                                    onChange={handleCreateInputChange}
                                    placeholder="e.g., farm-name"
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4>Owner Information</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="owner_name">Owner Name</label>
                                <input
                                    type="text"
                                    id="owner_name"
                                    name="owner_name"
                                    value={createFormData.owner_name}
                                    onChange={handleCreateInputChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="owner_email">Owner Email *</label>
                                <input
                                    type="email"
                                    id="owner_email"
                                    name="owner_email"
                                    value={createFormData.owner_email}
                                    onChange={handleCreateInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="owner_phone">Owner Phone</label>
                                <input
                                    type="tel"
                                    id="owner_phone"
                                    name="owner_phone"
                                    value={createFormData.owner_phone}
                                    onChange={handleCreateInputChange}
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4>Settings</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="subscription_plan">Subscription Plan</label>
                                <select
                                    id="subscription_plan"
                                    name="subscription_plan"
                                    value={createFormData.subscription_plan}
                                    onChange={handleCreateInputChange}
                                >
                                    <option value="starter">Starter</option>
                                    <option value="professional">Professional</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="timezone">Timezone</label>
                                <select
                                    id="timezone"
                                    name="timezone"
                                    value={createFormData.timezone}
                                    onChange={handleCreateInputChange}
                                >
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/New_York">Eastern Time</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="currency">Currency</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={createFormData.currency}
                                    onChange={handleCreateInputChange}
                                >
                                    <option value="USD">USD</option>
                                    <option value="CAD">CAD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="cannabis_module"
                                        checked={createFormData.cannabis_module}
                                        onChange={handleCreateInputChange}
                                    />
                                    Enable Cannabis Module
                                </label>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                disabled={creating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating}
                            >
                                {creating ? 'Creating...' : 'Create Farm'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Farm Modal */}
            {showEditModal && editingFarm && (
                <Modal
                    title={`Edit Farm: ${editingFarm.farm_name}`}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                >
                    <form onSubmit={handleEditFarm} className={styles.createForm}>
                        <div className={styles.formSection}>
                            <h4>Farm Information</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_farm_name">Farm Name *</label>
                                <input
                                    type="text"
                                    id="edit_farm_name"
                                    name="farm_name"
                                    value={editFormData.farm_name}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_business_name">Business Name</label>
                                <input
                                    type="text"
                                    id="edit_business_name"
                                    name="business_name"
                                    value={editFormData.business_name}
                                    onChange={handleEditInputChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_subdomain">Subdomain</label>
                                <input
                                    type="text"
                                    id="edit_subdomain"
                                    name="subdomain"
                                    value={editFormData.subdomain}
                                    onChange={handleEditInputChange}
                                    placeholder="e.g., farm-name"
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4>Subscription & Status</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_subscription_plan">Subscription Plan</label>
                                <select
                                    id="edit_subscription_plan"
                                    name="subscription_plan"
                                    value={editFormData.subscription_plan}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="starter">Starter</option>
                                    <option value="professional">Professional</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_subscription_status">Status</label>
                                <select
                                    id="edit_subscription_status"
                                    name="subscription_status"
                                    value={editFormData.subscription_status}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="trial">Trial</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4>Settings</h4>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_timezone">Timezone</label>
                                <select
                                    id="edit_timezone"
                                    name="timezone"
                                    value={editFormData.timezone}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/New_York">Eastern Time</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="edit_currency">Currency</label>
                                <select
                                    id="edit_currency"
                                    name="currency"
                                    value={editFormData.currency}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="USD">USD</option>
                                    <option value="CAD">CAD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="cannabis_module"
                                        checked={editFormData.cannabis_module}
                                        onChange={handleEditInputChange}
                                    />
                                    Enable Cannabis Module
                                </label>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditModal(false)}
                                disabled={updating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updating}
                            >
                                {updating ? 'Updating...' : 'Update Farm'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
} 