import { PrismaClient } from "@/prisma/awooga/client";
import { PrismaNeon } from "@prisma/adapter-neon";

function createPrismaClient() {
  const connectionString = process.env.PROD_POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error("PROD_POSTGRES_PRISMA_URL is not set");
  }
  // Neon's serverless adapter uses HTTP/WebSockets instead of requiring a
  // direct TCP connection to PostgreSQL on port 5432. This also works on
  // networks that block outbound database ports.
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy initialization to avoid errors during build when env vars aren't available
let prisma: PrismaClient | null = null;

function getDb(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb() as any)[prop];
  }
});

export default db;
