import React, { useState, useEffect } from 'react';
import { Coordinate } from '../../types';
import { X, Check } from 'lucide-react';

export interface PersilFormData {
  namaPersil: string;
  warnaBorder: string;
  catatan?: string;
  koordinatSudut: [Coordinate, Coordinate];
}

interface PersilModalProps {
  visible: boolean;
  koordinatSudut: [Coordinate, Coordinate] | null;
  initialData?: { namaPersil: string; warnaBorder: string; catatan?: string };
  onClose: () => void;
  onSubmit: (data: PersilFormData) => void;
}

const WARNA_OPTIONS = [
  { label: 'Pink', value: '#E91E63' },
  { label: 'Biru', value: '#2196F3' },
  { label: 'Hijau', value: '#4CAF50' },
  { label: 'Oranye', value: '#FF9800' },
  { label: 'Ungu', value: '#9C27B0' },
  { label: 'Kuning', value: '#FFC107' },
  { label: 'Merah', value: '#F44336' },
  { label: 'Cyan', value: '#00BCD4' },
];

export const PersilModal: React.FC<PersilModalProps> = ({
  visible,
  koordinatSudut,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [namaPersil, setNamaPersil] = useState(initialData?.namaPersil || '');
  const [warnaBorder, setWarnaBorder] = useState(initialData?.warnaBorder || WARNA_OPTIONS[0].value);
  const [catatan, setCatatan] = useState(initialData?.catatan || '');

  useEffect(() => {
    if (visible) {
      setNamaPersil(initialData?.namaPersil || '');
      setWarnaBorder(initialData?.warnaBorder || WARNA_OPTIONS[0].value);
      setCatatan(initialData?.catatan || '');
    }
  }, [visible, initialData]);

  if (!visible || !koordinatSudut) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPersil.trim()) {
      alert('Nama persil tidak boleh kosong');
      return;
    }

    onSubmit({
      namaPersil: namaPersil.trim(),
      warnaBorder,
      catatan: catatan.trim() || undefined,
      koordinatSudut,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🏘️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {initialData ? 'Edit Persil Pelanggan' : 'Persil Pelanggan Baru'}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Batas persil tanah / bangunan di peta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Nama Persil / Pelanggan *
            </label>
            <input
              type="text"
              required
              value={namaPersil}
              onChange={(e) => setNamaPersil(e.target.value)}
              placeholder="Contoh: Rumah Bpk. Ahmad / Ruko 01"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Warna Batas Persil
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {WARNA_OPTIONS.map((w) => (
                <div
                  key={w.value}
                  onClick={() => setWarnaBorder(w.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: w.value,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: warnaBorder === w.value ? '2.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: warnaBorder === w.value ? '0 0 10px ' + w.value : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {warnaBorder === w.value && <Check size={16} color="white" />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Catatan Khusus (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Keterangan tambahan persil..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#334155',
                color: '#e2e8f0',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: '#a16207',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Simpan Persil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
