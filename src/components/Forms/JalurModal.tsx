import React, { useState, useEffect } from 'react';
import { Coordinate, JalurKabel } from '../../types';
import { PENGHANTAR } from '../../utils/plnStandards';
import { calculatePolylineLength, formatDistance } from '../../utils/geoUtils';
import { X, Check } from 'lucide-react';

interface JalurModalProps {
  visible: boolean;
  koordinat: Coordinate[];
  initialData?: Partial<JalurKabel>;
  onClose: () => void;
  onSubmit: (data: Omit<JalurKabel, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => void;
}

export const JalurModal: React.FC<JalurModalProps> = ({
  visible,
  koordinat,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [namaJalur, setNamaJalur] = useState(initialData?.namaJalur || '');
  const [jenisJaringan, setJenisJaringan] = useState<'SUTM' | 'SKTM' | 'SKUTM' | 'SUTR' | 'SKTR'>(
    (initialData?.jenisJaringan as any) || 'SUTM'
  );
  const [jenisPenghantar, setJenisPenghantar] = useState(initialData?.jenisPenghantar || 'A3CS');
  const [penampangMM, setPenampangMM] = useState(initialData?.penampangMM || '150mm²');
  const [status, setStatus] = useState<'existing' | 'planned' | 'remove'>(
    initialData?.status || 'planned'
  );
  const [catatan, setCatatan] = useState(initialData?.catatan || '');

  const panjangMeter = Math.round(calculatePolylineLength(koordinat));

  useEffect(() => {
    if (visible && initialData) {
      setNamaJalur(initialData.namaJalur || '');
      setJenisJaringan((initialData.jenisJaringan as any) || 'SUTM');
      setJenisPenghantar(initialData.jenisPenghantar || 'A3CS');
      setPenampangMM(initialData.penampangMM || '150mm²');
      setStatus(initialData.status || 'planned');
      setCatatan(initialData.catatan || '');
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const getPenghantarJenis = () => {
    if (jenisJaringan === 'SUTM' || jenisJaringan === 'SKUTM') return PENGHANTAR.SUTM.jenis;
    if (jenisJaringan === 'SKTM') return PENGHANTAR.SKTM.jenis;
    return ['NFA2X', 'LVTC', 'Twisted Cable'];
  };

  const getPenampangOptions = () => {
    if (jenisJaringan === 'SUTM' || jenisJaringan === 'SKUTM') return PENGHANTAR.SUTM.penampang;
    if (jenisJaringan === 'SKTM') return PENGHANTAR.SKTM.penampang;
    return ['3x35+1x25mm²', '3x50+1x35mm²', '3x70+1x50mm²', '3x95+1x70mm²'];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      namaJalur: namaJalur.trim() || `Jalur ${jenisJaringan} (${panjangMeter}m)`,
      koordinat,
      jenisJaringan,
      jenisPenghantar,
      penampangMM,
      panjangMeter,
      status,
      catatan: catatan.trim() || undefined,
      tiangIds: initialData?.tiangIds || [],
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
              {initialData ? '✏️ Edit Spesifikasi Jalur Kabel' : '〰️ Rentang Jalur Kabel Jaringan'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              {koordinat.length} Titik Rentang • Panjang Total: <b>{formatDistance(panjangMeter)}</b>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* 1. Status Jalur (Pill Buttons) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Status Jalur
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
                  cursor: 'pointer'
                }}
              >
                🟢 Baru (Planned)
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
                  cursor: 'pointer'
                }}
              >
                ⬜ Existing
              </button>
            </div>
          </div>

          {/* 2. Jenis Jaringan (4 Cards Standard MASIV Mobile) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Jenis Jaringan (4 Tipe Standar PLN)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { code: 'SUTM', name: 'Saluran Udara TM (20 kV)', color: '#E91E63', desc: 'Garis-Titik Merah' },
                { code: 'SKTM', name: 'Kabel Tanah TM (20 kV)', color: '#9C27B0', desc: 'Titik Rapat Ungu' },
                { code: 'SKUTM', name: 'Kabel Udara TM (20 kV)', color: '#00BCD4', desc: 'Garis Spasi Cyan' },
                { code: 'SUTR', name: 'Saluran Udara TR (220/380V)', color: '#00E676', desc: 'Solid Neon Green' },
              ].map((item) => {
                const isSelected = jenisJaringan === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      const val = item.code as any;
                      setJenisJaringan(val);
                      if (val === 'SUTR') {
                        setJenisPenghantar('NFA2X');
                        setPenampangMM('3x70+1x50mm²');
                      } else {
                        setJenisPenghantar('A3CS');
                        setPenampangMM('150mm²');
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${item.color}` : '1px solid #334155',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : '#1e293b',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: item.color }}>{item.code}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.desc}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: isSelected ? '#f8fafc' : '#94a3b8' }}>
                      {item.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Jenis Penghantar (Quick Pill Chips) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Jenis Penghantar / Kabel
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {getPenghantarJenis().map((p) => {
                const isSelected = jenisPenghantar === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setJenisPenghantar(p)}
                    style={{
                      flex: 1,
                      minWidth: '80px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #334155',
                      background: isSelected ? '#0284c7' : '#1e293b',
                      color: isSelected ? 'white' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ukuran Penampang (Quick Pill Chips) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Ukuran Penampang Kabel
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
              {getPenampangOptions().map((o) => {
                const isSelected = penampangMM === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setPenampangMM(o)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #334155',
                      background: isSelected ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                      color: isSelected ? '#38bdf8' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Nama Jalur & Catatan */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Nama Jalur / Feeder (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Feeder KBN-01 / Jalur Utama"
              value={namaJalur}
              onChange={(e) => setNamaJalur(e.target.value)}
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

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}>
              Catatan Jalur
            </label>
            <textarea
              placeholder="Catatan lintasan, jalan, pohon, rintangan..."
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
                background: '#2563eb',
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
              Simpan Jalur Kabel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
