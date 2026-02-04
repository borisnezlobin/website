import { PrismaClient } from "@/prisma/awooga/client";
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_URL_NON_POOLING
});
const prisma = new PrismaClient({ adapter });

export default prisma;