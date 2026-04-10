import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    switch (type) {
      case "provinces":
        const provinces = await prisma.province.findMany({ orderBy: { name: "asc" } });
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
          orderBy: { name: "asc" },
          select: { id: true, name: true, lionDistrictId: true },
        });
        return NextResponse.json(districts);

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
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}