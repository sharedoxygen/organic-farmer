// Event-driven data refresh system for OFMS
// Implements pattern from OFMS_TECHNICAL_ESSENTIALS.md

class DataRefreshEmitter extends EventTarget {
    emit(eventType: string, detail?: any) {
        const event = new CustomEvent(eventType, { detail });
        console.log('🔄 Data event emitted:', eventType, detail);
        this.dispatchEvent(event);
    }

    on(eventType: string, callback: (event: CustomEvent) => void) {
        this.addEventListener(eventType, callback as EventListener);
    }

    off(eventType: string, callback: (event: CustomEvent) => void) {
        this.removeEventListener(eventType, callback as EventListener);
    }
}

export const dataRefreshEmitter = new DataRefreshEmitter();

export const DATA_EVENTS = {
    // Feedback events
    FEEDBACK_CREATED: 'FEEDBACK_CREATED',
    FEEDBACK_UPDATED: 'FEEDBACK_UPDATED',
    FEEDBACK_DELETED: 'FEEDBACK_DELETED',
    FEEDBACK_RESPONSE_CREATED: 'FEEDBACK_RESPONSE_CREATED',
    FEEDBACK_STATUS_CHANGED: 'FEEDBACK_STATUS_CHANGED',
    
    // Farm events
    FARM_SWITCHED: 'FARM_SWITCHED',
    
    // User events
    USER_UPDATED: 'USER_UPDATED',
    USER_CREATED: 'USER_CREATED',
    USER_DELETED: 'USER_DELETED',
    
    // General refresh
    DATA_REFRESH_NEEDED: 'DATA_REFRESH_NEEDED'
} as const;

// Utility functions for common patterns
export function emitFeedbackRefresh() {
    dataRefreshEmitter.emit(DATA_EVENTS.DATA_REFRESH_NEEDED, { 
        entity: 'feedback',
        timestamp: Date.now()
    });
}

export function emitFeedbackResponseCreated(feedbackId: string, responseData?: any) {
    dataRefreshEmitter.emit(DATA_EVENTS.FEEDBACK_RESPONSE_CREATED, {
        feedbackId,
        responseData,
        timestamp: Date.now()
    });
    // Also emit general feedback refresh
    emitFeedbackRefresh();
}

export function emitFeedbackStatusChanged(feedbackId: string, newStatus: string, oldStatus?: string) {
    dataRefreshEmitter.emit(DATA_EVENTS.FEEDBACK_STATUS_CHANGED, {
        feedbackId,
        newStatus,
        oldStatus,
        timestamp: Date.now()
    });
    // Also emit general feedback refresh
    emitFeedbackRefresh();
}

export function emitFeedbackDeleted(feedbackId: string) {
    dataRefreshEmitter.emit(DATA_EVENTS.FEEDBACK_DELETED, {
        feedbackId,
        timestamp: Date.now()
    });
    // Also emit general feedback refresh
    emitFeedbackRefresh();
}