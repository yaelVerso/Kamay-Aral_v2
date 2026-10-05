import { gemini, GEMINI_REPORT_MODEL } from '@/lib/gemini'
import type { TopicReportData, TopicStatus } from '@/lib/queries/report'

const STATUS_LABEL: Record<TopicStatus, string> = {
  mastered: 'Mastered',
  'needs-review': 'Needs Review',
  'needs-attention': 'Needs Attention',
  'insufficient-data': 'Not enough data yet',
}

function groupByModule(topics: TopicReportData[]): Map<string, TopicReportData[]> {
  const map = new Map<string, TopicReportData[]>()
  for (const t of topics) {
    const list = map.get(t.moduleTitle)
    if (list) list.push(t)
    else map.set(t.moduleTitle, [t])
  }
  return map
}

function buildPrompt(topics: TopicReportData[]): string {
  const moduleBlocks = [...groupByModule(topics)].map(([moduleTitle, topicsInModule]) => {
    const lines = topicsInModule.map((t) => {
      const weak = t.weakItems.length > 0
        ? ` Weak signs: ${t.weakItems.map((w) => `${w.label} (${w.correct}/${w.total} correct)`).join(', ')}.`
        : ''
      const trend = t.trend.length > 0 ? ` ${t.trend.join(' ')}` : ''
      return `  - ${t.title}: ${t.percent}% (${t.attemptCount} attempts, ${STATUS_LABEL[t.status]}).${weak}${trend}`
    }).join('\n')
    return `${moduleTitle} module:\n${lines}`
  }).join('\n\n')

  return `You are summarizing a student's sign-language practice and quiz data for their teacher.

Per-module, per-topic data (combined practice + quiz accuracy):
${moduleBlocks}

Write a brief report for the teacher, structured exactly like this:

Overall Summary
<1-2 sentence overall summary: strongest/weakest area, anything urgent>

<Module Name> module
- <1-2 sentence interpretation for each topic in that module, naming specific weak signs only where listed above, and mentioning improvement/decline only where a trend is explicitly given above>

(repeat the "<Module Name> module" heading + bullet list for every module that has data above, in the same order given)

Rules: do not invent any number, sign name, module, or topic not listed above. Topics marked "Not enough data yet" must be described as preliminary, not judged as good or bad. Keep it concise, plain text only, no tables or markdown formatting (no #, *, or **).`
}

/**
 * Turns already-computed, trusted numbers into teacher-facing prose. Never
 * computes or decides anything itself — see buildTopicReportData for the
 * actual (non-AI) assessment math this narrates.
 */
export async function generateStudentReport(topics: TopicReportData[]): Promise<string> {
  if (topics.length === 0) {
    return `No practice or quiz activity yet — nothing to report on.`
  }

  const model = gemini.getGenerativeModel({ model: GEMINI_REPORT_MODEL })
  const result = await model.generateContent(buildPrompt(topics))
  return result.response.text()
}
