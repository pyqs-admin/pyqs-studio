"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const signInSchema = z.object({ email: z.string().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.") });
type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });

  const submit = async (values: SignInValues) => {
    setError(null);
    const { error: signInError } = await createClient().auth.signInWithPassword(values);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  const sendMagicLink = async () => {
    const email = form.getValues("email");
    if (!z.string().email().safeParse(email).success) {
      form.setError("email", { message: "Enter your email address first." });
      return;
    }
    setError(null);
    const { error: otpError } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setMagicLinkSent(true);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <Field label="Email or username" className="mb-2.5">
        <Input autoComplete="email" type="email" autoCapitalize="off" spellCheck={false} {...form.register("email")} />
        {form.formState.errors.email && <p className="err">{form.formState.errors.email.message}</p>}
      </Field>
      <Field label="Password" className="mb-3.5">
        <Input autoComplete="current-password" type="password" {...form.register("password")} />
        {form.formState.errors.password && <p className="err">{form.formState.errors.password.message}</p>}
      </Field>
      {error && <p className="err mb-2" role="alert">{error}</p>}
      {magicLinkSent && <p className="small mb-2" role="status">Magic link sent. Check your inbox.</p>}
      <button className="btn pri w-full justify-center" type="submit" disabled={form.formState.isSubmitting}>
        Sign in
      </button>
      <button className="btn w-full justify-center !mt-3" type="button" onClick={sendMagicLink}>
        Email me a magic link
      </button>
    </form>
  );
}
