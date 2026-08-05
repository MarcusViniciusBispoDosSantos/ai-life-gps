import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { simulate } from "../lib/simulation/engine";
import { DecisionInput, SimulationResult } from "../lib/simulation/types";

interface SavedSimulation {
  id: string;
  question: string;
  created_at: string;
  result: SimulationResult;
}

interface AppState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  lastResult: SimulationResult | null;
  runSimulation: (input: DecisionInput) => SimulationResult;
  clearResult: () => void;
  savedSimulations: SavedSimulation[];
  saveCurrent: () => Promise<boolean>;
  loadSaved: () => Promise<void>;
  deleteSaved: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) console.error("Sign-in error:", error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const runSimulation = useCallback((input: DecisionInput) => {
    const result = simulate(input);
    setLastResult(result);
    return result;
  }, []);

  const clearResult = useCallback(() => setLastResult(null), []);

  const saveCurrent = useCallback(async () => {
    if (!user || !lastResult) return false;
    const { error } = await supabase.from("simulations").insert({
      user_id: user.id,
      question: lastResult.input.question,
      result: lastResult,
    });
    if (error) {
      console.error("Save error:", error.message);
      return false;
    }
    await loadSaved();
    return true;
  }, [user, lastResult]);

  const loadSaved = useCallback(async () => {
    if (!user) {
      setSavedSimulations([]);
      return;
    }
    const { data, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Load error:", error.message);
      return;
    }
    setSavedSimulations((data ?? []) as SavedSimulation[]);
  }, [user]);

  const deleteSaved = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from("simulations").delete().eq("id", id);
      await loadSaved();
    },
    [user, loadSaved],
  );

  useEffect(() => {
    if (user) void loadSaved();
  }, [user, loadSaved]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signIn,
      signOut,
      lastResult,
      runSimulation,
      clearResult,
      savedSimulations,
      saveCurrent,
      loadSaved,
      deleteSaved,
    }),
    [
      session,
      user,
      loading,
      signIn,
      signOut,
      lastResult,
      runSimulation,
      clearResult,
      savedSimulations,
      saveCurrent,
      loadSaved,
      deleteSaved,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
