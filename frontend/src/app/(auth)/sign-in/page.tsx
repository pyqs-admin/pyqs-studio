import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return <main className="grid min-h-screen place-items-center px-4 py-12"><section className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm"><p className="mb-2 text-sm font-medium text-slate-600">PYQS</p><h1 className="text-2xl font-semibold tracking-tight">Content Studio</h1><p className="mt-2 text-sm leading-6 text-slate-600">Sign in to create, review, and publish exam content.</p><SignInForm /></section></main>;
}
