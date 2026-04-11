import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    switch (type) {
      case "provinces":
        const provinces = await prisma.province.findMany({ 
          orderBy: { name: "asc" } 
        });
        return NextResponse.json(provinces);

      case "cities":
        if (!id) return NextResponse.json([]);
        const cities = await prisma.city.findMany({
          where: { provinceId: Number(id) },
          orderBy: { name: "asc" },
        });
        return NextResponse.json(cities);

      case "districts":
        if (!id) return NextResponse.json([]);
        const districts = await prisma.district.findMany({
          where: { cityId: Number(id) },
          include: {
            subDistricts: {
              select: {
                name: true,
                postalCode: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });

        const districtsWithPostal = districts.map((d) => {
          // Format menjadi "Kodepos - Nama Kelurahan"
          const options = d.subDistricts
            .filter((sd) => sd.postalCode && sd.name)
            .map((sd) => `${sd.postalCode} - ${sd.name}`);
          
          // Mengambil kodepos unik (angka saja) untuk default value
          const uniquePureCodes = Array.from(
            new Set(d.subDistricts.map((sd) => sd.postalCode).filter(Boolean))
          );

          return {
            id: d.id,
            name: d.name,
            lionDistrictId: d.lionDistrictId,
            // Default: ambil angka kodepos pertama
            postalCode: uniquePureCodes[0] || "", 
            // List untuk dropdown: "40217 - Nama Daerah"
            postalOptions: options, 
          };
        });

        return NextResponse.json(districtsWithPostal);

      case "subdistricts":
        if (!id) return NextResponse.json([]);
        const subdistricts = await prisma.subDistrict.findMany({
          where: { districtId: Number(id) },
          orderBy: { name: "asc" },
          select: { id: true, name: true, postalCode: true },
        });
        return NextResponse.json(subdistricts);

      default:
        return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}