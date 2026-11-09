import { jsPDF } from 'jspdf'
import { MASTERED_THRESHOLD, NEEDS_ATTENTION_THRESHOLD, type StudentProgressReportData, type SubmoduleProgressRow } from '@/lib/queries/report'

const COLOR_MASTERED = '#2A9D8F'
const COLOR_NEEDS_REVIEW = '#E9A23B'
const COLOR_NEEDS_ATTENTION = '#D1495B'
const COLOR_NAVY = '#1F3A5F'
const COLOR_MUTED = '#6B7280'

function statusColor(status: SubmoduleProgressRow['status']): string {
  if (status === 'mastered') return COLOR_MASTERED
  if (status === 'needs-review') return COLOR_NEEDS_REVIEW
  if (status === 'needs-attention') return COLOR_NEEDS_ATTENTION
  return COLOR_MUTED
}

function statusLabel(status: SubmoduleProgressRow['status']): string {
  if (status === 'mastered') return 'Mastered'
  if (status === 'needs-review') return 'Needs review'
  if (status === 'needs-attention') return 'Needs attention'
  return 'No quiz yet'
}

function latestPercent(row: SubmoduleProgressRow): number | null {
  if (row.quizAttempts.length === 0) return null
  const latest = row.quizAttempts[row.quizAttempts.length - 1]
  return Math.round((latest.score / latest.total) * 100)
}

export function downloadStudentProgressReportPdf(studentName: string, data: StudentProgressReportData, filename: string, sectionName?: string | null) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const usableWidth = pageWidth - margin * 2
  let y = margin

  function footer() {
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(COLOR_MUTED)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' })
    }
  }

  function sectionHeading(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(COLOR_NAVY)
    doc.text(text.toUpperCase(), margin, y)
    y += 18
  }

  // ---- Title ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(COLOR_NAVY)
  doc.text(`${studentName} — Progress Report`, margin, y)
  y += 16
  if (sectionName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(COLOR_MUTED)
    doc.text(sectionName, margin, y)
    y += 10
  }
  doc.setDrawColor(COLOR_NAVY)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  // ---- Summary cards ----
  sectionHeading('Summary')
  const cardWidth = (usableWidth - 16) / 3
  const cards: { label: string; value: number; sub: string; color: string }[] = [
    { label: 'Mastered', value: data.counts.mastered, sub: `${Math.round(MASTERED_THRESHOLD * 100)}% or higher`, color: COLOR_MASTERED },
    { label: 'Needs review', value: data.counts.needsReview, sub: `${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}% to ${Math.round(MASTERED_THRESHOLD * 100) - 1}%`, color: COLOR_NEEDS_REVIEW },
    { label: 'Needs attention', value: data.counts.needsAttention, sub: `below ${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}%`, color: COLOR_NEEDS_ATTENTION },
  ]
  const cardTop = y
  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 8)
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(1)
    doc.rect(x, cardTop, cardWidth, 60)
    doc.setDrawColor(card.color)
    doc.setLineWidth(2.5)
    doc.line(x, cardTop, x + cardWidth, cardTop)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(card.label, x + cardWidth / 2, cardTop + 16, { align: 'center' })
    doc.setFontSize(20)
    doc.setTextColor(card.color)
    doc.text(String(card.value), x + cardWidth / 2, cardTop + 36, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLOR_MUTED)
    doc.text(card.sub, x + cardWidth / 2, cardTop + 50, { align: 'center' })
  })
  y = cardTop + 72

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(COLOR_MUTED)
  doc.text(`Status is based on the latest quiz score in each of the ${data.submodules.length} submodules.`, margin, y)
  y += 16

  // Overall summary paragraph — deterministic, built from already-computed facts (no AI).
  const lowestModule = data.moduleAverages.reduce((min, m) => (m.averagePercent < min.averagePercent ? m : min), data.moduleAverages[0])
  const highestModule = data.moduleAverages.reduce((max, m) => (m.averagePercent > max.averagePercent ? m : max), data.moduleAverages[0])
  const masteredNames = data.submodules.filter((s) => s.status === 'mastered').map((s) => s.title)
  const attentionNames = data.submodules.filter((s) => s.status === 'needs-attention').map((s) => s.title)
  const signsPercent = data.totalSigns > 0 ? Math.round((data.totalSignsViewed / data.totalSigns) * 100) : 0

  const summaryParts: string[] = []
  summaryParts.push(
    masteredNames.length > 0
      ? `A total of ${data.counts.mastered} submodule${data.counts.mastered === 1 ? '' : 's'} ${data.counts.mastered === 1 ? 'is' : 'are'} mastered, which ${data.counts.mastered === 1 ? 'is' : 'are'} ${masteredNames.join(' and ')}.`
      : 'No submodules are mastered yet.',
  )
  summaryParts.push(`A total of ${data.counts.needsReview} submodule${data.counts.needsReview === 1 ? '' : 's'} need${data.counts.needsReview === 1 ? 's' : ''} review.`)
  summaryParts.push(
    attentionNames.length > 0
      ? `The submodule${attentionNames.length === 1 ? '' : 's'} that need${attentionNames.length === 1 ? 's' : ''} attention ${attentionNames.length === 1 ? 'is' : 'are'} ${attentionNames.join(' and ')}.`
      : 'No submodules currently need attention.',
  )
  if (lowestModule && highestModule) {
    summaryParts.push(
      lowestModule.moduleTitle === highestModule.moduleTitle
        ? `${lowestModule.moduleTitle} has an average quiz score of ${lowestModule.averagePercent}%.`
        : `${lowestModule.moduleTitle} has the lowest average quiz score at ${lowestModule.averagePercent}%, while ${highestModule.moduleTitle} has the highest average quiz score at ${highestModule.averagePercent}%.`,
    )
  }
  summaryParts.push(`Overall, ${data.totalSignsViewed} out of ${data.totalSigns} total signs were viewed (${signsPercent}%).`)

  const summaryText = summaryParts.join(' ')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  const summaryLines = doc.splitTextToSize(summaryText, usableWidth - 16)
  const summaryBoxHeight = summaryLines.length * 12 + 16
  doc.setFillColor(245, 247, 250)
  doc.rect(margin, y, usableWidth, summaryBoxHeight, 'F')
  doc.setDrawColor(COLOR_NAVY)
  doc.setLineWidth(2.5)
  doc.line(margin, y, margin, y + summaryBoxHeight)
  doc.text(summaryLines, margin + 10, y + 16)
  y += summaryBoxHeight + 20

  // ---- Chart ----
  sectionHeading('Quiz performance by submodule')
  const bars: { label: string; score: number; total: number; status: SubmoduleProgressRow['status']; moduleTitle: string; attemptLabel?: string }[] = []
  data.submodules.forEach((sm) => {
    if (sm.quizAttempts.length === 0) return
    sm.quizAttempts.forEach((a, i) => {
      bars.push({
        label: sm.title,
        score: a.score,
        total: a.total,
        status: i === sm.quizAttempts.length - 1 ? sm.status : 'insufficient-data', // only the latest attempt's color reflects real status; earlier attempts shown neutral
        moduleTitle: sm.moduleTitle,
        attemptLabel: sm.quizAttempts.length > 1 ? `${i === 0 ? '1st' : i === 1 ? '2nd' : `${i + 1}th`}` : undefined,
      })
    })
  })

  const chartHeight = 170
  const chartTop = y
  const chartBottom = chartTop + chartHeight
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, chartTop, pageWidth - margin, chartTop)
  doc.line(margin, chartBottom, pageWidth - margin, chartBottom)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COLOR_MUTED);
  [0, 25, 50, 75, 100].forEach((pct) => {
    const yy = chartBottom - (pct / 100) * chartHeight
    doc.text(`${pct}%`, margin - 4, yy + 2, { align: 'right' })
    doc.setDrawColor(240, 240, 240)
    doc.line(margin, yy, pageWidth - margin, yy)
  })

  // threshold lines at the app's real thresholds (75% / 50%), dashed
  doc.setDrawColor(COLOR_MASTERED)
  doc.setLineDashPattern([3, 2], 0)
  const masteredY = chartBottom - MASTERED_THRESHOLD * chartHeight
  doc.line(margin, masteredY, pageWidth - margin, masteredY)
  doc.setDrawColor(COLOR_NEEDS_ATTENTION)
  const attentionY = chartBottom - NEEDS_ATTENTION_THRESHOLD * chartHeight
  doc.line(margin, attentionY, pageWidth - margin, attentionY)
  doc.setLineDashPattern([], 0)

  if (bars.length > 0) {
    const barAreaWidth = usableWidth
    const slot = barAreaWidth / bars.length
    const barWidth = Math.min(28, slot * 0.6)
    bars.forEach((bar, i) => {
      const percent = bar.score / bar.total
      const barHeight = percent * chartHeight
      const x = margin + i * slot + (slot - barWidth) / 2
      const barY = chartBottom - barHeight
      doc.setFillColor(statusColor(bar.status === 'insufficient-data' ? 'needs-review' : bar.status))
      doc.rect(x, barY, barWidth, barHeight, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(30, 30, 30)
      doc.text(`${bar.score}/${bar.total}`, x + barWidth / 2, barY - 3, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(COLOR_MUTED)
      const sublabel = bar.attemptLabel ? `${bar.label} (${bar.attemptLabel})` : bar.label
      const labelLines = doc.splitTextToSize(sublabel, slot)
      doc.text(labelLines, x + barWidth / 2, chartBottom + 10, { align: 'center' })
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(COLOR_MUTED)
    doc.text('No quiz attempts yet.', pageWidth / 2, chartTop + chartHeight / 2, { align: 'center' })
  }
  y = chartBottom + 28

  const multiAttempt = data.submodules.filter((s) => s.quizAttempts.length > 1)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(COLOR_MUTED)
  const captionText = multiAttempt.length > 0
    ? `Every quiz attempt is shown. ${multiAttempt.map((s) => `${s.title} had more than one attempt (${s.quizAttempts.length} attempts)`).join('; ')}.`
    : 'Every quiz attempt is shown.'
  const captionLines = doc.splitTextToSize(captionText, usableWidth)
  doc.text(captionLines, margin, y)

  // ---- Page 2: Detailed results table ----
  doc.addPage()
  y = margin

  sectionHeading('Detailed results')

  const cols = [
    { header: 'Submodule', width: 120 },
    { header: 'Signs viewed', width: 80 },
    { header: 'Practice', width: 80 },
    { header: 'Quiz attempts', width: 140 },
    { header: 'Latest quiz', width: 75 },
    { header: 'Status', width: usableWidth - 120 - 80 - 80 - 140 - 75 },
  ]
  function colX(i: number) {
    let x = margin
    for (let j = 0; j < i; j++) x += cols[j].width
    return x
  }
  const rowLineHeight = 11
  const rowPadding = 6

  function drawTableHeader() {
    doc.setFillColor(COLOR_NAVY)
    doc.rect(margin, y, usableWidth, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    cols.forEach((c, i) => doc.text(c.header, colX(i) + 6, y + 13))
    y += 20
  }
  function drawModuleRow(title: string) {
    doc.setFillColor(230, 234, 240)
    doc.rect(margin, y, usableWidth, 16, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COLOR_NAVY)
    doc.text(title, margin + 6, y + 11)
    y += 16
  }

  drawTableHeader()
  let currentModule: string | null = null
  for (const row of data.submodules) {
    if (row.moduleTitle !== currentModule) {
      if (y + 16 > pageHeight - margin) {
        doc.addPage()
        y = margin
        drawTableHeader()
      }
      drawModuleRow(row.moduleTitle)
      currentModule = row.moduleTitle
    }

    const quizText = row.quizAttempts.length > 0 ? row.quizAttempts.map((a) => `${a.score}/${a.total}`).join(', ') : 'None'
    const practiceText = row.practiceTotal > 0 ? `${row.practiceCorrect}/${row.practiceTotal}` : 'None'
    const latest = latestPercent(row)
    const latestText = latest !== null ? `${latest}%` : '—'

    const cells = [row.title, `${row.signsViewed}/${row.signsTotal}`, practiceText, quizText, latestText, statusLabel(row.status)]
    const wrapped = cells.map((cell, i) => doc.splitTextToSize(cell, cols[i].width - rowPadding * 2))
    const lines = Math.max(...wrapped.map((l) => l.length))
    const rowHeight = lines * rowLineHeight + 6

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawTableHeader()
      drawModuleRow(row.moduleTitle)
    }

    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    wrapped.forEach((lines, i) => {
      if (i === 1 && row.signsViewed < row.signsTotal) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else if (i === 2 && row.practiceTotal === 0) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else if (i === 4) doc.setTextColor(statusColor(row.status))
      else if (i === 5) doc.setTextColor(statusColor(row.status))
      else doc.setTextColor(30, 30, 30)
      doc.text(lines, colX(i) + rowPadding, y + 10)
      doc.setTextColor(30, 30, 30)
    })
    y += rowHeight
  }

  y += 10
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(COLOR_MUTED)
  doc.text('Status and percentage come from the latest quiz attempt. Red text marks signs not fully viewed or no practice attempts.', margin, y)
  y += 20

  // ---- Key findings ----
  if (y + 60 > pageHeight - margin) {
    doc.addPage()
    y = margin
  }
  sectionHeading('Key findings')

  function bulletList(heading: string, items: string[]) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text(heading, margin, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    for (const item of items) {
      const lines = doc.splitTextToSize(`•  ${item}`, usableWidth - 10)
      if (y + lines.length * 11 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(lines, margin + 6, y)
      y += lines.length * 11 + 4
    }
    y += 6
  }

  const strengths: string[] = []
  if (masteredNames.length > 0) {
    const masteredList = data.submodules.filter((s) => s.status === 'mastered')
    strengths.push(`Mastered quizzes: ${masteredList.map((s) => {
      const p = latestPercent(s)
      const latest = s.quizAttempts[s.quizAttempts.length - 1]
      return `${s.title} with score ${latest.score}/${latest.total} (${p}%)`
    }).join(' and ')}.`)
  }
  const fullyViewed = data.submodules.filter((s) => s.signsTotal > 0 && s.signsViewed === s.signsTotal)
  if (fullyViewed.length > 0) {
    strengths.push(`Submodules where all signs were viewed: ${fullyViewed.map((s) => `${s.title} (${s.signsViewed}/${s.signsTotal})`).join(', ')}.`)
  }
  if (strengths.length === 0) strengths.push('No notable strengths yet based on current data.')

  const concerns: string[] = []
  if (attentionNames.length > 0) {
    const attentionList = data.submodules.filter((s) => s.status === 'needs-attention')
    concerns.push(`Submodules that need attention: ${attentionList.map((s) => {
      const p = latestPercent(s)
      return `${s.title} with latest quiz score ${p}%, practice score ${s.practiceTotal > 0 ? `${s.practiceCorrect}/${s.practiceTotal}` : 'None'}, and signs viewed ${s.signsViewed}/${s.signsTotal}`
    }).join('; ')}.`)
  }
  const reviewList = data.submodules.filter((s) => s.status === 'needs-review')
  if (reviewList.length > 0) {
    concerns.push(`Quizzes needing review: ${reviewList.map((s) => {
      const latest = s.quizAttempts[s.quizAttempts.length - 1]
      return `${s.title} (${latest.score}/${latest.total})`
    }).join(', ')}.`)
  }
  const notFullyViewed = data.submodules.filter((s) => s.signsTotal > 0 && s.signsViewed < s.signsTotal)
  if (notFullyViewed.length > 0) {
    const totalUnviewed = notFullyViewed.reduce((sum, s) => sum + (s.signsTotal - s.signsViewed), 0)
    concerns.push(`Signs not fully viewed: ${notFullyViewed.length} submodule${notFullyViewed.length === 1 ? '' : 's'} incomplete, including ${notFullyViewed.map((s) => `${s.title} (${s.signsViewed}/${s.signsTotal}, ${s.signsTotal - s.signsViewed} sign${s.signsTotal - s.signsViewed === 1 ? '' : 's'} remaining)`).join(', ')}. Total unviewed signs count is ${totalUnviewed}.`)
  }
  const noPractice = data.submodules.filter((s) => s.practiceTotal === 0 && s.signsTotal > 0)
  if (noPractice.length > 0) {
    concerns.push(`Submodules with no practice attempts: ${noPractice.map((s) => s.title).join(', ')}.`)
  }
  if (concerns.length === 0) concerns.push('No areas of concern based on current data.')

  bulletList('Strengths', strengths)
  bulletList('Areas of Concern', concerns)

  footer()
  doc.save(filename)
}
