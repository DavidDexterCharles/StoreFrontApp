import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection("users");
  const existing = await users.findOne({ email });

  if (existing) {
    return NextResponse.json(
      { message: "User already exists." },
      { status: 409 },
    );
  }

  await users.insertOne({ name, email, password });
  return NextResponse.json({ name, email });
}
