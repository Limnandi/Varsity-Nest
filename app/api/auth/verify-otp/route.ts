import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: 'Deprecated: use StackAuth verification flows.' }, { status: 410 })
}


