"use client";

import React, { useState } from "react";
import { Search, BookOpen, ExternalLink, Copy, Check, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { AcademicPaper } from "@/lib/academic/search";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { invokeEdgeFunction } from "@/lib/supabase/edge-functions";

export default function ReferencesSearchPage() {
  const { addToast } = useToast();
  const [query, setQuery] = useState("");
  const [courseName, setCourseName] = useState("");
  const [startYear, setStartYear] = useState(2021);
  const [endYear, setEndYear] = useState(2026);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AcademicPaper[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      addToast({
        type: "error",
        title: "Kata Kunci Kosong",
        description: "Harap masukkan kata kunci topik pencarian jurnal.",
      });
      return;
    }

    setIsSearching(true);
    try {
      const data = await invokeEdgeFunction<{ count: number; references: AcademicPaper[] }>("search-references", {
        query,
        course_name: courseName,
        start_year: startYear,
        end_year: endYear,
        limit: 10,
      });

      setResults(data.references || []);
      addToast({
        type: "success",
        title: "Pencarian Selesai",
        description: `Ditemukan ${data.count || 0} referensi jurnal ilmiah.`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan koneksi API jurnal.";
      addToast({
        type: "error",
        title: "Gagal Mencari",
        description: errorMsg,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyCitation = async (paper: AcademicPaper, idx: number) => {
    const success = await copyToClipboard(paper.citation_apa);
    if (success) {
      setCopiedId(idx);
      addToast({
        type: "success",
        title: "Sitasi APA 7 Disalin",
        description: paper.citation_apa.slice(0, 70) + "...",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      addToast({
        type: "error",
        title: "Gagal Menyalin Sitasi",
        description: "Browser tidak mengizinkan akses clipboard pada HTTP.",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Pencarian Jurnal & Referensi Ilmiah
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cari referensi artikel jurnal dan prosiding resmi dari OpenAlex & Crossref lengkap dengan metadata terverifikasi dan sitasi APA 7.
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Topik / Kata Kunci Pencarian *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: artificial intelligence, machine learning ethics..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mata Kuliah (Opsional)
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Contoh: Metodologi Penelitian"
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Rentang Tahun:</span>
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
            />
            <span>—</span>
            <input
              type="number"
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mencari Jurnal...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cari Jurnal Ilmiah
              </>
            )}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hasil Pencarian Jurnal ({results.length})
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((paper, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {paper.title}
                    </h3>
                    {paper.verified ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Belum Terverifikasi
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    {paper.authors} • {paper.year}
                  </p>

                  <p className="text-xs text-blue-600 font-semibold italic">
                    {paper.journal}
                  </p>

                  {paper.abstract && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {paper.abstract}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Sumber Jurnal
                  </a>

                  <button
                    onClick={() => handleCopyCitation(paper, idx)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-semibold transition"
                  >
                    {copiedId === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy APA 7
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
