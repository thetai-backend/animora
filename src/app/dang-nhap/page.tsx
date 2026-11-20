import React from "react";
import { redirect } from "next/navigation";
import { getSession, ROLE_META } from "@/lib/auth";
import { AuthClient } from "@/components/auth/AuthClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(ROLE_META[session.role]?.dashboardPath || "/");
  }

  return <AuthClient initialTab="login" />;
}
