// =============================================================================
// PLN SURVEY WEB - Overlay Manager Modal (Data Eksisting)
// =============================================================================
// Supports:
// 1. Cloud GIS On-Demand (JTM per Penyulang, JTR per Gardu, Gardu & Proteksi per ULP)
//    hosted on Cloudflare CDN / aaPanel server.
// 2. Local File Import (CSV, KML, and KMZ files).
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Search,
  RefreshCw,
  Zap,
  MapPin,
  Maximize2,
  Settings,
  Shield,
  Radio,
} from 'lucide-react';
import { OverlayFile, OverlayDataType } from '../../types/overlayTypes';
import { parseOverlayFile, detectOverlayType } from '../../services/overlayParser';
import { overlayStorage } from '../../services/overlayStorage';
import {
  cloudGisService,
  CloudGisCatalog,
  CloudGardu,
  CloudPenyulang,
  DEFAULT_CLOUD_GIS_URL,
} from '../../services/cloudGisService';

function generateId(): string {
  return 'ovl_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

const TYPE_LABELS: Record<OverlayDataType, string> = {
  jtm: '⚡ JTM (Jaringan TM)',
  jtr: '🔌 JTR (Jaringan & Tiang TR)',
  gardu: '🏠 Gardu Distribusi',
  proteksi: '🛡️ Proteksi & GH',
  custom: '🔌 JTR (Eksisting)',
};

const TYPE_OPTIONS: { value: OverlayDataType; label: string }[] = [
  { value: 'jtm', label: '⚡ JTM (Jaringan TM/Polyline)' },
  { value: 'jtr', label: '🔌 JTR (Jaringan & Tiang TR)' },
  { value: 'gardu', label: '🏠 Gardu (Titik)' },
  { value: 'proteksi', label: '🛡️ Proteksi (Titik)' },
];

const COLOR_PRESETS = [
  'multi',
  '#FF6600', // Oren menyala (JTR standard)
  '#FF5500',
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
  onZoomToBounds?: (bounds: [[number, number], [number, number]]) => void;
}

export const OverlayManagerModal: React.FC<OverlayManagerModalProps> = ({
  visible,
  onClose,
  overlays,
  onOverlaysChange,
  onZoomToBounds,
}) => {
  // Tab Switcher
  const [activeTab, setActiveTab] = useState<'cloud' | 'local'>('cloud');

  // Local Import State
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<'idle' | 'confirm'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingOverlay, setPendingOverlay] = useState<OverlayFile | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingType, setPendingType] = useState<OverlayDataType>('jtr');
  const [pendingColor, setPendingColor] = useState('#FF6600');

  // Cloud GIS State
  const [catalog, setCatalog] = useState<CloudGisCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedUlp, setSelectedUlp] = useState<string>('ALL');
  const [selectedPenyulangId, setSelectedPenyulangId] = useState<string>('');
  const [garduSearch, setGarduSearch] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Auto load catalog when modal is opened
  useEffect(() => {
    if (visible && !catalog && !loadingCatalog) {
      loadCatalog();
    }
    if (visible) {
      setCustomUrlInput(cloudGisService.getBaseUrl());
    }
  }, [visible]);

  const loadCatalog = async (forceRefresh = false) => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const data = await cloudGisService.getCatalog(forceRefresh);
      setCatalog(data);
      if (data.penyulang.length > 0 && !selectedPenyulangId) {
        setSelectedPenyulangId(data.penyulang[0].id);
      }
    } catch (err: any) {
      setCatalogError(err.message || 'Gagal memuat katalog dari Cloud Server');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleSaveCustomUrl = () => {
    if (customUrlInput.trim()) {
      cloudGisService.setBaseUrl(customUrlInput.trim());
      setShowUrlConfig(false);
      loadCatalog(true);
      showNotice('URL Cloud GIS berhasil diperbarui');
    }
  };

  const handleResetUrl = () => {
    cloudGisService.resetBaseUrl();
    setCustomUrlInput(DEFAULT_CLOUD_GIS_URL);
    setShowUrlConfig(false);
    loadCatalog(true);
    showNotice('URL dikembalikan ke default');
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Penyulang list based on ULP
  const filteredPenyulang = useMemo(() => {
    if (!catalog) return [];
    if (selectedUlp === 'ALL') return catalog.penyulang;
    return catalog.penyulang.filter((p) => p.ulp.toUpperCase() === selectedUlp.toUpperCase());
  }, [catalog, selectedUlp]);

  // Keep selected penyulang valid when ULP changes
  useEffect(() => {
    if (filteredPenyulang.length > 0) {
      const exists = filteredPenyulang.some((p) => p.id === selectedPenyulangId);
      if (!exists) {
        setSelectedPenyulangId(filteredPenyulang[0].id);
      }
    } else {
      setSelectedPenyulangId('');
    }
  }, [filteredPenyulang, selectedPenyulangId]);

  // Filtered Gardu list for search
  const filteredGardu = useMemo(() => {
    if (!catalog) return [];
    let list = catalog.gardu;
    if (selectedUlp !== 'ALL') {
      list = list.filter((g) => g.ulp.toUpperCase() === selectedUlp.toUpperCase());
    }
    const q = garduSearch.trim().toLowerCase();
    if (!q) {
      // Show first 20 items if no search query
      return list.slice(0, 20);
    }
    return list
      .filter(
        (g) =>
          g.id.toLowerCase().includes(q) ||
          g.nama.toLowerCase().includes(q) ||
          g.penyulang.toLowerCase().includes(q)
      )
      .slice(0, 50); // limit to 50 for performance
  }, [catalog, selectedUlp, garduSearch]);

  // --- CLOUD GIS ACTIONS ---

  const handleLoadJtm = async () => {
    if (!catalog || !selectedPenyulangId) return;
    const pObj = catalog.penyulang.find((x) => x.id === selectedPenyulangId);
    if (!pObj) return;

    const actionKey = `jtm-${pObj.id}`;
    setLoadingAction(actionKey);
    try {
      const overlay = await cloudGisService.fetchJtm(pObj.file, pObj.nama);

      // Check if already in overlays, replace or add
      const existsIdx = overlays.findIndex((o) => o.id === overlay.id);
      let updated: OverlayFile[];
      if (existsIdx >= 0) {
        updated = [...overlays];
        updated[existsIdx] = overlay;
      } else {
        updated = [...overlays, overlay];
      }

      onOverlaysChange(updated);
      await overlayStorage.saveOverlay(overlay);

      // Zoom to bounds if available
      const bounds = cloudGisService.calculateBounds(overlay);
      if (bounds && onZoomToBounds) {
        onZoomToBounds(bounds);
      }

      showNotice(`✅ ${overlay.name} (${overlay.data.polylines.length} segmen) berhasil dimuat!`);
    } catch (err: any) {
      alert(`Gagal memuat JTM: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoadJtr = async (gardu: CloudGardu) => {
    const actionKey = `jtr-${gardu.id}`;
    setLoadingAction(actionKey);
    try {
      const overlay = await cloudGisService.fetchJtr(gardu.id, gardu.nama);

      const existsIdx = overlays.findIndex((o) => o.id === overlay.id);
      let updated: OverlayFile[];
      if (existsIdx >= 0) {
        updated = [...overlays];
        updated[existsIdx] = overlay;
      } else {
        updated = [...overlays, overlay];
      }

      onOverlaysChange(updated);
      await overlayStorage.saveOverlay(overlay);

      const bounds = cloudGisService.calculateBounds(overlay);
      if (bounds && onZoomToBounds) {
        onZoomToBounds(bounds);
      }

      showNotice(`✅ JTR Gardu ${gardu.id} (${overlay.data.polylines.length} jalur, ${overlay.data.points.length} tiang) berhasil dimuat!`);
    } catch (err: any) {
      alert(`Gagal memuat JTR: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoadGarduUlp = async (ulp: string) => {
    if (ulp === 'ALL') {
      alert('Pilih ULP spesifik terlebih dahulu untuk memuat titik gardu.');
      return;
    }
    const actionKey = `gardu-${ulp}`;
    setLoadingAction(actionKey);
    try {
      const overlay = await cloudGisService.fetchGardu(ulp);

      const existsIdx = overlays.findIndex((o) => o.id === overlay.id);
      let updated: OverlayFile[];
      if (existsIdx >= 0) {
        updated = [...overlays];
        updated[existsIdx] = overlay;
      } else {
        updated = [...overlays, overlay];
      }

      onOverlaysChange(updated);
      await overlayStorage.saveOverlay(overlay);

      const bounds = cloudGisService.calculateBounds(overlay);
      if (bounds && onZoomToBounds) {
        onZoomToBounds(bounds);
      }

      showNotice(`✅ ${overlay.name} (${overlay.data.points.length} gardu) berhasil dimuat!`);
    } catch (err: any) {
      alert(`Gagal memuat data gardu ULP: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoadProteksiUlp = async (ulp: string) => {
    const targetUlp = ulp === 'ALL' ? 'LABUAN' : ulp;
    const actionKey = `pro-${targetUlp}`;
    setLoadingAction(actionKey);
    try {
      const overlay = await cloudGisService.fetchProteksi(targetUlp);

      const existsIdx = overlays.findIndex((o) => o.id === overlay.id);
      let updated: OverlayFile[];
      if (existsIdx >= 0) {
        updated = [...overlays];
        updated[existsIdx] = overlay;
      } else {
        updated = [...overlays, overlay];
      }

      onOverlaysChange(updated);
      await overlayStorage.saveOverlay(overlay);

      const bounds = cloudGisService.calculateBounds(overlay);
      if (bounds && onZoomToBounds) {
        onZoomToBounds(bounds);
      }

      showNotice(`✅ ${overlay.name} (${overlay.data.points.length} titik proteksi) berhasil dimuat!`);
    } catch (err: any) {
      alert(`Gagal memuat data proteksi: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Zoom to single overlay
  const handleFocusOverlay = (ol: OverlayFile) => {
    const bounds = cloudGisService.calculateBounds(ol);
    if (bounds && onZoomToBounds) {
      onZoomToBounds(bounds);
      showNotice(`Peta difokuskan ke layer "${ol.name}"`);
    } else {
      alert('Tidak dapat menghitung koordinat batas untuk layer ini.');
    }
  };

  // --- LOCAL FILE IMPORT ACTIONS ---

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
      const detectedType = detectOverlayType(geoData, undefined, file.name);

      const totalFeatures = geoData.points.length + geoData.polylines.length;
      if (totalFeatures === 0) {
        setErrorMsg('Tidak ditemukan data geografis valid di file ini.');
        setImporting(false);
        return;
      }

      const defaultColor = detectedType === 'jtr' ? '#FF6600' : undefined;

      const overlay: OverlayFile = {
        id: generateId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        type: detectedType,
        visible: true,
        opacity: 0.85,
        color: defaultColor,
        data: geoData,
        importedAt: new Date().toISOString(),
      };

      setPendingOverlay(overlay);
      setPendingName(overlay.name);
      setPendingType(detectedType);
      setPendingColor(detectedType === 'jtr' ? '#FF6600' : 'multi');
      setImportStep('confirm');
      setImporting(false);
    } catch (err: any) {
      setImporting(false);
      setErrorMsg(err.message || 'Gagal membaca file.');
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingOverlay) return;

    const resolvedColor =
      pendingType === 'jtm' || pendingType === 'jtr'
        ? pendingColor === 'multi'
          ? pendingType === 'jtr'
            ? '#FF6600'
            : undefined
          : pendingColor
        : undefined;

    const finalOverlay: OverlayFile = {
      ...pendingOverlay,
      name: pendingName.trim() || pendingOverlay.name,
      type: pendingType,
      color: resolvedColor,
    };

    const updated = [...overlays, finalOverlay];
    onOverlaysChange(updated);
    await overlayStorage.saveOverlay(finalOverlay);

    const bounds = cloudGisService.calculateBounds(finalOverlay);
    if (bounds && onZoomToBounds) {
      onZoomToBounds(bounds);
    }

    setPendingOverlay(null);
    setImportStep('idle');
    showNotice(`✅ Layer lokal "${finalOverlay.name}" berhasil ditambahkan!`);
  };

  const handleCancelImport = () => {
    setPendingOverlay(null);
    setImportStep('idle');
    setErrorMsg('');
  };

  // --- LAYER MANAGEMENT ---

  const toggleVisibility = async (id: string) => {
    const updated = overlays.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o));
    onOverlaysChange(updated);
    const target = updated.find((o) => o.id === id);
    if (target) await overlayStorage.updateVisibility(id, target.visible);
  };

  const updateOpacity = (id: string, opacity: number) => {
    const updated = overlays.map((o) => (o.id === id ? { ...o, opacity } : o));
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

  const handleClearAllOverlays = async () => {
    if (confirm(`Hapus semua ${overlays.length} layer data eksisting dari peta?`)) {
      onOverlaysChange([]);
      await overlayStorage.clearAllOverlays();
      showNotice('Semua layer eksisting telah dibersihkan.');
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '680px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
            background: 'rgba(30, 41, 59, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.4)',
              }}
            >
              <Globe size={18} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Data Jaringan Eksisting PLN
              </h3>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                On-Demand GIS UP3 Banten Selatan & File Overlay
              </div>
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
              transition: 'background 0.15s',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #334155',
            background: '#1e293b',
          }}
        >
          <button
            onClick={() => setActiveTab('cloud')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'cloud' ? '#0f172a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cloud' ? '2px solid #ea580c' : '2px solid transparent',
              color: activeTab === 'cloud' ? '#fb923c' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={16} />
            <span>Cloud GIS (On-Demand)</span>
            <span
              style={{
                fontSize: '10px',
                background: activeTab === 'cloud' ? '#ea580c' : '#334155',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              REKOMENDASI
            </span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'local' ? '#0f172a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'local' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'local' ? '#38bdf8' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={16} />
            <span>Upload File (KML / KMZ / CSV)</span>
          </button>
        </div>

        {/* Floating Success / Notification Toast inside modal */}
        {notification && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid #10b981',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          {/* ========================================================================= */}
          {/* TAB 1: CLOUD GIS ON-DEMAND */}
          {/* ========================================================================= */}
          {activeTab === 'cloud' && (
            <div>
              {/* Server Connection Bar */}
              <div
                style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: catalog ? '#10b981' : catalogError ? '#ef4444' : '#f59e0b',
                      boxShadow: catalog ? '0 0 6px #10b981' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loadingCatalog ? (
                      <span style={{ color: '#94a3b8' }}>Menghubungkan ke Cloud Server...</span>
                    ) : catalog ? (
                      <span>
                        <b style={{ color: '#f8fafc' }}>Server Online:</b>{' '}
                        <span style={{ color: '#38bdf8' }}>
                          {catalog.statistik
                            ? `${catalog.statistik.n_gardu.toLocaleString()} Gardu · ${catalog.statistik.n_penyulang} Penyulang · ${catalog.ulp.length} ULP`
                            : '5.339 Gardu · 68 Penyulang'}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: '#fca5a5' }}>Gagal terhubung ke Cloud GIS</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => loadCatalog(true)}
                    disabled={loadingCatalog}
                    title="Refresh Katalog"
                    style={{
                      background: '#334155',
                      border: 'none',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <RefreshCw size={13} className={loadingCatalog ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setShowUrlConfig(!showUrlConfig)}
                    title="Pengaturan URL Server"
                    style={{
                      background: showUrlConfig ? '#ea580c' : '#334155',
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '5px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <Settings size={13} />
                  </button>
                </div>
              </div>

              {/* URL Config Drawer */}
              {showUrlConfig && (
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '10px',
                    border: '1px solid #ea580c',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '12px',
                  }}
                >
                  <label style={{ display: 'block', fontWeight: 600, color: '#fb923c', marginBottom: '6px' }}>
                    Base URL Cloud Hosting (aaPanel / Cloudflare Tunnel):
                  </label>
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '12px',
                      marginBottom: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={handleResetUrl}
                      style={{
                        padding: '5px 10px',
                        background: '#334155',
                        border: 'none',
                        color: '#cbd5e1',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Reset Default
                    </button>
                    <button
                      onClick={handleSaveCustomUrl}
                      style={{
                        padding: '5px 12px',
                        background: '#ea580c',
                        border: 'none',
                        color: 'white',
                        borderRadius: '5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Simpan & Muat
                    </button>
                  </div>
                </div>
              )}

              {/* Error banner if catalog failed */}
              {catalogError && (
                <div
                  style={{
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
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{catalogError}</span>
                </div>
              )}

              {/* ULP Filter Pills */}
              {catalog && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '6px',
                    }}
                  >
                    Filter Wilayah ULP:
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedUlp('ALL')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: selectedUlp === 'ALL' ? 700 : 500,
                        background: selectedUlp === 'ALL' ? '#ea580c' : '#1e293b',
                        color: selectedUlp === 'ALL' ? 'white' : '#94a3b8',
                        border: selectedUlp === 'ALL' ? '1px solid #ea580c' : '1px solid #334155',
                        cursor: 'pointer',
                      }}
                    >
                      Semua ULP ({catalog.gardu.length})
                    </button>
                    {catalog.ulp.map((u) => {
                      const count = catalog.gardu.filter((g) => g.ulp.toUpperCase() === u.toUpperCase()).length;
                      const isSel = selectedUlp.toUpperCase() === u.toUpperCase();
                      return (
                        <button
                          key={u}
                          onClick={() => setSelectedUlp(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: isSel ? 700 : 500,
                            background: isSel ? '#ea580c' : '#1e293b',
                            color: isSel ? 'white' : '#94a3b8',
                            border: isSel ? '1px solid #ea580c' : '1px solid #334155',
                            cursor: 'pointer',
                          }}
                        >
                          {u} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION A: JTM (PENYULANG 20 kV) */}
              {catalog && (
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    padding: '14px 16px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={16} color="#38bdf8" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        JTM 20 kV (Per Penyulang)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {filteredPenyulang.length} penyulang
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedPenyulangId}
                      onChange={(e) => setSelectedPenyulangId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '12.5px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {filteredPenyulang.map((p) => {
                        const isLoaded = overlays.some((o) => o.id === `cloud_jtm_${p.file.replace('.geojson', '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.nama} ({p.ulp}) {isLoaded ? '✓ [Aktif]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={handleLoadJtm}
                      disabled={!selectedPenyulangId || loadingAction?.startsWith('jtm-')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#0284c7',
                        color: 'white',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {loadingAction?.startsWith('jtm-') ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Memuat...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Tampilkan JTM</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION B: JTR PER GARDU (GLOWING ORANGE + PURPLE POLES) */}
              {catalog && (
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #ea580c',
                    padding: '14px 16px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={16} color="#fb923c" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
                        JTR & Tiang TR Eksisting (Per Gardu)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'rgba(234, 88, 12, 0.25)',
                        color: '#fb923c',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      Oren Menyala (#FF6600)
                    </span>
                  </div>

                  {/* Search input for Gardu */}
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }}
                    />
                    <input
                      type="text"
                      placeholder="Cari Kode atau Nama Gardu (misal: TGP240, AAP, TELUK)..."
                      value={garduSearch}
                      onChange={(e) => setGarduSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    {garduSearch && (
                      <button
                        onClick={() => setGarduSearch('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '7px',
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Gardu list results */}
                  <div
                    style={{
                      maxHeight: '175px',
                      overflowY: 'auto',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      padding: '4px',
                    }}
                  >
                    {filteredGardu.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                        Tidak ditemukan gardu dengan kata kunci "{garduSearch}"
                      </div>
                    ) : (
                      filteredGardu.map((g) => {
                        const isLoaded = overlays.some((o) => o.id === `cloud_jtr_${g.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
                        const isLoading = loadingAction === `jtr-${g.id}`;
                        return (
                          <div
                            key={g.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                              background: isLoaded ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#f8fafc' }}>
                                  {g.id}
                                </span>
                                {g.ada_jtr ? (
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      background: '#065f46',
                                      color: '#6ee7b7',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Ada JTR
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      background: '#334155',
                                      color: '#94a3b8',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    Belum Ada JTR
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  Penyulang {g.penyulang}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#94a3b8',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '2px',
                                }}
                              >
                                {g.nama}
                              </div>
                            </div>

                            <button
                              onClick={() => handleLoadJtr(g)}
                              disabled={!g.ada_jtr || isLoading}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '5px',
                                background: isLoaded ? '#15803d' : g.ada_jtr ? '#ea580c' : '#334155',
                                color: 'white',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: g.ada_jtr && !isLoading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                                opacity: g.ada_jtr ? 1 : 0.5,
                              }}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Memuat...</span>
                                </>
                              ) : isLoaded ? (
                                <>
                                  <Check size={12} />
                                  <span>Aktif (Reload)</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={12} />
                                  <span>Muat JTR</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* SECTION C: BULK POINTS (TITIK GARDU & PROTEKSI) */}
              {catalog && (
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    padding: '14px 16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    Titik Gardu & Proteksi Regional (ULP)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleLoadGarduUlp(selectedUlp === 'ALL' ? 'LABUAN' : selectedUlp)}
                      disabled={loadingAction?.startsWith('gardu-')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#334155',
                        border: '1px solid #475569',
                        color: '#f8fafc',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {loadingAction?.startsWith('gardu-') ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <MapPin size={13} color="#4285F4" />
                      )}
                      <span>
                        Titik Gardu ({selectedUlp === 'ALL' ? 'LABUAN' : selectedUlp})
                      </span>
                    </button>

                    <button
                      onClick={() => handleLoadProteksiUlp(selectedUlp)}
                      disabled={loadingAction?.startsWith('pro-')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#334155',
                        border: '1px solid #475569',
                        color: '#f8fafc',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {loadingAction?.startsWith('pro-') ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Shield size={13} color="#e11d48" />
                      )}
                      <span>Proteksi & GH (LABUAN)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LOCAL FILE IMPORT */}
          {/* ========================================================================= */}
          {activeTab === 'local' && (
            <div>
              {/* Import Button Dropzone */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: importing ? '#0284c7' : '#0284c7',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: importing ? 'wait' : 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span>{importing ? 'Memproses File...' : 'Pilih File (CSV / KML / KMZ)'}</span>
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
                <div
                  style={{
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
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Import Confirmation Form */}
              {importStep === 'confirm' && pendingOverlay && (
                <div
                  style={{
                    background: '#1e293b',
                    border: '1px solid #0284c7',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                    Konfirmasi Import Layer
                  </div>

                  {/* Preview Stats */}
                  <div
                    style={{
                      background: '#0f172a',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      border: '1px solid #334155',
                      fontSize: '12.5px',
                      lineHeight: 1.6,
                      color: '#cbd5e1',
                    }}
                  >
                    <div>
                      📊 <b>Ditemukan:</b> {pendingOverlay.data.points.length} titik,{' '}
                      {pendingOverlay.data.polylines.length} jalur
                    </div>
                    <div>
                      🔍 <b>Tipe terdeteksi:</b> {TYPE_LABELS[pendingType]}
                    </div>
                  </div>

                  {/* Layer Name Input */}
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        marginBottom: '5px',
                      }}
                    >
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        marginBottom: '6px',
                      }}
                    >
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
                              border: isActive ? '1px solid #0284c7' : '1px solid #334155',
                              background: isActive ? '#0284c7' : '#0f172a',
                              color: isActive ? 'white' : '#94a3b8',
                              fontSize: '12px',
                              fontWeight: 600,
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

                  {/* Color Palette (JTM / JTR) */}
                  {(pendingType === 'jtm' || pendingType === 'jtr') && (
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#94a3b8',
                          marginBottom: '6px',
                        }}
                      >
                        Warna Jalur
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {COLOR_PRESETS.map((c) => {
                          if (c === 'multi') {
                            const isSelected = pendingColor === 'multi';
                            return (
                              <button
                                key="multi"
                                type="button"
                                onClick={() => setPendingColor('multi')}
                                title="Warna Otomatis per Feeder"
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* UNIFIED ACTIVE OVERLAY LAYERS LIST */}
          {/* ========================================================================= */}
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} />
                <span>Layer Aktif di Peta ({overlays.length})</span>
              </div>

              {overlays.length > 0 && (
                <button
                  onClick={handleClearAllOverlays}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                  }}
                >
                  <Trash2 size={12} />
                  <span>Bersihkan Semua</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overlays.map((ol) => {
                const isJtr = ol.type === 'jtr';
                return (
                  <div
                    key={ol.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: '10px',
                      border: isJtr ? '1px solid rgba(234, 88, 12, 0.4)' : '1px solid #334155',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#f8fafc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: ol.data.polylines.length > 0 ? '2px' : '50%',
                              background: ol.color || (isJtr ? '#FF6600' : '#38bdf8'),
                              flexShrink: 0,
                            }}
                          />
                          <span>{ol.name}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {TYPE_LABELS[ol.type]} • {ol.data.points.length} titik, {ol.data.polylines.length} jalur
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {/* Focus / Zoom to layer */}
                        <button
                          onClick={() => handleFocusOverlay(ol)}
                          title="Fokuskan peta ke layer ini"
                          style={{
                            background: '#334155',
                            border: 'none',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Maximize2 size={15} />
                        </button>

                        {/* Visibility Toggle */}
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
                          {ol.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Delete Layer */}
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
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Opacity Slider */}
                    {ol.visible && (
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '45px' }}>Transparansi:</span>
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
                );
              })}
            </div>

            {/* Empty State */}
            {overlays.length === 0 && importStep === 'idle' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#1e293b',
                  borderRadius: '10px',
                  border: '1px dashed #334155',
                }}
              >
                <FileCode size={36} strokeWidth={1.5} style={{ marginBottom: '8px', color: '#475569' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  Belum ada layer data eksisting yang dimuat.
                </div>
                <div style={{ fontSize: '11.5px', lineHeight: 1.5, maxWidth: '380px' }}>
                  Pilih Penyulang atau Gardu di tab <b>Cloud GIS</b> di atas untuk memuat jaringan existing secara instan ke peta!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Data tersimpan otomatis di browser (IndexedDB)
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              fontSize: '12.5px',
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
