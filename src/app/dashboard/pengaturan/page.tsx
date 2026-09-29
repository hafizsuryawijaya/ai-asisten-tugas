"use client";

import React, { useState, useEffect } from "react";
import { Settings, User, Building2, BookOpen, Mail, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUniversity(profile.university || "");
      setStudyProgram(profile.study_program || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        name,
        university,
        study_program: studyProgram,
      });

      if (error) throw error;

      await refreshProfile();

      addToast({
        type: "success",
        title: "Pengaturan Disimpan",
        description: "Profil mahasiswa Anda berhasil diperbarui.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan profil.";
      addToast({
        type: "error",
        title: "Gagal Menyimpan",
        description: errorMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-blue-600" />
          Pengaturan Akun & Profil
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola informasi identitas mahasiswa dan universitas Anda.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Alamat Email (Akun)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              disabled
              value={user?.email || "mahasiswa@univ.ac.id"}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Nama Lengkap *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Pratama"
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Universitas / Perguruan Tinggi
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Contoh: Universitas Gadjah Mada"
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Program Studi / Jurusan
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={studyProgram}
              onChange={(e) => setStudyProgram(e.target.value)}
              placeholder="Contoh: Teknik Informatika"
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
