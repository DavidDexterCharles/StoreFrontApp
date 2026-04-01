import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "storefrontdx";

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  globalWithMongo._mongoClient = new MongoClient(uri);
  globalWithMongo._mongoClientPromise = globalWithMongo._mongoClient.connect();
}

export const mongoClientPromise = globalWithMongo._mongoClientPromise;

export async function getDb() {
  const client = await mongoClientPromise;
  return client.db(dbName);
}
