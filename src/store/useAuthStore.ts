import { create } from 'zustand';
import { checkIsAdmin } from '../lib/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResult {
  error?: string;
  info?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  init: () => void;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: isSupabaseConfigured,

  init: () => {
    if (initialized || !supabase) return;
    initialized = true;

    const applySession = (u: { id: string; email?: string } | null | undefined) => {
      if (!u) {
        set({ user: null, isAdmin: false, loading: false });
        return;
      }
      set({ user: { id: u.id, email: u.email ?? '' }, loading: false });
      checkIsAdmin(u.id).then((isAdmin) => set({ isAdmin }));
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user));
    supabase.auth.onAuthStateChange((_event, session) => applySession(session?.user));
  },

  signUp: async (email, password) => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && !data.session) {
      return { info: 'Check your email to confirm your account, then sign in.' };
    }
    return {};
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    await supabase?.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));
