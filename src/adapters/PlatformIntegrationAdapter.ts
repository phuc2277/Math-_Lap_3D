import { LabAssignment } from '../models/LabAssignment';
import {
  LabActivitySession,
  LabActivityResult,
  ExperimentQuestion,
} from '../models/LabActivitySession';
import { LocalActivityStore } from '../services/LocalActivityStore';
import { ExperimentGrader } from '../services/ExperimentGrader';
import { postMessageBridge } from '../integration/postMessage';

export interface PlatformIntegrationAdapter {
  getAssignment(assignmentId: string): Promise<LabAssignment | null>;
  getStudentAssignments(studentId: string): Promise<LabAssignment[]>;
  saveAssignment(assignment: LabAssignment): Promise<LabAssignment>;
  getStudentSession(assignmentId: string, studentId: string): Promise<LabActivitySession | null>;
  submitActivityResult(
    session: LabActivitySession,
    questions: ExperimentQuestion[],
    totalStepsCount: number
  ): Promise<LabActivityResult>;
  getAssignmentResults(assignmentId: string): Promise<LabActivityResult[]>;
}

export class DefaultPlatformIntegrationAdapter implements PlatformIntegrationAdapter {
  public async getAssignment(assignmentId: string): Promise<LabAssignment | null> {
    const found = LocalActivityStore.getAssignmentById(assignmentId);
    return found || null;
  }

  public async getStudentAssignments(studentId: string): Promise<LabAssignment[]> {
    // Return published assignments
    const all = LocalActivityStore.getAssignments();
    return all.filter((a) => a.status === 'published');
  }

  public async saveAssignment(assignment: LabAssignment): Promise<LabAssignment> {
    LocalActivityStore.saveAssignment(assignment);
    return assignment;
  }

  public async getStudentSession(
    assignmentId: string,
    studentId: string
  ): Promise<LabActivitySession | null> {
    const session = LocalActivityStore.getSessionByAssignmentAndStudent(assignmentId, studentId);
    return session || null;
  }

  public async submitActivityResult(
    session: LabActivitySession,
    questions: ExperimentQuestion[],
    totalStepsCount: number
  ): Promise<LabActivityResult> {
    const assignment = LocalActivityStore.getAssignmentById(session.assignmentId);

    // Grade questions deterministically
    const grading = ExperimentGrader.gradeAll(questions, session.answers);

    const startedTime = new Date(session.startedAt).getTime();
    const completedTime = Date.now();
    const durationSeconds = Math.max(10, Math.round((completedTime - startedTime) / 1000));

    const progressPercentage = Math.round(
      (session.completedSteps.length / Math.max(1, totalStepsCount)) * 100
    );

    const result: LabActivityResult = {
      assignmentId: session.assignmentId,
      sessionId: session.id,
      studentId: session.studentId,
      studentName: session.studentName || `Học sinh ${session.studentId}`,
      experimentId: session.experimentId,
      labId: session.labId,
      lessonId: assignment?.lessonId,
      status: 'completed',
      startedAt: session.startedAt,
      completedAt: new Date(completedTime).toISOString(),
      progressPercentage,
      completedStepsCount: session.completedSteps.length,
      totalStepsCount,
      score: {
        earned: grading.totalEarned,
        possible: grading.totalPossible,
      },
      questionResults: grading.questionResults,
      durationSeconds,
      attemptNumber: session.attemptNumber || 1,
    };

    // Save result locally
    LocalActivityStore.saveResult(result);

    // Emit postMessage to parent container platform
    postMessageBridge.sendMessageToParent({
      type: 'EXPERIMENT_COMPLETED',
      labId: result.labId,
      experimentId: result.experimentId,
      payload: {
        assignmentId: result.assignmentId,
        sessionId: result.sessionId,
        studentId: result.studentId,
        score: result.score,
        progressPercentage: result.progressPercentage,
        durationSeconds: result.durationSeconds,
      },
    });

    return result;
  }

  public async getAssignmentResults(assignmentId: string): Promise<LabActivityResult[]> {
    return LocalActivityStore.getResultsByAssignment(assignmentId);
  }
}

export const platformIntegrationAdapter = new DefaultPlatformIntegrationAdapter();
