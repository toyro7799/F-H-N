import {useCallback, useEffect, useMemo, useState} from 'react';
import {FillInBlankSection} from './components/FillInBlankSection';
import {HeaderBar} from './components/HeaderBar';
import {McqSection} from './components/McqSection';
import {OfflineIndicator} from './components/OfflineIndicator';
import {ResultsScreen} from './components/ResultsScreen';
import {WelcomeScreen} from './components/WelcomeScreen';
import {WritingSection} from './components/WritingSection';
import type {
  ExamHistoryEntry,
  ExamStep,
  FillInGradeResult,
  GeneratedExam,
  LoadedSheet,
  McqGradeResult,
  SavedExamProgress,
  SheetCatalogItem,
  WritingGradeResult,
} from './types/exam';
import {loadAllSheets} from './utils/dataLoader';
import {
  computeExamSummary,
  gradeFillInQuestion,
  gradeMcqQuestion,
  gradeWritingQuestion,
} from './utils/grading';
import {buildExamFromSheets, buildRetryWrongExam} from './utils/questionSelection';
import {
  clearExamHistory,
  clearSavedProgress,
  loadExamHistory,
  loadSavedProgress,
  loadThemePreference,
  saveExamHistoryEntry,
  saveExamProgress,
  saveThemePreference,
} from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());
  const [debugMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('debug') === '1';
    }
    return false;
  });

  const [step, setStep] = useState<ExamStep>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'sheets';
    }
    return 'welcome';
  });

  // Loaded sheets state
  const [sheets, setSheets] = useState<LoadedSheet[]>([]);
  const [failedSheets, setFailedSheets] = useState<
    Array<{item: SheetCatalogItem; reason: string}>
  >([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);

  // Active exam state
  const [exam, setExam] = useState<GeneratedExam | null>(null);
  const [fibAnswers, setFibAnswers] = useState<Record<string, string[]>>({});
  const [mcqAnswers, setMcqAnswers] = useState<
    Record<string, 'A' | 'B' | 'C' | 'D' | null>
  >({});
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [skippedUids, setSkippedUids] = useState<string[]>([]);

  const [fibGraded, setFibGraded] = useState(false);
  const [mcqGraded, setMcqGraded] = useState(false);
  const [writingGraded, setWritingGraded] = useState(false);

  // Optional timer (off by default)
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // History & saved progress
  const [history, setHistory] = useState<ExamHistoryEntry[]>(() => loadExamHistory());
  const [savedProgress, setSavedProgress] = useState<SavedExamProgress | null>(() =>
    loadSavedProgress()
  );

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  // Fetch all 10 JSON files from /data/*.json
  const fetchAllData = useCallback(async () => {
    setIsLoadingSheets(true);
    const result = await loadAllSheets();
    setSheets(result.sheets);
    setFailedSheets(result.failed);
    setIsLoadingSheets(false);
  }, []);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  // Timer tick during active exam sections
  const isExamActive = step === 'fib' || step === 'mcq' || step === 'writing';
  useEffect(() => {
    if (!timerEnabled || !isExamActive) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerEnabled, isExamActive]);

  // Auto-save progress whenever exam state changes
  useEffect(() => {
    if (!exam || !isExamActive) return;
    const payload: SavedExamProgress = {
      exam,
      step,
      fibAnswers,
      mcqAnswers,
      writingAnswers,
      fibGraded,
      mcqGraded,
      writingGraded,
      skippedUids,
      elapsedSeconds,
      timerEnabled,
      updatedAt: new Date().toISOString(),
    };
    saveExamProgress(payload);
    setSavedProgress(payload);
  }, [
    exam,
    step,
    isExamActive,
    fibAnswers,
    mcqAnswers,
    writingAnswers,
    fibGraded,
    mcqGraded,
    writingGraded,
    skippedUids,
    elapsedSeconds,
    timerEnabled,
  ]);

  const skippedSet = useMemo(() => new Set(skippedUids), [skippedUids]);

  // Graded results computed cleanly from pure functions
  const fibGrades: FillInGradeResult[] = useMemo(() => {
    if (!exam || !fibGraded) return [];
    return exam.fillIn.map((q) => gradeFillInQuestion(q, fibAnswers[q.uid] ?? []));
  }, [exam, fibGraded, fibAnswers]);

  const mcqGrades: McqGradeResult[] = useMemo(() => {
    if (!exam || !mcqGraded) return [];
    return exam.mcq.map((q) => gradeMcqQuestion(q, mcqAnswers[q.uid] ?? null));
  }, [exam, mcqGraded, mcqAnswers]);

  const writingGrades: WritingGradeResult[] = useMemo(() => {
    if (!exam || !writingGraded) return [];
    return exam.writing.map((q) =>
      gradeWritingQuestion(q, writingAnswers[q.uid] ?? '', debugMode)
    );
  }, [exam, writingGraded, writingAnswers, debugMode]);

  const examSummary = useMemo(() => {
    if (!exam || step !== 'results') return null;
    return computeExamSummary(exam, fibGrades, mcqGrades, writingGrades);
  }, [exam, step, fibGrades, mcqGrades, writingGrades]);

  // Start a freshly generated exam
  const launchExam = useCallback((newExam: GeneratedExam) => {
    setExam(newExam);
    setFibAnswers({});
    setMcqAnswers({});
    setWritingAnswers({});
    setSkippedUids([]);
    setFibGraded(false);
    setMcqGraded(false);
    setWritingGraded(false);
    setElapsedSeconds(0);

    if (newExam.fillIn.length > 0) {
      setStep('fib');
    } else if (newExam.mcq.length > 0) {
      setStep('mcq');
    } else {
      setStep('writing');
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const handleStartExam = () => {
    if (selectedSheetIds.length === 0 || sheets.length === 0) return;
    const generated = buildExamFromSheets(sheets, selectedSheetIds);
    launchExam(generated);
  };

  const handleResumeProgress = () => {
    if (!savedProgress) return;
    setExam(savedProgress.exam);
    setFibAnswers(savedProgress.fibAnswers);
    setMcqAnswers(savedProgress.mcqAnswers);
    setWritingAnswers(savedProgress.writingAnswers);
    setFibGraded(savedProgress.fibGraded);
    setMcqGraded(savedProgress.mcqGraded);
    setWritingGraded(savedProgress.writingGraded);
    setSkippedUids(savedProgress.skippedUids);
    setElapsedSeconds(savedProgress.elapsedSeconds);
    setTimerEnabled(savedProgress.timerEnabled);
    setSelectedSheetIds(savedProgress.exam.selectedSheetIds);
    setStep(savedProgress.step);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleDiscardProgress = () => {
    clearSavedProgress();
    setSavedProgress(null);
  };

  const handleFinishExam = () => {
    if (!exam) return;
    const finalFibGrades = exam.fillIn.map((q) =>
      gradeFillInQuestion(q, fibAnswers[q.uid] ?? [])
    );
    const finalMcqGrades = exam.mcq.map((q) =>
      gradeMcqQuestion(q, mcqAnswers[q.uid] ?? null)
    );
    const finalWritingGrades = exam.writing.map((q) =>
      gradeWritingQuestion(q, writingAnswers[q.uid] ?? '', debugMode)
    );

    setFibGraded(true);
    setMcqGraded(true);
    setWritingGraded(true);

    const summary = computeExamSummary(
      exam,
      finalFibGrades,
      finalMcqGrades,
      finalWritingGrades
    );

    const sheetNameMap = new Map(sheets.map((s) => [s.sheetId, s.arabicTitle]));
    const entry: ExamHistoryEntry = {
      id: exam.id,
      date: new Date().toISOString(),
      sheetIds: exam.selectedSheetIds,
      sheetNames: exam.selectedSheetIds.map((id) => sheetNameMap.get(id) ?? id),
      totalScore: summary.totalScore,
      gradeLabel: summary.gradeLabel,
      fillInPct: summary.fillIn.percentage,
      mcqPct: summary.mcq.percentage,
      writingPct: summary.writing.percentage,
    };

    const updatedHistory = saveExamHistoryEntry(entry);
    setHistory(updatedHistory);
    clearSavedProgress();
    setSavedProgress(null);
    setStep('results');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleRetryWrong = () => {
    if (!exam) return;
    const wrongFib = new Set(fibGrades.filter((g) => !g.isFullyCorrect).map((g) => g.uid));
    const wrongMcq = new Set(mcqGrades.filter((g) => !g.isCorrect).map((g) => g.uid));
    const wrongWriting = new Set(
      writingGrades.filter((g) => g.status !== 'correct').map((g) => g.uid)
    );
    const retryExam = buildRetryWrongExam(exam, wrongFib, wrongMcq, wrongWriting);
    launchExam(retryExam);
  };

  const handleNewExamSameSheets = () => {
    const ids = exam?.selectedSheetIds ?? selectedSheetIds;
    if (ids.length === 0 || sheets.length === 0) {
      setStep('sheets');
      return;
    }
    const generated = buildExamFromSheets(sheets, ids);
    launchExam(generated);
  };

  const hasWrongQuestions = useMemo(() => {
    return (
      fibGrades.some((g) => !g.isFullyCorrect) ||
      mcqGrades.some((g) => !g.isCorrect) ||
      writingGrades.some((g) => g.status !== 'correct')
    );
  }, [fibGrades, mcqGrades, writingGrades]);

  const progressPercent = useMemo(() => {
    if (step === 'welcome') return 0;
    if (step === 'sheets') return 12;
    if (step === 'fib') return fibGraded ? 42 : 28;
    if (step === 'mcq') return mcqGraded ? 72 : 58;
    if (step === 'writing') return writingGraded ? 94 : 82;
    return 100;
  }, [step, fibGraded, mcqGraded, writingGraded]);

  const stepLabel = useMemo(() => {
    switch (step) {
      case 'welcome':
        return '';
      case 'sheets':
        return 'اختيار الشيتات';
      case 'fib':
        return 'أكمل الفراغ';
      case 'mcq':
        return 'الاختيار من متعدد';
      case 'writing':
        return 'الأسئلة الكتابية';
      case 'results':
        return 'النتيجة النهائية';
    }
  }, [step]);

  return (
    <div className="min-h-dvh bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <HeaderBar
        progressPercent={progressPercent}
        stepLabel={stepLabel}
        showTimerToggle={isExamActive}
        timerEnabled={timerEnabled}
        elapsedSeconds={elapsedSeconds}
        onToggleTimer={() => setTimerEnabled((prev) => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onGoHome={step !== 'welcome' ? () => setStep('welcome') : undefined}
      />

      <OfflineIndicator />

      {(step === 'welcome' || step === 'sheets') && (
        <WelcomeScreen
          mode={step}
          onEnterSelection={() => setStep('sheets')}
          sheets={sheets}
          failedSheets={failedSheets}
          isLoading={isLoadingSheets}
          onRetryLoad={fetchAllData}
          selectedSheetIds={selectedSheetIds}
          onToggleSheet={(id) =>
            setSelectedSheetIds((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            )
          }
          onToggleSelectAll={() => {
            const allIds = sheets.map((s) => s.sheetId);
            const allSelected =
              allIds.length > 0 && allIds.every((id) => selectedSheetIds.includes(id));
            setSelectedSheetIds(allSelected ? [] : allIds);
          }}
          onStartExam={handleStartExam}
          history={history}
          onClearHistory={() => {
            clearExamHistory();
            setHistory([]);
          }}
          savedProgress={savedProgress}
          onResumeProgress={handleResumeProgress}
          onDiscardProgress={handleDiscardProgress}
        />
      )}

      {step === 'fib' && exam && (
        <FillInBlankSection
          questions={exam.fillIn}
          answerBank={exam.answerBank}
          answers={fibAnswers}
          skippedUids={skippedSet}
          isGraded={fibGraded}
          gradeResults={fibGrades}
          hasNextMcq={exam.mcq.length > 0}
          hasNextWriting={exam.writing.length > 0}
          onChangeBlank={(uid, blankIndex, value) => {
            setFibAnswers((prev) => {
              const curr = [...(prev[uid] ?? [])];
              curr[blankIndex] = value;
              return {...prev, [uid]: curr};
            });
          }}
          onSkipQuestion={(uid) =>
            setSkippedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]))
          }
          onGrade={() => {
            setFibGraded(true);
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
          onNextSection={() => {
            if (exam.mcq.length > 0) {
              setStep('mcq');
              window.scrollTo({top: 0, behavior: 'smooth'});
            } else if (exam.writing.length > 0) {
              setStep('writing');
              window.scrollTo({top: 0, behavior: 'smooth'});
            } else {
              handleFinishExam();
            }
          }}
        />
      )}

      {step === 'mcq' && exam && (
        <McqSection
          questions={exam.mcq}
          answers={mcqAnswers}
          skippedUids={skippedSet}
          isGraded={mcqGraded}
          gradeResults={mcqGrades}
          hasNextWriting={exam.writing.length > 0}
          onSelectOption={(uid, key) =>
            setMcqAnswers((prev) => ({...prev, [uid]: key}))
          }
          onSkipQuestion={(uid) =>
            setSkippedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]))
          }
          onGrade={() => {
            setMcqGraded(true);
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
          onNextSection={() => {
            if (exam.writing.length > 0) {
              setStep('writing');
              window.scrollTo({top: 0, behavior: 'smooth'});
            } else {
              handleFinishExam();
            }
          }}
        />
      )}

      {step === 'writing' && exam && (
        <WritingSection
          questions={exam.writing}
          answers={writingAnswers}
          skippedUids={skippedSet}
          isGraded={writingGraded}
          gradeResults={writingGrades}
          debugMode={debugMode}
          onChangeAnswer={(uid, value) =>
            setWritingAnswers((prev) => ({...prev, [uid]: value}))
          }
          onSkipQuestion={(uid) =>
            setSkippedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]))
          }
          onGrade={() => {
            setWritingGraded(true);
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
          onFinishExam={handleFinishExam}
        />
      )}

      {step === 'results' && examSummary && (
        <ResultsScreen
          summary={examSummary}
          hasWrongQuestions={hasWrongQuestions}
          onRetryWrong={handleRetryWrong}
          onNewExamSameSheets={handleNewExamSameSheets}
          onChangeSheets={() => setStep('sheets')}
        />
      )}
    </div>
  );
}
