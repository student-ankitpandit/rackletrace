import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../prisma/generated/prisma/client"

const GlobalForPrisma = global as unknown as {prisma: PrismaClient}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = GlobalForPrisma.prisma || new PrismaClient({ adapter })

if(process.env.NODE_ENV !== "production") GlobalForPrisma.prisma = prisma

export default prisma