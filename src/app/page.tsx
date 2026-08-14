import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function Home() {
  redirect((await getCurrentUserId()) ? "/dashboard" : "/login");
}
