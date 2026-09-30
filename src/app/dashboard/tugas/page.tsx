"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileText,
  Wand2,
  FileDown,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { downloadDocxFile } from "@/lib/utils/export";
import { invokeEdgeFunction } from "@/lib/supabase/edge-functions";

interface ReferenceItem {
  id?: string;
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
  verified?: boolean;
}

interface AssignmentDetail {
  id: string;
  course_name: string;
  assignment_type: string;
  question: string;
  writing_style?: string;
  length?: string;
  answer: string;
  created_at: string;
  references?: ReferenceItem[];
}

function AssignmentDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const id = searchParams.get("id");

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteAction, setRewriteAction] = useState<string | null>(null);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadAssignment() {
      if (!id) {
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem(`assignment_${id}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setAssignment({
              id: parsed.assignment_id || id,
              course_name: parsed.metadata?.course_name || "Tugas Kuliah",
              assignment_type: parsed.metadata?.assignment_type || "Essay",
              question: parsed.question || "Pertanyaan Tugas",
              answer: parsed.answer,
              created_at: parsed.metadata?.created_at || new Date().toISOString(),
            });
            if (parsed.references) {
              setReferences(parsed.references);
            }
            setLoading(false);
            return;
          } catch {}
        }
      }

      try {
        const { data: assignData, error: assignErr } = await supabase
          .from("assignments")
          .select("*")
          .eq("id", id)
          .single();

        if (!assignErr && assignData) {
          setAssignment(assignData as AssignmentDetail);

          const { data: refData } = await supabase
            .from("references")
            .select("*")
            .eq("assignment_id", id);

          if (refData) {
            setReferences(refData as ReferenceItem[]);
          }
        }
      } catch (err) {
        console.error("Error loading assignment:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [id, supabase]);

  const handleCopyAnswer = async () => {
    if (!assignment?.answer) return;
    const success = await copyToClipboard(assignment.answer);
    if (success) {
      setCopiedAnswer(true);
      addToast({
        type: "success",
        title: "Berhasil Disalin",
        description: "Jawaban telah disalin ke clipboard.",
      });
      setTimeout(() => setCopiedAnswer(false), 2000);
    } else {
      addToast({
        type: "error",
        title: "Gagal Menyalin",
        description: "Format browser tidak mendukung penyalinan otomatis pada HTTP.",
      });
    }
  };

  const handleDownloadWord = async () => {
    if (!assignment) return;
    await downloadDocxFile({
      assignmentId: assignment.id,
      title: `TUGAS ${assignment.course_name.toUpperCase()}`,
      courseName: assignment.course_name,
      assignmentType: assignment.assignment_type,
      question: assignment.question,
      answer: assignment.answer,
      references: references,
      onLoadingChange: setIsDownloadingDocx,
      addToast,
    });
  };

  const handleCopyCitation = async (refItem: ReferenceItem, idx: number) => {
    const authors = refItem.authors || "Penulis Tidak Ditentukan";
    const year = refItem.year || "n.d.";
    const journal = refItem.journal || "Jurnal Ilmiah";
    const doi = refItem.doi ? ` https://doi.org/${refItem.doi}` : "";

    const citationAPA = `${authors} (${year}). ${refItem.title}. ${journal}.${doi}`;

    const success = await copyToClipboard(citationAPA);
    if (success) {
      setCopiedRefId(refItem.id || String(idx));
      addToast({
        type: "success",
        title: "Sitasi APA 7 Disalin",
        description: citationAPA.slice(0, 70) + "...",
      });
      setTimeout(() => setCopiedRefId(null), 2000);
    } else {
      addToast({
        type: "error",
        title: "Gagal Menyalin Sitasi",
        description: "Browser tidak mengizinkan penyalinan pada HTTP.",
      });
    }
  };

  const handleRewrite = async (action: string) => {
    if (!assignment) return;

    setIsRewriting(true);
    setRewriteAction(action);

    try {
      // Invoke Supabase Edge Function for Rewrite
      const data = await invokeEdgeFunction<{ new_answer: string }>("rewrite-assignment", {
        assignment_id: assignment.id,
        action,
        original_question: assignment.question,
        current_answer: assignment.answer,
      });

      const newAnswer = data.new_answer;
      setAssignment((prev) => (prev ? { ...prev, answer: newAnswer } : null));

      // Save revision to DB if user is logged in
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && assignment.id) {
          await supabase.from("revisions").insert({
            assignment_id: assignment.id,
            type: action,
            old_content: assignment.answer,
            new_content: newAnswer,
          });

          await supabase
            .from("assignments")
            .update({ answer: newAnswer, updated_at: new Date().toISOString() })
            .eq("id", assignment.id)
            .eq("user_id", user.id);
        }
      } catch (dbErr) {
        console.warn("[Save Revision DB Error]:", dbErr);
      }

      addToast({
        type: "success",
        title: "Revisi Berhasil!",
        description: `Gaya bahasa telah disesuaikan (${action}).`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi masalah saat merevisi.";
      addToast({
        type: "error",
        title: "Revisi Gagal",
        description: errorMsg,
      });
    } finally {
      setIsRewriting(false);
      setRewriteAction(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-600">Memuat hasil tugas...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600">Tugas tidak ditemukan.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP BACK BAR & METADATA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                {assignment.course_name}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                {assignment.assignment_type}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dibuat pada:{" "}
              {new Date(assignment.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadWord}
            disabled={isDownloadingDocx}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
          >
            {isDownloadingDocx ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                Membuat dokumen Word...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-400" />
                Download Word
              </>
            )}
          </button>

          <button
            onClick={handleCopyAnswer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs shrink-0"
          >
            {copiedAnswer ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Jawaban
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN DESKTOP 70% LEFT / 30% RIGHT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* LEFT COLUMN 70% */}
        <div className="lg:col-span-7 space-y-6">
          {/* REVISION TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-blue-600" />
              Perbaiki & Modifikasi Jawaban
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleRewrite("natural")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50"
              >
                {isRewriting && rewriteAction === "natural" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                Buat Lebih Natural
              </button>

              <button
                onClick={() => handleRewrite("academic")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50"
              >
                {isRewriting && rewriteAction === "academic" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                Lebih Akademik
              </button>

              <button
                onClick={() => handleRewrite("shorten")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50"
              >
                {isRewriting && rewriteAction === "shorten" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                Persingkat
              </button>

              <button
                onClick={() => handleRewrite("expand")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50"
              >
                {isRewriting && rewriteAction === "expand" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                Perpanjang
              </button>

              <button
                onClick={() => handleRewrite("add_references")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50"
              >
                {isRewriting && rewriteAction === "add_references" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                Tambahkan Referensi
              </button>

              <button
                onClick={() => handleRewrite("regenerate")}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Generate Ulang
              </button>
            </div>
          </div>

          {/* ANSWER CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pertanyaan Tugas
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {assignment.question}
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm">
              <ReactMarkdown>{assignment.answer}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN 30% - REFERENSI */}
        <div className="lg:col-span-3 space-y-4 sticky top-20">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Referensi Digunakan
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {references.length}
              </span>
            </div>

            {references.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p>Tidak ada referensi jurnal eksternal yang dilampirkan.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {references.map((ref, idx) => (
                  <div
                    key={ref.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5 transition hover:border-blue-200"
                  >
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {ref.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 font-medium">
                      {ref.authors || "Anonim"} • {ref.year || "N/A"}
                    </p>

                    <p className="text-[11px] text-blue-600 font-semibold italic truncate">
                      {ref.journal || "Jurnal Ilmiah"}
                    </p>

                    <div>
                      {ref.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Belum Terverifikasi
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-2">
                      {ref.url && ref.url !== "#" ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Buka Sumber
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">Teks Utama</span>
                      )}

                      <button
                        onClick={() => handleCopyCitation(ref, idx)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-[10px] font-semibold transition shadow-2xs"
                      >
                        {copiedRefId === (ref.id || String(idx)) ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Sitasi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Memuat halaman tugas...</p>
        </div>
      }
    >
      <AssignmentDetailContent />
    </Suspense>
  );
}
