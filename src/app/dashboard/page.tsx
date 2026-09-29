"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  FileCheck,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/client";

interface AssignmentSummary {
  id: string;
  course_name: string;
  assignment_type: string;
  question: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalReferences: 0,
    totalAnalyses: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch assignments count
        const { count: assignCount } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch recent assignments
        const { data: assignData } = await supabase
          .from("assignments")
          .select("id, course_name, assignment_type, question, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch references count
        const { count: refCount } = await supabase
          .from("references")
          .select("id", { count: "exact", head: true });

        // Fetch analyses count
        const { count: anaCount } = await supabase
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setStats({
          totalAssignments: assignCount || (assignData?.length ?? 0),
          totalReferences: refCount || 0,
          totalAnalyses: anaCount || 0,
        });

        if (assignData) {
          setRecentAssignments(assignData as AssignmentSummary[]);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, supabase]);

  const userName = profile?.name || user?.email?.split("@")[0] || "Mahasiswa";

  return (
    <div className="space-y-8">
      {/* WELCOME HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Asisten Akademik</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Halo, {userName} 👋
          </h1>
          <p className="mt-2 text-blue-100 text-sm max-w-xl">
            Siap menyelesaikan tugas kuliah hari ini? Gunakan asisten AI kami untuk menyusun draft jawaban dan referensi terpercaya.
          </p>
        </div>

        <Link
          href="/dashboard/tugas/baru"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-md hover:bg-blue-50 transition shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Buat Tugas Baru
        </Link>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* STAT 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tugas Dibuat
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? "..." : stats.totalAssignments}
            </p>
          </div>
        </div>

        {/* STAT 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Referensi Ditemukan
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? "..." : stats.totalReferences}
            </p>
          </div>
        </div>

        {/* STAT 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Analisis Dilakukan
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? "..." : stats.totalAnalyses}
            </p>
          </div>
        </div>
      </div>

      {/* RECENT ASSIGNMENTS SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tugas Terakhir</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar tugas yang baru saja Anda susun
            </p>
          </div>
          <Link
            href="/dashboard/riwayat"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Memuat riwayat tugas...</p>
          </div>
        ) : recentAssignments.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Belum Ada Tugas Dibuat</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Mulai buat pengerjaan tugas pertama Anda dengan menekan tombol di bawah.
            </p>
            <Link
              href="/dashboard/tugas/baru"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Tugas Sekarang
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAssignments.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                      {item.course_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {item.assignment_type}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {item.question}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Link
                  href={`/dashboard/tugas/${item.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white text-slate-700 hover:text-blue-600 text-xs font-semibold transition shrink-0"
                >
                  Buka Jawaban
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
