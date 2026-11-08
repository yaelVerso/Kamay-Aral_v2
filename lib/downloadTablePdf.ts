import { jsPDF } from 'jspdf'

interface Column {
  header: string
  width: number
}

/** Renders tabular rows into a downloadable, paginated PDF table. */
export function downloadTablePdf(title: string, columns: Column[], rows: string[][], filename: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, margin, y)
  y += 20

  doc.setFontSize(9)
  const lineHeight = 12
  const cellPadding = 4

  function columnX(index: number) {
    let x = margin
    for (let i = 0; i < index; i++) x += columns[i].width
    return x
  }

  function drawHeaderRow() {
    doc.setFont('helvetica', 'bold')
    columns.forEach((col, i) => doc.text(col.header, columnX(i), y))
    y += lineHeight + 4
    doc.setLineWidth(0.5)
    doc.line(margin, y - lineHeight + 2, pageWidth - margin, y - lineHeight + 2)
    doc.setFont('helvetica', 'normal')
  }

  drawHeaderRow()

  for (const row of rows) {
    // wrap each cell independently, then take the row's tallest cell as its height
    const wrapped = row.map((cell, i) => doc.splitTextToSize(cell, columns[i].width - cellPadding))
    const rowLines = Math.max(...wrapped.map((lines) => lines.length))
    const rowHeight = rowLines * lineHeight

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawHeaderRow()
    }

    wrapped.forEach((lines, i) => doc.text(lines, columnX(i), y))
    y += rowHeight + 6
  }

  doc.save(filename)
}
