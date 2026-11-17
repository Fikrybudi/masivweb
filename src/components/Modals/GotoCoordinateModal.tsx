import React, { useState, useEffect } from 'react';
import { X, Navigation, Copy, Check, ArrowLeftRight, Compass, LocateFixed, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { Coordinate } from '../../types';

interface GotoCoordinateModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (coord: Coordinate, zoom: number, showPin: boolean) => void;
  currentMapCenter?: Coordinate | null;
}

export function parseCoordinateString(input: string): {
  coord: Coordinate | null;
  isSwappedLikely: boolean;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { coord: null, isSwappedLikely: false };
  }

  // 1. Google Maps URL patterns
  // e.g. https://www.google.com/maps?q=-6.2088,106.8456 or /@ -6.2088,106.8456,17z
  const urlCoordMatch = trimmed.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/) ||
                        trimmed.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/) ||
                        trimmed.match(/place\/(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (urlCoordMatch) {
    const lat = parseFloat(urlCoordMatch[1]);
    const lng = parseFloat(urlCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return validateAndCheckSwap(lat, lng);
    }
  }

  // 2. DMS pattern: e.g. 6°12'31.7"S 106°50'44.2"E or 6 12 31.7 S, 106 50 44.2 E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEW])/gi;
  const dmsMatches = [...trimmed.matchAll(dmsRegex)];
  if (dmsMatches.length === 2) {
    const parseDMSMatch = (m: RegExpMatchArray) => {
      const deg = parseFloat(m[1]) || 0;
      const min = parseFloat(m[2]) || 0;
      const sec = parseFloat(m[3]) || 0;
      const dir = m[4].toUpperCase();
      let decimal = deg + min / 60 + sec / 3600;
      if (dir === 'S' || dir === 'W') decimal = -decimal;
      return { val: decimal, isLat: dir === 'N' || dir === 'S' };
    };

    const first = parseDMSMatch(dmsMatches[0]);
    const second = parseDMSMatch(dmsMatches[1]);

    const lat = first.isLat ? first.val : second.val;
    const lng = first.isLat ? second.val : first.val;
    return validateAndCheckSwap(lat, lng);
  }

  // 3. Decimal patterns: "-6.2088, 106.8456" or "-6.2088 106.8456" or "-6.2088; 106.8456"
  // Clean prefixes like "lat:", "long:", "latitude:", etc.
  const cleaned = trimmed
    .replace(/[a-zA-Z]+[:=]/gi, ' ')
    .replace(/[°]/g, ' ')
    .replace(/[;]/g, ',');

  // Extract all numbers (including signs and decimals)
  const numbers = cleaned.match(/-?\d+\.?\d*/g);
  if (numbers && numbers.length >= 2) {
    const lat = parseFloat(numbers[0]);
    const lng = parseFloat(numbers[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return validateAndCheckSwap(lat, lng);
    }
  }

  return {
    coord: null,
    isSwappedLikely: false,
    error: 'Format koordinat belum dikenali. Contoh: -6.2088, 106.8456',
  };
}

function validateAndCheckSwap(lat: number, lng: number): {
  coord: Coordinate | null;
  isSwappedLikely: boolean;
  error?: string;
} {
  // Check if coordinates are in Indonesia region reversed (Longitude first: ~95 to ~142, Latitude: ~ -11 to ~ 6)
  if (lat > 60 && lat < 150 && lng > -20 && lng < 20) {
    return {
      coord: { latitude: lng, longitude: lat },
      isSwappedLikely: true,
    };
  }

  // General range check
  if (lat < -90 || lat > 90) {
    return { coord: null, isSwappedLikely: false, error: 'Nilai Latitude harus antara -90 dan 90.' };
  }
  if (lng < -180 || lng > 180) {
    return { coord: null, isSwappedLikely: false, error: 'Nilai Longitude harus antara -180 dan 180.' };
  }

  return {
    coord: { latitude: lat, longitude: lng },
    isSwappedLikely: false,
  };
}

export const GotoCoordinateModal: React.FC<GotoCoordinateModalProps> = ({
  visible,
  onClose,
  onNavigate,
  currentMapCenter,
}) => {
  const [tab, setTab] = useState<'single' | 'manual'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(19);
  const [showPin, setShowPin] = useState<boolean>(true);
  const [parsedCoord, setParsedCoord] = useState<Coordinate | null>(null);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Parse whenever inputs change
  useEffect(() => {
    if (tab === 'single') {
      if (!singleInput.trim()) {
        setParsedCoord(null);
        setIsSwapped(false);
        setErrorMessage('');
        return;
      }
      const res = parseCoordinateString(singleInput);
      setParsedCoord(res.coord);
      setIsSwapped(res.isSwappedLikely);
      setErrorMessage(res.error || '');
    } else {
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);
      if (!latInput.trim() || !lngInput.trim()) {
        setParsedCoord(null);
        setIsSwapped(false);
        setErrorMessage('');
        return;
      }
      if (isNaN(lat) || isNaN(lng)) {
        setParsedCoord(null);
        setErrorMessage('Nilai Latitude atau Longitude tidak valid.');
        return;
      }
      const res = validateAndCheckSwap(lat, lng);
      setParsedCoord(res.coord);
      setIsSwapped(res.isSwappedLikely);
      setErrorMessage(res.error || '');
    }
  }, [tab, singleInput, latInput, lngInput]);

  if (!visible) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTab('single');
        setSingleInput(text.trim());
      }
    } catch {
      alert('Izin membaca clipboard diblokir oleh browser. Silakan tempel (Ctrl+V) langsung di kolom input.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setTab('single');
        setSingleInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      },
      (err) => {
        alert('Gagal mengambil lokasi GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwap = () => {
    if (parsedCoord) {
      const newLat = parsedCoord.longitude;
      const newLng = parsedCoord.latitude;
      setParsedCoord({ latitude: newLat, longitude: newLng });
      setIsSwapped(false);
      if (tab === 'single') {
        setSingleInput(`${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
      } else {
        setLatInput(newLat.toString());
        setLngInput(newLng.toString());
      }
    }
  };

  const handleCopyCoord = () => {
    if (parsedCoord) {
      navigator.clipboard.writeText(`${parsedCoord.latitude.toFixed(6)}, ${parsedCoord.longitude.toFixed(6)}`);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedCoord) return;
    onNavigate(parsedCoord, zoomLevel, showPin);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3500,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
            >
              <Compass size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#f8fafc' }}>
                Lompat ke Koordinat
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Arahkan peta langsung ke titik Latitude & Longitude
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
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Input Mode Selector */}
          <div
            style={{
              display: 'flex',
              background: '#1e293b',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #334155',
            }}
          >
            <button
              type="button"
              onClick={() => setTab('single')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: tab === 'single' ? '#0284c7' : 'transparent',
                color: tab === 'single' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📋 Tempel Bebas (Satu Kolom)
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: tab === 'manual' ? '#0284c7' : 'transparent',
                color: tab === 'manual' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✍️ Dua Kolom (Lat & Long)
            </button>
          </div>

          {/* Quick Helper Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePasteClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Copy size={12} />
              Tempel Clipboard
            </button>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#1e293b',
                color: '#34d399',
                border: '1px solid #059669',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LocateFixed size={12} />
              GPS Saya
            </button>
            {currentMapCenter && (
              <button
                type="button"
                onClick={() => {
                  setTab('single');
                  setSingleInput(`${currentMapCenter.latitude.toFixed(6)}, ${currentMapCenter.longitude.toFixed(6)}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#1e293b',
                  color: '#fbbf24',
                  border: '1px solid #d97706',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Compass size={12} />
                Tengah Peta
              </button>
            )}
          </div>

          {/* Input Fields */}
          {tab === 'single' ? (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tempel Koordinat atau Link Google Maps:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Contoh: -6.2088, 106.8456 atau link Maps"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#1e293b',
                  border: parsedCoord ? '1.5px solid #22c55e' : errorMessage ? '1.5px solid #ef4444' : '1px solid #475569',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Format didukung: Desimal (-6.20, 106.84), DMS (6°12'S 106°50'E), atau Link Google Maps
              </span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Latitude (Lintang):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: -6.2088"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Longitude (Bujur):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 106.8456"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Validation & Preview Card */}
          {parsedCoord ? (
            <div
              style={{
                background: 'rgba(22, 101, 52, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#4ade80" />
                <div>
                  <div style={{ fontSize: '11px', color: '#86efac', fontWeight: 700 }}>
                    Koordinat Siap Dilompat:
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#ffffff', fontFamily: 'monospace', fontWeight: 700 }}>
                    {parsedCoord.latitude.toFixed(6)}, {parsedCoord.longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isSwapped && (
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Terdeteksi urutan Longitude, Latitude. Klik untuk tukar posisi."
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#eab308',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowLeftRight size={12} />
                    Tukar Posisi
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyCoord}
                  title="Salin Koordinat"
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedSuccess ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          ) : errorMessage ? (
            <div
              style={{
                background: 'rgba(153, 27, 27, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#fca5a5',
              }}
            >
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Options: Zoom & Pin Marker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px solid #1e293b',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Zoom Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>Tingkat Zoom:</label>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={17}>17x (Kawasan/Area)</option>
                <option value={18}>18x (Standar Survey)</option>
                <option value={19}>19x (Detail Tiang - Rekomendasi)</option>
                <option value={20}>20x (Sangat Dekat)</option>
              </select>
            </div>

            {/* Pin Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                color: '#cbd5e1',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={showPin}
                onChange={(e) => setShowPin(e.target.checked)}
                style={{ accentColor: '#0284c7', width: 14, height: 14 }}
              />
              <MapPin size={13} color="#f87171" />
              <span>Pasang Pin Penanda</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!parsedCoord}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: parsedCoord ? '#0284c7' : '#334155',
                color: parsedCoord ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: parsedCoord ? 'pointer' : 'not-allowed',
                boxShadow: parsedCoord ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Navigation size={14} />
              <span>Lompat ke Lokasi (Fly To)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

