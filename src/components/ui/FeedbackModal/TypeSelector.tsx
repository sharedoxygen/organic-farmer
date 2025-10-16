"use client";
import React from 'react';
import styles from './FeedbackModal.module.css';
import { FeedbackType, FeedbackTypeMeta, FEEDBACK_TYPES } from '@/constants/feedback';

interface Props {
    types: FeedbackTypeMeta[];
    selectedType: FeedbackType;
    onSelect: (value: FeedbackType) => void;
}

const TypeSelector: React.FC<Props> = ({ types, selectedType, onSelect }) => {
    return (
        <div className={styles.typeGrid}>
            {types.map((type) => (
                <button
                    key={type.value}
                    type="button"
                    className={`${styles.typeButton} ${selectedType === type.value ? styles.selected : ''}`}
                    onClick={() => onSelect(type.value)}
                    aria-pressed={selectedType === type.value}
                >
                    <span className={styles.typeIcon}>{type.icon}</span>
                    <span className={styles.typeLabel}>{type.label}</span>
                </button>
            ))}
        </div>
    );
};

export default TypeSelector;
