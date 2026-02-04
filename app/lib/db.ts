import { PrismaClient } from "@/prisma/awooga/client";
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({ 
  connectionString: process.env.POSTGRES_PRISMA_URL 
});
const prisma = new PrismaClient({ adapter });

export default prisma;