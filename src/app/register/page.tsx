"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Building2,
  BookOpen,
  IdCard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { addToast } = useToast();
  const supabase = createClient();

  const getIndonesianErrorMessage = (errorMsg: string): string => {
    const lower = errorMsg.toLowerCase();
    if (lower.includes("already registered") || lower.includes("already exists")) {
      return "Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.";
    }
    if (lower.includes("weak password") || lower.includes("password should be")) {
      return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    }
    if (lower.includes("invalid email")) {
      return "Format alamat email tidak valid.";
    }
    return errorMsg || "Gagal melakukan pendaftaran. Silakan coba kembali.";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      addToast({
        type: "error",
        title: "Input Belum Lengkap",
        description: "Nama lengkap, email, kata sandi, dan konfirmasi kata sandi wajib diisi.",
      });
      return;
    }

    if (password !== confirmPassword) {
      addToast({
        type: "error",
        title: "Kata Sandi Tidak Cocok",
        description: "Konfirmasi kata sandi tidak cocok dengan kata sandi yang Anda masukkan.",
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        type: "error",
        title: "Kata Sandi Terlalu Pendek",
        description: "Kata sandi minimal 6 karakter.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
            university,
            study_program: studyProgram,
            student_id: studentId,
          },
        },
      });

      if (error) {
        addToast({
          type: "error",
          title: "Registrasi Gagal",
          description: getIndonesianErrorMessage(error.message),
        });
      } else {
        // Try inserting profile if user exists
        if (data.user) {
          try {
            await supabase.from("profiles").upsert(
              {
                user_id: data.user.id,
                full_name: name,
                university: university || "",
                study_program: studyProgram || "",
                student_id: studentId || "",
              },
              { onConflict: "user_id" }
            );
          } catch (profileErr) {
            console.error("Profile insert error:", profileErr);
          }
        }

        if (!data.session) {
          addToast({
            type: "info",
            title: "Verifikasi Email Diperlukan",
            description: "Registrasi berhasil. Silakan periksa email Anda untuk melakukan verifikasi.",
          });
          router.push("/login");
        } else {
          addToast({
            type: "success",
            title: "Registrasi Berhasil!",
            description: "Akun Anda berhasil dibuat. Mengalihkan ke dashboard...",
          });
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi masalah jaringan.";
      addToast({
        type: "error",
        title: "Registrasi Gagal",
        description: getIndonesianErrorMessage(msg),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Buat Akun Mahasiswa Baru
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-8">
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hafiz Surya Wijaya"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mahasiswa@univ.ac.id"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 Karakter"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Sandi *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi Sandi"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Universitas (Opsional)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Contoh: Universitas Terbuka"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Program Studi
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studyProgram}
                    onChange={(e) => setStudyProgram(e.target.value)}
                    placeholder="Informatika"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  NIM (Opsional)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="041234567"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
