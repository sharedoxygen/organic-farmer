"use client";
import React from 'react';
import styles from './FeedbackModal.module.css';
import { FeedbackPriority, FeedbackPriorityMeta } from '@/constants/feedback';

interface Props {
    priorities: FeedbackPriorityMeta[];
    selectedPriority: FeedbackPriority;
    onSelect: (value: FeedbackPriority) => void;
}

const PrioritySelector: React.FC<Props> = ({ priorities, selectedPriority, onSelect }) => {
    return (
        <div className={styles.priorityGrid}>
            {priorities.map((priority) => (
                <button
                    key={priority.value}
                    type="button"
                    className={`${styles.priorityButton} ${selectedPriority === priority.value ? styles.selected : ''}`}
                    onClick={() => onSelect(priority.value)}
                    aria-pressed={selectedPriority === priority.value}
                >
                    <span className={styles.priorityDot} style={{ backgroundColor: priority.color }} />
                    <span className={styles.priorityLabel}>{priority.label}</span>
                </button>
            ))}
        </div>
    );
};

export default PrioritySelector;
