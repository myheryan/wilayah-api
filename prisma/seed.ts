import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const superNormalize = (str: any) => 
  str?.toString().toUpperCase()
    .replace(/KABUPATEN|KOTA|KECAMATAN|KAB\.|KEC\.|ADM\./g, "")
    .replace(/[^A-Z0-9]/g, "")
    .trim() || "";

function detectSeparator(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf8').split('\n')[0];
  return content.includes(';') ? ';' : ',';
}

async function readCsv(fileName: string): Promise<any[]> {
  const filePath = path.join(process.cwd(), "prisma", fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File tidak ditemukan: ${filePath}`);
    return [];
  }
  const separator = detectSeparator(filePath);
  const results: any[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator }))
      .on("data", (data) => {
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          const cleanKey = key.trim().replace(/^\uFEFF/, "");
          cleanData[cleanKey] = data[key];
        });
        results.push(cleanData);
      })
      .on("error", reject)
      .on("end", () => resolve(results));
  });
}

async function seedData() {
  console.log("⏳ Menghapus data lama...");
  await prisma.$transaction([
    prisma.subDistrict.deleteMany(),
    prisma.district.deleteMany(),
    prisma.city.deleteMany(),
    prisma.province.deleteMany(),
  ]);

  const lpRows = await readCsv("lion.csv");
  const postalRows = await readCsv("full.csv");

  if (lpRows.length === 0 || postalRows.length === 0) return;

  // 1. BUAT MAP LION PARCEL (Logic milikmu)
  const lionMap = new Map();
  const lpRouteKey = "Routes (Booking API & Tariff Search API)";
  lpRows.forEach((row) => {
    const routeRaw = row[lpRouteKey] || "";
    const parts = routeRaw.split(",");
    if (parts.length >= 2) {
      const dist = superNormalize(parts[0]);
      const city = superNormalize(parts[1]);
      lionMap.set(`${dist}${city}`, { id: row["District.Id"], tlc: row["3LC"] });
    }
  });

  // 2. IMPORT PROVINSI
  console.log("📦 Mengimpor Provinsi...");
  const provinces = Array.from(new Map(postalRows.map(r => [r.prov_id, r.prov_name])).entries());
  await prisma.province.createMany({
    data: provinces.map(([id, name]) => ({ id: Number(id), name }))
  });

  // 3. IMPORT KOTA
  console.log("📦 Mengimpor Kota...");
  const cities = Array.from(new Map(postalRows.map(r => [r.city_id, { name: r.city_name, provId: r.prov_id }])).entries());
  await prisma.city.createMany({
    data: cities.map(([id, val]) => ({ id: Number(id), name: val.name, provinceId: Number(val.provId) }))
  });

  // 4. IMPORT KECAMATAN + SINKRONISASI LION (Logic Matched milikmu)
  console.log("📦 Mengimpor Kecamatan...");
  const uniqueDistricts = Array.from(new Map(postalRows.map(r => [r.dis_id, { name: r.dis_name, cityId: r.city_id, cityName: r.city_name }])).entries());
  
  let matchCount = 0;
  const districtData = uniqueDistricts.map(([id, val]) => {
    const key = `${superNormalize(val.name)}${superNormalize(val.cityName)}`;
    const match = lionMap.get(key);
    if (match) matchCount++;
    return {
      id: Number(id),
      name: val.name,
      cityId: Number(val.cityId),
      lionDistrictId: match?.id || null,
      threeLetterCode: match?.tlc || null
    };
  });
  await prisma.district.createMany({ data: districtData });

  // 5. IMPORT KELURAHAN (Batching 81rb data)
  console.log("📦 Mengimpor Kelurahan...");
  const batchSize = 5000;
  for (let i = 0; i < postalRows.length; i += batchSize) {
    const chunk = postalRows.slice(i, i + batchSize);
    const batch = chunk.map(row => ({
      id: Number(row.subdis_id),
      name: row.subdis_name,
      postalCode: String(row.postal_code),
      districtId: Number(row.dis_id),
      fullLabel: `${row.subdis_name}, ${row.dis_name}, ${row.city_name}, ${row.prov_name}, ${row.postal_code}`.toUpperCase()
    }));
    await prisma.subDistrict.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`\r✅ Progress Kelurahan: ${i + batch.length} `);
  }

  console.log(`\n\n✨ SELESAI! Terhubung ke Lion: ${matchCount} Kecamatan.`);
  await prisma.$disconnect();
}

seedData();