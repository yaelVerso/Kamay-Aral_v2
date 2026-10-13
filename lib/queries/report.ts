import type { Module } from '@/content/types'

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
