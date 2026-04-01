import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const SEED_PRODUCTS = [
  {
    id: "prod-1",
    name: "Classic Sneakers",
    description: "Comfortable everyday sneakers in white.",
    price: 59.99,
  },
  {
    id: "prod-2",
    name: "Denim Jacket",
    description: "Stylish denim jacket with a relaxed fit.",
    price: 79.99,
  },
  {
    id: "prod-3",
    name: "Wireless Headphones",
    description: "Noise-reducing headphones with long battery life.",
    price: 129.99,
  },
  {
    id: "prod-4",
    name: "Leather Wallet",
    description: "Slim, durable wallet with several card slots.",
    price: 34.99,
  },
  {
    id: "prod-5",
    name: "Travel Backpack",
    description: "Lightweight backpack with laptop compartment.",
    price: 69.99,
  },
];

export async function GET() {
  const db = await getDb();
  const collection = db.collection("products");
  const existing = await collection.find().toArray();

  if (existing.length > 0) {
    return NextResponse.json(existing);
  }

  await collection.insertMany(SEED_PRODUCTS);
  return NextResponse.json(SEED_PRODUCTS);
}
