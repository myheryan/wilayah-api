"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, X, Search, MapPin } from "lucide-react";

interface RegionItem {
  id: string;
  name: string;
  lionDistrictId?: string;
  postalCode?: string;
}

interface AddressManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function AddressManager({ isOpen, onClose, onSuccess, initialData }: AddressManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk API Internal
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [subDistricts, setSubDistricts] = useState<RegionItem[]>([]);

  const [searchProvince, setSearchProvince] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchSubDistrict, setSearchSubDistrict] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    label: "Rumah",
    recipient: "",
    phone: "",
    fullAddress: "",
    provinceId: "",
    province: "",
    cityId: "",
    city: "",
    districtId: "",
    district: "",
    subDistrictId: "", // Tambahan Relasi
    subDistrict: "",   // Tambahan Relasi
    postalCode: "",
    lionDistrictId: "", // Tambahan Relasi Lion Parcel
    isMain: false,
  });

  // Helper: Merapikan Huruf (Jakarta selatan -> Jakarta Selatan)
  const formatTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper: Hanya angka untuk nomor HP
  const formatPhoneNumber = (str: string) => {
    return str.replace(/\D/g, "");
  };

  // Helper Fetcher ke Internal API
  const getAddressData = async (type: string, id?: string) => {
    const url = id ? `/api/address?type=${type}&id=${id}` : `/api/address?type=${type}`;
    const res = await fetch(url);
    return res.json();
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSearchProvince(initialData.province || "");
      setSearchCity(initialData.city || "");
      setSearchDistrict(initialData.district || "");
      setSearchSubDistrict(initialData.subDistrict || "");
    } else {
      setFormData({
        id: "", label: "Rumah", recipient: "", phone: "", fullAddress: "",
        provinceId: "", province: "", cityId: "", city: "",
        districtId: "", district: "", subDistrictId: "", subDistrict: "",
        postalCode: "", lionDistrictId: "", isMain: false,
      });
      setSearchProvince(""); setSearchCity(""); setSearchDistrict(""); setSearchSubDistrict("");
    }
  }, [initialData, isOpen]);

  // Fetching Data Wilayah dari API Internal
  useEffect(() => {
    if (isOpen) getAddressData("provinces").then(setProvinces);
  }, [isOpen]);

  useEffect(() => {
    if (formData.provinceId) getAddressData("cities", formData.provinceId).then(setRegencies);
  }, [formData.provinceId]);

  useEffect(() => {
    if (formData.cityId) getAddressData("districts", formData.cityId).then(setDistricts);
  }, [formData.cityId]);

  useEffect(() => {
    if (formData.districtId) getAddressData("subdistricts", formData.districtId).then(setSubDistricts);
  }, [formData.districtId]);

  const handleManualSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.recipient || !formData.phone || !formData.fullAddress || !formData.lionDistrictId) {
      toast.error("Mohon lengkapi data dan pastikan wilayah dipilih dengan benar");
      return;
    }

    setIsLoading(true);
    try {
      const method = formData.id ? "PUT" : "POST";

      const payload = {
        ...formData,
        recipient: formatTitleCase(formData.recipient),
        phone: formatPhoneNumber(formData.phone),
        fullAddress: formatTitleCase(formData.fullAddress),
        province: formatTitleCase(formData.province),
        city: formatTitleCase(formData.city),
        district: formatTitleCase(formData.district),
        subDistrict: formatTitleCase(formData.subDistrict),
      };

      const response = await fetch("/api/user/address", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan");

      toast.success("Alamat berhasil disimpan dengan rapi");
      await onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-zinc-500" />
            <h3 className="font-bold text-zinc-800">{formData.id ? "Ubah Alamat" : "Tambah Alamat Baru"}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Penerima & HP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Nama Penerima</label>
              <input placeholder="Nama Lengkap" className="w-full h-11 px-4 border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Nomor HP</label>
              <input placeholder="0812xxxx" className="w-full h-11 px-4 border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          {/* Wilayah Cascading (4 Level) */}
          <div className="space-y-3">
            {[
              { label: "Provinsi", list: "p-list", data: provinces, search: searchProvince, setSearch: setSearchProvince, idKey: "provinceId", nameKey: "province", reset: ["cityId", "city", "districtId", "district", "subDistrictId", "subDistrict", "postalCode", "lionDistrictId"] },
              { label: "Kota/Kabupaten", list: "c-list", data: regencies, search: searchCity, setSearch: setSearchCity, idKey: "cityId", nameKey: "city", disabled: !formData.provinceId, reset: ["districtId", "district", "subDistrictId", "subDistrict", "postalCode", "lionDistrictId"] },
              { label: "Kecamatan", list: "d-list", data: districts, search: searchDistrict, setSearch: setSearchDistrict, idKey: "districtId", nameKey: "district", disabled: !formData.cityId, reset: ["subDistrictId", "subDistrict", "postalCode"] },
              { label: "Kelurahan / Desa", list: "s-list", data: subDistricts, search: searchSubDistrict, setSearch: setSearchSubDistrict, idKey: "subDistrictId", nameKey: "subDistrict", disabled: !formData.districtId, reset: [] }
            ].map((field) => (
              <div key={field.label} className="relative space-y-1">
                <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">{field.label}</label>
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-3.5 text-zinc-600" />
                  <input 
                    list={field.list} value={field.search} disabled={field.disabled}
                    placeholder={`Cari ${field.label}...`}
                    className="w-full h-11 pl-10 pr-4 border border-zinc-200 rounded-lg text-sm disabled:bg-zinc-50 outline-none focus:ring-1 focus:ring-black"
                    onChange={(e) => {
                      const val = e.target.value;
                      field.setSearch(val);
                      const selected: any = field.data.find((i: any) => i.name === val);
                      
                      if (selected) {
                        let update = { ...formData, [field.idKey]: selected.id, [field.nameKey]: selected.name };
                        field.reset.forEach(r => (update as any)[r] = "");
                        
                        // LOGIKA INTERNAL: Ambil Lion ID & Kode Pos otomatis
                        if(field.label === "Kecamatan") {
                           update.lionDistrictId = selected.lionDistrictId || "";
                        }
                        if(field.label === "Kelurahan / Desa") {
                           update.postalCode = selected.postalCode || "";
                        }
                        
                        setFormData(update);
                      }
                    }}
                  />
                  <datalist id={field.list}>{field.data.map((i: any) => <option key={i.id} value={i.name} />)}</datalist>
                </div>
              </div>
            ))}
          </div>

          {/* Kolom Otomatis: Kode Pos & Lion ID */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Kode Pos</label>
              <input readOnly placeholder="Otomatis terisi" className="w-full h-11 px-4 border border-zinc-200 bg-zinc-50 rounded-lg text-sm outline-none text-zinc-500" value={formData.postalCode} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Lion District ID</label>
              <input readOnly placeholder="Otomatis terisi" className="w-full h-11 px-4 border border-zinc-200 bg-zinc-50 rounded-lg text-sm outline-none text-zinc-500 font-mono" value={formData.lionDistrictId} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Detail Alamat</label>
            <textarea placeholder="Nama Jalan, Blok, Nomor Rumah..." className="w-full min-h-[80px] p-4 border border-zinc-200 rounded-lg text-sm resize-none outline-none focus:ring-1 focus:ring-black" value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
              {['Rumah', 'Kantor'].map(l => (
                <button key={l} type="button" onClick={() => setFormData({...formData, label: l})} className={`px-5 py-2 text-xs font-bold rounded-full border transition-all ${formData.label === l ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}>{l}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 accent-black rounded border-zinc-300" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} />
              <span className="text-xs text-zinc-500 font-bold group-hover:text-zinc-800 transition-colors">Utama</span>
            </label>
          </div>

          <button 
            type="button" 
            onClick={handleManualSubmit}
            disabled={isLoading || !formData.lionDistrictId} 
            className="w-full py-4 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Simpan Alamat"}
          </button>
        </div>
      </div>
    </div>
  );
}