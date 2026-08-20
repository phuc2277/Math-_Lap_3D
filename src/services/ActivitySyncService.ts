import { LocalActivityStore } from './LocalActivityStore';
import { postMessageBridge } from '../integration/postMessage';

export class ActivitySyncService {
  private isSyncing = false;

  public async syncPendingEvents(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncing) return { syncedCount: 0, errors: 0 };
    this.isSyncing = true;

    const pending = LocalActivityStore.getPendingEvents();
    if (pending.length === 0) {
      this.isSyncing = false;
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    try {
      for (const event of pending) {
        try {
          // Send activity via postMessage to parent container
          postMessageBridge.logActivity({
            type: event.type,
            labId: event.payload.labId || 'lab-active',
            lessonId: event.payload.lessonId,
            userId: event.studentId,
            details: {
              eventId: event.id,
              sessionId: event.sessionId,
              assignmentId: event.assignmentId,
              ...event.payload,
            },
            timestamp: event.timestamp,
          });
          syncedCount++;
        } catch {
          errors++;
        }
      }

      // If all succeeded, clear queue
      if (errors === 0) {
        LocalActivityStore.clearPendingEvents();
      }
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, errors };
  }
}

export const activitySyncService = new ActivitySyncService();
