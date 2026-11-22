
import { jsPDF } from 'jspdf'

export function generateRcaPdf(result) {
  if (!result?.analysis || !result?.incident) {
    throw new Error('A completed RCA result is required.')
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const W = 210
  const M = 17
  const CW = W - M * 2

  const incident = result.incident
  const analysis = result.analysis

  const C = {
    navy: [16, 29, 47],
    blue: [38, 111, 218],
    ink: [43, 53, 68],
    muted: [105, 116, 132],
    line: [222, 227, 234],
    soft: [246, 248, 251],
    white: [255, 255, 255],
    red: [190, 55, 61],
    orange: [190, 130, 28],
    green: [39, 130, 91],
  }

  const clean = (value, fallback = 'Not provided') => {
    if (value === null || value === undefined || value === '') {
      return fallback
    }

    return String(value)
      .replace(/\r\n/g, '\n')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/\u00a0/g, ' ')
      .replace(/[^\x20-\xFF]/g, '')
      .trim()
  }

  const severity = clean(incident.severity).toUpperCase()
  const confidence = clean(analysis.confidence).toUpperCase()

  const severityColor =
    severity === 'CRITICAL' ? C.red :
    severity === 'HIGH' ? [211, 111, 34] :
    severity === 'MEDIUM' ? C.orange :
    C.green

  const confidenceColor =
    confidence === 'LOW' ? C.orange :
    confidence === 'MEDIUM' ? C.blue :
    confidence === 'HIGH' ? C.green :
    C.muted

  const generatedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  // ------------------------------------------
  // HEADER
  // ------------------------------------------

  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 39, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...C.white)
  doc.text('InferOps', M, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(205, 214, 226)
  doc.text('Root Cause Analysis Report', M, 22)

  doc.setFontSize(7.5)
  doc.setTextColor(185, 198, 215)
  doc.text('RCA ID', W - M, 10, { align: 'right' })

  doc.setFontSize(7.2)
  doc.setTextColor(...C.white)
  doc.text(clean(result.rca_id), W - M, 17, {
    align: 'right',
  })

  doc.setFontSize(7)
  doc.setTextColor(185, 198, 215)
  doc.text(`Generated: ${generatedAt} IST`, W - M, 25, {
    align: 'right',
  })

  // Blue separator below header.
  doc.setFillColor(...C.blue)
  doc.rect(0, 39, W, 2, 'F')

  // ------------------------------------------
  // FOUR SUMMARY CARDS
  // ------------------------------------------

  const cardY = 47
  const cardGap = 3
  const cardW = (CW - cardGap * 3) / 4
  const cardH = 17

  const cards = [
    {
      label: 'SEVERITY',
      value: severity,
      color: severityColor,
    },
    {
      label: 'CONFIDENCE',
      value: confidence,
      color: confidenceColor,
    },
    {
      label: 'SERVICE',
      value: clean(incident.service_name),
      color: C.ink,
    },
    {
      label: 'INCIDENT TYPE',
      value: clean(incident.incident_type),
      color: C.ink,
    },
  ]

  cards.forEach((card, index) => {
    const x = M + index * (cardW + cardGap)

    doc.setFillColor(...C.soft)
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.25)
    doc.rect(x, cardY, cardW, cardH, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.6)
    doc.setTextColor(...C.muted)
    doc.text(card.label, x + 2.5, cardY + 5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...card.color)

    const lines = doc.splitTextToSize(
      card.value,
      cardW - 5
    )

    doc.text(lines.slice(0, 2), x + 2.5, cardY + 11)
  })

  // ------------------------------------------
  // REPORT CONTENT
  // ------------------------------------------

  const blocks = []

  const addSection = (title) => {
    blocks.push({
      type: 'section',
      title,
    })
  }

  const addParagraph = (value) => {
    blocks.push({
      type: 'paragraph',
      value: clean(value),
    })
  }

  const addList = (items) => {
    const values = Array.isArray(items)
      ? items.map((item) => clean(item))
      : []

    if (values.length === 0) {
      addParagraph('No information available.')
      return
    }

    blocks.push({
      type: 'list',
      items: values,
    })
  }

  // Probable root cause.
  addSection('Probable root cause')
  addParagraph(analysis.probable_root_cause)

  // Recommended actions.
  addSection('Recommended actions')
  addList(analysis.recommended_actions)

  // Evidence.
  addSection('Evidence')
  addList(analysis.evidence)

  // Limitations.
  addSection('Limitations')
  addList(analysis.limitations)

  // Historical incidents.
  addSection('Similar historical incidents')

  const similar = Array.isArray(result.similar_incidents)
    ? result.similar_incidents
    : []

  if (similar.length === 0) {
    addParagraph('No similar historical incidents were returned.')
  } else {
    similar.forEach((item, index) => {
      const similarity = Number(item.similarity)

      const similarityText = Number.isFinite(similarity)
        ? `${(similarity <= 1 ? similarity * 100 : similarity).toFixed(1)}%`
        : 'Not provided'

      addParagraph(
        `Historical Incident ${index + 1} | ${clean(item.incident_type)} | ${clean(item.service_name)} | ${clean(item.severity)} | Similarity: ${similarityText}`
      )

      addParagraph(`Description: ${clean(item.description)}`)
      addParagraph(`Root Cause: ${clean(item.root_cause)}`)
      addParagraph(`Resolution: ${clean(item.resolution)}`)
    })
  }

  // Preserve the submitted incident description.
  addSection('Appendix: submitted incident description')
  addParagraph(incident.description)

  // ------------------------------------------
  // DYNAMIC ONE-PAGE LAYOUT
  // ------------------------------------------

  const contentTop = 73
  const footerLineY = 284
  const contentBottom = footerLineY - 7

  const base = {
    body: 7.5,
    section: 9.1,
    line: 3.55,
    sectionGap: 5.7,
    paragraphGap: 1.5,
  }

  const calculateLayout = (scale) => {
    let cursor = contentTop
    const layout = []

    blocks.forEach((block) => {
      if (block.type === 'section') {
        const height = base.sectionGap * scale

        layout.push({
          ...block,
          y: cursor,
          height,
        })

        cursor += height
        return
      }

      if (block.type === 'paragraph') {
        const fontSize = base.body * scale
        const lineHeight = base.line * scale

        const lines = doc.splitTextToSize(
          block.value,
          CW
        )

        const height =
          lines.length * lineHeight +
          base.paragraphGap * scale

        layout.push({
          ...block,
          y: cursor,
          lines,
          fontSize,
          lineHeight,
          height,
        })

        cursor += height
        return
      }

      if (block.type === 'list') {
        const fontSize = base.body * scale
        const lineHeight = base.line * scale
        const itemGap = 1.1 * scale
        const prefixWidth = 5

        const items = block.items.map((item, index) => {
          const lines = doc.splitTextToSize(
            item,
            CW - prefixWidth
          )

          const height =
            lines.length * lineHeight + itemGap

          const entry = {
            index,
            lines,
            y: cursor,
            height,
          }

          cursor += height
          return entry
        })

        cursor += 0.8 * scale

        layout.push({
          ...block,
          items,
          fontSize,
          lineHeight,
        })
      }
    })

    return {
      layout,
      bottom: cursor,
    }
  }

  // Reduce spacing and typography together until everything fits.
  let scale = 1
  let measured = calculateLayout(scale)

  while (
    measured.bottom > contentBottom &&
    scale > 0.55
  ) {
    scale -= 0.025
    measured = calculateLayout(scale)
  }

  // ------------------------------------------
  // DRAW CONTENT
  // ------------------------------------------

  measured.layout.forEach((block) => {
    if (block.type === 'section') {
      const titleY = block.y + 3.2 * scale

      // Blue vertical section marker.
      doc.setFillColor(...C.blue)
      doc.roundedRect(
        M,
        block.y + 0.2,
        1.8,
        6.2 * scale,
        0.7,
        0.7,
        'F'
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(base.section * scale)
      doc.setTextColor(...C.ink)

      doc.text(block.title, M + 5.5, titleY)

      // Thin divider.
      const dividerY = block.y + 6.3 * scale

      doc.setDrawColor(...C.line)
      doc.setLineWidth(0.22)
      doc.line(M + 5.5, dividerY, W - M, dividerY)

      return
    }

    if (block.type === 'paragraph') {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(block.fontSize)
      doc.setTextColor(...C.ink)

      block.lines.forEach((line, index) => {
        doc.text(
          line,
          M,
          block.y + (index + 1) * block.lineHeight
        )
      })

      return
    }

    if (block.type === 'list') {
      block.items.forEach((item) => {
        const firstLineY = item.y + block.lineHeight

        item.lines.forEach((line, lineIndex) => {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(block.fontSize)

          if (lineIndex === 0) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...C.blue)
            doc.text(
              `${item.index + 1}.`,
              M + 1.5,
              firstLineY
            )
          }

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...C.ink)

          doc.text(
            line,
            M + 7,
            firstLineY + lineIndex * block.lineHeight
          )
        })
      })
    }
  })

  // ------------------------------------------
  // FOOTER
  // ------------------------------------------

  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.25)
  doc.line(M, footerLineY, W - M, footerLineY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.6)
  doc.setTextColor(...C.muted)

  doc.text(
    `Confidential | AI-assisted analysis (${clean(result.model, 'model not provided')}) - verify before acting`,
    M,
    289
  )

  doc.text(
    'Page 1 of 1',
    W - M,
    289,
    { align: 'right' }
  )

  // ------------------------------------------
  // SAVE PDF
  // ------------------------------------------

  const safeService = clean(
    incident.service_name,
    'incident'
  )
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'incident'

  const safeId = clean(result.rca_id, 'report')
    .slice(0, 8)
    .replace(/[^a-zA-Z0-9]/g, '')

  doc.save(
    `InferOps-RCA-${safeService}-${safeId || 'report'}.pdf`
  )
}

