"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id?: string;
  user_id: string;
  full_name?: string;
  name: string;
  university?: string;
  study_program?: string;
  student_id?: string;
  role?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string, currentUser?: User | null) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        const activeUser = currentUser || user;
        const meta = activeUser?.user_metadata || {};

        if (!error && data) {
          setProfile({
            id: data.id,
            user_id: data.user_id,
            full_name: data.full_name || data.name || meta.full_name || meta.name,
            name: data.full_name || data.name || meta.full_name || meta.name || activeUser?.email?.split("@")[0] || "Mahasiswa",
            university: data.university || meta.university || "",
            study_program: data.study_program || meta.study_program || "",
            student_id: data.student_id || meta.student_id || "",
            role: data.role || meta.role || "user",
          });
        } else {
          setProfile({
            user_id: userId,
            full_name: meta.full_name || meta.name,
            name: meta.full_name || meta.name || activeUser?.email?.split("@")[0] || "Mahasiswa",
            university: meta.university || "",
            study_program: meta.study_program || "",
            student_id: meta.student_id || "",
            role: meta.role || "user",
          });
        }
      } catch (err) {
        console.error("[AuthContext] fetchProfile error:", err);
      }
    },
    [supabase, user]
  );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext] session check error:", err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch {
      if (mounted) setLoading(false);
    }
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] signOut error:", err);
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
