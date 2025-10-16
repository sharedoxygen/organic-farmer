// Centralized enums, constants, and helper types for the OFMS feedback feature.
// Keeping these here prevents re-allocation on each render and ensures client / server share a single source of truth.

export type FeedbackType = 'BUG' | 'ENHANCEMENT' | 'GENERAL' | 'SUPPORT' | 'BILLING' | 'SECURITY';
export type FeedbackPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface FeedbackTypeMeta {
  value: FeedbackType;
  label: string;
  icon: string; // Emoji or icon string
  description: string;
  color: string; // Tailwind / HEX color
}

export interface FeedbackPriorityMeta {
  value: FeedbackPriority;
  label: string;
  color: string;
  description: string;
}

export const FEEDBACK_TYPES: FeedbackTypeMeta[] = [
  {
    value: 'BUG',
    label: 'Bug Report',
    icon: '🐛',
    description: "Report an issue or something that isn't working",
    color: '#ef4444',
  },
  {
    value: 'ENHANCEMENT',
    label: 'Feature Request',
    icon: '💡',
    description: 'Suggest a new feature or improvement',
    color: '#3b82f6',
  },
  {
    value: 'GENERAL',
    label: 'General Feedback',
    icon: '💬',
    description: 'Share your thoughts and suggestions',
    color: '#10b981',
  },
  {
    value: 'SUPPORT',
    label: 'Get Help',
    icon: '🤝',
    description: 'Need assistance with something',
    color: '#f59e0b',
  },
  {
    value: 'BILLING',
    label: 'Billing Issue',
    icon: '💳',
    description: 'Payment or subscription related',
    color: '#8b5cf6',
  },
  {
    value: 'SECURITY',
    label: 'Security Concern',
    icon: '🔒',
    description: 'Report a security vulnerability',
    color: '#dc2626',
  },
];

export const FEEDBACK_PRIORITIES: FeedbackPriorityMeta[] = [
  { value: 'LOW', label: 'Low', color: '#10b981', description: 'Nice to have' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6', description: 'Standard priority' },
  { value: 'HIGH', label: 'High', color: '#f59e0b', description: 'Important issue' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444', description: 'Critical problem' },
];
