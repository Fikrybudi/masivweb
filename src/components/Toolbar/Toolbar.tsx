import React from 'react';
import {
  MapPin,
  Home,
  Edit,
  Zap,
  Navigation,
  Check,
  X,
  Building,
} from 'lucide-react';

export type ToolMode =
  | 'none'
  | 'add-tiang'
  | 'add-gardu'
  | 'draw-jalur'
  | 'draw-jembatan'
  | 'underbuild-sutr'
  | 'draw-persil'
  | 'move-tiang';

interface ToolbarProps {
  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onFinishDrawing?: () => void;
  onCancelDrawing?: () => void;
  isDrawing?: boolean;
  drawingPointsCount?: number;
  underbuildTiangCount?: number;
  onFinishUnderbuild?: () => void;
  onCancelUnderbuild?: () => void;
  branchBannerText?: string;
  onCancelBranch?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentMode,
  onModeChange,
  onFinishDrawing,
  onCancelDrawing,
  isDrawing = false,
  drawingPointsCount = 0,
  underbuildTiangCount = 0,
  onFinishUnderbuild,
  onCancelUnderbuild,
  branchBannerText,
  onCancelBranch,
}) => {
  const toggleMode = (mode: ToolMode) => {
    onModeChange(currentMode === mode ? 'none' : mode);
  };

  // Branch Mode Banner
  if (branchBannerText) {
    return (
      <div
        className="masiv-mode-banner"
        style={{
          background: '#15803d',
        }}
      >
        <div>
          <div className="banner-title" style={{ fontWeight: 700, fontSize: '13px' }}>{branchBannerText}</div>
          <div className="banner-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>Klik pada peta untuk menancapkan tiang cabang baru</div>
        </div>
        <button
          onClick={onCancelBranch}
          style={{
            background: '#22c55e',
            color: '#052e16',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Selesai Cabang ✓
        </button>
      </div>
    );
  }

  // Underbuild Mode
  if (currentMode === 'underbuild-sutr') {
    return (
      <div
        className="masiv-mode-banner"
        style={{
          background: '#047857',
        }}
      >
        <div>
          <div className="banner-title" style={{ fontWeight: 700, fontSize: '13px' }}>🔌 Underbuild SUTR ({underbuildTiangCount} tiang dipilih)</div>
          <div className="banner-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>Klik berurutan tiang SUTM yang ingin dipasang jalur SUTR</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onCancelUnderbuild}
            style={{
              background: '#334155',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Batal
          </button>
          <button
            onClick={onFinishUnderbuild}
            disabled={underbuildTiangCount < 2}
            style={{
              background: underbuildTiangCount >= 2 ? '#10b981' : '#475569',
              color: 'white',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: underbuildTiangCount >= 2 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            Buat Jalur ✓
          </button>
        </div>
      </div>
    );
  }

  // Drawing Mode (Jalur / Jembatan Kabel)
  if (isDrawing && (currentMode === 'draw-jalur' || currentMode === 'draw-jembatan')) {
    const isJembatan = currentMode === 'draw-jembatan';
    return (
      <div
        className="masiv-mode-banner"
        style={{
          background: isJembatan ? '#0e7490' : '#1e3a8a',
        }}
      >
        <div>
          <div className="banner-title" style={{ fontWeight: 700, fontSize: '13px' }}>
            {isJembatan ? '🌉 Menggambar Jembatan Kabel' : '✏️ Menggambar Jalur Kabel'} ({drawingPointsCount} titik)
          </div>
          <div className="banner-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>Klik peta untuk menambah segmen penarikan</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onCancelDrawing}
            style={{
              background: '#334155',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Batal
          </button>
          <button
            onClick={onFinishDrawing}
            disabled={drawingPointsCount < 2}
            style={{
              background: drawingPointsCount >= 2 ? '#22c55e' : '#475569',
              color: 'white',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: drawingPointsCount >= 2 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            Selesai ✓
          </button>
        </div>
      </div>
    );
  }

  // Move Tiang Mode
  if (currentMode === 'move-tiang') {
    return (
      <div
        className="masiv-mode-banner"
        style={{
          background: '#d97706',
        }}
      >
        <div>
          <div className="banner-title" style={{ fontWeight: 700, fontSize: '13px' }}>📍 Geser Posisi Tiang</div>
          <div className="banner-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>Geser pin tiang atau klik titik baru di peta (jalur kabel otomatis snapped mengikuti)</div>
        </div>
        <button
          onClick={onCancelDrawing}
          style={{
            background: '#451a03',
            color: 'white',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Batal
        </button>
      </div>
    );
  }

  // Persil Pelanggan Drawing Mode Banner
  if (currentMode === 'draw-persil') {
    return (
      <div
        className="masiv-mode-banner"
        style={{
          background: '#854d0e',
        }}
      >
        <div>
          <div className="banner-title" style={{ fontWeight: 700, fontSize: '13px' }}>
            {drawingPointsCount === 0 ? '🏘️ Mode Persil: Klik Titik Sudut 1' : '🏘️ Titik 1 OK → Klik Titik Sudut 2 (Diagonal)'}
          </div>
          <div className="banner-subtitle" style={{ fontSize: '11px', opacity: 0.9 }}>
            {drawingPointsCount === 0 ? 'Klik sudut awal bidang tanah persil di peta' : 'Klik sudut diagonal berlawanan untuk membentuk kotak persil'}
          </div>
        </div>
        <button
          onClick={onCancelDrawing}
          style={{
            background: '#422006',
            color: 'white',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Batal
        </button>
      </div>
    );
  }

  // Main Floating Bottom Action Bar
  return (
    <div className="masiv-bottom-toolbar">
      {/* 1. Add Tiang */}
      <button
        onClick={() => toggleMode('add-tiang')}
        className="masiv-toolbar-btn"
        title="Tambah Tiang Baru"
        style={{
          background: currentMode === 'add-tiang' ? '#0284c7' : 'transparent',
          color: currentMode === 'add-tiang' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">📍</span>
        <span className="toolbar-label">Tiang</span>
      </button>

      {/* 2. Add Gardu */}
      <button
        onClick={() => toggleMode('add-gardu')}
        className="masiv-toolbar-btn"
        title="Tambah Gardu Baru"
        style={{
          background: currentMode === 'add-gardu' ? '#e11d48' : 'transparent',
          color: currentMode === 'add-gardu' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">⚡</span>
        <span className="toolbar-label">Gardu</span>
      </button>

      {/* 3. Draw Jalur */}
      <button
        onClick={() => toggleMode('draw-jalur')}
        className="masiv-toolbar-btn"
        title="Gambar Jalur Kabel"
        style={{
          background: currentMode === 'draw-jalur' ? '#2563eb' : 'transparent',
          color: currentMode === 'draw-jalur' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">✏️</span>
        <span className="toolbar-label">Jalur</span>
      </button>

      {/* 4. Underbuild SUTR */}
      <button
        onClick={() => toggleMode('underbuild-sutr')}
        className="masiv-toolbar-btn"
        title="Pasang Underbuild SUTR"
        style={{
          background: (currentMode as string) === 'underbuild-sutr' ? '#059669' : 'transparent',
          color: (currentMode as string) === 'underbuild-sutr' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">🔌</span>
        <span className="toolbar-label">Under</span>
      </button>

      {/* 5. Jembatan Kabel (JK) */}
      <button
        onClick={() => toggleMode('draw-jembatan')}
        className="masiv-toolbar-btn"
        title="Gambar Jembatan Kabel"
        style={{
          background: currentMode === 'draw-jembatan' ? '#0891b2' : 'transparent',
          color: currentMode === 'draw-jembatan' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">🌉</span>
        <span className="toolbar-label">JK</span>
      </button>

      {/* 6. Persil Pelanggan */}
      <button
        onClick={() => toggleMode('draw-persil')}
        className="masiv-toolbar-btn"
        title="Gambar Bidang Persil Pelanggan"
        style={{
          background: (currentMode as string) === 'draw-persil' ? '#a16207' : 'transparent',
          color: (currentMode as string) === 'draw-persil' ? 'white' : '#94a3b8',
        }}
      >
        <span className="toolbar-icon">🏘️</span>
        <span className="toolbar-label">Persil</span>
      </button>
    </div>

  );
};
