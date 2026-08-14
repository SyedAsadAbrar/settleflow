import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUserId } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getCurrentUserId()) redirect("/dashboard");
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-semibold text-[#176b4d]">Get started</p>
      <h1 className="text-3xl font-bold tracking-[-0.035em]">Create your workspace</h1>
      <p className="mt-3 text-sm leading-6 text-[#66756e]">Set up your account and create your first order in minutes.</p>
      <AuthForm mode="signup" />
    </div>
  );
}
