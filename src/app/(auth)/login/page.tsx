import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUserId } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUserId()) redirect("/dashboard");
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-semibold text-[#176b4d]">Welcome back</p>
      <h1 className="text-3xl font-bold tracking-[-0.035em]">Log in to your workspace</h1>
      <p className="mt-3 text-sm leading-6 text-[#66756e]">Track every order and reconcile each payment with confidence.</p>
      <AuthForm mode="login" />
    </div>
  );
}
