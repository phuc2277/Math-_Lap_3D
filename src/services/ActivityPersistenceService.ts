import {
  LabActivitySession,
  LabActivityEvent,
  ActivityEventType,
} from '../models/LabActivitySession';
import { LocalActivityStore } from './LocalActivityStore';

export class ActivityPersistenceService {
  private activeSession: LabActivitySession | null = null;
  private paramDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  public initializeSession(
    assignmentId: string,
    studentId: string,
    studentName: string | undefined,
    labId: string,
    experimentId: string,
    attemptNumber: number = 1
  ): LabActivitySession {
    const existing = LocalActivityStore.getSessionByAssignmentAndStudent(assignmentId, studentId);
    if (existing) {
      this.activeSession = existing;
      this.logEvent('LAB_OPENED', { resumed: true });
      return existing;
    }

    const newSession: LabActivitySession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assignmentId,
      studentId,
      studentName: studentName || `Học sinh ${studentId.substring(0, 4)}`,
      labId,
      experimentId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      currentStep: 1,
      completedSteps: [],
      answers: {},
      savedParams: {},
      attemptNumber,
    };

    this.activeSession = newSession;
    LocalActivityStore.saveSession(newSession);
    this.logEvent('LAB_OPENED', { newSession: true });
    this.logEvent('EXPERIMENT_STARTED', { step: 1 });
    return newSession;
  }

  public getSession(): LabActivitySession | null {
    return this.activeSession;
  }

  public updateStepProgress(stepNumber: number, isCompleted: boolean = true): void {
    if (!this.activeSession) return;

    this.activeSession.currentStep = stepNumber;
    if (isCompleted && !this.activeSession.completedSteps.includes(stepNumber)) {
      this.activeSession.completedSteps.push(stepNumber);
    }
    this.activeSession.updatedAt = new Date().toISOString();

    LocalActivityStore.saveSession(this.activeSession);
    this.logEvent('STEP_COMPLETED', { stepNumber, completedSteps: this.activeSession.completedSteps });
  }

  public recordAnswer(questionId: string, answer: string | number): void {
    if (!this.activeSession) return;

    this.activeSession.answers[questionId] = answer;
    this.activeSession.updatedAt = new Date().toISOString();

    LocalActivityStore.saveSession(this.activeSession);
    this.logEvent('QUESTION_ANSWERED', { questionId, answer });
  }

  public recordParameterChange(key: string, value: number): void {
    if (!this.activeSession) return;

    this.activeSession.savedParams = {
      ...this.activeSession.savedParams,
      [key]: value,
    };

    // Debounce logging to avoid spamming telemetry during slider drag
    if (this.paramDebounceTimer) clearTimeout(this.paramDebounceTimer);

    this.paramDebounceTimer = setTimeout(() => {
      if (this.activeSession) {
        this.activeSession.updatedAt = new Date().toISOString();
        LocalActivityStore.saveSession(this.activeSession);
        this.logEvent('PARAMETER_CHANGED', { key, value });
      }
    }, 400);
  }

  public logEvent(type: ActivityEventType, payload: Record<string, any> = {}): void {
    if (!this.activeSession) return;

    const event: LabActivityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: this.activeSession.id,
      assignmentId: this.activeSession.assignmentId,
      studentId: this.activeSession.studentId,
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    LocalActivityStore.enqueueEvent(event);
  }

  public completeSession(): void {
    if (!this.activeSession) return;

    this.activeSession.status = 'completed';
    this.activeSession.completedAt = new Date().toISOString();
    this.activeSession.updatedAt = new Date().toISOString();

    LocalActivityStore.saveSession(this.activeSession);
    this.logEvent('EXPERIMENT_COMPLETED', {
      totalCompletedSteps: this.activeSession.completedSteps.length,
    });
  }
}

export const activityPersistenceService = new ActivityPersistenceService();
