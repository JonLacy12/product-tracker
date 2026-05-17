import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/useSessionStore';
import { useUIStore } from '@/store/useUIStore';

interface AuthState {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Hydrate from existing session on store creation, then subscribe to changes.
  supabase.auth
    .getSession()
    .then(({ data }) => {
      set({ session: data.session, loading: false });
    })
    .catch(() => {
      useUIStore
        .getState()
        .showToast('error', "Couldn't connect to authentication service. Please try again.");
      set({ loading: false });
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session });
    if (!session) {
      useSessionStore.getState().lock();
    }
  });

  return {
    session: null,
    loading: true,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },

    async signOut() {
      await supabase.auth.signOut();
      // onAuthStateChange fires with null session and handles reset + lock.
    },
  };
});
