import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 2. Edit Bagian Ini (Optimasi Pool untuk Enterprise Dashboard)
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  max: 20, // Menaikkan batas koneksi simultan (default biasanya 10)
  idleTimeoutMillis: 30000, // Menutup koneksi yang tidak dipakai setelah 30 detik
  connectionTimeoutMillis: 10000, // Batas waktu tunggu koneksi baru (10 detik)
});

// 3. Masukkan pool ke dalam PrismaPg
const adapter = new PrismaPg(pool as any);

const prismaClientSingleton = () => {
  return new PrismaClient({ 
    adapter,
    // Tambahkan log error agar kamu bisa melihat detail jika query gagal di terminal
    log: ['error'], 
  });
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;