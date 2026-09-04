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
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        background: '#15803d',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{branchBannerText}</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Klik pada peta untuk menancapkan tiang cabang baru</div>
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
            cursor: 'pointer'
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
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        background: '#047857',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>🔌 Underbuild SUTR ({underbuildTiangCount} tiang dipilih)</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Klik berurutan tiang SUTM yang ingin dipasang jalur SUTR</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancelUnderbuild}
            style={{
              background: '#334155',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
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
              cursor: underbuildTiangCount >= 2 ? 'pointer' : 'not-allowed'
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
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        background: isJembatan ? '#0e7490' : '#1e3a8a',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>
            {isJembatan ? '🌉 Menggambar Jembatan Kabel' : '✏️ Menggambar Jalur Kabel'} ({drawingPointsCount} titik)
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Klik peta untuk menambah segmen penarikan</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancelDrawing}
            style={{
              background: '#334155',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
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
              cursor: drawingPointsCount >= 2 ? 'pointer' : 'not-allowed'
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
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        background: '#d97706',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>📍 Geser Posisi Tiang</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Klik pada titik baru di peta tempat tiang dipindahkan</div>
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
            cursor: 'pointer'
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
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        background: '#854d0e',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>
            {drawingPointsCount === 0 ? '🏘️ Mode Persil: Klik Titik Sudut 1' : '🏘️ Titik 1 OK → Klik Titik Sudut 2 (Diagonal)'}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
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
            cursor: 'pointer'
          }}
        >
          Batal
        </button>
      </div>
    );
  }


  // Main Floating Bottom Action Bar
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1500,
      background: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(12px)',
      padding: '6px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      maxWidth: 'calc(100vw - 24px)',
      overflowX: 'auto',
    }}>
      {/* 1. Add Tiang */}
      <button
        onClick={() => toggleMode('add-tiang')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: currentMode === 'add-tiang' ? '#0284c7' : 'transparent',
          color: currentMode === 'add-tiang' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>📍</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Tiang</span>
      </button>

      {/* 2. Add Gardu */}
      <button
        onClick={() => toggleMode('add-gardu')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: currentMode === 'add-gardu' ? '#e11d48' : 'transparent',
          color: currentMode === 'add-gardu' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>⚡</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Gardu</span>
      </button>

      {/* 3. Draw Jalur */}
      <button
        onClick={() => toggleMode('draw-jalur')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: currentMode === 'draw-jalur' ? '#2563eb' : 'transparent',
          color: currentMode === 'draw-jalur' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>✏️</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Jalur</span>
      </button>

      {/* 4. Underbuild SUTR */}
      <button
        onClick={() => toggleMode('underbuild-sutr')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: (currentMode as string) === 'underbuild-sutr' ? '#059669' : 'transparent',
          color: (currentMode as string) === 'underbuild-sutr' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>🔌</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Under</span>
      </button>

      {/* 5. Jembatan Kabel (JK) */}
      <button
        onClick={() => toggleMode('draw-jembatan')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: currentMode === 'draw-jembatan' ? '#0891b2' : 'transparent',
          color: currentMode === 'draw-jembatan' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>🌉</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>JK</span>
      </button>

      {/* 6. Persil Pelanggan */}
      <button
        onClick={() => toggleMode('draw-persil')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 52,
          borderRadius: '10px',
          border: 'none',
          background: (currentMode as string) === 'draw-persil' ? '#a16207' : 'transparent',
          color: (currentMode as string) === 'draw-persil' ? 'white' : '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: '16px' }}>🏘️</span>
        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Persil</span>
      </button>
    </div>

  );
};
