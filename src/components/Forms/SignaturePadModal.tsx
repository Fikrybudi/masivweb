// =============================================================================
// PLN SURVEY WEB - Interactive Digital Signature Pad Modal
// =============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Check, PenTool } from 'lucide-react';

interface SignaturePadModalProps {
  visible: boolean;
  title: string;
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  visible,
  title,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setHasDrawn(false);
    setIsDrawing(false);

    // Give modal DOM a tick to measure before drawing
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set internal resolution matching display width
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Fill white background for clean PNG export
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
    }, 50);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasDrawn) {
      alert('Silakan bubuhkan tanda tangan terlebih dahulu');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0f172a',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '520px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            <PenTool size={18} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              {title}
            </h4>
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
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Gunakan mouse atau sentuhan jari / stylus pada area putih di bawah:
          </p>

          <div style={{
            position: 'relative',
            width: '100%',
            height: '220px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px dashed #0284c7',
            background: '#ffffff'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                touchAction: 'none',
                cursor: 'crosshair',
                display: 'block'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {!hasDrawn && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>
                Bubuhkan tanda tangan di sini...
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b'
        }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              padding: '8px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} color="#ef4444" />
            <span>Hapus</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '8px 14px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: '#0284c7',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>Simpan Tanda Tangan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
