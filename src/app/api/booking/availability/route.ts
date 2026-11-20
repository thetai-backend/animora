import { NextRequest, NextResponse } from "next/server";
import { computeDayAvailability, getTodayDateStr } from "@/lib/booking-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getTodayDateStr();
  const duration = Number(searchParams.get("duration") || "30");
  const doctorId = searchParams.get("doctorId") || null;

  const result = await computeDayAvailability({
    date,
    durationMinutes: Number.isFinite(duration) ? duration : 30,
    doctorId: doctorId === "AUTO" ? null : doctorId,
  });

  return NextResponse.json(result);
}
