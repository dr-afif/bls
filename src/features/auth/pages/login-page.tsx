import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useAuth } from "../context/auth-context";
import { getSafeAuthError } from "../lib/auth-errors";
import { AuthLayout } from "../components/auth-layout";
import { FormField } from "../components/form-field";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { state, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  if (state.status === "signed_in") return <Navigate replace to="/app" />;

  const from = (location.state as { from?: string } | null)?.from ?? "/app";
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setRequestError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setRequestError(getSafeAuthError(error));
      return;
    }
    navigate(from, { replace: true });
  });

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold text-primary">Invite-only access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use the account provided by your course organization. Public sign-up
          is not available.
        </p>

        <Card className="mt-7">
          <CardContent className="pt-5 sm:pt-6">
            {state.status === "configuration_error" && (
              <div className="mb-5 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning" role="alert">
                <strong>Sign-in is not configured.</strong> Add the public
                Supabase URL and publishable key to this deployment. No secret
                key belongs in the browser.
              </div>
            )}
            {requestError && (
              <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive-soft p-4 text-sm font-medium text-destructive" role="alert">
                {requestError}
              </div>
            )}
            <form className="space-y-5" noValidate onSubmit={onSubmit}>
              <FormField
                autoComplete="email"
                error={errors.email?.message}
                id="email"
                label="Email address"
                type="email"
                {...register("email")}
              />
              <FormField
                autoComplete="current-password"
                error={errors.password?.message}
                id="password"
                label="Password"
                type="password"
                {...register("password")}
              />
              <div className="flex justify-end">
                <Link className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-primary hover:underline" to="/auth/forgot-password">
                  Forgot password?
                </Link>
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting || state.status === "configuration_error"}
                size="lg"
                type="submit"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
                {!isSubmitting && <ArrowRight aria-hidden="true" />}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Route guards improve navigation; Supabase Row Level Security remains
          the authorization boundary for browser-accessible data.
        </p>
      </div>
    </AuthLayout>
  );
}
