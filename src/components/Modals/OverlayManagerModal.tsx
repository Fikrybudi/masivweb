// =============================================================================
// PLN SURVEY WEB - Overlay Manager Modal (Data Eksisting)
// =============================================================================
// Direct port of mobile app's OverlayManager.tsx
// Supports importing CSV, KML, and KMZ files into static GIS reference layers.
// =============================================================================

import React, { useState } from 'react';
import {
  X,
  Upload,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Check,
  FileCode,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { OverlayFile, OverlayDataType } from '../../types/overlayTypes';
import { parseOverlayFile, detectOverlayType } from '../../services/overlayParser';
import { overlayStorage } from '../../services/overlayStorage';

function generateId(): string {
  return 'ovl_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

const TYPE_LABELS: Record<OverlayDataType, string> = {
  jtm: '⚡ JTM (Jaringan)',
  gardu: '🔌 Gardu',
  proteksi: '🛡️ Proteksi',
  custom: '📍 Custom',
};

const TYPE_OPTIONS: { value: OverlayDataType; label: string }[] = [
  { value: 'jtm', label: '⚡ JTM (Jaringan/Polyline)' },
  { value: 'gardu', label: '🔌 Gardu (Titik)' },
  { value: 'proteksi', label: '🛡️ Proteksi (Titik)' },
  { value: 'custom', label: '📍 Custom' },
];

const COLOR_PRESETS = [
  'multi',
  '#FFC107',
  '#FF9800',
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#2196F3',
  '#4CAF50',
  '#00BCD4',
];

interface OverlayManagerModalProps {
  visible: boolean;
  onClose: () => void;
  overlays: OverlayFile[];
  onOverlaysChange: (overlays: OverlayFile[]) => void;
}

export const OverlayManagerModal: React.FC<OverlayManagerModalProps> = ({
  visible,
  onClose,
  overlays,
  onOverlaysChange,
}) => {
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<'idle' | 'confirm'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Import confirmation state
  const [pendingOverlay, setPendingOverlay] = useState<OverlayFile | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingType, setPendingType] = useState<OverlayDataType>('custom');
  const [pendingColor, setPendingColor] = useState('multi');

  if (!visible) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['csv', 'kml', 'kmz', 'txt'].includes(ext)) {
      setErrorMsg(`File .${ext} tidak didukung. Harap gunakan file .csv, .kml, atau .kmz`);
      return;
    }

    try {
      setImporting(true);
      const geoData = await parseOverlayFile(file);
      const detectedType = detectOverlayType(geoData);

      const totalFeatures = geoData.points.length + geoData.polylines.length;
      if (totalFeatures === 0) {
        setErrorMsg('Tidak ditemukan data geografis valid di file ini.');
        setImporting(false);
        return;
      }

      const overlay: OverlayFile = {
        id: generateId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        type: detectedType,
        visible: true,
        opacity: 0.7,
        color: undefined,
        data: geoData,
        importedAt: new Date().toISOString(),
      };

      setPendingOverlay(overlay);
      setPendingName(overlay.name);
      setPendingType(detectedType);
      setPendingColor('multi');
      setImportStep('confirm');
      setImporting(false);
    } catch (err: any) {
      setImporting(false);
      setErrorMsg(err.message || 'Gagal membaca file.');
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingOverlay) return;

    const finalOverlay: OverlayFile = {
      ...pendingOverlay,
      name: pendingName.trim() || pendingOverlay.name,
      type: pendingType,
      color: pendingType === 'jtm' ? (pendingColor === 'multi' ? undefined : pendingColor) : undefined,
    };

    const updated = [...overlays, finalOverlay];
    onOverlaysChange(updated);
    await overlayStorage.saveOverlay(finalOverlay);

    setPendingOverlay(null);
    setImportStep('idle');
  };

  const handleCancelImport = () => {
    setPendingOverlay(null);
    setImportStep('idle');
    setErrorMsg('');
  };

  const toggleVisibility = async (id: string) => {
    const updated = overlays.map((o) =>
      o.id === id ? { ...o, visible: !o.visible } : o
    );
    onOverlaysChange(updated);
    const target = updated.find((o) => o.id === id);
    if (target) await overlayStorage.updateVisibility(id, target.visible);
  };

  const updateOpacity = (id: string, opacity: number) => {
    const updated = overlays.map((o) =>
      o.id === id ? { ...o, opacity } : o
    );
    onOverlaysChange(updated);
  };

  const saveOpacity = async (id: string, opacity: number) => {
    await overlayStorage.updateOpacity(id, opacity);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus layer "${name}"?`)) {
      const updated = overlays.filter((o) => o.id !== id);
      onOverlaysChange(updated);
      await overlayStorage.deleteOverlay(id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3500,
      padding: '16px',
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '88vh',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              📂 Data Eksisting (JTM / Gardu / Proteksi)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Import Button Dropzone */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: importing ? '#0284c7' : '#0284c7',
            color: 'white',
            borderRadius: '10px',
            padding: '12px 18px',
            cursor: importing ? 'wait' : 'pointer',
            fontSize: '13.5px',
            fontWeight: 600,
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            transition: 'all 0.2s',
          }}>
            {importing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            <span>{importing ? 'Memproses File...' : 'Import File (CSV / KML / KMZ)'}</span>
            <input
              type="file"
              accept=".csv,.kml,.kmz,.txt"
              onChange={handleFileChange}
              disabled={importing}
              style={{ display: 'none' }}
            />
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Confirmation Form */}
          {importStep === 'confirm' && pendingOverlay && (
            <div style={{
              background: '#1e293b',
              border: '1px solid #0284c7',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                Konfirmasi Import Layer
              </div>

              {/* Preview Stats */}
              <div style={{
                background: '#0f172a',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                border: '1px solid #334155',
                fontSize: '12.5px',
                lineHeight: 1.6,
                color: '#cbd5e1',
              }}>
                <div>📊 <b>Ditemukan:</b> {pendingOverlay.data.points.length} titik, {pendingOverlay.data.polylines.length} jalur</div>
                <div>🔍 <b>Tipe terdeteksi:</b> {TYPE_LABELS[pendingType]}</div>
              </div>

              {/* Layer Name Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                  Nama Layer
                </label>
                <input
                  type="text"
                  value={pendingName}
                  onChange={(e) => setPendingName(e.target.value)}
                  placeholder="Nama layer"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Type Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Tipe Data
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TYPE_OPTIONS.map((opt) => {
                    const isActive = pendingType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPendingType(opt.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isActive ? '#0284c7' : '#0f172a',
                          color: isActive ? 'white' : '#94a3b8',
                          border: `1px solid ${isActive ? '#38bdf8' : '#334155'}`,
                          fontSize: '12px',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Presets (If JTM) */}
              {pendingType === 'jtm' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Warna Jalur
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_PRESETS.map((c) => {
                      if (c === 'multi') {
                        const isSelected = pendingColor === 'multi';
                        return (
                          <button
                            key="multi"
                            type="button"
                            onClick={() => setPendingColor('multi')}
                            title="Multi-Warna Otomatis Tiap Penyulang"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: '#334155',
                              border: isSelected ? '2.5px solid #38bdf8' : '1px solid #475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              boxShadow: isSelected ? '0 0 8px #38bdf8' : 'none',
                            }}
                          >
                            🌈
                          </button>
                        );
                      }
                      const isSelected = pendingColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPendingColor(c)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: c,
                            border: isSelected ? '2.5px solid white' : '1px solid transparent',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirmation Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCancelImport}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={16} />
                  Simpan & Tampilkan
                </button>
              </div>
            </div>
          )}

          {/* Active Overlay List */}
          {overlays.length > 0 && (
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Layer Aktif ({overlays.length})
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overlays.map((ol) => (
              <div
                key={ol.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ol.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {TYPE_LABELS[ol.type]} • {ol.data.points.length} titik, {ol.data.polylines.length} jalur
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => toggleVisibility(ol.id)}
                      title={ol.visible ? 'Sembunyikan layer' : 'Tampilkan layer'}
                      style={{
                        background: ol.visible ? '#0284c7' : '#334155',
                        border: 'none',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      {ol.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(ol.id, ol.name)}
                      title="Hapus layer"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#f87171',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Opacity Slider if layer is visible */}
                {ol.visible && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '45px' }}>Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={ol.opacity}
                      onChange={(e) => updateOpacity(ol.id, parseFloat(e.target.value))}
                      onMouseUp={(e) => saveOpacity(ol.id, parseFloat((e.target as HTMLInputElement).value))}
                      style={{ flex: 1, accentColor: '#0284c7', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11px', color: '#cbd5e1', minWidth: '35px', textAlign: 'right' }}>
                      {Math.round(ol.opacity * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {overlays.length === 0 && importStep === 'idle' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px 16px',
              textAlign: 'center',
              color: '#64748b',
            }}>
              <FileCode size={42} strokeWidth={1.5} style={{ marginBottom: '12px', color: '#475569' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Belum ada data eksisting diimport.
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.5, maxWidth: '320px' }}>
                Klik tombol di atas untuk mengimpor file <b>CSV</b>, <b>KML</b>, atau <b>KMZ</b> berisi data jaringan JTM dan Gardu eksisting PLN.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
