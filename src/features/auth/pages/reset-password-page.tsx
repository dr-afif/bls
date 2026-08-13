import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { AuthLayout } from "../components/auth-layout";
import { FormField } from "../components/form-field";
import { useAuth } from "../context/auth-context";
import { getSafeAuthError } from "../lib/auth-errors";

const schema = z.object({
  confirmPassword: z.string(),
  password: z.string().min(12, "Use at least 12 characters."),
}).refine(({ confirmPassword, password }) => confirmPassword === password, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});
type Values = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { state, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState<string | null>(null);
  const { formState: { errors, isSubmitting }, handleSubmit, register } =
    useForm<Values>({ resolver: zodResolver(schema) });

  if (state.status === "signed_out") return <Navigate replace to="/auth/login" />;

  const onSubmit = handleSubmit(async ({ password }) => {
    setRequestError(null);
    const { error } = await updatePassword(password);
    if (error) {
      setRequestError(getSafeAuthError(error));
      return;
    }
    navigate("/app", { replace: true });
  });

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-3 text-sm text-muted-foreground">Use at least 12 characters. Avoid passwords used for other services.</p>
        <Card className="mt-7"><CardContent className="pt-5 sm:pt-6">
          <form className="space-y-5" noValidate onSubmit={onSubmit}>
            {requestError && <p className="rounded-xl bg-destructive-soft p-4 text-sm font-medium text-destructive" role="alert">{requestError}</p>}
            <FormField autoComplete="new-password" error={errors.password?.message} id="new-password" label="New password" type="password" {...register("password")} />
            <FormField autoComplete="new-password" error={errors.confirmPassword?.message} id="confirm-password" label="Confirm new password" type="password" {...register("confirmPassword")} />
            <Button className="w-full" disabled={isSubmitting || state.status !== "signed_in"} type="submit">{isSubmitting ? "Updating…" : "Update password"}</Button>
          </form>
        </CardContent></Card>
      </div>
    </AuthLayout>
  );
}
