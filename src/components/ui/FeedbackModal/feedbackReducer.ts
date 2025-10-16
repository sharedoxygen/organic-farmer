import { FeedbackType, FeedbackPriority } from '@/constants/feedback';
import { ZodError } from 'zod';

export interface FeedbackFormState {
    formData: {
        title: string;
        category: string;
        type: FeedbackType;
        description: string;
        priority: FeedbackPriority;
    };
    errors: Record<string, string[] | undefined>;
}

export const initialState = (initialCategory: string, initialType: FeedbackType): FeedbackFormState => ({
    formData: {
        title: '',
        category: initialCategory,
        type: initialType,
        description: '',
        priority: 'NORMAL',
    },
    errors: {},
});

export type Action = 
    | { type: 'SET_FIELD'; payload: { field: keyof FeedbackFormState['formData']; value: string } }
    | { type: 'SET_ERRORS'; payload: Record<string, string[] | undefined> }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'RESET'; payload: { initialCategory: string; initialType: FeedbackType } };

export function feedbackReducer(state: FeedbackFormState, action: Action): FeedbackFormState {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                formData: { ...state.formData, [action.payload.field]: action.payload.value },
                errors: { ...state.errors, [action.payload.field]: undefined },
            };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'CLEAR_ERRORS':
            return { ...state, errors: {} };
        case 'RESET':
            return initialState(action.payload.initialCategory, action.payload.initialType);
        default:
            return state;
    }
}
