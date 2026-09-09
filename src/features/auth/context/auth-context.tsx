import type { AuthError, Session, SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import type { Database } from "../../../lib/supabase/database.types";
import type { AuthState } from "../model/auth-types";

type AuthResult = { error: AuthError | null };

export type VerifyOtpResult = {
  error: AuthError | null;
  session: Session | null;
};

type AuthContextValue = {
  client: SupabaseClient<Database> | null;
  state: AuthState;
  requestPasswordReset: (email: string, redirectTo: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<AuthResult>;
  verifyOtp: (params: { token_hash: string; type: "invite" }) => Promise<VerifyOtpResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  client = getSupabaseBrowserClient(),
}: {
  children: ReactNode;
  client?: SupabaseClient<Database> | null;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(
    client ? { status: "initializing" } : { status: "configuration_error" },
  );

  useEffect(() => {
    if (!client) return;

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(
        data.session
          ? { status: "signed_in", session: data.session, user: data.session.user }
          : { status: "signed_out" },
      );
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState(
        session
          ? { status: "signed_in", session, user: session.user }
          : { status: "signed_out" },
      );
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: null };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (client) await client.auth.signOut();
    queryClient.clear();
  }, [client, queryClient]);

  const requestPasswordReset = useCallback(
    async (email: string, redirectTo: string) => {
      if (!client) return { error: null };
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error };
    },
    [client],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!client) return { error: null };
      const { error } = await client.auth.updateUser({ password });
      return { error };
    },
    [client],
  );

  const verifyOtp = useCallback(
    async ({ token_hash, type }: { token_hash: string; type: "invite" }): Promise<VerifyOtpResult> => {
      if (!client) return { error: null, session: null };
      const { data, error } = await client.auth.verifyOtp({
        token_hash,
        type,
      });
      return { error, session: data?.session ?? null };
    },
    [client],
  );

  const value = useMemo(
    () => ({
      client,
      requestPasswordReset,
      signIn,
      signOut,
      state,
      updatePassword,
      verifyOtp,
    }),
    [client, requestPasswordReset, signIn, signOut, state, updatePassword, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
