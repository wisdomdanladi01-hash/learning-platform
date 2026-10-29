import { DEMONSTRATION_ASSESSMENTS } from '@/data/demonstrationAssessments';
import type { PracticeAssessment } from '@/types';

export interface AssessmentResult {
  assessmentId: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number;
  grade: 'Distinction' | 'Credit' | 'Pass' | 'Fail';
  completedAt: string;
  durationSeconds: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export const assessmentService = {
  async listAssessments(params?: {
    query?: string;
    courseCode?: string;
    difficulty?: string;
  }): Promise<PracticeAssessment[]> {
    let items = [...DEMONSTRATION_ASSESSMENTS];
    if (params?.query?.trim()) {
      const q = params.query.trim().toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.courseCode.toLowerCase().includes(q) ||
          a.courseTitle.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }
    if (params?.courseCode) {
      items = items.filter((a) => a.courseCode.toLowerCase() === params.courseCode?.toLowerCase());
    }
    if (params?.difficulty) {
      items = items.filter((a) => a.difficulty === params.difficulty);
    }
    return items;
  },

  async getAssessment(id: string): Promise<PracticeAssessment | undefined> {
    return DEMONSTRATION_ASSESSMENTS.find((a) => a.id === id);
  },

  calculateResult(
    assessment: PracticeAssessment,
    userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>,
    durationSeconds: number,
  ): AssessmentResult {
    let correctCount = 0;
    let answeredCount = 0;

    assessment.questions.forEach((q) => {
      const userChoice = userAnswers[q.id];
      if (userChoice !== undefined) {
        answeredCount += 1;
        if (userChoice === q.correctAnswer) {
          correctCount += 1;
        }
      }
    });

    const totalQuestions = assessment.questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    let grade: AssessmentResult['grade'] = 'Fail';
    if (scorePercentage >= 70) grade = 'Distinction';
    else if (scorePercentage >= 60) grade = 'Credit';
    else if (scorePercentage >= 50) grade = 'Pass';

    return {
      assessmentId: assessment.id,
      totalQuestions,
      answeredCount,
      correctCount,
      scorePercentage,
      grade,
      completedAt: new Date().toISOString(),
      durationSeconds,
      answers: { ...userAnswers },
    };
  },
};

