import React, { useState, useEffect } from 'react';
import { Tiang } from '../../types';
import { getTiangDisplayCode } from '../../utils/branchUtils';
import {
  MapPin,
  GitBranch,
  ArrowRightCircle,
  ArrowLeftCircle,
  Move,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TiangActionModalProps {
  visible: boolean;
  tiang: Tiang | null;
  onClose: () => void;
  onSelectBranch: (direction: 'R' | 'L') => void;
  onSelectMove: () => void;
  onSelectEdit: () => void;
  onSelectDelete: () => void;
}

export const TiangActionModal: React.FC<TiangActionModalProps> = ({
  visible,
  tiang,
  onClose,
  onSelectBranch,
  onSelectMove,
  onSelectEdit,
  onSelectDelete,
}) => {
  const [showBranchOptions, setShowBranchOptions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowBranchOptions(false);
      setConfirmDelete(false);
    }
  }, [visible]);


  if (!visible || !tiang) return null;

  const kodeTiang = getTiangDisplayCode(tiang);

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
      zIndex: 2500,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {/* Header Info */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <MapPin size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>
                Tiang {kodeTiang}
              </h3>
              {tiang.status === 'existing' && (
                <span style={{ fontSize: '10px', background: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                  Existing
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {tiang.konstruksi} • {tiang.jenisTiang} ({tiang.tinggiTiang})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Options List */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Percabangan (Tee-off) */}
          <div style={{
            background: '#1e293b',
            borderRadius: '10px',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <div
              onClick={() => setShowBranchOptions(!showBranchOptions)}
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex'
              }}>
                <GitBranch size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80' }}>
                  🌿 Buat Percabangan (Tee-off)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Tarik jalur cabang baru (R/L) dari tiang ini
                </div>
              </div>
              {showBranchOptions ? <ChevronUp size={18} color="#4ade80" /> : <ChevronDown size={18} color="#4ade80" />}
            </div>

            {/* Expandable Submenu for Branch */}
            {showBranchOptions && (
              <div style={{
                padding: '10px 14px 14px 14px',
                borderTop: '1px solid #334155',
                display: 'flex',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.6)'
              }}>
                <button
                  onClick={() => onSelectBranch('R')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#15803d',
                    color: 'white',
                    border: 'none',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRightCircle size={16} />
                  Cabang Kanan (R)
                </button>
                <button
                  onClick={() => onSelectBranch('L')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#166534',
                    color: 'white',
                    border: 'none',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeftCircle size={16} />
                  Cabang Kiri (L)
                </button>
              </div>
            )}
          </div>

          {/* 2. Geser Posisi Tiang (Move) */}
          <div
            onClick={onSelectMove}
            style={{
              background: '#1e293b',
              borderRadius: '10px',
              border: '1px solid #334155',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#facc15',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Move size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#facc15' }}>
                📍 Geser Posisi Tiang (Move)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Klik lokasi baru di peta untuk memindahkan tiang
              </div>
            </div>
          </div>

          {/* 3. Edit Data Tiang */}
          <div
            onClick={onSelectEdit}
            style={{
              background: '#1e293b',
              borderRadius: '10px',
              border: '1px solid #334155',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Edit3 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                ✏️ Edit Data Tiang
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Ubah konstruksi, tinggi tiang, penguat, foto, dll
              </div>
            </div>
          </div>

          {/* 4. Hapus Tiang */}
          {confirmDelete ? (
            <div
              style={{
                background: 'rgba(225, 29, 72, 0.15)',
                borderRadius: '10px',
                border: '1.5px solid #e11d48',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fecdd3' }}>
                ⚠️ Yakin ingin menghapus Tiang {kodeTiang} beserta segmen jalur yang terhubung?
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  style={{
                    background: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDelete();
                  }}
                  style={{
                    background: '#e11d48',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Ya, Hapus Tiang
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setConfirmDelete(true)}
              style={{
                background: '#1e293b',
                borderRadius: '10px',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                background: 'rgba(225, 29, 72, 0.15)',
                color: '#fb7185',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex'
              }}>
                <Trash2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fb7185' }}>
                  🗑️ Hapus Tiang Ini
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Hapus titik tiang dari survey ini
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

