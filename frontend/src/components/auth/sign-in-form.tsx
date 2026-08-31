"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const signInSchema = z.object({ email: z.string().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.") });
type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [magicLinkSent, setMagicLinkSent] = useState(false);
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const submit = async (values: SignInValues) => { setError(null); const { error: signInError } = await createClient().auth.signInWithPassword(values); if (signInError) { setError(signInError.message); return; } router.replace("/dashboard"); router.refresh(); };
  const sendMagicLink = async () => { const email = form.getValues("email"); if (!z.string().email().safeParse(email).success) { form.setError("email", { message: "Enter your email address first." }); return; } setError(null); const { error: otpError } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } }); if (otpError) { setError(otpError.message); return; } setMagicLinkSent(true); };
  return <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)} noValidate><label className="grid gap-1.5 text-sm font-medium">Email<input className="h-10 rounded-md border bg-white px-3 outline-none transition focus:ring-2 focus:ring-slate-950" autoComplete="email" type="email" {...form.register("email")} />{form.formState.errors.email && <span className="text-xs text-red-700">{form.formState.errors.email.message}</span>}</label><label className="grid gap-1.5 text-sm font-medium">Password<input className="h-10 rounded-md border bg-white px-3 outline-none transition focus:ring-2 focus:ring-slate-950" autoComplete="current-password" type="password" {...form.register("password")} />{form.formState.errors.password && <span className="text-xs text-red-700">{form.formState.errors.password.message}</span>}</label>{error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}{magicLinkSent && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">Magic link sent. Check your inbox.</p>}<Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}Sign in</Button><Button className="w-full" type="button" variant="outline" onClick={sendMagicLink}>Email me a magic link</Button></form>;
}
