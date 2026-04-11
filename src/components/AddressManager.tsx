import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, X, Search, MapPin } from "lucide-react";

interface RegionItem {
  id: string;
  name: string;
  lionDistrictId?: string;
  postalOptions?: string[];
}

interface AddressManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function AddressManager({ isOpen, onClose, onSuccess, initialData }: AddressManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);
  
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);

  const [searchProvince, setSearchProvince] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchPostal, setSearchPostal] = useState("");
  const [postalOptions, setPostalOptions] = useState<string[]>([]);

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
    postalCode: "",
    lionDistrictId: "",
    isMain: false,
  });

  const formatTitleCase = (str: string) => str ? str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()) : "";
  const formatPhoneNumber = (str: string) => str.replace(/\D/g, "");

  const getAddressData = useCallback(async (type: string, id?: string) => {
    try {
      setIsFetchingGeo(true);
      const url = id ? `/api/address?type=${type}&id=${id}` : `/api/address?type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return await res.json();
    } catch (error) {
      return [];
    } finally {
      setIsFetchingGeo(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setSearchProvince(initialData.province || "");
        setSearchCity(initialData.city || "");
        setSearchDistrict(initialData.district || "");
        setSearchPostal(initialData.postalCode || "");
      } else {
        setFormData({
          id: "", label: "Rumah", recipient: "", phone: "", fullAddress: "",
          provinceId: "", province: "", cityId: "", city: "",
          districtId: "", district: "", postalCode: "", lionDistrictId: "", isMain: false,
        });
        setSearchProvince(""); setSearchCity(""); setSearchDistrict(""); setSearchPostal("");
      }
      getAddressData("provinces").then(setProvinces);
    }
  }, [isOpen, initialData, getAddressData]);

  useEffect(() => {
    if (formData.provinceId) getAddressData("cities", formData.provinceId).then(setRegencies);
  }, [formData.provinceId, getAddressData]);

  useEffect(() => {
    if (formData.cityId) getAddressData("districts", formData.cityId).then(setDistricts);
  }, [formData.cityId, getAddressData]);

  const handleManualSubmit = async () => {
    if (!formData.recipient || !formData.phone || !formData.postalCode || !formData.lionDistrictId) {
      toast.error("Mohon lengkapi data wilayah dan kode pos");
      return;
    }

    setIsLoading(true);
    try {
      const method = formData.id ? "PUT" : "POST";
      const res = await fetch("/api/user/address", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          recipient: formatTitleCase(formData.recipient),
          phone: formatPhoneNumber(formData.phone),
          fullAddress: formatTitleCase(formData.fullAddress),
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success("Alamat berhasil diperbarui");
      onSuccess();
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
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-zinc-200">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-zinc-400" />
            <span className="text-sm font-medium tracking-tight text-zinc-800">{formData.id ? "Edit Alamat" : "Alamat Baru"}</span>
            {isFetchingGeo && <Loader2 size={14} className="animate-spin text-zinc-300" />}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-50 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Penerima</label>
              <input 
                className="w-full h-10 px-3 border border-zinc-200 text-sm focus:border-zinc-800 outline-none transition-all" 
                value={formData.recipient} 
                onChange={e => setFormData({...formData, recipient: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Telepon</label>
              <input 
                className="w-full h-10 px-3 border border-zinc-200 text-sm focus:border-zinc-800 outline-none transition-all" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: "Provinsi", list: "p-list", data: provinces, search: searchProvince, setSearch: setSearchProvince, idKey: "provinceId", nameKey: "province", reset: ["cityId", "city", "districtId", "district", "postalCode", "lionDistrictId"] },
              { label: "Kota / Kabupaten", list: "c-list", data: regencies, search: searchCity, setSearch: setSearchCity, idKey: "cityId", nameKey: "city", disabled: !formData.provinceId, reset: ["districtId", "district", "postalCode", "lionDistrictId"] },
              { label: "Kecamatan", list: "d-list", data: districts, search: searchDistrict, setSearch: setSearchDistrict, idKey: "districtId", nameKey: "district", disabled: !formData.cityId, reset: ["postalCode"] },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{field.label}</label>
                <div className="relative">
                  <input 
                    list={field.list} value={field.search} disabled={field.disabled || isFetchingGeo}
                    placeholder={`Pilih ${field.label}`}
                    className="w-full h-10 px-3 border border-zinc-200 text-sm focus:border-zinc-800 outline-none disabled:bg-zinc-50 transition-all"
                    onChange={(e) => {
                      const val = e.target.value;
                      field.setSearch(val);
                      const selected: any = field.data.find((i: any) => i.name.toLowerCase() === val.toLowerCase());
                      if (selected) {
                        let update = { ...formData, [field.idKey]: selected.id, [field.nameKey]: selected.name };
                        field.reset.forEach(r => (update as any)[r] = "");
                        if(field.label === "Kecamatan") {
                            update.lionDistrictId = selected.lionDistrictId || "";
                            setPostalOptions(selected.postalOptions || []);
                            setSearchPostal("");
                        }
                        setFormData(update);
                        if(field.label === "Provinsi") { setSearchCity(""); setSearchDistrict(""); }
                        if(field.label === "Kota / Kabupaten") { setSearchDistrict(""); }
                      }
                    }}
                  />
                  <datalist id={field.list}>{field.data.map((i: any) => <option key={i.id} value={i.name} />)}</datalist>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Kode Pos</label>
              <input 
                list="postal-list" value={searchPostal} disabled={!formData.districtId}
                placeholder="Pilih..."
                className="w-full h-10 px-3 border border-zinc-200 text-sm focus:border-zinc-800 outline-none transition-all"
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchPostal(val);
                  const match = val.match(/^\d+/);
                  if (match && postalOptions.includes(val)) {
                    setFormData({ ...formData, postalCode: match[0] });
                    setSearchPostal(match[0]);
                  }
                }}
              />
              <datalist id="postal-list">{postalOptions.map((opt, idx) => <option key={idx} value={opt} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Lion ID</label>
              <input readOnly className="w-full h-10 px-3 border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-400 outline-none" value={formData.lionDistrictId} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Alamat Lengkap</label>
            <textarea 
              className="w-full min-h-[80px] p-3 border border-zinc-200 text-sm focus:border-zinc-800 outline-none resize-none transition-all" 
              value={formData.fullAddress} 
              onChange={e => setFormData({...formData, fullAddress: e.target.value})} 
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <div className="flex gap-2">
              {['Rumah', 'Kantor'].map(l => (
                <button 
                  key={l} type="button" 
                  onClick={() => setFormData({...formData, label: l})} 
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.label === l ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 accent-black border-zinc-300" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} />
              <span className="text-[10px] font-bold uppercase text-zinc-400 group-hover:text-zinc-800 transition-colors">Utama</span>
            </label>
          </div>

          <button 
            type="button" onClick={handleManualSubmit} disabled={isLoading || !formData.postalCode} 
            className="w-full py-3.5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 disabled:bg-zinc-200 transition-all flex items-center justify-center shadow-sm"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan Alamat"}
          </button>
        </div>
      </div>
    </div>
  );
}