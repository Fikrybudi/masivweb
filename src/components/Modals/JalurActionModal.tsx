import React, { useState, useEffect } from 'react';
import { JalurKabel } from '../../types';
import {
  Activity,
  Edit3,
  Trash2,
  X,
  Zap,
  Tag,
  Maximize2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface JalurActionModalProps {
  visible: boolean;
  jalur: JalurKabel | null;
  onClose: () => void;
  onSelectEdit: () => void;
  onSelectDelete: () => void;
}

export const JalurActionModal: React.FC<JalurActionModalProps> = ({
  visible,
  jalur,
  onClose,
  onSelectEdit,
  onSelectDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!visible) {
      setConfirmDelete(false);
    }
  }, [visible]);

  if (!visible || !jalur) return null;

  const colorBadge =
    jalur.jenisJaringan === 'SUTR'
      ? '#10b981'
      : jalur.jenisJaringan === 'SKTM'
      ? '#a855f7'
      : jalur.jenisJaringan === 'SKUTM'
      ? '#06b6d4'
      : '#f43f5e';

  return (
    <div
      style={{
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
        zIndex: 2500,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          border: '1px solid #334155',
          overflow: 'hidden',
        }}
      >
        {/* Header Info */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'rgba(233, 30, 99, 0.15)',
              border: '1px solid rgba(233, 30, 99, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorBadge,
              flexShrink: 0,
            }}
          >
            <Activity size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {jalur.namaJalur || `Jalur ${jalur.jenisJaringan}`}
              </h3>
              <span
                style={{
                  background: colorBadge,
                  color: 'white',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {jalur.jenisJaringan}
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              {jalur.jenisPenghantar} {jalur.penampangMM || ''} •{' '}
              <strong style={{ color: '#38bdf8' }}>
                {Math.round(jalur.panjangMeter)} m
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action List */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Edit Jalur */}
          <button
            onClick={() => {
              onClose();
              onSelectEdit();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 16px',
              borderRadius: '10px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#334155';
              (e.currentTarget as HTMLElement).style.borderColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#1e293b';
              (e.currentTarget as HTMLElement).style.borderColor = '#334155';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  background: 'rgba(2, 132, 199, 0.2)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit3 size={18} />
              </div>
              <div>
                <div>✏️ Edit Spesifikasi Jalur</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
                  Ubah jenis kabel, penampang, nama jalur, atau catatan
                </div>
              </div>
            </div>
          </button>

          {/* 2. Delete Jalur */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.08)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <div>🗑️ Hapus Jalur Kabel</div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 400 }}>
                    Hapus rentang kabel ini dari survey
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <span>Yakin ingin menghapus jalur ini?</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#334155',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onSelectDelete();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div
          style={{
            padding: '12px 20px',
            background: '#0b1120',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>Rentang: {jalur.koordinat.length} Titik Koordinat</span>
          <span>Status: {jalur.status === 'existing' ? 'Eksisting' : 'Rencana'}</span>
        </div>
      </div>
    </div>
  );
};
