import { generateAssignmentDocxBlob, sanitizeFilename, DocxExportInput } from "@/lib/docx/builder";

export interface ExportDocxOptions {
  assignmentId?: string;
  title?: string;
  studentName?: string;
  studentId?: string;
  courseName?: string;
  assignmentType?: string;
  question?: string;
  answer?: string;
  text?: string;
  references?: Array<{
    title: string;
    authors?: string;
    year?: number | string;
    journal?: string;
    doi?: string;
    url?: string;
  }>;
  onLoadingChange?: (loading: boolean) => void;
  addToast?: (toast: { type: "success" | "error" | "info"; title: string; description?: string }) => void;
}

export async function downloadDocxFile(options: ExportDocxOptions): Promise<boolean> {
  const { onLoadingChange, addToast } = options;

  if (onLoadingChange) onLoadingChange(true);

  if (addToast) {
    addToast({
      type: "info",
      title: "Membuat dokumen Word...",
      description: "Menyusun format A4, font Times New Roman 12pt, dan referensi APA 7.",
    });
  }

  try {
    const finalAnswer = options.answer || options.text;
    if (!finalAnswer) {
      throw new Error("Konten jawaban tidak boleh kosong.");
    }

    const exportInput: DocxExportInput = {
      title: options.title || (options.courseName ? `TUGAS ${options.courseName.toUpperCase()}` : "DOKUMEN TUGAS AKADEMIK"),
      studentName: options.studentName || "Mahasiswa",
      studentId: options.studentId || "-",
      courseName: options.courseName || "-",
      assignmentType: options.assignmentType || "TugasKuliah",
      question: options.question,
      answer: finalAnswer,
      references: options.references,
    };

    const blob = await generateAssignmentDocxBlob(exportInput);

    if (!blob || blob.size === 0) {
      throw new Error("File dokumen Word kosong.");
    }

    const baseName = `${options.courseName || "Tugas"}_${options.assignmentType || "Mahasiswa"}_${options.studentName || "User"}`;
    const filename = `${sanitizeFilename(baseName)}.docx`;

    // Trigger direct client browser download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    if (addToast) {
      addToast({
        type: "success",
        title: "Dokumen Word Berhasil Dibuat",
        description: `File ${filename} telah diunduh ke perangkat Anda.`,
      });
    }

    return true;
  } catch (err: unknown) {
    console.error("[Download DOCX Error]:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal membuat dokumen Word";

    if (addToast) {
      addToast({
        type: "error",
        title: "Gagal Membuat Dokumen Word",
        description: errorMsg,
      });
    }

    return false;
  } finally {
    if (onLoadingChange) onLoadingChange(false);
  }
}
