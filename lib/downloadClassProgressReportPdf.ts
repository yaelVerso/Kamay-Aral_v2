import { jsPDF } from 'jspdf'
import { MASTERED_THRESHOLD, NEEDS_ATTENTION_THRESHOLD, type ClassProgressReportData } from '@/lib/queries/report'

const COLOR_MASTERED = '#2A9D8F'
const COLOR_NEEDS_REVIEW = '#E9A23B'
const COLOR_NEEDS_ATTENTION = '#D1495B'
const COLOR_NAVY = '#1F3A5F'
const COLOR_MUTED = '#6B7280'
const LIGHT_MASTERED = '#D7F0EC'
const LIGHT_NEEDS_REVIEW = '#FBECD3'
const LIGHT_NEEDS_ATTENTION = '#F8D7DC'
const LIGHT_MUTED = '#F3F4F6'

function bandColor(percent: number | null): string {
  if (percent === null) return COLOR_MUTED
  if (percent / 100 >= MASTERED_THRESHOLD) return COLOR_MASTERED
  if (percent / 100 >= NEEDS_ATTENTION_THRESHOLD) return COLOR_NEEDS_REVIEW
  return COLOR_NEEDS_ATTENTION
}

function bandLightColor(percent: number | null): string {
  if (percent === null) return LIGHT_MUTED
  if (percent / 100 >= MASTERED_THRESHOLD) return LIGHT_MASTERED
  if (percent / 100 >= NEEDS_ATTENTION_THRESHOLD) return LIGHT_NEEDS_REVIEW
  return LIGHT_NEEDS_ATTENTION
}

function bandLabel(percent: number | null): string {
  if (percent === null) return 'No data'
  if (percent / 100 >= MASTERED_THRESHOLD) return 'Mastered'
  if (percent / 100 >= NEEDS_ATTENTION_THRESHOLD) return 'Needs review'
  return 'Needs attention'
}

export function downloadClassProgressReportPdf(data: ClassProgressReportData, filename: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 43
  const usableWidth = pageWidth - margin * 2
  let y = margin

  function footer() {
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(COLOR_MUTED)
      doc.text(`Page ${i}`, pageWidth - margin, pageHeight - 20, { align: 'right' })
    }
  }

  function sectionHeading(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(COLOR_NAVY)
    doc.text(text.toUpperCase(), margin, y)
    y += 18
  }

  function caption(text: string) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(COLOR_MUTED)
    const lines = doc.splitTextToSize(text, usableWidth)
    doc.text(lines, margin, y)
    y += lines.length * 10 + 8
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // ---- Title ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(COLOR_NAVY)
  doc.text(`${data.sectionName} — Section Progress Report`, margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(COLOR_MUTED)
  doc.text(`${data.totalStudents} students | ${data.modules.length} modules | ${data.submodules.length} submodules`, margin, y)
  y += 10
  doc.setDrawColor(COLOR_NAVY)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  // ---- Summary cards ----
  sectionHeading('Summary')
  const cardWidth = (usableWidth - 16) / 3
  const cards: { label: string; value: number; sub: string; color: string }[] = [
    { label: 'Mastered', value: data.counts.mastered, sub: `${Math.round(MASTERED_THRESHOLD * 100)}% or higher overall`, color: COLOR_MASTERED },
    { label: 'Needs review', value: data.counts.needsReview, sub: `${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}% to ${Math.round(MASTERED_THRESHOLD * 100) - 1}% overall`, color: COLOR_NEEDS_REVIEW },
    { label: 'Needs attention', value: data.counts.needsAttention, sub: `below ${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}% overall`, color: COLOR_NEEDS_ATTENTION },
  ]
  const cardTop = y
  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 8)
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(1)
    doc.rect(x, cardTop, cardWidth, 56)
    doc.setDrawColor(card.color)
    doc.setLineWidth(2.5)
    doc.line(x, cardTop, x + cardWidth, cardTop)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(card.label, x + cardWidth / 2, cardTop + 15, { align: 'center' })
    doc.setFontSize(19)
    doc.setTextColor(card.color)
    doc.text(String(card.value), x + cardWidth / 2, cardTop + 34, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COLOR_MUTED)
    doc.text(card.sub, x + cardWidth / 2, cardTop + 47, { align: 'center' })
  })
  y = cardTop + 64

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(COLOR_MUTED)
  const noData = data.totalStudents - (data.counts.mastered + data.counts.needsReview + data.counts.needsAttention)
  doc.text(
    `A student's status is the average of their latest quiz score in every submodule they have attempted.${noData > 0 ? ` ${noData} student${noData === 1 ? '' : 's'} have not taken a quiz yet and are not counted above.` : ''}`,
    margin, y,
  )
  y += 18

  // ---- Overall Summary paragraph ----
  const modulesWithData = data.modules.filter((m) => m.averageLatestPercent !== null)
  const highestModule = modulesWithData.reduce((max, m) => (m.averageLatestPercent! > max.averageLatestPercent! ? m : max), modulesWithData[0])
  const lowestModule = modulesWithData.reduce((min, m) => (m.averageLatestPercent! < min.averageLatestPercent! ? m : min), modulesWithData[0])
  const submodulesWithData = data.submodules.filter((s) => s.averageLatestPercent !== null)
  const highestSubmodule = submodulesWithData.reduce((max, s) => (s.averageLatestPercent! > max.averageLatestPercent! ? s : max), submodulesWithData[0])
  const lowestSubmodule = submodulesWithData.reduce((min, s) => (s.averageLatestPercent! < min.averageLatestPercent! ? s : min), submodulesWithData[0])
  const signsPercent = data.totalSigns > 0 ? Math.round((data.totalSignsViewed / data.totalSigns) * 100) : 0

  const summaryParts: string[] = []
  summaryParts.push(
    `Of ${data.totalStudents} students, ${data.counts.mastered} ${data.counts.mastered === 1 ? 'is' : 'are'} Mastered, ${data.counts.needsReview} need${data.counts.needsReview === 1 ? 's' : ''} review, and ${data.counts.needsAttention} need${data.counts.needsAttention === 1 ? 's' : ''} attention.`,
  )
  if (highestModule && lowestModule) {
    summaryParts.push(
      highestModule.moduleTitle === lowestModule.moduleTitle
        ? `${highestModule.moduleTitle} has a class average of ${highestModule.averageLatestPercent}%.`
        : `${highestModule.moduleTitle} has the highest module average at ${highestModule.averageLatestPercent}%, while ${lowestModule.moduleTitle} has the lowest at ${lowestModule.averageLatestPercent}%.`,
    )
  }
  if (highestSubmodule && lowestSubmodule) {
    summaryParts.push(
      highestSubmodule.title === lowestSubmodule.title
        ? `${highestSubmodule.title} has a class average of ${highestSubmodule.averageLatestPercent}%.`
        : `${highestSubmodule.title} has the highest submodule average at ${highestSubmodule.averageLatestPercent}%, while ${lowestSubmodule.title} has the lowest at ${lowestSubmodule.averageLatestPercent}%, where ${lowestSubmodule.studentsBelow50} of ${lowestSubmodule.studentsWithQuizData} students who attempted it scored below ${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}%.`,
    )
  }
  summaryParts.push(`Overall, ${signsPercent}% of all assignable signs have been viewed across the section (${data.totalSignsViewed} of ${data.totalSigns}).`)

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

  // ---- Quiz performance by module (stacked bar: student count per status) ----
  sectionHeading('Quiz performance by module')

  // legend
  const legendItems: { label: string; color: string }[] = [
    { label: 'Mastered', color: COLOR_MASTERED },
    { label: 'Needs review', color: COLOR_NEEDS_REVIEW },
    { label: 'Needs attention', color: COLOR_NEEDS_ATTENTION },
  ]
  let legendX = margin
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const item of legendItems) {
    doc.setFillColor(item.color)
    doc.rect(legendX, y - 7, 8, 8, 'F')
    doc.setTextColor(40, 40, 40)
    doc.text(item.label, legendX + 12, y)
    legendX += 12 + doc.getTextWidth(item.label) + 18
  }
  y += 14

  const chartHeight = 150
  const chartTop = y
  const chartBottom = chartTop + chartHeight
  const maxStack = Math.max(1, ...data.modules.map((m) => m.masteredCount + m.needsReviewCount + m.needsAttentionCount))

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, chartBottom, pageWidth - margin, chartBottom)

  if (data.modules.length > 0) {
    const slot = usableWidth / data.modules.length
    const barWidth = Math.min(70, slot * 0.6)
    data.modules.forEach((mod, i) => {
      const x = margin + i * slot + (slot - barWidth) / 2
      const segments: { count: number; color: string }[] = [
        { count: mod.masteredCount, color: COLOR_MASTERED },
        { count: mod.needsReviewCount, color: COLOR_NEEDS_REVIEW },
        { count: mod.needsAttentionCount, color: COLOR_NEEDS_ATTENTION },
      ]
      let baseY = chartBottom
      for (const seg of segments) {
        if (seg.count === 0) continue
        const segHeight = (seg.count / maxStack) * chartHeight
        doc.setFillColor(seg.color)
        doc.rect(x, baseY - segHeight, barWidth, segHeight, 'F')
        if (segHeight > 9) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(255, 255, 255)
          doc.text(String(seg.count), x + barWidth / 2, baseY - segHeight / 2 + 3, { align: 'center' })
        }
        baseY -= segHeight
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(40, 40, 40)
      const labelLines = doc.splitTextToSize(mod.moduleTitle, slot)
      doc.text(labelLines, x + barWidth / 2, chartBottom + 11, { align: 'center' })
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(COLOR_MUTED)
    doc.text('No modules selected.', pageWidth / 2, chartTop + chartHeight / 2, { align: 'center' })
  }
  y = chartBottom + 26
  caption('Each bar shows how many students fall into each status for that module, based on the average of their latest quiz scores across its submodules.')

  // ---- Module results table ----
  doc.addPage()
  y = margin
  sectionHeading('Module results')

  const modCols = [
    { header: 'Module', width: 170 },
    { header: 'Submodules', width: 75 },
    { header: 'Average quiz', width: 85 },
    { header: 'Mastered', width: 75 },
    { header: 'Needs review', width: 90 },
    { header: 'Needs attention', width: 100 },
    { header: 'Signs viewed', width: usableWidth - 170 - 75 - 85 - 75 - 90 - 100 },
  ]
  function modColX(i: number) {
    let x = margin
    for (let j = 0; j < i; j++) x += modCols[j].width
    return x
  }
  function drawModHeader() {
    doc.setFillColor(COLOR_NAVY)
    doc.rect(margin, y, usableWidth, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    modCols.forEach((c, i) => doc.text(c.header, modColX(i) + 6, y + 13))
    y += 20
  }

  drawModHeader()
  for (const mod of data.modules) {
    const avgText = mod.averageLatestPercent !== null ? `${mod.averageLatestPercent}%` : '—'
    const signsShare = data.totalSignsViewed > 0 ? Math.round((mod.signsViewed / data.totalSignsViewed) * 100) : 0
    const cells = [mod.moduleTitle, String(mod.submoduleCount), avgText, String(mod.masteredCount), String(mod.needsReviewCount), String(mod.needsAttentionCount), `${mod.signsViewed}/${mod.signsTotal} (${signsShare}%)`]
    const wrapped = cells.map((cell, i) => doc.splitTextToSize(cell, modCols[i].width - 12))
    const lines = Math.max(...wrapped.map((l) => l.length))
    const rowHeight = lines * 11 + 6

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawModHeader()
    }

    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    wrapped.forEach((lines, i) => {
      if (i === 2) doc.setTextColor(bandColor(mod.averageLatestPercent))
      else if (i === 5 && mod.needsAttentionCount > 0) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else doc.setTextColor(30, 30, 30)
      doc.text(lines, modColX(i) + 6, y + 10)
      doc.setTextColor(30, 30, 30)
    })
    y += rowHeight
  }
  y += 10
  caption('Average quiz is each student’s per-module average of latest quiz scores, then averaged across students with data.')

  // ---- Submodule results table ----
  ensureSpace(80)
  sectionHeading('Submodule results')

  const smCols = [
    { header: 'Submodule', width: 120 },
    { header: 'Average quiz', width: 75 },
    { header: 'Mastered', width: 60 },
    { header: 'Needs review', width: 75 },
    { header: 'Needs attention', width: 85 },
    { header: 'Avg signs viewed', width: 80 },
    { header: 'Incomplete signs', width: 85 },
    { header: 'No practice', width: usableWidth - 120 - 75 - 60 - 75 - 85 - 80 - 85 },
  ]
  function smColX(i: number) {
    let x = margin
    for (let j = 0; j < i; j++) x += smCols[j].width
    return x
  }
  function drawSmHeader() {
    doc.setFillColor(COLOR_NAVY)
    doc.rect(margin, y, usableWidth, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255)
    smCols.forEach((c, i) => doc.text(c.header, smColX(i) + 5, y + 13))
    y += 20
  }
  function drawSmModuleRow(title: string) {
    doc.setFillColor(230, 234, 240)
    doc.rect(margin, y, usableWidth, 16, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COLOR_NAVY)
    doc.text(title, margin + 6, y + 11)
    y += 16
  }

  drawSmHeader()
  let currentModule: string | null = null
  for (const row of data.submodules) {
    if (row.moduleTitle !== currentModule) {
      if (y + 16 > pageHeight - margin) {
        doc.addPage()
        y = margin
        drawSmHeader()
      }
      drawSmModuleRow(row.moduleTitle)
      currentModule = row.moduleTitle
    }

    const avgText = row.averageLatestPercent !== null ? `${row.averageLatestPercent}%` : '—'
    const cells = [
      row.title,
      avgText,
      String(row.masteredCount),
      String(row.needsReviewCount),
      String(row.needsAttentionCount),
      `${row.averageSignsViewed} of ${row.signsTotal}`,
      `${row.studentsWithIncompleteSigns} of ${row.totalStudents}`,
      `${row.studentsWithNoPractice} of ${row.totalStudents}`,
    ]
    const wrapped = cells.map((cell, i) => doc.splitTextToSize(cell, smCols[i].width - 10))
    const lines = Math.max(...wrapped.map((l) => l.length))
    const rowHeight = lines * 10 + 6

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawSmHeader()
      drawSmModuleRow(row.moduleTitle)
    }

    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    wrapped.forEach((lines, i) => {
      if (i === 1) doc.setTextColor(bandColor(row.averageLatestPercent))
      else if (i === 4 && row.needsAttentionCount > 0) doc.setTextColor(COLOR_NEEDS_ATTENTION)
      else doc.setTextColor(30, 30, 30)
      doc.text(lines, smColX(i) + 5, y + 9)
      doc.setTextColor(30, 30, 30)
    })
    y += rowHeight
  }
  y += 10
  caption('Average quiz and status counts are based on each student’s latest quiz attempt in that submodule.')

  // ---- Student overview heatmap ----
  doc.addPage()
  y = margin
  sectionHeading('Student overview')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(COLOR_MUTED)
  doc.text('Each cell is the student’s average of latest quiz scores within that module.', margin, y)
  y += 14

  const nameColWidth = 130
  const otherCols = data.moduleOrder.length + 2 // + Average + Status
  const cellWidth = Math.max(45, (usableWidth - nameColWidth) / otherCols)
  const heatCols = [...data.moduleOrder, 'Average', 'Status']

  function drawHeatHeader() {
    doc.setFillColor(COLOR_NAVY)
    doc.rect(margin, y, usableWidth, 26, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('Student', margin + 6, y + 16)
    heatCols.forEach((c, i) => {
      const lines = doc.splitTextToSize(c, cellWidth - 6)
      doc.text(lines, margin + nameColWidth + i * cellWidth + cellWidth / 2, y + (lines.length > 1 ? 10 : 16), { align: 'center' })
    })
    y += 26
  }

  drawHeatHeader()
  const rowHeight = 18
  for (const student of data.students) {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawHeatHeader()
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(30, 30, 30)
    const nameLines = doc.splitTextToSize(student.studentName, nameColWidth - 8)
    doc.text(nameLines[0], margin + 6, y + 13)

    const cellValues = [...student.moduleAverages, student.overallPercent]
    cellValues.forEach((percent, i) => {
      const x = margin + nameColWidth + i * cellWidth
      doc.setFillColor(bandLightColor(percent))
      doc.rect(x, y, cellWidth, rowHeight, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      doc.text(percent !== null ? `${percent}%` : '—', x + cellWidth / 2, y + 13, { align: 'center' })
    })

    const statusX = margin + nameColWidth + cellValues.length * cellWidth
    doc.setFillColor(bandLightColor(student.overallPercent))
    doc.rect(statusX, y, cellWidth, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(bandColor(student.overallPercent))
    doc.text(bandLabel(student.overallPercent), statusX + cellWidth / 2, y + 13, { align: 'center' })

    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)

    y += rowHeight
  }
  y += 10
  caption('Average and Status reflect the student’s overall average of latest quiz scores across every submodule attempted.')

  // ---- Quizzes needing attention ----
  ensureSpace(80)
  sectionHeading('Quizzes needing attention')
  const flagged = data.students.filter((s) => s.needsAttentionSubmodules.length > 0)
  if (flagged.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text('None.', margin, y)
    y += 16
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    for (const student of flagged) {
      const text = `${student.studentName}: ${student.needsAttentionSubmodules.map((s) => `${s.title} (${s.score})`).join(', ')}`
      const lines = doc.splitTextToSize(`•  ${text}`, usableWidth - 10)
      if (y + lines.length * 11 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.setTextColor(30, 30, 30)
      doc.text(lines, margin + 6, y)
      y += lines.length * 11 + 3
    }
  }
  y += 10

  // ---- Key findings ----
  ensureSpace(80)
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

  const sortedSubmodulesByAvg = [...submodulesWithData].sort((a, b) => b.averageLatestPercent! - a.averageLatestPercent!)
  const topSubmodules = sortedSubmodulesByAvg.slice(0, 3)
  const bottomSubmodules = sortedSubmodulesByAvg.slice(-3).reverse()
  const halfStrongModules = data.modules.filter((m) => m.studentsWithData > 0 && m.masteredCount / m.studentsWithData > 0.5)
  const halfWeakModules = data.modules.filter((m) => m.studentsWithData > 0 && (m.needsReviewCount + m.needsAttentionCount) / m.studentsWithData > 0.5)
  const masteredStudents = data.students.filter((s) => s.overallStatus === 'mastered').sort((a, b) => b.overallPercent! - a.overallPercent!)
  const attentionStudents = data.students.filter((s) => s.overallStatus === 'needs-attention').sort((a, b) => a.overallPercent! - b.overallPercent!)
  const retookStudents = data.students.filter((s) => s.retook)
  const improvedStudents = retookStudents.filter((s) => s.retookAndImproved)
  const fullyViewedStudents = data.students.filter((s) => s.fullyViewedAllSubmodules)
  const belowOnAnyQuiz = data.students.filter((s) => s.needsAttentionSubmodules.length > 0)
  const noPracticeStudents = data.students.filter((s) => s.noPracticeSubmodules.length > 0)
  const worstIncompleteSubmodule = [...data.submodules].sort((a, b) => b.studentsWithIncompleteSigns - a.studentsWithIncompleteSigns)[0]
  const worstNoPracticeSubmodule = [...data.submodules].sort((a, b) => b.studentsWithNoPractice - a.studentsWithNoPractice)[0]

  const strengths: string[] = []
  if (topSubmodules.length > 0) strengths.push(`Highest averages: ${topSubmodules.map((s) => `${s.title} (${s.averageLatestPercent}%)`).join(', ')}.`)
  if (halfStrongModules.length > 0) strengths.push(`More than half the class is Mastered in: ${halfStrongModules.map((m) => `${m.moduleTitle} (${m.masteredCount} of ${m.studentsWithData})`).join(', ')}.`)
  if (masteredStudents.length > 0) strengths.push(`Mastered overall: ${masteredStudents.map((s) => `${s.studentName} (${s.overallPercent}%)`).join(', ')}.`)
  if (retookStudents.length > 0) {
    strengths.push(`${retookStudents.length} of ${data.totalStudents} students retook at least one quiz, and ${improvedStudents.length === retookStudents.length ? 'all of them' : `${improvedStudents.length} of them`} showed progress by scoring higher on a retake.`)
  }
  if (fullyViewedStudents.length > 0) strengths.push(`${fullyViewedStudents.length} of ${data.totalStudents} students viewed every sign in every submodule.`)
  if (strengths.length === 0) strengths.push('No notable strengths yet based on current data.')

  const concerns: string[] = []
  if (bottomSubmodules.length > 0) concerns.push(`Lowest averages: ${bottomSubmodules.map((s) => `${s.title} (${s.averageLatestPercent}%)`).join(', ')}.`)
  if (halfWeakModules.length > 0) concerns.push(`More than half the class is below Mastered in: ${halfWeakModules.map((m) => `${m.moduleTitle} (${m.needsReviewCount + m.needsAttentionCount} of ${m.studentsWithData})`).join(', ')}.`)
  if (attentionStudents.length > 0) {
    const reviewCount = data.counts.needsReview
    concerns.push(`Needing attention overall: ${attentionStudents.map((s) => `${s.studentName} (${s.overallPercent}%)`).join(', ')}. Separately, ${reviewCount} student${reviewCount === 1 ? '' : 's'} ${reviewCount === 1 ? 'is' : 'are'} in the needs review range.`)
  }
  if (belowOnAnyQuiz.length > 0) concerns.push(`${belowOnAnyQuiz.length} of ${data.totalStudents} students scored below ${Math.round(NEEDS_ATTENTION_THRESHOLD * 100)}% on at least one quiz.`)
  const anyIncomplete = data.students.length - fullyViewedStudents.length
  if (anyIncomplete > 0 && worstIncompleteSubmodule && worstIncompleteSubmodule.studentsWithIncompleteSigns > 0) {
    concerns.push(`${anyIncomplete} of ${data.totalStudents} students have signs left to view in at least one submodule. ${worstIncompleteSubmodule.title} has the most, with ${worstIncompleteSubmodule.studentsWithIncompleteSigns} of ${worstIncompleteSubmodule.totalStudents} students not fully viewed.`)
  }
  if (noPracticeStudents.length > 0 && worstNoPracticeSubmodule && worstNoPracticeSubmodule.studentsWithNoPractice > 0) {
    concerns.push(`${noPracticeStudents.length} of ${data.totalStudents} students did no practice in at least one submodule. ${worstNoPracticeSubmodule.title} has the most, with ${worstNoPracticeSubmodule.studentsWithNoPractice} of ${worstNoPracticeSubmodule.totalStudents} students.`)
  }
  if (concerns.length === 0) concerns.push('No areas of concern based on current data.')

  bulletList('Strengths', strengths)
  bulletList('Areas of Concern', concerns)

  footer()
  doc.save(filename)
}
