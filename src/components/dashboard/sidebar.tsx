"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  History,
  Search,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tugas/baru", label: "Buat Tugas", icon: PlusCircle },
  { href: "/dashboard/riwayat", label: "Riwayat", icon: History },
  { href: "/dashboard/referensi", label: "Referensi", icon: Search },
  { href: "/dashboard/analisis", label: "Analisis Tulisan", icon: FileCheck },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { addToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({
        type: "info",
        title: "Keluar Akun",
        description: "Anda telah keluar dari aplikasi.",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* BRAND */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
              AI Asisten Tugas
            </span>
            <span className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase">
              Mahasiswa
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NAVIGATION LINKS */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
              pathname.startsWith("/admin")
                ? "bg-purple-50 text-purple-600 font-semibold"
                : "text-purple-600 hover:bg-purple-50"
            }`}
          >
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Admin Dashboard</span>
          </Link>
        )}
      </div>

      {/* USER PROFILE FOOTER */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
            {(profile?.full_name || profile?.name || user?.email)?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {profile?.full_name || profile?.name || user?.email?.split("@")[0] || "Mahasiswa"}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {profile?.university || profile?.study_program || user?.email || "Mahasiswa"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Akun
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <NavContent />
      </aside>

      {/* MOBILE TRIGGER HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-900 text-sm">AI Asisten Tugas</span>
        </Link>
        <div className="w-6" />
      </div>

      {/* MOBILE OVERLAY DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-full z-10">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
