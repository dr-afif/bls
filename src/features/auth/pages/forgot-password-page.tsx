import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { AuthLayout } from "../components/auth-layout";
import { FormField } from "../components/form-field";
import { useAuth } from "../context/auth-context";
import { buildAuthReturnUrl, getSafeAuthError } from "../lib/auth-errors";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { requestPasswordReset, state } = useAuth();
  const [complete, setComplete] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { formState: { errors, isSubmitting }, handleSubmit, register } =
    useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setRequestError(null);
    const { error } = await requestPasswordReset(email, buildAuthReturnUrl());
    if (error) {
      setRequestError(getSafeAuthError(error));
      return;
    }
    setComplete(true);
  });

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Enter your invited email address. If an eligible account exists, you
          will receive a reset link.
        </p>
        <Card className="mt-7">
          <CardContent className="pt-5 sm:pt-6">
            {complete ? (
              <div role="status">
                <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
                <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  If that address is eligible, a password reset message is on
                  its way. The message is deliberately the same for every address.
                </p>
              </div>
            ) : (
              <form className="space-y-5" noValidate onSubmit={onSubmit}>
                {requestError && <p className="rounded-xl bg-destructive-soft p-4 text-sm font-medium text-destructive" role="alert">{requestError}</p>}
                <FormField autoComplete="email" error={errors.email?.message} id="reset-email" label="Email address" type="email" {...register("email")} />
                <Button className="w-full" disabled={isSubmitting || state.status === "configuration_error"} type="submit">
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline" to="/auth/login">
          Return to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
