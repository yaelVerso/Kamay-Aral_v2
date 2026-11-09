import type { Module } from '@/content/types'

interface LearnProgressRow {
  submodule_id: string
  item_id: string
}

// Below this many combined practice+quiz answers, a topic's percentage is too
// noisy to show with any confidence — flagged as 'insufficient-data' instead
// of a raw (often extreme) percentage. A deliberately simple threshold in
// place of a proper mastery-tracking model (e.g. Bayesian Knowledge Tracing),
// which was evaluated and dropped as more complexity than this needs.
const MIN_ATTEMPTS_FOR_CONFIDENCE = 5
export const MASTERED_THRESHOLD = 0.75
export const NEEDS_ATTENTION_THRESHOLD = 0.5
/** An item below this ratio (within an already-confident topic) is called out by name. */
const WEAK_ITEM_THRESHOLD = 0.5

export type TopicStatus = 'mastered' | 'needs-review' | 'needs-attention' | 'insufficient-data'

export interface WeakItem {
  label: string
  correct: number
  total: number
}

export interface TopicReportData {
  submoduleId: string
  moduleTitle: string
  title: string
  percent: number
  attemptCount: number
  status: TopicStatus
  weakItems: WeakItem[]
  /** Plain-English, already-computed facts about change over time — 0-2 entries. */
  trend: string[]
}

interface AttemptRow {
  id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string | null
  started_at: string
}

interface AnswerRow {
  attempt_id: string
  item_id: string
  is_correct: boolean
}

interface PracticeAnswerRow {
  submodule_id: string
  item_id: string
  is_correct: boolean
  answered_at: string
}

/** First submitted quiz attempt vs the latest, only if there's more than one to compare. */
function computeQuizTrend(submoduleAttempts: AttemptRow[]): string | null {
  const submitted = submoduleAttempts
    .filter((a): a is AttemptRow & { total: number } => !!a.submitted_at && !!a.total)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
  if (submitted.length < 2) return null

  const first = submitted[0]
  const latest = submitted[submitted.length - 1]
  return `Quiz score went from ${first.score}/${first.total} (first attempt) to ${latest.score}/${latest.total} (latest attempt) across ${submitted.length} attempts.`
}

/** Splits practice answers chronologically in half and compares accuracy — needs enough volume for both halves to mean anything. */
function computePracticeTrend(submodulePractice: PracticeAnswerRow[]): string | null {
  if (submodulePractice.length < 6) return null

  const sorted = [...submodulePractice].sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime())
  const mid = Math.floor(sorted.length / 2)
  const early = sorted.slice(0, mid)
  const recent = sorted.slice(mid)
  const earlyPercent = Math.round((early.filter((a) => a.is_correct).length / early.length) * 100)
  const recentPercent = Math.round((recent.filter((a) => a.is_correct).length / recent.length) * 100)
  if (earlyPercent === recentPercent) return null

  return `Practice accuracy went from ${earlyPercent}% (earlier attempts) to ${recentPercent}% (recent attempts).`
}

/**
 * Plain arithmetic per-topic mastery — correct/total combining practice and
 * quiz answers, no model behind it. Topics the student hasn't touched at all
 * are omitted rather than shown as 0%.
 */
export function buildTopicReportData(
  modules: Module[],
  attempts: AttemptRow[],
  answers: AnswerRow[],
  practiceAnswers: PracticeAnswerRow[],
): TopicReportData[] {
  const results: TopicReportData[] = []

  for (const mod of modules) {
    for (const sm of mod.subModules) {
      const smAttempts = attempts.filter((a) => a.submodule_id === sm.id)
      const attemptIds = new Set(smAttempts.map((a) => a.id))
      const quizAnswers = answers.filter((a) => attemptIds.has(a.attempt_id))
      const practice = practiceAnswers.filter((p) => p.submodule_id === sm.id)
      const combined = [...quizAnswers, ...practice]
      if (combined.length === 0) continue

      const correct = combined.filter((a) => a.is_correct).length
      const total = combined.length
      const percent = Math.round((correct / total) * 100)

      const status: TopicStatus =
        total < MIN_ATTEMPTS_FOR_CONFIDENCE ? 'insufficient-data' :
        percent / 100 >= MASTERED_THRESHOLD ? 'mastered' :
        percent / 100 >= NEEDS_ATTENTION_THRESHOLD ? 'needs-review' :
        'needs-attention'

      const weakItems: WeakItem[] = []
      for (const item of sm.items) {
        const itemAnswers = combined.filter((a) => a.item_id === item.id)
        if (itemAnswers.length === 0) continue
        const itemCorrect = itemAnswers.filter((a) => a.is_correct).length
        if (itemCorrect / itemAnswers.length < WEAK_ITEM_THRESHOLD) {
          weakItems.push({ label: item.label, correct: itemCorrect, total: itemAnswers.length })
        }
      }

      const trend = [computeQuizTrend(smAttempts), computePracticeTrend(practice)]
        .filter((t): t is string => t !== null)

      results.push({ submoduleId: sm.id, moduleTitle: mod.title, title: sm.title, percent, attemptCount: total, status, weakItems, trend })
    }
  }

  return results
}

export interface ClassTopicSummary {
  moduleTitle: string
  title: string
  studentCount: number
  classAveragePercent: number
  needsAttentionStudents: string[]
}

export interface ClassReportData {
  topics: ClassTopicSummary[]
  /** Students flagged "needs attention" on 2+ topics — worth individual follow-up, not just a class-wide reteach. */
  studentsAcrossMultipleTopics: { name: string; topicCount: number }[]
}

/**
 * Aggregates each student's already-computed topic data (buildTopicReportData
 * output) into class-wide per-topic averages, without recomputing anything —
 * topics marked 'insufficient-data' for a given student are excluded from
 * the class average too, same reliability reasoning as the per-student report.
 */
export function buildClassReportData(
  perStudent: { studentName: string; topics: TopicReportData[] }[],
): ClassReportData {
  const bySubmodule = new Map<string, { moduleTitle: string; title: string; percents: number[]; needsAttentionNames: string[] }>()
  const needsAttentionCountByStudent = new Map<string, number>()

  for (const { studentName, topics } of perStudent) {
    for (const t of topics) {
      if (t.status === 'insufficient-data') continue

      let entry = bySubmodule.get(t.submoduleId)
      if (!entry) {
        entry = { moduleTitle: t.moduleTitle, title: t.title, percents: [], needsAttentionNames: [] }
        bySubmodule.set(t.submoduleId, entry)
      }
      entry.percents.push(t.percent)

      if (t.status === 'needs-attention') {
        entry.needsAttentionNames.push(studentName)
        needsAttentionCountByStudent.set(studentName, (needsAttentionCountByStudent.get(studentName) ?? 0) + 1)
      }
    }
  }

  const topicSummaries: ClassTopicSummary[] = [...bySubmodule.values()].map((e) => ({
    moduleTitle: e.moduleTitle,
    title: e.title,
    studentCount: e.percents.length,
    classAveragePercent: Math.round(e.percents.reduce((sum, p) => sum + p, 0) / e.percents.length),
    needsAttentionStudents: e.needsAttentionNames,
  }))

  const studentsAcrossMultipleTopics = [...needsAttentionCountByStudent.entries()]
    .filter(([, count]) => count >= 2)
    .map(([name, topicCount]) => ({ name, topicCount }))
    .sort((a, b) => b.topicCount - a.topicCount)

  return { topics: topicSummaries, studentsAcrossMultipleTopics }
}

export interface SubmoduleProgressRow {
  moduleTitle: string
  title: string
  signsViewed: number
  signsTotal: number
  practiceCorrect: number
  practiceTotal: number
  /** Every submitted quiz attempt, chronological — the sample report wants every attempt shown, not just the latest. */
  quizAttempts: { score: number; total: number }[]
  /** Status is based on the LATEST quiz attempt only (not combined practice+quiz, unlike buildTopicReportData's status). */
  status: TopicStatus
}

export interface ModuleAverage {
  moduleTitle: string
  averagePercent: number
}

export interface StudentProgressReportData {
  submodules: SubmoduleProgressRow[]
  moduleAverages: ModuleAverage[]
  totalSignsViewed: number
  totalSigns: number
  counts: { mastered: number; needsReview: number; needsAttention: number }
}

/**
 * Per-submodule breakdown for the "Student Progress Report" PDF — every
 * submodule in the given modules gets a row (even with zero activity), and
 * status/the latest-quiz percent come from the most recently submitted quiz
 * attempt only, matching how the report presents "latest quiz" to a teacher.
 */
export function buildStudentProgressReportData(
  modules: Module[],
  learnProgress: LearnProgressRow[],
  attempts: AttemptRow[],
  practiceAnswers: PracticeAnswerRow[],
): StudentProgressReportData {
  const submodules: SubmoduleProgressRow[] = []
  const moduleAverages: ModuleAverage[] = []
  let totalSignsViewed = 0
  let totalSigns = 0
  const counts = { mastered: 0, needsReview: 0, needsAttention: 0 }

  for (const mod of modules) {
    const modulePercents: number[] = []

    for (const sm of mod.subModules) {
      const signsTotal = sm.items.length
      const signsViewed = learnProgress.filter((r) => r.submodule_id === sm.id).length

      const practice = practiceAnswers.filter((p) => p.submodule_id === sm.id)
      const practiceCorrect = practice.filter((p) => p.is_correct).length
      const practiceTotal = practice.length

      const submitted = attempts
        .filter((a): a is AttemptRow & { score: number; total: number } => a.submodule_id === sm.id && !!a.submitted_at && a.score !== null && a.total !== null)
        .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      const quizAttempts = submitted.map((a) => ({ score: a.score, total: a.total }))

      let status: TopicStatus = 'insufficient-data'
      if (quizAttempts.length > 0) {
        const latest = quizAttempts[quizAttempts.length - 1]
        const latestPercent = latest.score / latest.total
        status = latestPercent >= MASTERED_THRESHOLD ? 'mastered' : latestPercent >= NEEDS_ATTENTION_THRESHOLD ? 'needs-review' : 'needs-attention'
        modulePercents.push(Math.round(latestPercent * 100))
        if (status === 'mastered') counts.mastered++
        else if (status === 'needs-review') counts.needsReview++
        else counts.needsAttention++
      }

      totalSignsViewed += signsViewed
      totalSigns += signsTotal

      submodules.push({ moduleTitle: mod.title, title: sm.title, signsViewed, signsTotal, practiceCorrect, practiceTotal, quizAttempts, status })
    }

    if (modulePercents.length > 0) {
      moduleAverages.push({
        moduleTitle: mod.title,
        averagePercent: Math.round(modulePercents.reduce((sum, p) => sum + p, 0) / modulePercents.length),
      })
    }
  }

  return { submodules, moduleAverages, totalSignsViewed, totalSigns, counts }
}

export interface SubmoduleClassSummary {
  moduleTitle: string
  title: string
  studentsWithQuizData: number
  totalStudents: number
  /** Average of each student's LATEST quiz percent in this submodule — null if nobody has taken it yet. */
  averageLatestPercent: number | null
  masteredCount: number
  needsReviewCount: number
  needsAttentionCount: number
  /** Count of students whose latest quiz here is below NEEDS_ATTENTION_THRESHOLD. */
  studentsBelow50: number
  signsTotal: number
  averageSignsViewed: number
  studentsWithIncompleteSigns: number
  studentsWithNoPractice: number
}

export interface ModuleClassSummary {
  moduleTitle: string
  submoduleCount: number
  /** Average of each student's per-module average (buildStudentProgressReportData's moduleAverages) — null if nobody has quiz data in this module. */
  averageLatestPercent: number | null
  /** Student count with per-module data, bucketed by that module average. */
  masteredCount: number
  needsReviewCount: number
  needsAttentionCount: number
  studentsWithData: number
  signsViewed: number
  signsTotal: number
}

export interface StudentOverallSummary {
  studentName: string
  /** One entry per module in class-wide module order, aligned for the heatmap — null where the student has no quiz data in that module. */
  moduleAverages: (number | null)[]
  /** Average of latest-quiz percent across every submodule with quiz data — null if the student hasn't taken any quiz. */
  overallPercent: number | null
  overallStatus: TopicStatus
  needsAttentionSubmodules: { title: string; score: string }[]
  retook: boolean
  retookAndImproved: boolean
  fullyViewedAllSubmodules: boolean
  noPracticeSubmodules: string[]
}

export interface ClassProgressReportData {
  sectionName: string
  totalStudents: number
  moduleOrder: string[]
  modules: ModuleClassSummary[]
  submodules: SubmoduleClassSummary[]
  students: StudentOverallSummary[]
  /** Student counts by OVERALL status (see StudentOverallSummary.overallStatus) — not submodule-completion counts. */
  counts: { mastered: number; needsReview: number; needsAttention: number }
  totalSignsViewed: number
  totalSigns: number
}

function bandStatus(percent: number): TopicStatus {
  return percent / 100 >= MASTERED_THRESHOLD ? 'mastered' : percent / 100 >= NEEDS_ATTENTION_THRESHOLD ? 'needs-review' : 'needs-attention'
}

/**
 * Aggregates each student's already-computed StudentProgressReportData
 * (buildStudentProgressReportData output) into section-wide per-module,
 * per-submodule, and per-student summaries, without recomputing anything
 * from raw rows — same "reuse, don't rederive" approach as buildClassReportData.
 * Every student has exactly one row per submodule already (even with zero
 * activity), so there's no "missing row" case to special-case here.
 */
export function buildClassProgressReportData(
  sectionName: string,
  modules: Module[],
  perStudent: { studentName: string; data: StudentProgressReportData }[],
): ClassProgressReportData {
  const totalStudents = perStudent.length
  const moduleOrder = modules.map((m) => m.title)

  const bySubmodule = new Map<string, { moduleTitle: string; title: string; signsTotal: number; percents: number[]; mastered: number; needsReview: number; needsAttention: number; below50: number; signsViewedSum: number; incompleteSigns: number; noPractice: number }>()
  const byModule = new Map<string, { percents: number[]; mastered: number; needsReview: number; needsAttention: number; signsViewed: number; signsTotal: number }>()

  const counts = { mastered: 0, needsReview: 0, needsAttention: 0 }
  let totalSignsViewed = 0
  let totalSigns = 0

  const students: StudentOverallSummary[] = perStudent.map(({ studentName, data }) => {
    totalSignsViewed += data.totalSignsViewed
    totalSigns += data.totalSigns

    const allLatestPercents: number[] = []
    const needsAttentionSubmodules: { title: string; score: string }[] = []
    const noPracticeSubmodules: string[] = []
    let fullyViewedAllSubmodules = true
    let hasAnySubmoduleWithSigns = false
    let retook = false
    let retookAndImproved = false

    for (const sm of data.submodules) {
      const smKey = `${sm.moduleTitle}::${sm.title}`
      let smEntry = bySubmodule.get(smKey)
      if (!smEntry) {
        smEntry = { moduleTitle: sm.moduleTitle, title: sm.title, signsTotal: sm.signsTotal, percents: [], mastered: 0, needsReview: 0, needsAttention: 0, below50: 0, signsViewedSum: 0, incompleteSigns: 0, noPractice: 0 }
        bySubmodule.set(smKey, smEntry)
      }
      smEntry.signsViewedSum += sm.signsViewed
      if (sm.signsTotal > 0) {
        hasAnySubmoduleWithSigns = true
        if (sm.signsViewed < sm.signsTotal) {
          smEntry.incompleteSigns++
          fullyViewedAllSubmodules = false
        }
        if (sm.practiceTotal === 0) {
          smEntry.noPractice++
          noPracticeSubmodules.push(sm.title)
        }
      }

      if (sm.quizAttempts.length > 0) {
        const latest = sm.quizAttempts[sm.quizAttempts.length - 1]
        const latestPercent = Math.round((latest.score / latest.total) * 100)
        smEntry.percents.push(latestPercent)
        allLatestPercents.push(latestPercent)
        if (sm.status === 'mastered') smEntry.mastered++
        else if (sm.status === 'needs-review') smEntry.needsReview++
        else if (sm.status === 'needs-attention') { smEntry.needsAttention++; smEntry.below50++ }

        if (latestPercent / 100 < NEEDS_ATTENTION_THRESHOLD) {
          needsAttentionSubmodules.push({ title: sm.title, score: `${latest.score}/${latest.total}` })
        }

        if (sm.quizAttempts.length > 1) {
          retook = true
          const first = sm.quizAttempts[0]
          if (latest.score / latest.total > first.score / first.total) retookAndImproved = true
        }
      }
    }

    const moduleAverages = moduleOrder.map((title) => {
      const found = data.moduleAverages.find((m) => m.moduleTitle === title)
      const percent = found?.averagePercent ?? null

      let modEntry = byModule.get(title)
      if (!modEntry) {
        modEntry = { percents: [], mastered: 0, needsReview: 0, needsAttention: 0, signsViewed: 0, signsTotal: 0 }
        byModule.set(title, modEntry)
      }
      for (const sm of data.submodules) {
        if (sm.moduleTitle === title) {
          modEntry.signsViewed += sm.signsViewed
          modEntry.signsTotal += sm.signsTotal
        }
      }
      if (percent !== null) {
        modEntry.percents.push(percent)
        const status = bandStatus(percent)
        if (status === 'mastered') modEntry.mastered++
        else if (status === 'needs-review') modEntry.needsReview++
        else modEntry.needsAttention++
      }

      return percent
    })

    const overallPercent = allLatestPercents.length > 0
      ? Math.round(allLatestPercents.reduce((sum, p) => sum + p, 0) / allLatestPercents.length)
      : null
    const overallStatus: TopicStatus = overallPercent === null ? 'insufficient-data' : bandStatus(overallPercent)
    if (overallStatus === 'mastered') counts.mastered++
    else if (overallStatus === 'needs-review') counts.needsReview++
    else if (overallStatus === 'needs-attention') counts.needsAttention++

    return {
      studentName,
      moduleAverages,
      overallPercent,
      overallStatus,
      needsAttentionSubmodules,
      retook,
      retookAndImproved,
      fullyViewedAllSubmodules: hasAnySubmoduleWithSigns && fullyViewedAllSubmodules,
      noPracticeSubmodules,
    }
  })

  const submodules: SubmoduleClassSummary[] = [...bySubmodule.values()].map((e) => ({
    moduleTitle: e.moduleTitle,
    title: e.title,
    studentsWithQuizData: e.percents.length,
    totalStudents,
    averageLatestPercent: e.percents.length > 0 ? Math.round(e.percents.reduce((sum, p) => sum + p, 0) / e.percents.length) : null,
    masteredCount: e.mastered,
    needsReviewCount: e.needsReview,
    needsAttentionCount: e.needsAttention,
    studentsBelow50: e.below50,
    signsTotal: e.signsTotal,
    averageSignsViewed: totalStudents > 0 ? Math.round((e.signsViewedSum / totalStudents) * 10) / 10 : 0,
    studentsWithIncompleteSigns: e.incompleteSigns,
    studentsWithNoPractice: e.noPractice,
  }))

  const moduleSummaries: ModuleClassSummary[] = moduleOrder.map((title) => {
    const mod = modules.find((m) => m.title === title)
    const e = byModule.get(title)
    return {
      moduleTitle: title,
      submoduleCount: mod?.subModules.length ?? 0,
      averageLatestPercent: e && e.percents.length > 0 ? Math.round(e.percents.reduce((sum, p) => sum + p, 0) / e.percents.length) : null,
      masteredCount: e?.mastered ?? 0,
      needsReviewCount: e?.needsReview ?? 0,
      needsAttentionCount: e?.needsAttention ?? 0,
      studentsWithData: e?.percents.length ?? 0,
      signsViewed: e?.signsViewed ?? 0,
      signsTotal: e?.signsTotal ?? 0,
    }
  })

  return { sectionName, totalStudents, moduleOrder, modules: moduleSummaries, submodules, students, counts, totalSignsViewed, totalSigns }
}
