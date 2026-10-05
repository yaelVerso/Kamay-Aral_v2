import { gemini, GEMINI_REPORT_MODEL } from '@/lib/gemini'
import type { ClassReportData } from '@/lib/queries/report'

function groupByModule(topics: ClassReportData['topics']): Map<string, ClassReportData['topics']> {
  const map = new Map<string, ClassReportData['topics']>()
  for (const t of topics) {
    const list = map.get(t.moduleTitle)
    if (list) list.push(t)
    else map.set(t.moduleTitle, [t])
  }
  return map
}

function buildPrompt(sectionName: string, data: ClassReportData): string {
  const moduleBlocks = [...groupByModule(data.topics)].map(([moduleTitle, topicsInModule]) => {
    const lines = topicsInModule.map((t) => {
      const flagged = t.needsAttentionStudents.length > 0
        ? ` Needs attention: ${t.needsAttentionStudents.join(', ')}.`
        : ''
      return `  - ${t.title}: class average ${t.classAveragePercent}% across ${t.studentCount} student(s).${flagged}`
    }).join('\n')
    return `${moduleTitle} module:\n${lines}`
  }).join('\n\n')

  const multiTopicLine = data.studentsAcrossMultipleTopics.length > 0
    ? data.studentsAcrossMultipleTopics.map((s) => `${s.name} (needs attention on ${s.topicCount} topics)`).join(', ')
    : 'None — no student stands out across multiple topics.'

  return `You are summarizing a class's sign-language practice and quiz performance for their teacher.

Section: ${sectionName}
Per-module, per-topic class data (combined practice + quiz accuracy, averaged across students):
${moduleBlocks}

Students flagged as needing attention on 2 or more topics: ${multiTopicLine}

Write a brief report for the teacher, structured exactly like this:

Overall Summary
<1-2 sentence overall summary: which topics the class as a whole is strong/weak in, anything urgent>

<Module Name> module
- <1-2 sentence interpretation per topic, naming students only where listed as needing attention above>

(repeat the "<Module Name> module" heading + bullet list for every module that has data above, in the same order given)

Students Needing Individual Attention
<name the students flagged above across multiple topics, or state plainly that none stand out if the list says so>

Rules: do not invent any number, student name, module, or topic not listed above. Always write each student's label in full on its own, e.g. "Student 1 and Student 2" — never shorten to "Students 1 and 2" or combine labels. Keep it concise, plain text only, no tables or markdown formatting (no #, *, or **).`
}

/**
 * Same narrator-not-calculator role as generateStudentReport, one level up —
 * turns buildClassReportData's already-computed class averages into
 * teacher-facing prose. Never computes or decides anything itself.
 */
export async function generateClassReport(sectionName: string, data: ClassReportData): Promise<string> {
  if (data.topics.length === 0) {
    return `No students in ${sectionName} have completed any practice or quiz activity yet — nothing to report on.`
  }

  const model = gemini.getGenerativeModel({ model: GEMINI_REPORT_MODEL })
  const result = await model.generateContent(buildPrompt(sectionName, data))
  return result.response.text()
}
