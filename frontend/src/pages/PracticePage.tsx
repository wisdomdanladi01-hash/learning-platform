import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { assessmentService } from '@/services/assessments';
import type { PracticeAssessment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  ListChecks,
  Clock,
  HelpCircle,
  Play,
  Search,
  BookOpen,
  Info,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourse = searchParams.get('course') ?? '';
  const [assessments, setAssessments] = useState<PracticeAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialCourse);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    assessmentService
      .listAssessments({
        query: searchQuery,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
      })
      .then((items) => {
        if (active) setAssessments(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery, selectedDifficulty]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
    setSearchParams({});
  };

  return (
    <div className="container-page py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Self-Assessment & Exam Preparation
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">
          Interactive Practice Tests
        </h1>
        <p className="mt-1.5 text-sm text-ink-600 max-w-2xl">
          Test your understanding of lecture concepts, practice past problem patterns, and build examination confidence with timed, self-paced practice tests.
        </p>
      </div>

      {/* Academic Disclaimer Alert */}
      <Alert tone="info" className="border-teal-200 bg-teal-50/60 text-teal-900">
        <div className="flex items-start gap-2.5">
          <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold text-teal-950">Demonstration Practice Mode</p>
            <p className="text-teal-800 leading-relaxed">
              These assessments are interactive demonstration practice tests designed to help Sa&apos;adu Zungur University students evaluate their course grasp and exam readiness. They are pedagogical study aids and do not constitute official university continuous assessments (CA) or semester exam scores.
            </p>
          </div>
        </div>
      </Alert>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-ink-100 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search by course code, title, or topic (e.g. COS 102, CSC 206)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-ink-500 whitespace-nowrap">Difficulty:</span>
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedDifficulty === diff
                  ? 'bg-ink-950 text-white'
                  : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
              }`}
            >
              {diff === 'all' ? 'All levels' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Assessments Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-ink-500">Loading practice assessments…</div>
      ) : assessments.length === 0 ? (
        <Card className="p-12 text-center">
          <HelpCircle className="h-10 w-10 text-ink-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-ink-900">No practice tests matched your search</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto mb-4">
            Try adjusting your search query or selecting &quot;All levels&quot; to see available assessments.
          </p>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Reset filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((test) => (
            <Card
              key={test.id}
              className="p-6 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="teal">{test.courseCode}</Badge>
                    <Badge tone="neutral">Level {test.level}</Badge>
                    <Badge tone="neutral">{test.semester}</Badge>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      test.difficulty === 'Beginner'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : test.difficulty === 'Intermediate'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {test.difficulty}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-ink-950 group-hover:text-teal-900 transition">
                  {test.title}
                </h3>
                <p className="text-xs font-medium text-ink-500 mt-0.5">
                  Course: {test.courseTitle}
                </p>

                <p className="mt-3 text-xs sm:text-sm text-ink-600 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 p-3 bg-ink-50 rounded-xl border border-ink-100 text-xs">
                  <div className="flex items-center gap-2 text-ink-700">
                    <ListChecks className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{test.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-700">
                    <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{test.durationMinutes} Minutes</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-ink-400 font-medium">Demonstration Assessment</span>
                <Link to={`/practice/${test.id}`}>
                  <Button
                    size="sm"
                    className="font-semibold shadow-xs"
                    rightIcon={<Play className="h-3.5 w-3.5 fill-current" />}
                  >
                    Start Test
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Helpful Guidance */}
      <Card className="p-6 bg-ink-950 text-white border-ink-950">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-300" /> Looking for corresponding lecture notes?
            </h4>
            <p className="text-xs sm:text-sm text-ink-300 max-w-xl">
              Study the course syllabus, handouts, and past questions in the learning materials catalogue before taking timed practice tests.
            </p>
          </div>
          <Link to="/materials">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-ink-700 text-ink-100 hover:text-white hover:bg-ink-800 whitespace-nowrap"
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Browse Materials
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
