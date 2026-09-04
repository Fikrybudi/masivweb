import React, { useState, useEffect } from 'react';
import { Coordinate, Tiang } from '../../types';
import {
  KONSTRUKSI_TM,
  KONSTRUKSI_TR,
  KONSTRUKSI_SKUTM,
  JENIS_TIANG,
  DEFAULT_TIANG,
} from '../../utils/plnStandards';
import { X, Check, Camera, Image } from 'lucide-react';

interface TiangModalProps {
  visible: boolean;
  koordinat: Coordinate;
  nextNomorUrut: number;
  initialData?: Partial<Tiang>;
  lastJenisJaringan?: 'SUTM' | 'SKTM' | 'SKUTM' | 'SUTR' | 'SKTR';
  onClose: () => void;
  onSubmit: (data: Omit<Tiang, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => void;
}

export const TiangModal: React.FC<TiangModalProps> = ({
  visible,
  koordinat,
  nextNomorUrut,
  initialData,
  lastJenisJaringan = 'SUTM',
  onClose,
  onSubmit,
}) => {
  const initialJenis = initialData?.jenisJaringan || lastJenisJaringan;
  const defaults = DEFAULT_TIANG[initialJenis] || DEFAULT_TIANG['SUTM'];

  const [jenisJaringan, setJenisJaringan] = useState<'SUTM' | 'SKTM' | 'SKUTM' | 'SUTR' | 'SKTR'>(initialJenis);
  const [status, setStatus] = useState<'existing' | 'planned'>(initialData?.status || 'planned');
  const [kodeTiang, setKodeTiang] = useState(initialData?.kodeTiang || '');
  const [konstruksi, setKonstruksi] = useState(initialData?.konstruksi || defaults.konstruksi);
  const [jenisTiang, setJenisTiang] = useState<'Beton' | 'Besi/Baja' | 'Kayu'>(
    initialData?.jenisTiang || (defaults.bahan as any) || 'Beton'
  );
  const [tinggiTiang, setTinggiTiang] = useState(initialData?.tinggiTiang || defaults.tinggi);
  const [kekuatanTiang, setKekuatanTiang] = useState(initialData?.kekuatanTiang || defaults.kekuatan);
  const [penguat, setPenguat] = useState<'Tanpa Penguat' | 'Stayset' | 'Pondasi'>(
    initialData?.penguat || 'Tanpa Penguat'
  );
  const [grounding, setGrounding] = useState<boolean>(initialData?.grounding ?? false);
  const [catatan, setCatatan] = useState(initialData?.catatan || '');
  const [fotos, setFotos] = useState<string[]>(initialData?.foto || []);

  useEffect(() => {
    if (!initialData) {
      const newDefaults = DEFAULT_TIANG[jenisJaringan] || DEFAULT_TIANG['SUTM'];
      setKonstruksi(newDefaults.konstruksi);
      setTinggiTiang(newDefaults.tinggi);
      setJenisTiang(newDefaults.bahan as any);
      setKekuatanTiang(newDefaults.kekuatan);
    }
  }, [jenisJaringan, initialData]);

  if (!visible) return null;

  const konstruksiOptions = () => {
    if (jenisJaringan === 'SUTR') return Object.values(KONSTRUKSI_TR);
    if (jenisJaringan === 'SKUTM') return Object.values(KONSTRUKSI_SKUTM);
    return Object.values(KONSTRUKSI_TM);
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
    onSubmit({
      nomorUrut: initialData?.nomorUrut || nextNomorUrut,
      kodeTiang: kodeTiang.trim() || undefined,
      parentTiangId: initialData?.parentTiangId,
      branchDirection: initialData?.branchDirection,
      branchPath: initialData?.branchPath,
      koordinat,
      jenisTiang,
      tinggiTiang,
      kekuatanTiang,
      jenisJaringan,
      konstruksi,
      penguat: penguat === 'Tanpa Penguat' ? undefined : (penguat as 'Stayset' | 'Pondasi'),
      grounding,
      status,
      catatan: catatan.trim() || undefined,
      foto: fotos.length > 0 ? fotos : undefined,
      perlengkapan: initialData?.perlengkapan || [],
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
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              📍 Plotting Tiang No. {initialData?.nomorUrut || nextNomorUrut}
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
          
          {/* 1. Status Tiang */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Status Tiang
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStatus('planned')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: status === 'planned' ? '2px solid #10b981' : '1px solid #334155',
                  background: status === 'planned' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                  color: status === 'planned' ? '#34d399' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🟢</span> Baru (Planned)
              </button>
              <button
                type="button"
                onClick={() => setStatus('existing')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: status === 'existing' ? '2px solid #64748b' : '1px solid #334155',
                  background: status === 'existing' ? 'rgba(100, 116, 139, 0.25)' : '#1e293b',
                  color: status === 'existing' ? '#f1f5f9' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⬜</span> Existing
              </button>
            </div>
            {status === 'existing' && (
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                Tiang existing ditampilkan abu-abu dan tidak masuk rekap material.
              </p>
            )}
          </div>

          {/* 2. Kode Tiang */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Kode Tiang
            </label>
            <input
              type="text"
              placeholder="Contoh: T.01 / A-1 (Otomatis jika kosong)"
              value={kodeTiang}
              onChange={(e) => setKodeTiang(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 3. Jenis Jaringan (Pill Chips) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Jenis Jaringan
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['SUTM', 'SKTM', 'SKUTM', 'SUTR'] as const).map((type) => {
                const isActive = jenisJaringan === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJenisJaringan(type)}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid #0284c7' : '1px solid #334155',
                      background: isActive ? '#0284c7' : '#1e293b',
                      color: isActive ? 'white' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: isActive ? '0 0 10px rgba(2, 132, 199, 0.4)' : 'none'
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Standar Konstruksi (Scrollable Horizontal Cards / Chips - Standar Banten Selatan) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: 0 }}>
                Konstruksi
              </label>
              {jenisJaringan === 'SUTM' && (
                <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                  📍 Standar Banten Selatan
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '8px',
              maxHeight: '170px',
              overflowY: 'auto',
              padding: '2px'
            }}>
              {konstruksiOptions().map((opt: any) => {
                const isSelected = konstruksi === opt.kode;
                return (
                  <button
                    key={opt.kode}
                    type="button"
                    onClick={() => setKonstruksi(opt.kode)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#1e293b',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      color: isSelected ? '#38bdf8' : '#f8fafc'
                    }}>
                      {opt.kode}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isSelected ? '#e2e8f0' : '#94a3b8',
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {opt.nama}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Konstruksi Detail Info Banner */}
            {konstruksi && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '11.5px',
                color: '#bae6fd'
              }}>
                ℹ️ <b>{konstruksi}:</b> {konstruksiOptions().find((k: any) => k.kode === konstruksi)?.keterangan || konstruksiOptions().find((k: any) => k.kode === konstruksi)?.nama}
              </div>
            )}
          </div>

          {/* 5. Jenis Tiang / Bahan (Button Group) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Bahan Tiang
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {JENIS_TIANG.bahan.map((bahan) => {
                const isActive = jenisTiang === bahan;
                return (
                  <button
                    key={bahan}
                    type="button"
                    onClick={() => setJenisTiang(bahan as any)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid #0284c7' : '1px solid #334155',
                      background: isActive ? '#0284c7' : '#1e293b',
                      color: isActive ? 'white' : '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {bahan}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Tinggi & Kekuatan Tiang (Compact Selectors Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            {/* Tinggi Tiang */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
                Tinggi Tiang
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {JENIS_TIANG.tinggi.map((h) => {
                  const isActive = tinggiTiang === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTinggiTiang(h)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #0284c7' : '1px solid #334155',
                        background: isActive ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                        color: isActive ? '#38bdf8' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kekuatan Tiang */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
                Kekuatan (daN)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {JENIS_TIANG.kekuatan.map((k) => {
                  const isActive = kekuatanTiang === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKekuatanTiang(k)}
                      style={{
                        padding: '8px 8px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #0284c7' : '1px solid #334155',
                        background: isActive ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                        color: isActive ? '#38bdf8' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {k.replace(' daN', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. Penguat Tiang (Pilih Salah Satu: Stayset / Pondasi / Tanpa) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Penguat Tiang (Pilih Salah Satu)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPenguat('Tanpa Penguat')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: penguat === 'Tanpa Penguat' ? '2px solid #64748b' : '1px solid #334155',
                  background: penguat === 'Tanpa Penguat' ? 'rgba(100, 116, 139, 0.3)' : '#1e293b',
                  color: penguat === 'Tanpa Penguat' ? '#f1f5f9' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ❌ Tanpa
              </button>

              <button
                type="button"
                onClick={() => setPenguat('Stayset')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: penguat === 'Stayset' ? '2px solid #eab308' : '1px solid #334155',
                  background: penguat === 'Stayset' ? 'rgba(234, 179, 8, 0.15)' : '#1e293b',
                  color: penguat === 'Stayset' ? '#fde047' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ⚓ Stay Set
              </button>

              <button
                type="button"
                onClick={() => setPenguat('Pondasi')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: penguat === 'Pondasi' ? '2px solid #ec4899' : '1px solid #334155',
                  background: penguat === 'Pondasi' ? 'rgba(236, 72, 153, 0.15)' : '#1e293b',
                  color: penguat === 'Pondasi' ? '#f472b6' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🧱 Pondasi
              </button>
            </div>
          </div>

          {/* 8. Proteksi Pembumian / Grounding (Custom Checkbox Card) */}
          <div style={{ marginBottom: '18px' }}>
            <div
              onClick={() => setGrounding(!grounding)}
              style={{
                padding: '11px 14px',
                borderRadius: '10px',
                background: grounding ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                border: grounding ? '1.5px solid #0284c7' : '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: grounding ? '#0284c7' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 900
              }}>
                {grounding ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: grounding ? '#38bdf8' : '#f8fafc' }}>
                  ⚡ Pemasangan Grounding / Pembumian
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Simbol grounding ⏚ akan dicantumkan di samping titik tiang
                </div>
              </div>
            </div>
          </div>

          {/* 9. Foto Aset */}
          <div style={{ marginBottom: '18px' }}>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Foto Dokumentasi Aset ({fotos.length} foto)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                border: '1px dashed #475569',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#38bdf8'
              }}>
                <Camera size={16} />
                Ambil Foto / Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={f} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #475569' }} />
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

          {/* 10. Catatan Lapangan */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Catatan Lapangan
            </label>
            <textarea
              placeholder="Catatan kondisi lokasi, pohon, rintangan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
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
                background: '#0284c7',
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
              Simpan Titik Tiang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
