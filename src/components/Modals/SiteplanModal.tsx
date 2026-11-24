// =============================================================================
// PLN SURVEY WEB - Siteplan / Denah Developer Overlay Modal
// Allows uploading developer siteplan (JPG/PNG/WEBP) to overlay on map
// =============================================================================

import React, { useState, useRef } from 'react';
import { Survey, SiteplanOverlay } from '../../types';
import { X, Upload, Map, Eye, EyeOff, Sliders, Trash2, Crosshair, Check, AlertCircle } from 'lucide-react';

interface SiteplanModalProps {
  visible: boolean;
  survey: Survey | null;
  onClose: () => void;
  onUpdateSiteplan: (overlay: SiteplanOverlay | null) => void;
  onStartCalibration: () => void;
  mapCenter?: { lat: number; lng: number } | null;
}

export const SiteplanModal: React.FC<SiteplanModalProps> = ({
  visible,
  survey,
  onClose,
  onUpdateSiteplan,
  onStartCalibration,
  mapCenter,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!visible || !survey) return null;

  const currentOverlay = survey.siteplanOverlay;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, atau WEBP). Jika file berupa PDF, silakan screenshot denah terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Determine center coordinate
      let centerLat = mapCenter?.lat || -6.2088;
      let centerLng = mapCenter?.lng || 106.8456;

      // If survey already has tiang or gardu, prefer its first asset coordinate
      if (survey.garduList && survey.garduList.length > 0 && survey.garduList[0].koordinat) {
        centerLat = survey.garduList[0].koordinat.latitude;
        centerLng = survey.garduList[0].koordinat.longitude;
      } else if (survey.tiangList && survey.tiangList.length > 0 && survey.tiangList[0].koordinat) {
        centerLat = survey.tiangList[0].koordinat.latitude;
        centerLng = survey.tiangList[0].koordinat.longitude;
      }

      // Default bounding box: ~200m x 200m around center
      const deltaLat = 0.0010;
      const deltaLng = 0.0015;

      const newOverlay: SiteplanOverlay = {
        id: crypto.randomUUID(),
        surveyId: survey.id,
        name: file.name,
        imageUrl: dataUrl,
        bounds: [
          [centerLat - deltaLat, centerLng - deltaLng],
          [centerLat + deltaLat, centerLng + deltaLng],
        ],
        opacity: 0.75,
        visible: true,
      };

      onUpdateSiteplan(newOverlay);
      onClose();
      // Auto open calibration toolbar so user can position it right away
      onStartCalibration();
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca file gambar.');
    };

    reader.readAsDataURL(file);
  };

  const handleToggleVisible = () => {
    if (!currentOverlay) return;
    onUpdateSiteplan({
      ...currentOverlay,
      visible: !currentOverlay.visible,
    });
  };

  const handleOpacityChange = (opacity: number) => {
    if (!currentOverlay) return;
    onUpdateSiteplan({
      ...currentOverlay,
      opacity,
    });
  };

  const handleRecenterToMap = () => {
    if (!currentOverlay) return;
    const centerLat = mapCenter?.lat || (currentOverlay.bounds[0][0] + currentOverlay.bounds[1][0]) / 2;
    const centerLng = mapCenter?.lng || (currentOverlay.bounds[0][1] + currentOverlay.bounds[1][1]) / 2;

    const halfLat = Math.abs(currentOverlay.bounds[1][0] - currentOverlay.bounds[0][0]) / 2;
    const halfLng = Math.abs(currentOverlay.bounds[1][1] - currentOverlay.bounds[0][1]) / 2;

    onUpdateSiteplan({
      ...currentOverlay,
      bounds: [
        [centerLat - halfLat, centerLng - halfLng],
        [centerLat + halfLat, centerLng + halfLng],
      ],
    });
  };

  const handleDeleteSiteplan = () => {
    if (window.confirm('Yakin ingin menghapus denah siteplan dari survey ini?')) {
      onUpdateSiteplan(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #1e293b',
            background: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={18} color="#34d399" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              Siteplan Denah Developer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
            Tempelkan gambar denah kavling/perumahan dari developer tepat di atas koordinat Google Maps. Anda tetap dapat menarik tiang dan jalur kabel dengan koordinat GPS nyata.
          </p>

          {errorMsg && (
            <div
              style={{
                background: '#7f1d1d',
                color: '#fecaca',
                fontSize: '11.5px',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {!currentOverlay ? (
            /* Upload State */
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #0284c7',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.05)',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(2, 132, 199, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  color: '#38bdf8',
                }}
              >
                <Upload size={22} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                Pilih File Gambar Denah Siteplan
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                Format yang didukung: <b>JPG, PNG, WEBP</b>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: '#0284c7',
                  color: 'white',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '6px',
                }}
              >
                Jelajahi File
              </div>

              <div
                style={{
                  marginTop: '14px',
                  padding: '8px 10px',
                  background: '#1e293b',
                  borderRadius: '6px',
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  textAlign: 'left',
                }}
              >
                💡 <b>Tips:</b> Jika developer memberikan file PDF, buka PDF di komputer Anda lalu gunakan tombol <b>Win + Shift + S</b> untuk mengambil screenshot denah, simpan sebagai gambar PNG/JPG lalu upload ke sini.
              </div>
            </div>
          ) : (
            /* Siteplan Active Card & Controls */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                }}
              >
                <img
                  src={currentOverlay.imageUrl}
                  alt="Siteplan Preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentOverlay.name || 'Siteplan Denah'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} />
                    <span>Aktif di Survey Ini</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Transparansi: <b>{Math.round(currentOverlay.opacity * 100)}%</b>
                  </div>
                </div>
              </div>

              {/* Opacity Control */}
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  <span>Transparansi Denah (Opacity):</span>
                  <span style={{ color: '#38bdf8' }}>{Math.round(currentOverlay.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={currentOverlay.opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
                  <span>10% (Samar)</span>
                  <span>50%</span>
                  <span>100% (Jelas)</span>
                </div>
              </div>

              {/* Rotation Control */}
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  <span>Rotasi / Kemiringan Denah:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{currentOverlay.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={currentOverlay.rotation || 0}
                  onChange={(e) => {
                    onUpdateSiteplan({
                      ...currentOverlay,
                      rotation: parseInt(e.target.value, 10),
                    });
                  }}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
                  <span>0° (Tegak)</span>
                  <span>90°</span>
                  <span>180°</span>
                  <span>270°</span>
                  <span>360°</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleToggleVisible}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: currentOverlay.visible ? '#1e293b' : '#334155',
                    color: currentOverlay.visible ? '#38bdf8' : '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {currentOverlay.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{currentOverlay.visible ? 'Tampilkan Denah' : 'Sembunyikan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRecenterToMap}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Crosshair size={14} />
                  <span>Pusatkan ke Layar</span>
                </button>
              </div>

              {/* Big Calibration Mode Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCalibration();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                }}
              >
                <Sliders size={16} />
                <span>Mulai Atur / Kalibrasi Posisi di Peta</span>
              </button>

              {/* Replace or Delete Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Ganti File Gambar...
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSiteplan}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Hapus Denah</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

