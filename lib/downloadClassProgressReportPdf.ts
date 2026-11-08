import { jsPDF } from 'jspdf'
import { MASTERED_THRESHOLD, NEEDS_ATTENTION_THRESHOLD, type ClassProgressReportData } from '@/lib/queries/report'

const COLOR_MASTERED = '#2A9D8F'
const COLOR_NEEDS_REVIEW = '#E9A23B'
const COLOR_NEEDS_ATTENTION = '#D1495B'
const COLOR_NAVY = '#1F3A5F'
const COLOR_MUTED = '#6B7280'

function averageColor(percent: number | null): string {
  if (percent === null) return COLOR_MUTED
  if (percent / 100 >= MASTERED_THRESHOLD) return COLOR_MASTERED
  if (percent / 100 >= NEEDS_ATTENTION_THRESHOLD) return COLOR_NEEDS_REVIEW
  return COLOR_NEEDS_ATTENTION
}

export function downloadClassProgressReportPdf(data: ClassProgressReportData, filename: string) {
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
  doc.text(`${data.sectionName} — Class Progress Report`, margin, y)
  y += 10
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
  doc.text(`Counts are totaled across ${data.totalStudents} student${data.totalStudents === 1 ? '' : 's'} and ${data.submodules.length} submodules, based on each student's latest quiz score.`, margin, y)
  y += 16

  // Overall summary paragraph — deterministic, built from already-computed facts (no AI).
  const withData = data.submodules.filter((s) => s.averageLatestPercent !== null)
  const lowest = withData.reduce((min, s) => (s.averageLatestPercent! < min.averageLatestPercent! ? s : min), withData[0])
  const highest = withData.reduce((max, s) => (s.averageLatestPercent! > max.averageLatestPercent! ? s : max), withData[0])
  const strugglingSubmodules = data.submodules.filter((s) => s.needsAttentionCount > 0).map((s) => s.title)
  const signsPercent = data.totalSigns > 0 ? Math.round((data.totalSignsViewed / data.totalSigns) * 100) : 0

  const summaryParts: string[] = []
  summaryParts.push(
    `Across ${data.totalStudents} student${data.totalStudents === 1 ? '' : 's'}, ${data.counts.mastered} submodule completion${data.counts.mastered === 1 ? '' : 's'} ${data.counts.mastered === 1 ? 'is' : 'are'} mastered, ${data.counts.needsReview} need${data.counts.needsReview === 1 ? 's' : ''} review, and ${data.counts.needsAttention} need${data.counts.needsAttention === 1 ? 's' : ''} attention.`,
  )
  summaryParts.push(
    strugglingSubmodules.length > 0
      ? `Submodule${strugglingSubmodules.length === 1 ? '' : 's'} with at least one student needing attention: ${strugglingSubmodules.join(', ')}.`
      : 'No submodule currently has a student needing attention.',
  )
  if (lowest && highest) {
    summaryParts.push(
      lowest.title === highest.title
        ? `${lowest.title} has a class average latest-quiz score of ${lowest.averageLatestPercent}%.`
        : `${lowest.title} has the lowest class average latest-quiz score at ${lowest.averageLatestPercent}%, while ${highest.title} has the highest at ${highest.averageLatestPercent}%.`,
    )
  }
  summaryParts.push(`Overall, ${signsPercent}% of all assignable signs have been viewed across the section.`)

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

  // ---- Chart: class average latest-quiz score per submodule ----
  sectionHeading('Class average quiz score by submodule')
  const bars = data.submodules.filter((s) => s.averageLatestPercent !== null)

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

  doc.setDrawColor(COLOR_MASTERED)
  doc.setLineDashPattern([3, 2], 0)
  const masteredY = chartBottom - MASTERED_THRESHOLD * chartHeight
  doc.line(margin, masteredY, pageWidth - margin, masteredY)
  doc.setDrawColor(COLOR_NEEDS_ATTENTION)
  const attentionY = chartBottom - NEEDS_ATTENTION_THRESHOLD * chartHeight
  doc.line(margin, attentionY, pageWidth - margin, attentionY)
  doc.setLineDashPattern([], 0)

  if (bars.length > 0) {
    const slot = usableWidth / bars.length
    const barWidth = Math.min(28, slot * 0.6)
    bars.forEach((bar, i) => {
      const percent = bar.averageLatestPercent! / 100
      const barHeight = percent * chartHeight
      const x = margin + i * slot + (slot - barWidth) / 2
      const barY = chartBottom - barHeight
      doc.setFillColor(averageColor(bar.averageLatestPercent))
      doc.rect(x, barY, barWidth, barHeight, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(30, 30, 30)
      doc.text(`${bar.averageLatestPercent}%`, x + barWidth / 2, barY - 3, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(COLOR_MUTED)
      const labelLines = doc.splitTextToSize(bar.title, slot)
      doc.text(labelLines, x + barWidth / 2, chartBottom + 10, { align: 'center' })
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(COLOR_MUTED)
    doc.text('No quiz attempts yet.', pageWidth / 2, chartTop + chartHeight / 2, { align: 'center' })
  }
  y = chartBottom + 28

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(COLOR_MUTED)
  doc.text('Each bar is the class average of every student’s latest quiz score in that submodule. Submodules nobody has attempted are omitted.', margin, y)

  // ---- Page 2: Per-submodule detailed table ----
  doc.addPage()
  y = margin

  sectionHeading('Submodule breakdown')

  const cols = [
    { header: 'Submodule', width: 160 },
    { header: 'Attempted', width: 80 },
    { header: 'Class avg', width: 70 },
    { header: 'Mastered', width: 75 },
    { header: 'Needs review', width: 85 },
    { header: 'Needs attention', width: usableWidth - 160 - 80 - 70 - 75 - 85 },
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

    const avgText = row.averageLatestPercent !== null ? `${row.averageLatestPercent}%` : '—'
    const cells = [
      row.title,
      `${row.studentsWithQuizData}/${row.totalStudents}`,
      avgText,
      String(row.masteredCount),
      String(row.needsReviewCount),
      String(row.needsAttentionCount),
    ]
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
      if (i === 2) doc.setTextColor(averageColor(row.averageLatestPercent))
      else if (i === 5 && row.needsAttentionCount > 0) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else doc.setTextColor(30, 30, 30)
      doc.text(lines, colX(i) + rowPadding, y + 10)
      doc.setTextColor(30, 30, 30)
    })
    y += rowHeight
  }

  y += 20

  // ---- Per-student summary ----
  if (y + 60 > pageHeight - margin) {
    doc.addPage()
    y = margin
  }
  sectionHeading('Per-student summary')

  const studentCols = [
    { header: 'Student', width: 170 },
    { header: 'Mastered', width: 75 },
    { header: 'Needs review', width: 90 },
    { header: 'Needs attention', width: 95 },
    { header: 'Signs viewed', width: usableWidth - 170 - 75 - 90 - 95 },
  ]
  function studentColX(i: number) {
    let x = margin
    for (let j = 0; j < i; j++) x += studentCols[j].width
    return x
  }
  function drawStudentHeader() {
    doc.setFillColor(COLOR_NAVY)
    doc.rect(margin, y, usableWidth, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    studentCols.forEach((c, i) => doc.text(c.header, studentColX(i) + 6, y + 13))
    y += 20
  }

  drawStudentHeader()
  const sortedStudents = [...data.students].sort((a, b) => a.studentName.localeCompare(b.studentName))
  for (const s of sortedStudents) {
    const cells = [s.studentName, String(s.masteredCount), String(s.needsReviewCount), String(s.needsAttentionCount), `${s.signsViewed}/${s.signsTotal}`]
    const wrapped = cells.map((cell, i) => doc.splitTextToSize(cell, studentCols[i].width - rowPadding * 2))
    const lines = Math.max(...wrapped.map((l) => l.length))
    const rowHeight = lines * rowLineHeight + 6

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawStudentHeader()
    }

    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    wrapped.forEach((lines, i) => {
      if (i === 3 && s.needsAttentionCount > 0) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else doc.setTextColor(30, 30, 30)
      doc.text(lines, studentColX(i) + rowPadding, y + 10)
      doc.setTextColor(30, 30, 30)
    })
    y += rowHeight
  }

  footer()
  doc.save(filename)
}
