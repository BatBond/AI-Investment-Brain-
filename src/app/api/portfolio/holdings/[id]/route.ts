import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.quantity === "number") data.quantity = body.quantity;
    if (typeof body.avgCostBasis === "number") data.avgCostBasis = body.avgCostBasis;
    if (typeof body.type === "string") data.type = body.type;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof data.quantity === "number" && typeof data.avgCostBasis === "number") {
      data.costBasisTotal = (data.quantity as number) * (data.avgCostBasis as number);
    }
    const updated = await db.portfolioPosition.update({
      where: { id },
      data,
    });
    return NextResponse.json({ position: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.portfolioPosition.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
