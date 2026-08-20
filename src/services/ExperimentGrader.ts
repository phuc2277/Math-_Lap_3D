import { ExperimentQuestion, QuestionResult } from '../models/LabActivitySession';

export class ExperimentGrader {
  /**
   * Evaluates a single question answer deterministically without relying on AI.
   */
  public static gradeQuestion(
    question: ExperimentQuestion,
    studentAnswer: string | number,
    attemptsCount: number = 1
  ): QuestionResult {
    const maxScore = question.points ?? 1;

    if (question.type === 'single_choice') {
      const isCorrect = String(studentAnswer).trim() === String(question.correctAnswer).trim();
      return {
        questionId: question.id,
        stepNumber: question.stepNumber,
        questionText: question.questionText,
        type: 'single_choice',
        studentAnswer,
        expectedAnswer: question.correctAnswer,
        isCorrect,
        score: isCorrect ? maxScore : 0,
        maxScore,
        attemptsCount,
        requiresTeacherReview: false,
      };
    }

    if (question.type === 'numeric') {
      const parsedStudent = parseFloat(String(studentAnswer));
      const parsedExpected = parseFloat(String(question.correctAnswer));

      if (isNaN(parsedStudent) || isNaN(parsedExpected)) {
        return {
          questionId: question.id,
          stepNumber: question.stepNumber,
          questionText: question.questionText,
          type: 'numeric',
          studentAnswer,
          expectedAnswer: question.correctAnswer,
          isCorrect: false,
          score: 0,
          maxScore,
          attemptsCount,
          requiresTeacherReview: false,
        };
      }

      const tolerance = question.tolerance ?? 0.1;
      const isCorrect = Math.abs(parsedStudent - parsedExpected) <= tolerance;

      return {
        questionId: question.id,
        stepNumber: question.stepNumber,
        questionText: question.questionText,
        type: 'numeric',
        studentAnswer: parsedStudent,
        expectedAnswer: parsedExpected,
        isCorrect,
        score: isCorrect ? maxScore : 0,
        maxScore,
        attemptsCount,
        requiresTeacherReview: false,
      };
    }

    // observation type: subjective answer requiring teacher review
    return {
      questionId: question.id,
      stepNumber: question.stepNumber,
      questionText: question.questionText,
      type: 'observation',
      studentAnswer,
      expectedAnswer: undefined,
      isCorrect: null,
      score: 0,
      maxScore,
      attemptsCount,
      requiresTeacherReview: true,
    };
  }

  /**
   * Evaluates an entire collection of questions for an experiment.
   */
  public static gradeAll(
    questions: ExperimentQuestion[],
    answers: Record<string, string | number>
  ): {
    questionResults: QuestionResult[];
    totalEarned: number;
    totalPossible: number;
  } {
    let totalEarned = 0;
    let totalPossible = 0;
    const questionResults: QuestionResult[] = [];

    for (const q of questions) {
      const ans = answers[q.id];
      if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
        const result = this.gradeQuestion(q, ans);
        questionResults.push(result);
        totalEarned += result.score;
        totalPossible += result.maxScore;
      } else {
        questionResults.push({
          questionId: q.id,
          stepNumber: q.stepNumber,
          questionText: q.questionText,
          type: q.type,
          studentAnswer: 'Chưa trả lời',
          expectedAnswer: q.correctAnswer,
          isCorrect: false,
          score: 0,
          maxScore: q.points ?? 1,
          attemptsCount: 0,
          requiresTeacherReview: q.type === 'observation',
        });
        totalPossible += q.points ?? 1;
      }
    }

    return { questionResults, totalEarned, totalPossible };
  }
}
