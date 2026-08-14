"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { getApiError } from "@/lib/http/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";
  const hasFieldErrors = Object.keys(fieldErrors).some((field) => field !== "request");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!response.ok) {
        const apiError = await getApiError(response);
        setError(apiError.message);
        setFieldErrors(apiError.details);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach SettleFlow. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input className="field" id="email" name="email" type="email" autoComplete="email" required autoFocus placeholder="you@company.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
        {fieldErrors.email ? <p id="email-error" className="mt-1.5 text-xs text-rose-700">{fieldErrors.email}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          required
          placeholder="At least 8 characters"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password ? <p id="password-error" className="mt-1.5 text-xs text-rose-700">{fieldErrors.password}</p> : null}
      </div>
      {error && !hasFieldErrors ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={submitting}>
        {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isLogin ? "Log in" : "Create account"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
      <p className="text-center text-sm text-[#66756e]">
        {isLogin ? "New to SettleFlow?" : "Already have an account?"}{" "}
        <Link className="font-semibold text-[#176b4d] hover:underline" href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
