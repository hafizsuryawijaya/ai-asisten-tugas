"use client";

import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Search,
  FileCheck,
  History,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
                AI Asisten Tugas
              </span>
              <span className="text-[10px] text-blue-600 font-medium tracking-wide uppercase">
                Mahasiswa
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-medium text-sm transition hover:bg-slate-100"
            >
              Masuk
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
            >
              {user ? "Ke Dashboard" : "Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Platform Pintar Akademik Mahasiswa</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            AI Asisten Tugas Mahasiswa
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Bantu pahami soal, susun draft jawaban, dan temukan referensi ilmiah yang relevan dalam satu tempat.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/tugas/baru"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#fitur"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-base border border-slate-200 shadow-sm transition"
            >
              Pelajari Fitur
            </Link>
          </div>

          {/* QUICK PROOF BADGES */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Pencarian Jurnal OpenAlex & Crossref Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Verifikasi DOI Otomatis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Format Sitasi APA 7</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="fitur" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase">
              Fitur Unggulan
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
              Solusi Lengkap Menyusun Tugas Akademik
            </p>
            <p className="mt-4 text-base text-slate-600">
              Dirancang khusus untuk membantu mahasiswa menyusun tugas kuliah dengan standar akademis tinggi dan referensi sahih.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <Link href="/dashboard/tugas/baru" className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 block">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Asisten Tugas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menyusun draft jawaban tugas diskusi, essay, maupun makalah dengan alur berpikir yang runtut dan akademis.
              </p>
            </Link>

            <Link href="/dashboard/referensi" className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 block">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pencarian Jurnal</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mencari referensi jurnal ilmiah asli langsung dari OpenAlex dan Crossref sesuai topik soal dan tahun terbit.
              </p>
            </Link>

            <Link href="/dashboard/analisis" className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 block">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analisis Tulisan</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menganalisis kejelasan argumen, struktur jawaban, kalimat panjang, serta estimasi pola tulisan secara lugas.
              </p>
            </Link>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verifikasi Referensi</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap jurnal diperiksa keaslian metadata dan DOI-nya. Tanpa jurnal rekaan AI yang menyesatkan.
              </p>
            </div>

            <Link href="/dashboard/riwayat" className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 block">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Riwayat Tugas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Simpan semua riwayat pengerjaan tugas, sitasi, dan catatan revisi Anda dengan aman di cloud.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* DISCLAIMER SECTION */}
      <section className="py-14 bg-amber-50/60 border-b border-amber-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-amber-900">Disclaimer & Etika Penggunaan Akademik</h3>
          <p className="mt-2 text-sm text-amber-800 leading-relaxed max-w-2xl mx-auto">
            Hasil pengerjaan dan draft jawaban dari platform AI ini bertujuan sebagai alat bantu pemahaman awal dan studi literatur. Hasil AI sebaiknya diperiksa, dipahami, dan disesuaikan sendiri oleh mahasiswa sebelum dikumpulkan untuk menjaga integritas dan etika akademik.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-slate-200 text-sm">AI Asisten Tugas Mahasiswa</span>
          </div>
          <p>© {new Date().getFullYear()} AI Asisten Tugas Mahasiswa. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
