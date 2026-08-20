import { LabAssignment, SAMPLE_ASSIGNMENTS } from '../models/LabAssignment';
import {
  LabActivitySession,
  LabActivityEvent,
  LabActivityResult,
} from '../models/LabActivitySession';

const ASSIGNMENTS_KEY = 'mathlab_assignments_v1';
const SESSIONS_KEY = 'mathlab_activity_sessions_v1';
const EVENTS_QUEUE_KEY = 'mathlab_pending_events_v1';
const PROCESSED_EVENT_IDS_KEY = 'mathlab_processed_event_ids_v1';
const RESULTS_KEY = 'mathlab_activity_results_v1';

export class LocalActivityStore {
  /* ================= ASSIGNMENTS ================= */
  public static getAssignments(): LabAssignment[] {
    try {
      const raw = localStorage.getItem(ASSIGNMENTS_KEY);
      if (!raw) {
        this.saveAssignments(SAMPLE_ASSIGNMENTS);
        return SAMPLE_ASSIGNMENTS;
      }
      return JSON.parse(raw);
    } catch {
      return SAMPLE_ASSIGNMENTS;
    }
  }

  public static getAssignmentById(id: string): LabAssignment | undefined {
    return this.getAssignments().find((a) => a.id === id);
  }

  public static saveAssignment(assignment: LabAssignment): void {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) {
      list[idx] = assignment;
    } else {
      list.unshift(assignment);
    }
    this.saveAssignments(list);
  }

  private static saveAssignments(list: LabAssignment[]): void {
    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to save assignments', e);
    }
  }

  /* ================= SESSIONS ================= */
  public static getSessions(): LabActivitySession[] {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static getSessionByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): LabActivitySession | undefined {
    return this.getSessions().find(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId && s.status !== 'completed'
    );
  }

  public static saveSession(session: LabActivitySession): void {
    const list = this.getSessions();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to save session', e);
    }
  }

  /* ================= EVENTS (IDEMPOTENT & QUEUED) ================= */
  public static isEventProcessed(eventId: string): boolean {
    try {
      const raw = localStorage.getItem(PROCESSED_EVENT_IDS_KEY);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      return set.has(eventId);
    } catch {
      return false;
    }
  }

  public static markEventProcessed(eventId: string): void {
    try {
      const raw = localStorage.getItem(PROCESSED_EVENT_IDS_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(eventId)) {
        arr.push(eventId);
        // keep only latest 500 IDs
        if (arr.length > 500) arr.shift();
        localStorage.setItem(PROCESSED_EVENT_IDS_KEY, JSON.stringify(arr));
      }
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to mark event processed', e);
    }
  }

  public static enqueueEvent(event: LabActivityEvent): void {
    if (this.isEventProcessed(event.id)) return;
    this.markEventProcessed(event.id);

    try {
      const raw = localStorage.getItem(EVENTS_QUEUE_KEY);
      const queue: LabActivityEvent[] = raw ? JSON.parse(raw) : [];
      queue.push(event);
      localStorage.setItem(EVENTS_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to enqueue event', e);
    }
  }

  public static getPendingEvents(): LabActivityEvent[] {
    try {
      const raw = localStorage.getItem(EVENTS_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static clearPendingEvents(): void {
    try {
      localStorage.setItem(EVENTS_QUEUE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to clear queue', e);
    }
  }

  /* ================= RESULTS ================= */
  public static getResults(): LabActivityResult[] {
    try {
      const raw = localStorage.getItem(RESULTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static getResultsByAssignment(assignmentId: string): LabActivityResult[] {
    return this.getResults().filter((r) => r.assignmentId === assignmentId);
  }

  public static getResultsByStudent(studentId: string): LabActivityResult[] {
    return this.getResults().filter((r) => r.studentId === studentId);
  }

  public static saveResult(result: LabActivityResult): void {
    const list = this.getResults();
    const idx = list.findIndex(
      (r) => r.sessionId === result.sessionId || (r.assignmentId === result.assignmentId && r.studentId === result.studentId)
    );
    if (idx >= 0) {
      list[idx] = result;
    } else {
      list.push(result);
    }
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[LocalActivityStore] Failed to save result', e);
    }
  }
}
