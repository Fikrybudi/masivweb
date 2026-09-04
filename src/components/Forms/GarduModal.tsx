import React, { useState, useEffect } from 'react';
import { Coordinate, Gardu } from '../../types';
import { JENIS_GARDU, KAPASITAS_TRAFO, PERALATAN_PROTEKSI } from '../../utils/plnStandards';
import { X, Check, Camera } from 'lucide-react';

interface GarduModalProps {
  visible: boolean;
  koordinat: Coordinate;
  initialData?: Partial<Gardu>;
  onClose: () => void;
  onSubmit: (data: Omit<Gardu, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => void;
}

export const GarduModal: React.FC<GarduModalProps> = ({
  visible,
  koordinat,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [nomorGardu, setNomorGardu] = useState(initialData?.nomorGardu || '');
  const [namaGardu, setNamaGardu] = useState(initialData?.namaGardu || '');
  const [jenisGardu, setJenisGardu] = useState<'Portal' | 'Cantol' | 'Beton' | 'Ground'>(
    initialData?.jenisGardu || 'Cantol'
  );
  const [kapasitasKVA, setKapasitasKVA] = useState<number>(initialData?.kapasitasKVA || 100);
  const [merekTrafo, setMerekTrafo] = useState(initialData?.merekTrafo || '');
  const [tahunPasang, setTahunPasang] = useState(
    initialData?.tahunPasang?.toString() || new Date().getFullYear().toString()
  );
  const [selectedProteksi, setSelectedProteksi] = useState<string[]>(
    initialData?.peralatanProteksi || ['FCO (Fuse Cut Out)', 'LA (Lightning Arrester)']
  );
  const [catatan, setCatatan] = useState(initialData?.catatan || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.foto || []);

  useEffect(() => {
    if (visible && initialData) {
      setNomorGardu(initialData.nomorGardu || '');
      setNamaGardu(initialData.namaGardu || '');
      setJenisGardu(initialData.jenisGardu || 'Cantol');
      setKapasitasKVA(initialData.kapasitasKVA || 100);
      setMerekTrafo(initialData.merekTrafo || '');
      setTahunPasang(initialData.tahunPasang?.toString() || new Date().getFullYear().toString());
      setSelectedProteksi(initialData.peralatanProteksi || ['FCO (Fuse Cut Out)', 'LA (Lightning Arrester)']);
      setCatatan(initialData.catatan || '');
      setFotos(initialData.foto || []);
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const toggleProteksi = (item: string) => {
    setSelectedProteksi((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorGardu.trim()) {
      alert('Nomor gardu harus diisi!');
      return;
    }

    onSubmit({
      nomorGardu: nomorGardu.trim(),
      namaGardu: namaGardu.trim() || undefined,
      koordinat,
      jenisGardu,
      kapasitasKVA,
      merekTrafo: merekTrafo.trim() || undefined,
      tahunPasang: tahunPasang ? parseInt(tahunPasang) : undefined,
      peralatanProteksi: selectedProteksi,
      foto: fotos.length > 0 ? fotos : undefined,
      catatan: catatan.trim() || undefined,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        border: '1px solid #334155'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              ⚡ Plotting Titik Gardu Distribusi
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Lat: {koordinat.latitude.toFixed(6)}, Lng: {koordinat.longitude.toFixed(6)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Nomor Gardu */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Nomor Gardu *
              </label>
              <input
                type="text"
                placeholder="Contoh: GD.102 / CKD01"
                required
                value={nomorGardu}
                onChange={(e) => setNomorGardu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Nama Gardu */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Nama Gardu (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Gardu Kantor Desa"
                value={namaGardu}
                onChange={(e) => setNamaGardu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Jenis Gardu */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Konstruksi Gardu
              </label>
              <select
                value={jenisGardu}
                onChange={(e) => setJenisGardu(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              >
                {Object.values(JENIS_GARDU).map((g) => (
                  <option key={g.kode} value={g.kode}>{g.nama}</option>
                ))}
              </select>
            </div>


            {/* Kapasitas Trafo */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Kapasitas Trafo (kVA)
              </label>
              <select
                value={kapasitasKVA}
                onChange={(e) => setKapasitasKVA(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              >
                {KAPASITAS_TRAFO.map((k) => (
                  <option key={k} value={k}>{k} kVA</option>
                ))}
              </select>
            </div>

            {/* Merek Trafo */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Merek Trafo
              </label>
              <input
                type="text"
                placeholder="Contoh: Trafindo, Bambang Djaja, Sintra"
                value={merekTrafo}
                onChange={(e) => setMerekTrafo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Tahun Pasang */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Tahun Pasang
              </label>
              <input
                type="number"
                value={tahunPasang}
                onChange={(e) => setTahunPasang(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Peralatan Proteksi */}
            <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#38bdf8' }}>
                Peralatan Proteksi
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PERALATAN_PROTEKSI.map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedProteksi.includes(p)}
                      onChange={() => toggleProteksi(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            {/* Foto Aset */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Foto Dokumentasi Gardu ({fotos.length} foto)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#1e293b',
                  border: '1px dashed #475569',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#38bdf8'
                }}>
                  <Camera size={16} />
                  Ambil Foto / Pilih File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={f} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #475569' }} />
                    <button
                      type="button"
                      onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: '#e11d48',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        fontSize: 10,
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Catatan Gardu
              </label>
              <textarea
                placeholder="Catatan kondisi fisik gardu, pembebanan trafo..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: '#334155',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#e11d48',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              Simpan Titik Gardu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
