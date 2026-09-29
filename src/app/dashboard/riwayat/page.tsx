"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

interface AssignmentHistoryItem {
  id: string;
  course_name: string;
  assignment_type: string;
  question: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("Semua");
  const [selectedType, setSelectedType] = useState("Semua");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, course_name, assignment_type, question, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: sortOrder === "oldest" });

      if (!error && data) {
        setAssignments(data as AssignmentHistoryItem[]);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, sortOrder, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat tugas ini?")) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id);

      if (error) throw error;

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      addToast({
        type: "success",
        title: "Tugas Dihapus",
        description: "Riwayat tugas berhasil dihapus dari akun Anda.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data.";
      addToast({
        type: "error",
        title: "Gagal Menghapus",
        description: errorMsg,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const courses = Array.from(new Set(assignments.map((a) => a.course_name)));
  const types = ["Diskusi", "Essay", "Makalah", "Pertanyaan", "Ringkasan"];

  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === "Semua" || item.course_name === selectedCourse;
    const matchesType = selectedType === "Semua" || item.assignment_type === selectedType;

    return matchesSearch && matchesCourse && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-7 h-7 text-blue-600" />
          Riwayat Tugas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola dan lihat kembali seluruh draft pengerjaan tugas dan referensi yang telah Anda buat.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kata kunci atau matkul..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Semua">Semua Mata Kuliah</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Semua">Semua Jenis Tugas</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
          {sortOrder === "newest" ? "Urutan: Terbaru" : "Urutan: Terlama"}
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat riwayat...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada riwayat tugas</p>
            <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci atau buat tugas baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssignments.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                      {item.course_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {item.assignment_type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {item.question}
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/tugas/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs"
                  >
                    Buka
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
