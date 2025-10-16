'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface Equipment {
    id: string;
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    location: string;
    status: 'operational' | 'maintenance' | 'repair' | 'retired';
    lastMaintenance: string;
    nextMaintenance: string;
}

export default function EquipmentPage() {
    const [equipment] = useState<Equipment[]>([
        {
            id: '1',
            name: 'LED Grow Light Panel A1',
            type: 'Lighting',
            model: 'SpiderFarmer SF4000',
            serialNumber: 'SF4K-2024001',
            location: 'Greenhouse A',
            status: 'operational',
            lastMaintenance: '2024-05-15',
            nextMaintenance: '2024-08-15'
        },
        {
            id: '2',
            name: 'Hydroponic Pump System',
            type: 'Irrigation',
            model: 'ActiveAqua AAPW250',
            serialNumber: 'AA250-2023087',
            location: 'Growing Room B',
            status: 'operational',
            lastMaintenance: '2024-06-01',
            nextMaintenance: '2024-09-01'
        },
        {
            id: '3',
            name: 'Climate Control Unit',
            type: 'HVAC',
            model: 'Quest Dual 205',
            serialNumber: 'QD205-2022145',
            location: 'Greenhouse A',
            status: 'maintenance',
            lastMaintenance: '2024-06-20',
            nextMaintenance: '2024-07-20'
        }
    ]);

    const getStatusColor = (status: Equipment['status']) => {
        switch (status) {
            case 'operational': return '#28a745';
            case 'maintenance': return '#ffc107';
            case 'repair': return '#dc3545';
            case 'retired': return '#6c757d';
            default: return '#6c757d';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Equipment Management</h1>
                <p>Track and maintain all farming equipment</p>
                <Button>+ Add Equipment</Button>
            </div>

            <div className={styles.equipmentGrid}>
                {equipment.map((item) => (
                    <Card key={item.id} className={styles.equipmentCard}>
                        <div className={styles.cardHeader}>
                            <h3>{item.name}</h3>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(item.status) }}
                            >
                                {item.status}
                            </span>
                        </div>
                        <div className={styles.details}>
                            <p><strong>Type:</strong> {item.type}</p>
                            <p><strong>Model:</strong> {item.model}</p>
                            <p><strong>Serial:</strong> {item.serialNumber}</p>
                            <p><strong>Location:</strong> {item.location}</p>
                            <p><strong>Last Maintenance:</strong> {new Date(item.lastMaintenance).toLocaleDateString()}</p>
                            <p><strong>Next Maintenance:</strong> {new Date(item.nextMaintenance).toLocaleDateString()}</p>
                        </div>
                        <div className={styles.actions}>
                            <Button variant="secondary">View Details</Button>
                            <Button variant="primary">Schedule Maintenance</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 