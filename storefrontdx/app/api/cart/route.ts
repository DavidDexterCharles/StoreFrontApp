import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type CartItem = {
  productId: string;
  quantity: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "Missing email query parameter." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const cart = await db.collection("carts").findOne({ email });
  return NextResponse.json(cart?.items || []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, productId, quantity } = body as {
    email: string;
    productId: string;
    quantity: number;
  };

  if (!email || !productId || !quantity) {
    return NextResponse.json(
      { message: "Email, productId, and quantity are required." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const carts = db.collection("carts");
  const cart = await carts.findOne<{ email: string; items: CartItem[] }>({
    email,
  });
  const items = cart?.items ?? [];
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }

  await carts.updateOne(
    { email },
    { $set: { email, items } },
    { upsert: true },
  );

  return NextResponse.json(items);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { email, productId, quantity } = body as {
    email: string;
    productId: string;
    quantity: number;
  };

  if (!email || !productId || quantity == null) {
    return NextResponse.json(
      { message: "Email, productId, and quantity are required." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const carts = db.collection("carts");
  const cart = await carts.findOne<{ email: string; items: CartItem[] }>({
    email,
  });
  const items = cart?.items ?? [];
  const existing = items.find((item) => item.productId === productId);

  if (!existing) {
    return NextResponse.json(
      { message: "Cart item not found." },
      { status: 404 },
    );
  }

  if (quantity <= 0) {
    const nextItems = items.filter((item) => item.productId !== productId);
    await carts.updateOne(
      { email },
      { $set: { email, items: nextItems } },
      { upsert: true },
    );
    return NextResponse.json(nextItems);
  }

  existing.quantity = quantity;
  await carts.updateOne(
    { email },
    { $set: { email, items } },
    { upsert: true },
  );
  return NextResponse.json(items);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { email, productId } = body as { email: string; productId?: string };

  if (!email) {
    return NextResponse.json(
      { message: "Email is required." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const carts = db.collection("carts");
  const cart = await carts.findOne<{ email: string; items: CartItem[] }>({
    email,
  });
  const items = cart?.items ?? [];

  const nextItems = productId
    ? items.filter((item) => item.productId !== productId)
    : [];
  await carts.updateOne(
    { email },
    { $set: { email, items: nextItems } },
    { upsert: true },
  );
  return NextResponse.json(nextItems);
}
