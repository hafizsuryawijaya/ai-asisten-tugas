"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { addToast } = useToast();
  const supabase = createClient();

  const getIndonesianErrorMessage = (errorMsg: string): string => {
    const lower = errorMsg.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
      return "Email atau kata sandi yang Anda masukkan salah.";
    }
    if (lower.includes("email not confirmed")) {
      return "Email Anda belum terverifikasi. Silakan periksa kotak masuk email Anda.";
    }
    if (lower.includes("too many requests") || lower.includes("rate limit")) {
      return "Terlalu banyak percobaan login. Silakan tunggu beberapa menit.";
    }
    return errorMsg || "Gagal masuk. Silakan periksa kembali akun Anda.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: "error",
        title: "Input Tidak Lengkap",
        description: "Harap isi alamat email dan password Anda.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addToast({
          type: "error",
          title: "Gagal Masuk",
          description: getIndonesianErrorMessage(error.message),
        });
      } else {
        addToast({
          type: "success",
          title: "Berhasil Masuk",
          description: "Mengalihkan ke dashboard...",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      addToast({
        type: "error",
        title: "Gagal Masuk",
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
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            Daftar Sekarang
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-8">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mahasiswa@univ.ac.id"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
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
