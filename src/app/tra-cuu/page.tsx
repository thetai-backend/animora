import React from "react";
import { getSession } from "@/lib/auth";
import { StickyHeader } from "@/components/StickyHeader";
import { LookupClient } from "@/components/booking/LookupClient";

export const dynamic = "force-dynamic";

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#132A2E]">
      <StickyHeader session={session} />
      <main className="mx-auto max-w-[960px] px-8 py-12">
        <LookupClient initialCode={sp.code || ""} />
      </main>
    </div>
  );
}
