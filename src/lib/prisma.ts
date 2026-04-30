import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres.dlmeobddgifgptjvpmtw:gdfdRqFUE56eyodm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
