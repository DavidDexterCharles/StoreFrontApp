import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email });

  if (!user || user.password !== password) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401 },
    );
  }

  return NextResponse.json({ name: user.name, email: user.email });
}
