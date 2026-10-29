import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assessmentService } from '@/services/assessments';
import type { AssessmentResult } from '@/services/assessments';
import type { PracticeAssessment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileCode,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';

export function TestRunnerPage() {
  const { id } = useParams();

  const [assessment, setAssessment] = useState<PracticeAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assessment Runner State
  // 'idle' = instructions, 'active' = test in progress, 'finished' = submitted
  const [testState, setTestState] = useState<'idle' | 'active' | 'finished'>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load Assessment
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    assessmentService
      .getAssessment(id)
      .then((data) => {
        if (!active) return;
        if (!data) setError('Assessment not found.');
        else {
          setAssessment(data);
          setTimeRemaining(data.durationMinutes * 60);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Timer Effect
  useEffect(() => {
    if (testState === 'active') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState]);

  const handleStartTest = () => {
    if (!assessment) return;
    setUserAnswers({});
    setCurrentIndex(0);
    setTimeRemaining(assessment.durationMinutes * 60);
    startTimeRef.current = Date.now();
    setTestState('active');
  };

  const handleSelectOption = (questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleAutoSubmit = () => {
    submitAssessment();
  };

  const submitAssessment = () => {
    if (!assessment) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000),
    );
    const calculated = assessmentService.calculateResult(assessment, userAnswers, elapsedSeconds);
    setResult(calculated);
    setTestState('finished');
    setConfirmSubmitModal(false);
  };

  const handlePromptSubmit = () => {
    setConfirmSubmitModal(true);
  };

  const handleRestart = () => {
    setTestState('idle');
    setUserAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setShowReview(false);
    if (assessment) setTimeRemaining(assessment.durationMinutes * 60);
  };

  if (loading) {
    return <div className="container-page py-16 text-sm text-ink-600">Loading assessment details…</div>;
  }

  if (!assessment || error) {
    return (
      <div className="container-page py-16 max-w-xl">
        <Alert tone="error" title="Assessment unavailable">
          {error ?? 'This assessment could not be loaded.'}
        </Alert>
        <div className="mt-4">
          <Link to="/practice">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to practice tests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const unansweredCount =
    assessment.questions.length - Object.keys(userAnswers).length;

  // 1. INSTRUCTION SCREEN (IDLE)
  if (testState === 'idle') {
    return (
      <div className="container-page py-8 sm:py-12 max-w-3xl space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-ink-500" aria-label="Breadcrumb">
          <Link to="/practice" className="hover:text-teal-700 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Practice tests
          </Link>
          <span>/</span>
          <span className="text-ink-700 truncate">{assessment.courseCode}</span>
        </nav>

        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge tone="teal">{assessment.courseCode}</Badge>
              <Badge tone="neutral">Level {assessment.level}</Badge>
              <Badge tone="neutral">{assessment.semester}</Badge>
              <Badge tone="neutral">{assessment.difficulty}</Badge>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">
              {assessment.title}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-ink-600">
              Course: {assessment.courseTitle}
            </p>
            <p className="mt-4 text-sm text-ink-700 leading-relaxed">
              {assessment.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-ink-50 rounded-xl border border-ink-100 text-xs sm:text-sm">
            <div>
              <span className="text-ink-500 block text-xs">Total Questions</span>
              <span className="font-bold text-ink-950 text-base">{assessment.questions.length} Questions</span>
            </div>
            <div>
              <span className="text-ink-500 block text-xs">Time Limit</span>
              <span className="font-bold text-ink-950 text-base">{assessment.durationMinutes} Minutes</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-ink-500 block text-xs">Test Format</span>
              <span className="font-bold text-ink-950 text-base">Multiple Choice (MCQ)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-ink-900 text-sm uppercase tracking-wider">
              Test Instructions & Rules
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-ink-600 list-disc list-inside leading-relaxed">
              <li>Each question has exactly one correct answer.</li>
              <li>You can freely skip back and forth between questions using the question navigator.</li>
              <li>The test will automatically submit if the timer reaches 00:00.</li>
              <li>Immediate scoring and step-by-step pedagogical explanations are provided after submission.</li>
              <li>
                <strong>Academic Notice:</strong> This is an interactive demonstration assessment for personal study, not an official SAZU semester examination.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/practice" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth className="sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              fullWidth
              className="sm:w-auto font-bold px-8"
              onClick={handleStartTest}
              rightIcon={<Play className="h-4 w-4 fill-current" />}
            >
              Begin Assessment
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. ACTIVE TEST RUNNER
  if (testState === 'active') {
    const currentQ = assessment.questions[currentIndex];
    const isUrgent = timeRemaining < 120; // less than 2 minutes

    return (
      <div className="container-page py-6 sm:py-8 max-w-4xl space-y-6">
        {/* Runner Header Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-ink-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-ink-500 flex items-center gap-2">
              <span className="font-bold text-teal-700">{assessment.courseCode}</span>
              <span>•</span>
              <span>Question {currentIndex + 1} of {assessment.questions.length}</span>
            </div>
            <h2 className="text-base font-bold text-ink-900 mt-0.5">{assessment.title}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition ${
                isUrgent
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                  : 'bg-ink-50 text-ink-800 border-ink-200'
              }`}
            >
              <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-teal-600'}`} />
              <span>{formatTime(timeRemaining)}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePromptSubmit}
              className="font-semibold text-teal-700 border-teal-300 hover:bg-teal-50"
            >
              Submit Test
            </Button>
          </div>
        </div>

        {/* Question Navigator Grid */}
        <div className="bg-white p-4 rounded-xl border border-ink-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              Question Navigator
            </span>
            <span className="text-xs text-ink-600">
              {Object.keys(userAnswers).length} of {assessment.questions.length} Answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = userAnswers[q.id] !== undefined;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                    isCurrent
                      ? 'bg-teal-600 text-white ring-2 ring-teal-500 ring-offset-2'
                      : isAnswered
                      ? 'bg-teal-100 text-teal-900 border border-teal-300 hover:bg-teal-200'
                      : 'bg-ink-50 text-ink-700 border border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Display Card */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              Question {currentIndex + 1}
            </span>
            {userAnswers[currentQ.id] ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Check className="h-3 w-3" /> Answer selected ({userAnswers[currentQ.id]})
              </span>
            ) : (
              <span className="text-xs text-ink-400 italic">Not answered yet</span>
            )}
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-semibold text-ink-950 leading-relaxed">
            {currentQ.text}
          </div>

          {/* Code Snippet if applicable */}
          {currentQ.codeSnippet && (
            <div className="rounded-xl overflow-hidden border border-ink-800 bg-ink-950 text-ink-100 font-mono text-xs sm:text-sm p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink-800 text-[11px] text-ink-400">
                <span className="flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-teal-400" /> Code Reference
                </span>
              </div>
              <pre className="overflow-x-auto whitespace-pre leading-relaxed select-text">
                {currentQ.codeSnippet}
              </pre>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = userAnswers[currentQ.id] === opt.key;

              return (
                <div
                  key={opt.key}
                  onClick={() => handleSelectOption(currentQ.id, opt.key)}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/70 shadow-xs'
                      : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/50 bg-white'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'border border-ink-300 bg-white text-ink-700'
                    }`}
                  >
                    {opt.key}
                  </div>
                  <div className={`text-sm leading-relaxed ${isSelected ? 'font-semibold text-teal-950' : 'text-ink-800'}`}>
                    {opt.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Step Controls */}
          <div className="pt-6 border-t border-ink-100 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < assessment.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentIndex((prev) => Math.min(assessment.questions.length - 1, prev + 1))}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="font-bold bg-teal-700 hover:bg-teal-800"
                  onClick={handlePromptSubmit}
                >
                  Review & Submit
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Early Submit Confirmation Modal */}
        {confirmSubmitModal && (
          <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                <h3 className="font-display font-bold text-lg text-ink-950">Confirm Test Submission</h3>
              </div>

              {unansweredCount > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 leading-relaxed">
                  You still have <strong>{unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}</strong> out of {assessment.questions.length}. Any unanswered questions will be marked incorrect.
                </div>
              ) : (
                <p className="text-sm text-ink-600">
                  You have answered all {assessment.questions.length} questions. Are you ready to submit and calculate your score?
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button variant="outline" onClick={() => setConfirmSubmitModal(false)}>
                  Continue Answering
                </Button>
                <Button
                  className="font-bold bg-teal-600 hover:bg-teal-700"
                  onClick={submitAssessment}
                >
                  Submit Assessment
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // 3. RESULTS & REVIEW SCREEN (FINISHED)
  return (
    <div className="container-page py-8 sm:py-12 max-w-3xl space-y-8">
      {/* Result Overview Card */}
      <Card className="p-6 sm:p-8 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 mx-auto">
          <GraduationCap className="h-8 w-8" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-1 text-xs text-ink-500 font-medium">
            <span>{assessment.courseCode}</span>
            <span>•</span>
            <span>{assessment.title}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-ink-950">
            Assessment Complete
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Completed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Score Typography */}
        <div className="p-6 bg-ink-50 rounded-2xl border border-ink-100 max-w-sm mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
            Your Score
          </div>
          <div className="text-4xl sm:text-5xl font-black text-teal-700 tracking-tight">
            {result?.scorePercentage}%
          </div>
          <div className="mt-2 text-xs font-semibold text-ink-700">
            {result?.correctCount} out of {result?.totalQuestions} correct
          </div>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white border border-ink-200 text-ink-800">
            Grade: {result?.grade}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs text-ink-700 max-w-md mx-auto">
          <div className="p-3 bg-white border border-ink-100 rounded-xl">
            <span className="text-ink-400 block mb-0.5">Time Spent</span>
            <span className="font-bold text-sm">{formatTime(result?.durationSeconds ?? 0)}</span>
          </div>
          <div className="p-3 bg-white border border-ink-100 rounded-xl">
            <span className="text-ink-400 block mb-0.5">Answered Questions</span>
            <span className="font-bold text-sm">
              {result?.answeredCount} / {result?.totalQuestions}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-ink-100 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleRestart}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Retake Test
          </Button>
          <Button
            onClick={() => setShowReview(!showReview)}
            className="font-bold"
            leftIcon={<HelpCircle className="h-4 w-4" />}
          >
            {showReview ? 'Hide Explanations' : 'Review Questions & Explanations'}
          </Button>
          <Link to="/practice">
            <Button variant="ghost">All Practice Tests</Button>
          </Link>
        </div>
      </Card>

      {/* 4. DETAILED ANSWER REVIEW SECTION */}
      {showReview && (
        <div className="space-y-6 pt-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-950 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" /> Question-by-Question Review
            </h2>
            <span className="text-xs text-ink-500">
              Green = Correct answer • Red = Incorrect choice
            </span>
          </div>

          {assessment.questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.correctAnswer;

            return (
              <Card key={q.id} className="p-6 space-y-4 border border-ink-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink-700 bg-ink-100 px-2.5 py-1 rounded">
                    Question {idx + 1}
                  </span>
                  {userChoice ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4" /> Correct (+1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        <XCircle className="h-4 w-4" /> Incorrect (0)
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      Unanswered
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-ink-950 leading-relaxed">
                  {q.text}
                </div>

                {q.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-ink-800 bg-ink-950 text-ink-100 font-mono text-xs p-3.5">
                    <pre className="overflow-x-auto whitespace-pre leading-relaxed select-text">
                      {q.codeSnippet}
                    </pre>
                  </div>
                )}

                {/* Option Breakdown */}
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isTheCorrectOne = opt.key === q.correctAnswer;
                    const isUserChoice = userChoice === opt.key;

                    let rowStyle = 'border-ink-100 bg-white text-ink-700';
                    if (isTheCorrectOne) {
                      rowStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                    } else if (isUserChoice && !isCorrect) {
                      rowStyle = 'border-red-400 bg-red-50/60 text-red-950 ring-1 ring-red-400';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                        {isTheCorrectOne && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                            <Check className="h-3.5 w-3.5" /> Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isTheCorrectOne && (
                          <span className="text-xs font-bold text-red-700 shrink-0">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="p-3.5 bg-ink-50 rounded-xl border border-ink-100 text-xs text-ink-700 space-y-1">
                  <div className="font-bold text-ink-900 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-teal-600" /> Explanation
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
