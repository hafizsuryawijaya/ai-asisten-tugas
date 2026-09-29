"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  Loader2,
  FileText,
  Sliders,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

const PROGRESS_STEPS = [
  "Menganalisis soal...",
  "Menyusun struktur jawaban...",
  "Mencari referensi ilmiah...",
  "Memeriksa referensi...",
  "Menyusun jawaban akhir...",
];

export default function NewAssignmentPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [courseName, setCourseName] = useState("");
  const [assignmentType, setAssignmentType] = useState("Essay");
  const [question, setQuestion] = useState("");
  const [instructions, setInstructions] = useState("");
  const [writingStyle, setWritingStyle] = useState("Akademik");
  const [length, setLength] = useState("Sedang");
  const [searchReferences, setSearchReferences] = useState(true);
  const [refCount, setRefCount] = useState(5);
  const [startYear, setStartYear] = useState(2021);
  const [endYear, setEndYear] = useState(2026);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseName.trim() || !question.trim()) {
      addToast({
        type: "error",
        title: "Form Belum Lengkap",
        description: "Mata Kuliah dan Pertanyaan/Soal wajib diisi.",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStepIndex(0);

    // Live progress state updater interval
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const res = await fetch("/api/assignments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_name: courseName,
          assignment_type: assignmentType,
          question,
          instructions,
          writing_style: writingStyle,
          length,
          search_references: searchReferences,
          ref_count: refCount,
          start_year: startYear,
          end_year: endYear,
        }),
      });

      clearInterval(stepInterval);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyusun jawaban.");
      }

      // Final step highlight
      setCurrentStepIndex(PROGRESS_STEPS.length - 1);

      addToast({
        type: "success",
        title: "Tugas Berhasil Disusun!",
        description: "Mengalihkan ke halaman hasil...",
      });

      // Save output in sessionStorage as immediate fallback
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`assignment_${data.assignment_id}`, JSON.stringify(data));
      }

      setTimeout(() => {
        router.push(`/dashboard/tugas/${data.assignment_id}`);
      }, 500);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada layanan AI.";
      addToast({
        type: "error",
        title: "Gagal Membuat Tugas",
        description: errorMsg,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Buat Tugas Baru
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Masukkan detail soal tugas Anda. AI akan menganalisis, mencari referensi jurnal terverifikasi, dan menyusun draft jawaban terbaik.
        </p>
      </div>

      {/* GENERATION PROGRESS MODAL OVERLAY */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Sparkles className="w-7 h-7 text-blue-600" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Proses Menyusun Tugas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mohon tunggu sejenak, AI sedang bekerja...
              </p>
            </div>

            {/* PROGRESS STEPS LIST */}
            <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              {PROGRESS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-xs transition-all ${
                      isDone
                        ? "text-emerald-600 font-semibold"
                        : isCurrent
                        ? "text-blue-600 font-bold scale-102"
                        : "text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MATA KULIAH */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Mata Kuliah *
            </label>
            <input
              type="text"
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Contoh: Metodologi Penelitian / Hukum Tata Negara"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* JENIS TUGAS */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Jenis Tugas *
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="Diskusi">Diskusi Forum</option>
              <option value="Essay">Essay</option>
              <option value="Makalah">Makalah</option>
              <option value="Pertanyaan">Pertanyaan Singkat</option>
              <option value="Ringkasan">Ringkasan Materi</option>
            </select>
          </div>
        </div>

        {/* SOAL / PERTANYAAN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Pertanyaan / Soal Tugas *
          </label>
          <textarea
            rows={5}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Masukkan pertanyaan atau instruksi tugas di sini..."
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-y"
          />
        </div>

        {/* INSTRUKSI TAMBAHAN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Instruksi Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Contoh: Gunakan minimal 3 jurnal terbitan terbaru dan tambahkan contoh studi kasus."
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* GAYA BAHASA & PANJANG JAWABAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Gaya Bahasa
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Bahasa mahasiswa", "Akademik", "Formal", "Sederhana"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setWritingStyle(style)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    writingStyle === style
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Panjang Jawaban
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Singkat", "Sedang", "Panjang"].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setLength(len)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    length === len
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* REFERENSI SECTION */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchReferences}
                onChange={(e) => setSearchReferences(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-600" />
                Cari Referensi Ilmiah
              </span>
            </label>
          </div>

          {searchReferences && (
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Jumlah Jurnal (1–10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={refCount}
                  onChange={(e) => setRefCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Rentang Tahun Terbit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-slate-400 text-xs">—</span>
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            Buat Jawaban
          </button>
        </div>
      </form>
    </div>
  );
}
