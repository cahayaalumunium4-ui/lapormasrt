import { useState } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { error } = await supabase.auth.getSession();

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }

      return {
        ok: true,
        message: 'Koneksi Supabase berhasil.',
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Koneksi Supabase gagal.',
      };
    }
  };

  return {
    signIn,
    resetPassword,
    testConnection,
    loading,
  };
}
