"use client";
import { useState } from "react";
import AddressManager from "@/components/AddressManager";
import { MapPin, Plus, Truck, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  return (
    <main className="min-h-screen bg-white text-zinc-900 font-normal">
      {/* Header / Nav Minimalis */}
      <nav className="border-b border-zinc-100 px-8 py-6 flex justify-between items-center">
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Norvine</h1>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <a href="#" className="hover:text-black transition-colors">Catalog</a>
          <a href="#" className="hover:text-black transition-colors">Archive</a>
          <a href="#" className="text-black">Account</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-16 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Sisi Kiri: Informasi Akun/Ringkasan */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4">Pengaturan Akun</h2>
              <ul className="space-y-3 text-[11px] uppercase tracking-wider text-zinc-500">
                <li className="text-black underline underline-offset-4 cursor-pointer">Daftar Alamat</li>
                <li className="hover:text-black cursor-pointer transition-colors">Riwayat Pesanan</li>
                <li className="hover:text-black cursor-pointer transition-colors">Keamanan</li>
              </ul>
            </section>
          </div>

          {/* Sisi Kanan: Manajemen Alamat */}
          <div className="lg:col-span-8 space-y-12">
            <header className="flex justify-between items-end border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-xl font-normal tracking-tight">Alamat Pengiriman</h3>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">Kelola lokasi tujuan pengiriman Anda</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Tambah Baru
              </button>
            </header>

            {/* List Alamat */}
            <div className="grid grid-cols-1 gap-6">
              {selectedAddress ? (
                <div className="border border-zinc-200 p-6 flex justify-between items-start animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-none">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 uppercase tracking-tighter">
                        {selectedAddress.label}
                      </span>
                      {selectedAddress.isMain && (
                        <span className="text-[9px] font-black border border-zinc-200 px-2 py-0.5 uppercase tracking-tighter text-zinc-400">
                          Utama
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{selectedAddress.recipient}</p>
                      <p className="text-xs text-zinc-500">{selectedAddress.phone}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed mt-2 max-w-sm">
                        {selectedAddress.fullAddress}, {selectedAddress.subDistrict}, {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province}, {selectedAddress.postalCode}
                      </p>
                    </div>

                    {/* Badge Koneksi Lion Parcel */}
                    {selectedAddress.lionDistrictId && (
                      <div className="flex items-center gap-2 pt-2">
                        <Truck size={12} className="text-zinc-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                          Verified for shipping: <span className="text-black font-black">{selectedAddress.lionDistrictId}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-0.5 hover:text-zinc-400 hover:border-zinc-400 transition-all"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsModalOpen(true)}
                  className="border-2 border-dashed border-zinc-100 py-20 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-300 transition-all group"
                >
                  <MapPin size={24} className="text-zinc-200 group-hover:text-zinc-400 transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-zinc-500">
                    Belum ada alamat tersimpan
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Komponen Autocomplete Modal */}
      <AddressManager 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Logika fetch ulang data alamat dari database user
          // Untuk demo ini, kita asumsikan sukses
          setIsModalOpen(false);
        }}
        initialData={selectedAddress}
      />
    </main>
  );
}