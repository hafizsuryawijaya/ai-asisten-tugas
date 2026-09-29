import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

export interface ReferenceExportData {
  title: string;
  authors?: string;
  year?: number | string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
}

export interface DocxExportInput {
  title?: string;
  studentName?: string;
  studentId?: string;
  courseName?: string;
  assignmentType?: string;
  question?: string;
  answer: string;
  references?: ReferenceExportData[];
}

/**
 * Clean & sanitize filename for header content-disposition
 */
export function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return clean || "Tugas_Mahasiswa";
}

/**
 * Parse inline markdown formatting (**bold**, *italic*, ***bold-italic***) into TextRuns
 */
function parseInlineFormatting(
  text: string,
  options: {
    font?: string;
    size?: number; // half-points: 24 = 12pt
    color?: string;
    defaultBold?: boolean;
    defaultItalic?: boolean;
  } = {}
): TextRun[] {
  const font = options.font || "Times New Roman";
  const size = options.size || 24; // 12 pt
  const color = options.color || "000000";
  const defaultBold = options.defaultBold || false;
  const defaultItalic = options.defaultItalic || false;

  const runs: TextRun[] = [];
  // Regex to match ***bold-italic***, **bold**, *italic*, or _italic_
  const regex = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        runs.push(
          new TextRun({
            text: plainText,
            font,
            size,
            color,
            bold: defaultBold,
            italics: defaultItalic,
          })
        );
      }
    }

    const boldItalicText = match[2];
    const boldText = match[3];
    const italicText = match[4] || match[5];

    if (boldItalicText) {
      runs.push(
        new TextRun({
          text: boldItalicText,
          font,
          size,
          color,
          bold: true,
          italics: true,
        })
      );
    } else if (boldText) {
      runs.push(
        new TextRun({
          text: boldText,
          font,
          size,
          color,
          bold: true,
          italics: defaultItalic,
        })
      );
    } else if (italicText) {
      runs.push(
        new TextRun({
          text: italicText,
          font,
          size,
          color,
          bold: defaultBold,
          italics: true,
        })
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      runs.push(
        new TextRun({
          text: remainingText,
          font,
          size,
          color,
          bold: defaultBold,
          italics: defaultItalic,
        })
      );
    }
  }

  return runs;
}

/**
 * Format reference item into APA 7 string
 */
function formatAPACitationText(ref: ReferenceExportData): string {
  const authors = ref.authors ? ref.authors.trim() : "Anonim";
  const year = ref.year ? `(${ref.year})` : "(n.d.)";
  const title = ref.title ? ref.title.trim() : "Tanpa Judul";
  const journal = ref.journal ? ref.journal.trim() : "";
  const doi = ref.doi
    ? ` https://doi.org/${ref.doi.replace(/^https?:\/\/doi\.org\//, "")}`
    : "";
  const url = ref.url && ref.url !== "#" && !doi ? ` ${ref.url}` : "";

  let citation = `${authors} ${year}. ${title}.`;
  if (journal) {
    citation += ` *${journal}*.`;
  }
  if (doi) {
    citation += doi;
  } else if (url) {
    citation += url;
  }

  return citation;
}

/**
 * Generate native DOCX Buffer for an assignment
 */
export async function generateAssignmentDocx(input: DocxExportInput): Promise<Buffer> {
  const children: Paragraph[] = [];

  const mainTitle =
    input.title ||
    `TUGAS ${input.assignmentType ? input.assignmentType.toUpperCase() : "AKADEMIK"}`;

  // 1. HEADER TITLE (Centered, 14pt / size 28, Bold, line spacing 1.5)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 360, before: 120, after: 240 },
      children: [
        new TextRun({
          text: mainTitle,
          font: "Times New Roman",
          size: 28, // 14 pt
          bold: true,
          color: "000000",
        }),
      ],
    })
  );

  // 2. METADATA MAHASISWA & TUGAS (Left, 12pt / size 24, line spacing 1.5)
  const metaLines = [
    { label: "Nama Mahasiswa", val: input.studentName || "-" },
    { label: "NIM", val: input.studentId || "-" },
    { label: "Mata Kuliah", val: input.courseName || "-" },
    { label: "Jenis Tugas", val: input.assignmentType || "-" },
  ];

  metaLines.forEach((m) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 360, after: 60 },
        children: [
          new TextRun({
            text: `${m.label.padEnd(16, " ")}: `,
            font: "Times New Roman",
            size: 24,
            bold: true,
            color: "000000",
          }),
          new TextRun({
            text: m.val,
            font: "Times New Roman",
            size: 24,
            color: "000000",
          }),
        ],
      })
    );
  });

  // Empty divider spacing
  children.push(
    new Paragraph({
      spacing: { line: 360, after: 240 },
      children: [],
    })
  );

  // 3. SOAL TUGAS (If provided)
  if (input.question) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 360, before: 120, after: 60 },
        children: [
          new TextRun({
            text: "Soal / Pertanyaan Tugas:",
            font: "Times New Roman",
            size: 24,
            bold: true,
            color: "000000",
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        indent: { left: 360, right: 360 },
        children: parseInlineFormatting(input.question, { defaultItalic: true }),
      })
    );
  }

  // 4. PARSE MARKDOWN ANSWER BODY
  const rawAnswer = input.answer || "";
  const lines = rawAnswer.replace(/\r\n/g, "\n").split("\n");

  let inDaftarPustaka = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue; // Skip blank lines, spacing is handled by paragraph after-margins
    }

    // Check if line is DAFTAR PUSTAKA heading in answer text
    if (/^(#+\s*)?(DAFTAR PUSTAKA|REFERENSI|REFERENCES)$/i.test(trimmed)) {
      inDaftarPustaka = true;
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, before: 360, after: 180 },
          children: [
            new TextRun({
              text: "DAFTAR PUSTAKA",
              font: "Times New Roman",
              size: 28, // 14 pt
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // Heading 1 (# Heading or bold standalone section like Pendahuluan, Pembahasan, Kesimpulan)
    if (
      trimmed.startsWith("# ") ||
      /^(Pendahuluan|Pembahasan|Kesimpulan|BAB\s+[IVXLCDM]+\s*.*)$/i.test(
        trimmed.replace(/\*\*/g, "")
      )
    ) {
      const headingText = trimmed
        .replace(/^#\s+/, "")
        .replace(/\*\*/g, "")
        .trim();
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, before: 240, after: 120 },
          children: [
            new TextRun({
              text: headingText,
              font: "Times New Roman",
              size: 28, // 14 pt
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // Heading 2 (## Heading)
    if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "").trim();
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, before: 180, after: 100 },
          children: [
            new TextRun({
              text: headingText,
              font: "Times New Roman",
              size: 26, // 13 pt
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // Heading 3 (### Heading)
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      const headingText = trimmed.replace(/^#+\s+/, "").trim();
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, before: 120, after: 60 },
          children: [
            new TextRun({
              text: headingText,
              font: "Times New Roman",
              size: 24, // 12 pt
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // Bullet List Item (- item or * item)
    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, "").trim();
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 60 },
          indent: { left: 720, hanging: 360 }, // Hanging indent for bullet symbol
          children: [
            new TextRun({
              text: "• ",
              font: "Times New Roman",
              size: 24,
              bold: true,
              color: "000000",
            }),
            ...parseInlineFormatting(itemText),
          ],
        })
      );
      continue;
    }

    // Numbered List Item (1. item or 2. item)
    const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
    if (numMatch) {
      const prefix = numMatch[1];
      const itemText = numMatch[2];
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 60 },
          indent: { left: 720, hanging: 360 },
          children: [
            new TextRun({
              text: `${prefix} `,
              font: "Times New Roman",
              size: 24,
              bold: true,
              color: "000000",
            }),
            ...parseInlineFormatting(itemText),
          ],
        })
      );
      continue;
    }

    // If currently in Daftar Pustaka section of text, format as APA hanging indent
    if (inDaftarPustaka) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 120 },
          indent: { left: 720, hanging: 720 }, // APA 7 hanging indent
          children: parseInlineFormatting(trimmed),
        })
      );
      continue;
    }

    // Standard Body Paragraph (Times New Roman 12pt, line spacing 1.5, justify, first line indent 1.27 cm / 720 dxa)
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 720 }, // 1.27 cm / 0.5 in indent
        children: parseInlineFormatting(trimmed),
      })
    );
  }

  // 5. APPEND DAFTAR PUSTAKA FROM VERIFIED REFERENCES (if not already included and references exist)
  if (!inDaftarPustaka && input.references && input.references.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 360, before: 360, after: 180 },
        children: [
          new TextRun({
            text: "DAFTAR PUSTAKA",
            font: "Times New Roman",
            size: 28, // 14 pt
            bold: true,
            color: "000000",
          }),
        ],
      })
    );

    input.references.forEach((ref) => {
      const apaText = formatAPACitationText(ref);
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 144 },
          indent: { left: 720, hanging: 720 }, // APA 7 hanging indent
          children: parseInlineFormatting(apaText),
        })
      );
    });
  }

  // BUILD DOCUMENT WITH A4 MARGINS (2.54 cm / 1440 dxa normal margins)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.54 cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
