"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirectTo=/admin");
      } else if (profile?.role !== "admin") {
        router.push("/dashboard");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-tight">
                Admin Control Center
              </span>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">
                AI Asisten Tugas Mahasiswa
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Ke User Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
