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
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId: options.assignmentId,
        title: options.title,
        studentName: options.studentName,
        studentId: options.studentId,
        courseName: options.courseName,
        assignmentType: options.assignmentType,
        question: options.question,
        answer: options.answer || options.text,
        references: options.references,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal mengunduh dokumen Word.");
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("File dokumen Word kosong.");
    }

    // Extract filename from header or build default
    let filename = "Tugas_Mahasiswa.docx";
    const disposition = res.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
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
