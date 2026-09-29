"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FileCheck,
  Sparkles,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Wand2,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { WritingAnalysisReport } from "@/lib/detection/provider";
import { downloadDocxFile } from "@/lib/utils/export";

export default function AnalysisPage() {
  const { addToast } = useToast();
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<WritingAnalysisReport | null>(null);

  // States for AI improvement & DOCX export
  const [revisedText, setRevisedText] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 20) {
      addToast({
        type: "error",
        title: "Teks Terlalu Pendek",
        description: "Masukkan minimal 20 karakter untuk dianalisis.",
      });
      return;
    }

    setIsAnalyzing(true);
    setReport(null);
    setRevisedText("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis.");

      setReport(data.report);
      addToast({
        type: "success",
        title: "Analisis Selesai",
        description: "Laporan kualitas tulisan berhasil dibuat.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      addToast({
        type: "error",
        title: "Gagal Menganalisis",
        description: errorMsg,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImproveWithAI = async () => {
    const textToImprove = revisedText || content;
    if (!textToImprove.trim()) return;

    setIsImproving(true);
    try {
      const res = await fetch("/api/assignments/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "natural",
          original_question: "Perbaiki tulisan berikut agar memiliki struktur runtut, gaya bahasa akademik natural, dan kejelasan tinggi.",
          current_answer: textToImprove,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbaiki tulisan.");

      setRevisedText(data.new_answer);
      addToast({
        type: "success",
        title: "Tulisan Berhasil Diperbaiki!",
        description: "Gaya bahasa dan struktur paragraf telah disempurnakan oleh AI.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui teks.";
      addToast({
        type: "error",
        title: "Perbaikan Gagal",
        description: errorMsg,
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleReanalyzeRevisedText = async () => {
    if (!revisedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: revisedText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis.");

      setReport(data.report);
      setContent(revisedText);
      addToast({
        type: "success",
        title: "Analisis Ulang Selesai",
        description: "Skor kualitas tulisan hasil perbaikan telah diperbarui.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      addToast({
        type: "error",
        title: "Gagal Menganalisis Ulang",
        description: errorMsg,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadRevisedDocx = async () => {
    const textToDownload = revisedText || content;
    if (!textToDownload) return;

    await downloadDocxFile({
      title: "HASIL ANALISIS & PERBAIKAN TULISAN AKADEMIK",
      courseName: "Analisis Tulisan",
      assignmentType: "Hasil Perbaikan AI",
      answer: textToDownload,
      onLoadingChange: setIsDownloadingDocx,
      addToast,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck className="w-7 h-7 text-blue-600" />
          Analisis Kualitas & Pola Tulisan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tempelkan draft tulisan/jawaban Anda untuk menganalisis kerapian struktur, kejelasan argumen, konsistensi gaya bahasa, dan estimasi pola tulisan.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Draft Teks Tugas / Artikel
        </label>
        <textarea
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tempelkan paragraf atau jawaban lengkap Anda di sini..."
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-y"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analisis Tulisan
              </>
            )}
          </button>
        </div>
      </form>

      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* ESTIMASI POLA TULISAN */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Estimasi Pola Tulisan
            </h3>

            {report.pattern_detection.status === "configured" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                      Pola Human-like
                    </span>
                    <span className="text-3xl font-extrabold text-blue-900">
                      {report.pattern_detection.human_score}%
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    Human
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
                      Pola AI-like
                    </span>
                    <span className="text-3xl font-extrabold text-purple-900">
                      {report.pattern_detection.ai_score}%
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    AI
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                {report.pattern_detection.disclaimer}
              </p>
            </div>
          </div>

          {/* INDIKATOR KUALITAS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">Indikator Kualitas Tulisan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.quality_metrics.map((metric) => (
                <div key={metric.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{metric.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        metric.status === "Baik"
                          ? "bg-emerald-100 text-emerald-800"
                          : metric.status === "Cukup"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.score >= 80
                          ? "bg-emerald-500"
                          : metric.score >= 60
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600">{metric.feedback}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                Total Kata: <strong>{report.total_words}</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                Total Kalimat: <strong>{report.total_sentences}</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                Kalimat Panjang (&gt;25 kata): <strong>{report.long_sentence_count}</strong>
              </span>
            </div>
          </div>

          {/* SARAN PERBAIKAN & ACTION BUTTON TO IMPROVE */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Saran Perbaikan (Actionable Tips)
              </h3>

              <button
                type="button"
                onClick={handleImproveWithAI}
                disabled={isImproving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50 shrink-0"
              >
                {isImproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memperbaiki Tulisan...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Perbaiki Tulisan dengan AI
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {report.improvement_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HASIL SETELAH PERBAIKAN & DOWNLOAD WORD */}
          {revisedText && (
            <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Hasil Setelah Perbaikan
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Versi Teks yang Telah Disempurnakan oleh AI
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReanalyzeRevisedText}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Analisis Ulang Result
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRevisedDocx}
                    disabled={isDownloadingDocx}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                  >
                    {isDownloadingDocx ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
                        Membuat dokumen Word...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                        Download Word
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <ReactMarkdown>{revisedText}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
