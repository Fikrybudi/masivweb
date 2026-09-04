// =============================================================================
// PLN SURVEY WEB - Layer Control Modal
// =============================================================================
// Direct port of mobile app's LayerControlModal.tsx
// Controls visibility of survey layers AND imported KML/KMZ existing JTM/Gardu layers.
// =============================================================================

import React from 'react';
import {
  X,
  Layers,
  Tag,
  Zap,
  Radio,
  Circle,
  FolderOpen,
  GitMerge,
  Shield,
  MapPin,
} from 'lucide-react';
import { OverlayFile } from '../../types/overlayTypes';

export interface LayerVisibility {
  tiang: boolean;
  gardu: boolean;
  titikTiang: boolean;
  titikGardu: boolean;
  sutr: boolean;
  sutm: boolean;
  skutm: boolean;
  sktm: boolean;
}

interface LayerControlModalProps {
  visible: boolean;
  onClose: () => void;
  layerVisibility: LayerVisibility;
  onLayerChange: (update: Partial<LayerVisibility>) => void;
  overlayLayers?: OverlayFile[];
  onOverlayVisibilityChange?: (id: string, visible: boolean) => void;
  onOverlayUpdate?: (updatedOverlay: OverlayFile) => void;
}

export const LayerControlModal: React.FC<LayerControlModalProps> = ({
  visible,
  onClose,
  layerVisibility,
  onLayerChange,
  overlayLayers = [],
  onOverlayVisibilityChange,
  onOverlayUpdate,
}) => {
  if (!visible) return null;

  const toggle = (key: keyof LayerVisibility) => {
    onLayerChange({ [key]: !layerVisibility[key] });
  };

  const handleToggleFeeder = (ol: OverlayFile, feederName: string, isVis: boolean) => {
    const currentHidden = ol.hiddenFeeders || [];
    let updatedHidden: string[];
    if (isVis) {
      updatedHidden = currentHidden.filter((f) => f !== feederName);
    } else {
      updatedHidden = [...currentHidden, feederName];
    }
    const updated = { ...ol, hiddenFeeders: updatedHidden };
    if (onOverlayUpdate) onOverlayUpdate(updated);
  };

  const handleToggleType = (ol: OverlayFile, typeKey: string, isVis: boolean) => {
    const currentHidden = ol.hiddenTypes || [];
    let updatedHidden: string[];
    if (isVis) {
      updatedHidden = currentHidden.filter((t) => t !== typeKey);
    } else {
      updatedHidden = [...currentHidden, typeKey];
    }
    const updated = { ...ol, hiddenTypes: updatedHidden };
    if (onOverlayUpdate) onOverlayUpdate(updated);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
        maxWidth: '480px',
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
            <Layers size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Atur Layer Peta
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
          
          {/* 1. LABEL SURVEY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              📌 Layer Survey Aktif
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => toggle('tiang')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <Tag size={16} color="#94a3b8" />
                  <span>Label Tiang (Lingkaran Info)</span>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '11px',
                  background: layerVisibility.tiang ? '#0284c7' : '#475569',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: layerVisibility.tiang ? '19px' : '3px',
                    transition: 'all 0.2s',
                  }} />
                </div>
              </div>

              <div
                onClick={() => toggle('gardu')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <Zap size={16} color="#f97316" />
                  <span>Label Gardu (Nomor & kVA)</span>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '11px',
                  background: layerVisibility.gardu ? '#0284c7' : '#475569',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: layerVisibility.gardu ? '19px' : '3px',
                    transition: 'all 0.2s',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. TITIK MARKER */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              📍 Titik Marker Lokasi
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => toggle('titikTiang')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <Circle size={16} color="#0284c7" />
                  <span>Titik Tiang (Dot Marker)</span>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '11px',
                  background: layerVisibility.titikTiang ? '#0284c7' : '#475569',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: layerVisibility.titikTiang ? '19px' : '3px',
                    transition: 'all 0.2s',
                  }} />
                </div>
              </div>

              <div
                onClick={() => toggle('titikGardu')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <Zap size={16} color="#f97316" />
                  <span>Titik Gardu (Kotak Distribusi)</span>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '11px',
                  background: layerVisibility.titikGardu ? '#0284c7' : '#475569',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: layerVisibility.titikGardu ? '19px' : '3px',
                    transition: 'all 0.2s',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. JALUR KABEL SURVEY */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              ⚡ Jalur Kabel Survey
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'sutm' as const, label: 'Jalur SUTM (TM)', color: '#E91E63' },
                { key: 'sktm' as const, label: 'Jalur SKTM (Tanah)', color: '#9C27B0' },
                { key: 'skutm' as const, label: 'Jalur SKUTM (Udara)', color: '#00BCD4' },
                { key: 'sutr' as const, label: 'Jalur SUTR (TR)', color: '#00E676' },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#1e293b',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Radio size={16} color={item.color} />
                    <span>{item.label}</span>
                  </div>
                  <div style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '11px',
                    background: layerVisibility[item.key] ? item.color : '#475569',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '3px',
                      left: layerVisibility[item.key] ? '19px' : '3px',
                      transition: 'all 0.2s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. DATA JARINGAN EKSISTING (KML / KMZ / CSV) - Mobile App Standard */}
          {overlayLayers.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                📂 DATA JARINGAN EKSISTING (KML / KMZ)
              </div>

              {overlayLayers.map((ol) => {
                const uniqueFeeders = Array.from(
                  new Set((ol.data?.polylines || []).map((pl) => pl.name).filter(Boolean))
                );
                const points = ol.data?.points || [];
                const garduCount = points.filter(
                  (pt) =>
                    pt.properties['CLASSIFICATION']?.includes('GD') ||
                    pt.properties['TYPE_GARDU'] === 'GD' ||
                    pt.name.match(/^[A-Za-z]{2,4}\d{3}[A-Za-z]?$/)
                ).length;
                const proteksiCount = points.filter(
                  (pt) =>
                    /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.name) ||
                    /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.properties['JENIS'] || pt.properties['jenis'] || '')
                ).length;

                return (
                  <div
                    key={ol.id}
                    style={{
                      marginBottom: '14px',
                      backgroundColor: '#1e293b',
                      borderRadius: '10px',
                      padding: '12px',
                      borderLeft: '4px solid #f43f5e',
                      border: '1px solid #334155',
                      borderLeftWidth: '4px',
                      borderLeftColor: '#f43f5e',
                    }}
                  >
                    {/* Master File Header Switch */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <FolderOpen size={18} color="#f43f5e" style={{ marginRight: '8px', flexShrink: 0 }} />
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ol.name}
                        </span>
                      </div>
                      <div
                        onClick={() => onOverlayVisibilityChange && onOverlayVisibilityChange(ol.id, !ol.visible)}
                        style={{
                          width: '38px',
                          height: '22px',
                          borderRadius: '11px',
                          background: ol.visible ? '#f43f5e' : '#475569',
                          position: 'relative',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '3px',
                          left: ol.visible ? '19px' : '3px',
                          transition: 'all 0.2s',
                        }} />
                      </div>
                    </div>

                    {/* Sub-layers (Only shown if master file is ON) */}
                    {ol.visible && (
                      <div style={{ paddingLeft: '8px', marginTop: '8px' }}>
                        {/* ⚡ JTM Per Penyulang Switches */}
                        {uniqueFeeders.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ec4899', marginBottom: '6px' }}>
                              ⚡ PENYULANG JTM ({uniqueFeeders.length} jalur)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {uniqueFeeders.map((feederName) => {
                                const isFeederVis = !ol.hiddenFeeders?.includes(feederName);
                                return (
                                  <div
                                    key={feederName}
                                    onClick={() => handleToggleFeeder(ol, feederName, !isFeederVis)}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '6px 8px',
                                      background: '#0f172a',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                      <GitMerge size={14} color="#ec4899" />
                                      <span style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {feederName}
                                      </span>
                                    </div>
                                    <div style={{
                                      width: '32px',
                                      height: '18px',
                                      borderRadius: '9px',
                                      background: isFeederVis ? '#ec4899' : '#475569',
                                      position: 'relative',
                                      transition: 'all 0.2s',
                                    }}>
                                      <div style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '2px',
                                        left: isFeederVis ? '16px' : '2px',
                                        transition: 'all 0.2s',
                                      }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 🏢 Gardu Eksisting Switches */}
                        {(garduCount > 0 || ol.type === 'gardu') && (() => {
                          const garduPoints = points.filter(
                            (pt) =>
                              pt.properties['CLASSIFICATION']?.includes('GD') ||
                              pt.properties['TYPE_GARDU'] === 'GD' ||
                              pt.name.match(/^[A-Za-z]{2,4}\d{3}[A-Za-z]?$/)
                          );
                          const garduByFeeder: Record<string, number> = {};
                          garduPoints.forEach((pt) => {
                            const fName =
                              pt.properties['feeder'] ||
                              pt.properties['FEEDER'] ||
                              pt.properties['PENYULANG'] ||
                              pt.properties['penyulang'] ||
                              '';
                            if (fName) garduByFeeder[fName] = (garduByFeeder[fName] || 0) + 1;
                          });
                          const gFeeders = Object.keys(garduByFeeder);
                          const isAllGarduVis = !ol.hiddenTypes?.includes('gardu');

                          return (
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                                🏢 GARDU EKSISTING ({garduCount} unit)
                              </div>

                              {/* Master Gardu Toggle */}
                              <div
                                onClick={() => handleToggleType(ol, 'gardu', !isAllGarduVis)}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  background: '#0f172a',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginBottom: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Zap size={14} color="#38bdf8" />
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                                    Semua Gardu Eksisting
                                  </span>
                                </div>
                                <div style={{
                                  width: '32px',
                                  height: '18px',
                                  borderRadius: '9px',
                                  background: isAllGarduVis ? '#38bdf8' : '#475569',
                                  position: 'relative',
                                  transition: 'all 0.2s',
                                }}>
                                  <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: isAllGarduVis ? '16px' : '2px',
                                    transition: 'all 0.2s',
                                  }} />
                                </div>
                              </div>

                              {/* Per-Feeder Gardu Switches */}
                              {gFeeders.length > 1 && isAllGarduVis && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                                  {gFeeders.map((fName) => {
                                    const isGVis =
                                      !ol.hiddenTypes?.includes('gardu_' + fName) &&
                                      !ol.hiddenFeeders?.includes(fName);
                                    return (
                                      <div
                                        key={'g_' + fName}
                                        onClick={() => handleToggleType(ol, 'gardu_' + fName, !isGVis)}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '5px 8px',
                                          background: 'rgba(15, 23, 42, 0.6)',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                          <MapPin size={12} color="#60a5fa" />
                                          <span style={{ fontSize: '11px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            Gardu {fName} ({garduByFeeder[fName]} unit)
                                          </span>
                                        </div>
                                        <div style={{
                                          width: '28px',
                                          height: '16px',
                                          borderRadius: '8px',
                                          background: isGVis ? '#60a5fa' : '#475569',
                                          position: 'relative',
                                          transition: 'all 0.2s',
                                        }}>
                                          <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            position: 'absolute',
                                            top: '2px',
                                            left: isGVis ? '14px' : '2px',
                                            transition: 'all 0.2s',
                                          }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 🛡️ Titik Proteksi Switches */}
                        {(proteksiCount > 0 || ol.type === 'proteksi') && (() => {
                          const proteksiPoints = points.filter(
                            (pt) =>
                              /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.name) ||
                              /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.properties['JENIS'] || pt.properties['jenis'] || '')
                          );
                          const proteksiByFeeder: Record<string, number> = {};
                          proteksiPoints.forEach((pt) => {
                            const fName =
                              pt.properties['feeder'] ||
                              pt.properties['FEEDER'] ||
                              pt.properties['PENYULANG'] ||
                              pt.properties['penyulang'] ||
                              '';
                            if (fName) proteksiByFeeder[fName] = (proteksiByFeeder[fName] || 0) + 1;
                          });
                          const pFeeders = Object.keys(proteksiByFeeder);
                          const isAllProteksiVis = !ol.hiddenTypes?.includes('proteksi');

                          return (
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
                                🛡️ TITIK PROTEKSI ({proteksiCount} unit: GH, LBS, PMR)
                              </div>

                              {/* Master Proteksi Toggle */}
                              <div
                                onClick={() => handleToggleType(ol, 'proteksi', !isAllProteksiVis)}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  background: '#0f172a',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginBottom: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Shield size={14} color="#f59e0b" />
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                                    Semua Titik Proteksi
                                  </span>
                                </div>
                                <div style={{
                                  width: '32px',
                                  height: '18px',
                                  borderRadius: '9px',
                                  background: isAllProteksiVis ? '#f59e0b' : '#475569',
                                  position: 'relative',
                                  transition: 'all 0.2s',
                                }}>
                                  <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: isAllProteksiVis ? '16px' : '2px',
                                    transition: 'all 0.2s',
                                  }} />
                                </div>
                              </div>

                              {/* Per-Feeder Proteksi Switches */}
                              {pFeeders.length > 1 && isAllProteksiVis && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                                  {pFeeders.map((fName) => {
                                    const isPVis =
                                      !ol.hiddenTypes?.includes('proteksi_' + fName) &&
                                      !ol.hiddenFeeders?.includes(fName);
                                    return (
                                      <div
                                        key={'p_' + fName}
                                        onClick={() => handleToggleType(ol, 'proteksi_' + fName, !isPVis)}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '5px 8px',
                                          background: 'rgba(15, 23, 42, 0.6)',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                          <Shield size={12} color="#fbbf24" />
                                          <span style={{ fontSize: '11px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            Proteksi {fName} ({proteksiByFeeder[fName]} unit)
                                          </span>
                                        </div>
                                        <div style={{
                                          width: '28px',
                                          height: '16px',
                                          borderRadius: '8px',
                                          background: isPVis ? '#fbbf24' : '#475569',
                                          position: 'relative',
                                          transition: 'all 0.2s',
                                        }}>
                                          <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            position: 'absolute',
                                            top: '2px',
                                            left: isPVis ? '14px' : '2px',
                                            transition: 'all 0.2s',
                                          }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
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
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
