'use client';

import React, { useState } from 'react';
import styles from './CrudTable.module.css';

interface Column<T = Record<string, unknown>> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface CrudTableProps<T = Record<string, unknown>> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onAdd?: () => void;
    loading?: boolean;
    searchable?: boolean;
    title?: string;
}

export default function CrudTable<T extends Record<string, unknown>>({
    data,
    columns,
    onEdit,
    onDelete,
    onAdd,
    loading = false,
    searchable = true,
    title = 'Data Table'
}: CrudTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter data based on search term
    const filteredData = data.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortColumn) return 0;

        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (column: keyof T) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleEdit = (row: T) => {
        if (onEdit) {
            onEdit(row);
        }
    };

    const handleDelete = (row: T) => {
        if (onDelete && window.confirm('Are you sure you want to delete this item?')) {
            onDelete(row);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.headerActions}>
                    {searchable && (
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    )}
                    {onAdd && (
                        <button onClick={onAdd} className={styles.addButton}>
                            + Add New
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`${styles.th} ${column.sortable ? styles.sortable : ''}`}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    {column.label}
                                    {column.sortable && sortColumn === column.key && (
                                        <span className={styles.sortIcon}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                            ))}
                            {(onEdit || onDelete) && (
                                <th className={styles.th}>Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, index) => (
                            <tr key={index} className={styles.tr}>
                                {columns.map((column) => (
                                    <td key={String(column.key)} className={styles.td}>
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? '')
                                        }
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className={styles.td}>
                                        <div className={styles.actionButtons}>
                                            {onEdit && (
                                                <button
                                                    onClick={() => handleEdit(row)}
                                                    className={styles.editButton}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => handleDelete(row)}
                                                    className={styles.deleteButton}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sortedData.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No data found</p>
                        {searchTerm && (
                            <p>Try adjusting your search criteria</p>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <p className={styles.resultCount}>
                    Showing {sortedData.length} of {data.length} items
                </p>
            </div>
        </div>
    );
} 