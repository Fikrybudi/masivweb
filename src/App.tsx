import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { LoginScreen } from './components/Auth/LoginScreen';
import { SplashScreen } from './components/Common/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Survey, Coordinate, Tiang, Gardu, JalurKabel } from './types';
import { SurveyMap } from './components/SurveyMap';
import { Sidebar } from './components/Sidebar';
import { localDb } from './services/localDb';
import { supabaseSurveyService } from './services/supabaseService';
import { BASurveyModal } from './components/Forms/BASurveyModal';
import { SurveySummaryModal } from './components/Modals/SurveySummaryModal';
import { ExportPdfModal } from './components/Modals/ExportPdfModal';
import { TiangModal } from './components/Forms/TiangModal';
import { GarduModal } from './components/Forms/GarduModal';
import { JalurModal } from './components/Forms/JalurModal';
import { PersilModal, PersilFormData } from './components/Forms/PersilModal';
import { Toolbar, ToolMode } from './components/Toolbar/Toolbar';
import { TiangActionModal } from './components/Modals/TiangActionModal';
import { JalurActionModal } from './components/Modals/JalurActionModal';
import { LayerControlModal, LayerVisibility } from './components/Modals/LayerControlModal';
import { AboutModal } from './components/Modals/AboutModal';
import { OverlayManagerModal } from './components/Modals/OverlayManagerModal';
import { overlayStorage } from './services/overlayStorage';
import { OverlayFile } from './types/overlayTypes';
import { generateNextBranchCode, getBranchModeBannerLabel } from './utils/branchUtils';
import { calculateDistance } from './utils/geoUtils';
import { Layers, UploadCloud, Trash2, Menu, ChevronRight, BarChart2, Edit3 } from 'lucide-react';

export function App() {
  // Fast Startup Splash Screen state (matching mobile app App.tsx)
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const [splashOpacity, setSplashOpacity] = useState<number>(1);

  // Authentication state
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<'tiang' | 'gardu' | 'jalur' | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'google-sat' | 'google-hybrid'>('osm');

  // Toolbar & Drawing Modes
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [clickedCoord, setClickedCoord] = useState<Coordinate | null>(null);
  const [tempLineCoords, setTempLineCoords] = useState<Coordinate[]>([]);
  const [underbuildTiangIds, setUnderbuildTiangIds] = useState<string[]>([]);
  const [persilCorners, setPersilCorners] = useState<Coordinate[]>([]);

  // Branching states (R/L)
  const [activeBranchParent, setActiveBranchParent] = useState<Tiang | null>(null);
  const [activeBranchDirection, setActiveBranchDirection] = useState<'R' | 'L' | null>(null);

  // Move Tiang state
  const [movingTiang, setMovingTiang] = useState<Tiang | null>(null);

  // Modals Visibility
  const [showBASurveyModal, setShowBASurveyModal] = useState<boolean>(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summarySurvey, setSummarySurvey] = useState<Survey | null>(null);
  const [showExportPdfModal, setShowExportPdfModal] = useState<boolean>(false);
  const [leafletMap, setLeafletMap] = useState<any | null>(null);
  const [showTiangModal, setShowTiangModal] = useState<boolean>(false);
  const [showGarduModal, setShowGarduModal] = useState<boolean>(false);
  const [showJalurModal, setShowJalurModal] = useState<boolean>(false);
  // Layer Control & Modal Visibility
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    tiang: true,
    gardu: true,
    titikTiang: true,
    titikGardu: true,
    sutr: true,
    sutm: true,
    skutm: true,
    sktm: true,
  });
  const [showLayerModal, setShowLayerModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPersilModal, setShowPersilModal] = useState<boolean>(false);
  const [actionTiang, setActionTiang] = useState<Tiang | null>(null);
  const [editingTiang, setEditingTiang] = useState<Tiang | null>(null);
  const [actionJalur, setActionJalur] = useState<JalurKabel | null>(null);
  const [editingJalur, setEditingJalur] = useState<JalurKabel | null>(null);

  // Overlay Layers State (Data Eksisting KML / KMZ / CSV)
  const [overlays, setOverlays] = useState<OverlayFile[]>([]);

  // Auto-Connect Jalur Modal State
  const [autoConnectPrompt, setAutoConnectPrompt] = useState<{
    prevTiang: Tiang;
    newTiang: Tiang;
    jenisJaringan: string;
    penghantar: string;
    penampang: string;
    dist: number;
  } | null>(null);

  // Resizable Sidebar & Responsive Mobile Drawer states
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('masiv_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 260 && val <= 650) return val;
      }
    } catch (e) {}
    return 350;
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Resize window detection for responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resizing mouse drag handlers
  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maxAllowed = Math.min(window.innerWidth * 0.6, 650);
      const newWidth = Math.max(260, Math.min(e.clientX, maxAllowed));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('masiv_sidebar_width', String(sidebarWidth));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, sidebarWidth]);

  const loadData = async () => {
    const stored = await localDb.getAllSurveys();
    setSurveys(stored);
    if (stored.length > 0) {
      const activeId = await localDb.getActiveSurveyId();
      const found = stored.find((s) => s.id === activeId) || stored[0];
      setActiveSurvey(found);
    }
    const loadedOverlays = await overlayStorage.getAllOverlays();
    setOverlays(loadedOverlays);
  };

  useEffect(() => {
    // Check if logout requested via URL query param
    if (window.location.search.includes('logout=true')) {
      supabase.auth.signOut().then(() => {
        setSession(null);
        setAuthInitialized(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          setSplashOpacity(0);
          setTimeout(() => setShowSplashScreen(false), 400);
        }, 500);
      });
      return;
    }

    // Initial Supabase session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setAuthInitialized(true);
      if (initialSession) {
        loadData();
      }
      // Fast startup splash fade out matching mobile app
      setTimeout(() => {
        setSplashOpacity(0);
        setTimeout(() => setShowSplashScreen(false), 400);
      }, 800);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
      await supabase.auth.signOut();
      setSession(null);
      setActiveSurvey(null);
    }
  };

  const handleOverlaysChange = (updated: OverlayFile[]) => {
    setOverlays(updated);
  };

  const handleOverlayVisibilityChange = async (id: string, visible: boolean) => {
    const updated = overlays.map((o) => (o.id === id ? { ...o, visible } : o));
    setOverlays(updated);
    await overlayStorage.updateVisibility(id, visible);
  };

  const handleOverlayUpdate = async (updatedOverlay: OverlayFile) => {
    const updated = overlays.map((o) => (o.id === updatedOverlay.id ? updatedOverlay : o));
    setOverlays(updated);
    await overlayStorage.updateOverlay(updatedOverlay);
  };

  // Two-Way Sync with Supabase Cloud (Upload Local + Download Cloud)
  const handleSyncCloud = async () => {
    if (!session) {
      alert('Silakan login terlebih dahulu untuk melakukan sinkronisasi dengan database Supabase.');
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Upload local unsynced surveys to Supabase (owner surveys or if superadmin edited)
      const localSurveys = await localDb.getAllSurveys();
      const isSuperadmin = session?.user?.user_metadata?.role === 'superadmin';
      const unsyncedSurveys = localSurveys.filter(
        (s) => !s.isSynced && (!s.userId || s.userId === session.user.id || isSuperadmin)
      );
      let uploadSuccessCount = 0;
      let uploadFailCount = 0;

      for (const survey of unsyncedSurveys) {
        const toUpload: Survey = {
          ...survey,
          userId: survey.userId || session.user.id,
          updatedBy: session.user.email || survey.updatedBy,
        };
        const res = await supabaseSurveyService.upsertSurvey(toUpload);
        if (res.success) {
          uploadSuccessCount++;
          await localDb.saveSurvey({ ...toUpload, isSynced: true });
        } else {
          uploadFailCount++;
          console.warn(`Gagal upload survey ${survey.namaSurvey}:`, res.error);
        }
      }

      // 2. Fetch all surveys from Supabase cloud
      const cloudSurveys = await supabaseSurveyService.fetchAllSurveys();
      let downloadedCount = 0;

      if (cloudSurveys && cloudSurveys.length > 0) {
        const freshLocal = await localDb.getAllSurveys();
        for (const cs of cloudSurveys) {
          const localMatch = freshLocal.find((l) => l.id === cs.id);
          if (!localMatch) {
            // New survey from cloud: save to local cache
            await localDb.saveSurvey({ ...cs, isSynced: true });
            downloadedCount++;
          } else if (localMatch.isSynced) {
            // Local had no unpushed edits: update if cloud has newer updatedAt
            const localTime = new Date(localMatch.updatedAt || localMatch.createdAt).getTime();
            const cloudTime = new Date(cs.updatedAt || cs.createdAt).getTime();
            if (cloudTime > localTime) {
              await localDb.saveSurvey({ ...cs, isSynced: true });
              downloadedCount++;
            }
          }
        }
      }

      // 3. Reload surveys from localDb
      const updated = await localDb.getAllSurveys();
      setSurveys(updated);
      if (!activeSurvey || !updated.some((u) => u.id === activeSurvey.id)) {
        if (updated.length > 0) {
          setActiveSurvey(updated[0]);
          await localDb.setActiveSurveyId(updated[0].id);
        }
      } else {
        // Refresh activeSurvey with latest version
        const currentActive = updated.find((u) => u.id === activeSurvey.id);
        if (currentActive) setActiveSurvey(currentActive);
      }

      alert(
        `✅ Sinkronisasi Berhasil!\n\n` +
        `• Diunggah ke Cloud: ${uploadSuccessCount} survey${uploadFailCount > 0 ? ` (${uploadFailCount} gagal)` : ''}\n` +
        `• Diunduh dari Cloud: ${downloadedCount} survey\n` +
        `• Total Tersedia: ${updated.length} survey`
      );
    } catch (err: any) {
      console.error('Failed to sync with Supabase:', err);
      alert(`❌ Sinkronisasi Gagal: ${err?.message || 'Terjadi kesalahan saat menghubungi Supabase.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Single Survey Cloud Upload
  const handleSyncSingleSurvey = async (survey: Survey) => {
    if (!session) {
      alert('Silakan login terlebih dahulu untuk sinkronisasi cloud.');
      return;
    }
    try {
      const toUpload: Survey = {
        ...survey,
        userId: survey.userId || session.user.id,
        updatedBy: session.user.email || survey.updatedBy,
      };
      const res = await supabaseSurveyService.upsertSurvey(toUpload);
      if (res.success) {
        const updatedSurvey = { ...toUpload, isSynced: true };
        await localDb.saveSurvey(updatedSurvey);
        const all = await localDb.getAllSurveys();
        setSurveys(all);
        if (activeSurvey?.id === survey.id) {
          setActiveSurvey(updatedSurvey);
        }
        alert(`✅ Survey "${survey.namaSurvey}" berhasil di-upload ke Cloud Supabase!`);
      } else {
        alert(`❌ Gagal upload survey: ${res.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`❌ Gagal upload survey: ${err?.message || String(err)}`);
    }
  };

  const handleSelectSurvey = async (survey: Survey) => {
    setActiveSurvey(survey);
    setSelectedAsset(null);
    setSelectedAssetType(null);
    setToolMode('none');
    setTempLineCoords([]);
    setActiveBranchParent(null);
    setActiveBranchDirection(null);
    setMovingTiang(null);
    await localDb.setActiveSurveyId(survey.id);
  };

  // Delete Survey Handler (Clean heavy surveys to prevent lag)
  const handleDeleteSurvey = async (survey: Survey) => {
    const tiangCount = survey.tiangList?.length || 0;
    const garduCount = survey.garduList?.length || 0;
    const jalurCount = survey.jalurList?.length || 0;

    const confirmMsg =
      `Yakin ingin menghapus survey "${survey.namaSurvey || 'Survey'}"?\n\n` +
      `Data yang akan dihapus:\n` +
      `• ${tiangCount} Titik Tiang\n` +
      `• ${garduCount} Titik Gardu\n` +
      `• ${jalurCount} Jalur Kabel\n\n` +
      `Data akan dihapus permanen dari browser ini untuk mengosongkan memori agar tidak ngelag.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await localDb.deleteSurvey(survey.id);

      try {
        await supabaseSurveyService.deleteSurvey(survey.id);
      } catch (err) {
        console.warn('Could not delete from Supabase or offline:', err);
      }

      const remaining = surveys.filter((s) => s.id !== survey.id);
      setSurveys(remaining);

      if (activeSurvey?.id === survey.id) {
        const nextActive = remaining.length > 0 ? remaining[0] : null;
        setActiveSurvey(nextActive);
        if (nextActive) {
          await localDb.setActiveSurveyId(nextActive.id);
        }
        setSelectedAsset(null);
        setSelectedAssetType(null);
        setTempLineCoords([]);
        setUnderbuildTiangIds([]);
        setPersilCorners([]);
        setToolMode('none');
        setMovingTiang(null);
      }
    } catch (err: any) {
      alert('Gagal menghapus survey: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const handleSelectAsset = (asset: any, type: 'tiang' | 'gardu' | 'jalur') => {
    if (toolMode !== 'none') return; // Don't inspect while drawing
    setSelectedAsset(asset);
    setSelectedAssetType(type);
    if (type === 'jalur') {
      setActionJalur(asset);
    }
  };

  // Tiang click on Map
  const handleTiangClick = (tiang: Tiang) => {
    if (toolMode === 'underbuild-sutr') {
      // Toggle tiang in underbuild selection
      setUnderbuildTiangIds((prev) =>
        prev.includes(tiang.id) ? prev.filter((id) => id !== tiang.id) : [...prev, tiang.id]
      );
      return;
    }

    if (toolMode === 'none') {
      setActionTiang(tiang);
    }
  };

  // Move Tiang & Snap All Connected Jalurs (Identical to MASIV Mobile)
  const handleMoveTiang = async (tiangId: string, newCoord: Coordinate) => {
    if (!activeSurvey) return;

    const targetTiang = (activeSurvey.tiangList || []).find((t) => t.id === tiangId);
    const oldCoord = targetTiang?.koordinat;

    // 1. Update Tiang Coordinate
    const updatedTiangList = (activeSurvey.tiangList || []).map((t) =>
      t.id === tiangId ? { ...t, koordinat: newCoord, updatedAt: new Date(), isSynced: false } : t
    );

    // 2. Find and update connected Jalurs (snapped to new position)
    const updatedJalurList = (activeSurvey.jalurList || []).map((jalur) => {
      let hasMatch = false;
      const newKoordinat = [...(jalur.koordinat || [])];

      // A. Match by tiangIds
      if (jalur.tiangIds && jalur.tiangIds.includes(tiangId)) {
        jalur.tiangIds.forEach((id, idx) => {
          if (id === tiangId && idx < newKoordinat.length) {
            newKoordinat[idx] = newCoord;
            hasMatch = true;
          }
        });
      }

      // B. Fallback match by old coordinates proximity (within 2.5 meters)
      if (!hasMatch && oldCoord && newKoordinat.length > 0) {
        newKoordinat.forEach((c, idx) => {
          const dist = calculateDistance(c, oldCoord);
          if (dist <= 2.5) {
            newKoordinat[idx] = newCoord;
            hasMatch = true;
          }
        });
      }

      if (!hasMatch) return jalur;

      // Recalculate total length along the new polyline
      let newPanjang = 0;
      for (let i = 0; i < newKoordinat.length - 1; i++) {
        newPanjang += calculateDistance(newKoordinat[i], newKoordinat[i + 1]);
      }

      return {
        ...jalur,
        koordinat: newKoordinat,
        panjangMeter: Math.round(newPanjang * 10) / 10,
        updatedAt: new Date(),
        isSynced: false,
      };
    });

    const updatedSurvey: Survey = {
      ...activeSurvey,
      tiangList: updatedTiangList,
      jalurList: updatedJalurList,
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setMovingTiang(null);
    setToolMode('none');
  };

  // Map Click Handler
  const handleMapClick = async (coord: Coordinate) => {
    if (!activeSurvey) {
      alert('Silakan buat atau pilih survey terlebih dahulu!');
      return;
    }

    // Move Tiang Handler (Click on map to place)
    if (toolMode === 'move-tiang' && movingTiang) {
      await handleMoveTiang(movingTiang.id, coord);
      return;
    }

    if (toolMode === 'add-tiang') {
      setClickedCoord(coord);
      setEditingTiang(null);
      setShowTiangModal(true);
    } else if (toolMode === 'add-gardu') {
      setClickedCoord(coord);
      setShowGarduModal(true);
    } else if (toolMode === 'draw-jalur' || toolMode === 'draw-jembatan') {
      setTempLineCoords((prev) => [...prev, coord]);
    } else if (toolMode === 'draw-persil') {
      if (persilCorners.length === 0) {
        setPersilCorners([coord]);
      } else {
        const corner1 = persilCorners[0];
        const corner2 = coord;
        const sw: Coordinate = {
          latitude: Math.min(corner1.latitude, corner2.latitude),
          longitude: Math.min(corner1.longitude, corner2.longitude),
        };
        const ne: Coordinate = {
          latitude: Math.max(corner1.latitude, corner2.latitude),
          longitude: Math.max(corner1.longitude, corner2.longitude),
        };
        setPersilCorners([sw, ne]);
        setShowPersilModal(true);
      }
    }
  };


  // Tiang Actions
  const handleSelectBranch = (direction: 'R' | 'L') => {
    if (!actionTiang) return;
    setActiveBranchParent(actionTiang);
    setActiveBranchDirection(direction);
    setToolMode('add-tiang');
    setActionTiang(null);
  };

  const handleSelectMove = () => {
    if (!actionTiang) return;
    setMovingTiang(actionTiang);
    setToolMode('move-tiang');
    setActionTiang(null);
  };

  const handleSelectEdit = () => {
    if (!actionTiang) return;
    setEditingTiang(actionTiang);
    setClickedCoord(actionTiang.koordinat);
    setShowTiangModal(true);
    setActionTiang(null);
  };

  const handleSelectDelete = async () => {
    if (!actionTiang || !activeSurvey) return;
    const tiangId = actionTiang.id;

    // 1. Remove tiang and renumber remaining
    const filteredTiangList = (activeSurvey.tiangList || [])
      .filter((t) => t.id !== tiangId)
      .map((t, idx) => ({ ...t, nomorUrut: idx + 1 }));

    // 2. Cascade update connected Jalur
    const updatedJalurList = (activeSurvey.jalurList || [])
      .map((j) => {
        if (!j.tiangIds || !j.tiangIds.includes(tiangId)) return j;
        const remainingIds = j.tiangIds.filter((id) => id !== tiangId);
        if (remainingIds.length < 2) {
          return null; // Jalur only had this tiang or is now invalid (<2 tiang)
        }
        const remainingCoords = j.koordinat.filter((_, idx) => j.tiangIds![idx] !== tiangId);
        let newPanjang = 0;
        for (let i = 0; i < remainingCoords.length - 1; i++) {
          newPanjang += calculateDistance(remainingCoords[i], remainingCoords[i + 1]);
        }
        return {
          ...j,
          tiangIds: remainingIds,
          koordinat: remainingCoords,
          panjangMeter: newPanjang,
          updatedAt: new Date(),
        };
      })
      .filter(Boolean) as JalurKabel[];

    const updatedSurvey: Survey = {
      ...activeSurvey,
      tiangList: filteredTiangList,
      jalurList: updatedJalurList,
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setActionTiang(null);
    setSelectedAsset(null);
  };

  // Jalur Actions (Matching MASIV Mobile)
  const handleSelectEditJalur = (jalurToEdit?: JalurKabel) => {
    const target = jalurToEdit || actionJalur || (selectedAssetType === 'jalur' ? selectedAsset : null);
    if (!target) return;
    setEditingJalur(target);
    setTempLineCoords(target.koordinat);
    setShowJalurModal(true);
    setActionJalur(null);
  };

  const handleSelectDeleteJalur = async (jalurToDelete?: JalurKabel) => {
    const target = jalurToDelete || actionJalur || (selectedAssetType === 'jalur' ? selectedAsset : null);
    if (!target || !activeSurvey) return;

    const confirmMsg = `Yakin ingin menghapus jalur kabel "${target.namaJalur || target.jenisJaringan}" (${Math.round(target.panjangMeter)}m)?`;
    if (!window.confirm(confirmMsg)) return;

    const updatedJalurList = (activeSurvey.jalurList || []).filter((j) => j.id !== target.id);
    const updatedSurvey: Survey = {
      ...activeSurvey,
      jalurList: updatedJalurList,
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setActionJalur(null);
    setSelectedAsset(null);
    setSelectedAssetType(null);
  };



  // Submit & BA Survey Handlers
  const handleSaveBASurvey = async (surveyData: Partial<Survey>) => {
    if (editingSurvey) {
      // Edit mode: update existing survey
      const updatedSurvey: Survey = {
        ...editingSurvey,
        ...surveyData,
        updatedAt: new Date(),
        updatedBy: session?.user?.email || editingSurvey.updatedBy,
        isSynced: false,
      };
      await localDb.saveSurvey(updatedSurvey);
      if (activeSurvey?.id === editingSurvey.id) {
        setActiveSurvey(updatedSurvey);
      }
      setSurveys(await localDb.getAllSurveys());
      setEditingSurvey(null);
      setShowBASurveyModal(false);
    } else {
      // New survey mode
      const newSurvey: Survey = {
        id: crypto.randomUUID(),
        namaSurvey: surveyData.namaSurvey || 'Survey Baru',
        jenisSurvey: surveyData.jenisSurvey || 'Pasang Baru',
        lokasi: surveyData.lokasi || '',
        kecamatan: surveyData.kecamatan || '',
        kelurahan: surveyData.kelurahan || '',
        namaFeeder: surveyData.namaFeeder || '',
        namaGarduInduk: surveyData.namaGarduInduk || '',
        surveyor: surveyData.surveyor || session?.user?.email || 'Surveyor PLN',
        tanggalSurvey: surveyData.tanggalSurvey || new Date(),
        tiangList: [],
        garduList: [],
        jalurList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isSynced: false,
        idPelanggan: surveyData.idPelanggan,
        namaPelanggan: surveyData.namaPelanggan,
        alamatPelanggan: surveyData.alamatPelanggan,
        tarifDaya: surveyData.tarifDaya,
        hasilSurvey: surveyData.hasilSurvey,
        namaPerwakilan: surveyData.namaPerwakilan,
        keterangan: surveyData.keterangan,
        appDipasang: surveyData.appDipasang,
        konstruksiOleh: surveyData.konstruksiOleh,
        baChecklist: surveyData.baChecklist,
        signaturePelanggan: surveyData.signaturePelanggan,
        signatureSurveyor: surveyData.signatureSurveyor,
      };
      await localDb.saveSurvey(newSurvey);
      const updated = await localDb.getAllSurveys();
      setSurveys(updated);
      setActiveSurvey(newSurvey);
      await localDb.setActiveSurveyId(newSurvey.id);
      setShowBASurveyModal(false);
    }
  };

  const handleOpenEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setShowBASurveyModal(true);
  };

  const handleOpenSummary = (survey: Survey) => {
    setSummarySurvey(survey);
    setShowSummaryModal(true);
  };

  // Handle tiang label shift (snapped to quadrant 0..7)
  const handleTiangLabelShift = async (tiangId: string, newPosition: number, newDistance?: number) => {
    if (!activeSurvey) return;
    const updatedTiangList = (activeSurvey.tiangList || []).map((t) =>
      t.id === tiangId ? { ...t, labelPosition: newPosition, labelDistance: newDistance } : t
    );
    const updatedSurvey: Survey = {
      ...activeSurvey,
      tiangList: updatedTiangList,
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };
    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
  };

  const handleSaveTiang = async (data: Omit<Tiang, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    if (!activeSurvey) return;

    if (editingTiang) {
      // Update existing tiang
      const updatedTiangList = (activeSurvey.tiangList || []).map((t) =>
        t.id === editingTiang.id ? { ...t, ...data, updatedAt: new Date() } : t
      );
      const updatedSurvey: Survey = {
        ...activeSurvey,
        tiangList: updatedTiangList,
        isSynced: false,
        updatedAt: new Date(),
        updatedBy: session?.user?.email || activeSurvey.updatedBy,
      };
      await localDb.saveSurvey(updatedSurvey);
      setActiveSurvey(updatedSurvey);
      setSurveys(await localDb.getAllSurveys());
      setEditingTiang(null);
      setClickedCoord(null);
      return;
    }

    // New tiang (Check if in Branching mode)
    let autoKode = data.kodeTiang;
    let branchProps: Partial<Tiang> = {};

    if (activeBranchParent && activeBranchDirection) {
      const res = generateNextBranchCode(
        activeBranchParent,
        activeBranchDirection,
        activeSurvey.tiangList || []
      );
      autoKode = res.kodeTiang;
      branchProps = {
        parentTiangId: activeBranchParent.id,
        branchDirection: activeBranchDirection,
        branchPath: res.branchPath,
      };
    }

    const newTiang: Tiang = {
      ...data,
      ...branchProps,
      kodeTiang: autoKode || data.kodeTiang,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: false,
    };

    // Determine previous tiang for auto-cable connecting
    const previousTiangList = activeSurvey.tiangList || [];
    let prevTiang: Tiang | null = null;
    if (activeBranchParent) {
      prevTiang = activeBranchParent;
    } else if (previousTiangList.length >= 1) {
      prevTiang = previousTiangList[previousTiangList.length - 1];
    }

    const updatedSurvey: Survey = {
      ...activeSurvey,
      tiangList: [...previousTiangList, newTiang],
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setClickedCoord(null);

    // Prompt auto-connect jalur jika ada tiang sebelumnya (Identik dengan MASIV Mobile)
    if (prevTiang) {
      const dist = calculateDistance(prevTiang.koordinat, newTiang.koordinat);
      const isSUTR = data.jenisJaringan === 'SUTR';
      const defaultPenghantar = isSUTR ? 'NFA2X' : 'A3CS';
      const defaultPenampang = isSUTR ? '3x70+1x50mm²' : '150mm²';

      setAutoConnectPrompt({
        prevTiang,
        newTiang,
        jenisJaringan: data.jenisJaringan,
        penghantar: defaultPenghantar,
        penampang: defaultPenampang,
        dist,
      });
    }
  };

  // Handler: Confirm Auto-Connect Jalur
  const handleConfirmAutoConnect = async () => {
    if (!autoConnectPrompt || !activeSurvey) return;
    const { prevTiang, newTiang, jenisJaringan, penghantar, penampang, dist } = autoConnectPrompt;

    let updatedJalurList = [...(activeSurvey.jalurList || [])];

    // Check if existing jalur ends at prevTiang to extend
    const existingJalurIndex = updatedJalurList.findIndex(
      (j) =>
        j.jenisJaringan === jenisJaringan &&
        j.tiangIds &&
        j.tiangIds[j.tiangIds.length - 1] === prevTiang.id
    );

    if (existingJalurIndex >= 0) {
      const ej = updatedJalurList[existingJalurIndex];
      updatedJalurList[existingJalurIndex] = {
        ...ej,
        koordinat: [...ej.koordinat, newTiang.koordinat],
        tiangIds: [...(ej.tiangIds || []), newTiang.id],
        panjangMeter: ej.panjangMeter + dist,
        updatedAt: new Date(),
      };
    } else {
      const autoJalur: JalurKabel = {
        id: crypto.randomUUID(),
        jenisJaringan: jenisJaringan as any,
        jenisPenghantar: penghantar,
        penampangMM: penampang,
        koordinat: [prevTiang.koordinat, newTiang.koordinat],
        tiangIds: [prevTiang.id, newTiang.id],
        panjangMeter: dist,
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
        isSynced: false,
      };
      updatedJalurList.push(autoJalur);
    }

    const updatedSurvey: Survey = {
      ...activeSurvey,
      jalurList: updatedJalurList,
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setAutoConnectPrompt(null);
  };



  const handleSaveGardu = async (data: Omit<Gardu, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    if (!activeSurvey) return;
    const newGardu: Gardu = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: false,
    };

    const updatedSurvey: Survey = {
      ...activeSurvey,
      garduList: [...(activeSurvey.garduList || []), newGardu],
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setClickedCoord(null);
  };

  const handleSaveJalur = async (data: Omit<JalurKabel, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    if (!activeSurvey) return;

    if (editingJalur) {
      const updatedJalurList = (activeSurvey.jalurList || []).map((j) =>
        j.id === editingJalur.id
          ? {
              ...j,
              ...data,
              updatedAt: new Date(),
              isSynced: false,
            }
          : j
      );

      const updatedSurvey: Survey = {
        ...activeSurvey,
        jalurList: updatedJalurList,
        isSynced: false,
        updatedAt: new Date(),
        updatedBy: session?.user?.email || activeSurvey.updatedBy,
      };

      await localDb.saveSurvey(updatedSurvey);
      setActiveSurvey(updatedSurvey);
      setSurveys(await localDb.getAllSurveys());
      setEditingJalur(null);
      setTempLineCoords([]);
      setShowJalurModal(false);
      setSelectedAsset(null);
      setSelectedAssetType(null);
      return;
    }

    const newJalur: JalurKabel = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: false,
    };

    const updatedSurvey: Survey = {
      ...activeSurvey,
      jalurList: [...(activeSurvey.jalurList || []), newJalur],
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setTempLineCoords([]);
    setShowJalurModal(false);
    setToolMode('none');
  };

  const handleSavePersil = async (data: PersilFormData) => {
    if (!activeSurvey) return;
    const newPersil = {
      id: crypto.randomUUID(),
      namaPersil: data.namaPersil,
      warnaBorder: data.warnaBorder,
      catatan: data.catatan,
      koordinatSudut: data.koordinatSudut,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: false,
    };

    const updatedSurvey: Survey = {
      ...activeSurvey,
      persilList: [...(activeSurvey.persilList || []), newPersil],
      isSynced: false,
      updatedAt: new Date(),
      updatedBy: session?.user?.email || activeSurvey.updatedBy,
    };

    await localDb.saveSurvey(updatedSurvey);
    setActiveSurvey(updatedSurvey);
    setSurveys(await localDb.getAllSurveys());
    setShowPersilModal(false);
    setPersilCorners([]);
    setToolMode('none');
  };



  // Finish Underbuild SUTR
  const handleFinishUnderbuild = async () => {
    if (!activeSurvey || underbuildTiangIds.length < 2) return;
    const selectedTiang = (activeSurvey.tiangList || [])
      .filter((t) => underbuildTiangIds.includes(t.id))
      .map((t) => t.koordinat);

    setTempLineCoords(selectedTiang);
    setShowJalurModal(true);
    setUnderbuildTiangIds([]);
    setToolMode('none');
  };


  // Auth loading gate: Show mobile-matched splash screen
  if (!authInitialized) {
    return <SplashScreen opacity={1} message="Memeriksa sesi akun..." />;
  }

  // Auth gate: Require Supabase login first
  if (!session) {
    return (
      <>
        <LoginScreen onLoginSuccess={loadData} />
        {showSplashScreen && <SplashScreen opacity={splashOpacity} />}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', position: 'relative' }}>
      {showSplashScreen && <SplashScreen opacity={splashOpacity} />}

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobile && isMobileDrawerOpen && (
        <div className="sidebar-drawer-overlay" onClick={() => setIsMobileDrawerOpen(false)} />
      )}

      {/* Left Sidebar (Resizable on Desktop, Off-Canvas Drawer on Mobile) */}
      <Sidebar
        surveys={surveys}
        activeSurvey={activeSurvey}
        onSelectSurvey={handleSelectSurvey}
        onNewSurvey={() => {
          setEditingSurvey(null);
          setShowBASurveyModal(true);
        }}
        onEditSurvey={handleOpenEditSurvey}
        onShowSummary={handleOpenSummary}
        onDeleteSurvey={handleDeleteSurvey}
        onSync={handleSyncCloud}
        onSyncSingleSurvey={handleSyncSingleSurvey}
        isSyncing={isSyncing}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        userEmail={session.user.email}
        onLogout={handleLogout}
        width={sidebarWidth}
        isResizing={isResizing}
        onStartResize={handleStartResize}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobile={isMobile}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Map View & Topbar */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Floating Expand Button when Sidebar is Collapsed on Desktop */}
        {!isMobile && isCollapsed && (
          <button
            className="sidebar-floating-expand-btn"
            onClick={() => setIsCollapsed(false)}
            title="Tampilkan Daftar Survey"
          >
            <ChevronRight size={16} />
            <span>Daftar Survey</span>
          </button>
        )}

        {/* Top Floating Header & Action Toolbar (Responsive) */}
        <header
          className="top-header-masiv"
          style={{
            position: 'absolute',
            top: isMobile ? 10 : 16,
            left: !isMobile && isCollapsed ? 156 : isMobile ? 10 : 16,
            right: isMobile ? 10 : 16,
            zIndex: 1000,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: isMobile ? '8px 10px' : '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            gap: isMobile ? '8px' : '12px',
            transition: 'left 0.2s ease',
          }}
        >
          {/* Header Row 1: Mobile Hamburger + Logo + Survey Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            {/* Hamburger Button for Mobile Drawer */}
            {isMobile && (
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                title="Buka Menu Survey"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <Menu size={16} />
                <span>Survey</span>
              </button>
            )}

            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#ffffff',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>
              <img src="/logo_masiv_icon.png" alt="MASIV" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeSurvey ? activeSurvey.namaSurvey : 'Pilih / Buat Survey Baru'}
                </span>
                {activeSurvey && (
                  <span style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: activeSurvey.jenisSurvey === 'SUTM' ? '#7f1d1d' : '#1e3a8a',
                    color: activeSurvey.jenisSurvey === 'SUTM' ? '#fca5a5' : '#93c5fd',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {activeSurvey.jenisSurvey}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeSurvey ? `${activeSurvey.namaFeeder || 'Feeder Utama'} • GI ${activeSurvey.namaGarduInduk || '-'}` : 'Survey Made Easy : Mudah, Cepat, Akurat'}
              </div>
            </div>
          </div>

          {/* Header Row 2 (or Right Side on Desktop): Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '2px' : '0',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setShowLayerModal(true)}
              title="Atur Visibilitas Layer Peta (Tiang, Gardu, Jalur)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Layers size={13} />
              Layer Peta
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              title="Import Data Eksisting (KML / KMZ / CSV)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#1e293b',
                color: '#f97316',
                border: '1px solid #f97316',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <UploadCloud size={13} />
              Data Eksisting
            </button>

            {activeSurvey && (
              <>
                <button
                  onClick={() => handleOpenSummary(activeSurvey)}
                  title="Rekapitulasi Survey & 5 Menu Export (PDF, KML, BA, Gambar, CSV)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <BarChart2 size={13} />
                  Rekap Survey
                </button>

                <button
                  onClick={() => handleOpenEditSurvey(activeSurvey)}
                  title="Edit Data Survey & Berita Acara (BA)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#1e293b',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Edit3 size={13} />
                  Edit BA
                </button>
              </>
            )}
            {activeSurvey && (
              <button
                onClick={() => handleDeleteSurvey(activeSurvey)}
                title="Hapus Survey Ini"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={13} />
                Hapus
              </button>
            )}
          </div>
        </header>


        {/* Map Container */}
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          <ErrorBoundary key={activeSurvey?.id || 'no-survey'} fallbackTitle="Gagal Memuat Visual Peta Survey">
            <SurveyMap
              survey={activeSurvey}
              selectedAsset={selectedAsset}
              onSelectAsset={handleSelectAsset}
              onTiangClick={handleTiangClick}
              onTiangLabelShift={handleTiangLabelShift}
              movingTiang={movingTiang}
              onTiangMove={handleMoveTiang}
              mapType={mapType}
              onToggleMapType={() => setMapType((prev) => {
                const cycle: Array<'osm' | 'satellite' | 'google-sat' | 'google-hybrid'> = ['osm', 'satellite', 'google-sat', 'google-hybrid'];
                const idx = cycle.indexOf(prev);
                return cycle[(idx + 1) % cycle.length];
              })}
              mode={toolMode}
              onMapClick={handleMapClick}
              tempLineCoords={tempLineCoords}
              underbuildTiangIds={underbuildTiangIds}
              layerVisibility={layerVisibility}
              overlayLayers={overlays}
              onMapReady={setLeafletMap}
            />
          </ErrorBoundary>
        </div>


        {/* Floating Bottom Toolbar (MASIV Mobile Standard) */}
        {activeSurvey && (
          <Toolbar
            currentMode={toolMode}
            onModeChange={(mode) => {
              setToolMode(mode);
              setTempLineCoords([]);
              setSelectedAsset(null);
            }}
            isDrawing={tempLineCoords.length > 0 || (toolMode === 'draw-persil' && persilCorners.length > 0)}
            drawingPointsCount={toolMode === 'draw-persil' ? persilCorners.length : tempLineCoords.length}
            onCancelDrawing={() => {
              setTempLineCoords([]);
              setPersilCorners([]);
              setToolMode('none');
              setMovingTiang(null);
            }}
            onFinishDrawing={() => {
              if (tempLineCoords.length >= 2) {
                setShowJalurModal(true);
              }
            }}
            underbuildTiangCount={underbuildTiangIds.length}
            onCancelUnderbuild={() => {
              setUnderbuildTiangIds([]);
              setToolMode('none');
            }}
            onFinishUnderbuild={handleFinishUnderbuild}
            branchBannerText={
              activeBranchParent && activeBranchDirection
                ? getBranchModeBannerLabel(activeBranchParent, activeBranchDirection)
                : undefined
            }
            onCancelBranch={() => {
              setActiveBranchParent(null);
              setActiveBranchDirection(null);
              setToolMode('none');
            }}
          />
        )}

        {/* Bottom Inspector Bar for Selected Asset */}
        {selectedAsset && toolMode === 'none' && (
          <div style={{
            position: 'absolute',
            bottom: 84,
            left: 16,
            right: 16,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{
                background: selectedAssetType === 'tiang' ? '#0284c7' : selectedAssetType === 'gardu' ? '#e11d48' : '#2563eb',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginRight: '8px'
              }}>
                {selectedAssetType}
              </span>
              <strong style={{ fontSize: '14px' }}>
                {selectedAssetType === 'tiang' && `Tiang No. ${selectedAsset.nomorUrut} (${selectedAsset.kodeTiang || 'Tanpa Kode'}) • ${selectedAsset.jenisTiang} (${selectedAsset.tinggiTiang}) • ${selectedAsset.konstruksi}`}
                {selectedAssetType === 'gardu' && `Gardu ${selectedAsset.nomorGardu} • ${selectedAsset.jenisGardu} - ${selectedAsset.kapasitasKVA} kVA`}
                {selectedAssetType === 'jalur' && `Jalur Kabel ${selectedAsset.jenisJaringan} • ${selectedAsset.jenisPenghantar} ${selectedAsset.penampangMM || ''} • ${selectedAsset.panjangMeter}m`}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedAssetType === 'jalur' && (
                <>
                  <button
                    onClick={() => handleSelectEditJalur(selectedAsset)}
                    title="Edit Spesifikasi Jalur Kabel Ini"
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleSelectDeleteJalur(selectedAsset)}
                    title="Hapus Jalur Kabel Ini"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🗑️ Hapus
                  </button>
                </>
              )}

              {selectedAssetType === 'tiang' && (
                <button
                  onClick={() => setActionTiang(selectedAsset)}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Opsi Tiang
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedAsset(null);
                  setSelectedAssetType(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BA Survey Modal (New Survey & Edit Survey with Digital Signatures) */}
      <BASurveyModal
        visible={showBASurveyModal}
        onClose={() => {
          setShowBASurveyModal(false);
          setEditingSurvey(null);
        }}
        onSubmit={handleSaveBASurvey}
        initialData={editingSurvey}
      />

      {/* Survey Summary (Rekap) Modal with 5 Export Options */}
      <SurveySummaryModal
        visible={showSummaryModal}
        survey={summarySurvey || activeSurvey}
        onClose={() => {
          setShowSummaryModal(false);
          setSummarySurvey(null);
        }}
        onEditSurvey={handleOpenEditSurvey}
        onOpenExportPdfGambar={() => {
          setShowSummaryModal(false);
          setShowExportPdfModal(true);
        }}
      />

      {/* Modal Form Data Kop Gambar PLN (Official CAD Standard) */}
      {(summarySurvey || activeSurvey) && (
        <ExportPdfModal
          visible={showExportPdfModal}
          survey={summarySurvey || activeSurvey!}
          leafletMap={leafletMap}
          onClose={() => setShowExportPdfModal(false)}
        />
      )}

      {/* Tiang Action Modal (Branching R/L, Move, Edit, Delete) */}
      <TiangActionModal
        visible={!!actionTiang}
        tiang={actionTiang}
        onClose={() => setActionTiang(null)}
        onSelectBranch={handleSelectBranch}
        onSelectMove={handleSelectMove}
        onSelectEdit={handleSelectEdit}
        onSelectDelete={handleSelectDelete}
      />

      {/* Jalur Action Modal (Edit, Delete, Info - Matching Mobile MASIV) */}
      <JalurActionModal
        visible={!!actionJalur}
        jalur={actionJalur}
        onClose={() => setActionJalur(null)}
        onSelectEdit={() => handleSelectEditJalur(actionJalur!)}
        onSelectDelete={() => handleSelectDeleteJalur(actionJalur!)}
      />

      {/* Persil Pelanggan Form Modal */}
      {persilCorners.length === 2 && (
        <PersilModal
          visible={showPersilModal}
          koordinatSudut={[persilCorners[0], persilCorners[1]]}
          onClose={() => {
            setShowPersilModal(false);
            setPersilCorners([]);
            setToolMode('none');
          }}
          onSubmit={handleSavePersil}
        />
      )}

      {/* Auto-Connect Jalur Prompt Modal (Identical to MASIV Mobile) */}
      {autoConnectPrompt && (
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
          zIndex: 3500,
          padding: '16px'
        }}>
          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
            border: '1px solid #334155',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '24px' }}>🔗</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                  Hubungkan Jalur Kabel?
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                  Otomatis tarik jalur kabel antar tiang
                </p>
              </div>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
              fontSize: '13px',
              lineHeight: 1.5,
              border: '1px solid #334155'
            }}>
              <div>Hubungkan kabel dari <b>{autoConnectPrompt.prevTiang.kodeTiang || `T.${autoConnectPrompt.prevTiang.nomorUrut}`}</b> ke <b>{autoConnectPrompt.newTiang.kodeTiang || `T.${autoConnectPrompt.newTiang.nomorUrut}`}</b>?</div>
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                • Jaringan: <b style={{ color: '#f8fafc' }}>{autoConnectPrompt.jenisJaringan}</b><br/>
                • Penghantar: <b style={{ color: '#f8fafc' }}>{autoConnectPrompt.penghantar} ({autoConnectPrompt.penampang})</b><br/>
                • Jarak Bentang: <b style={{ color: '#38bdf8' }}>{Math.round(autoConnectPrompt.dist)} meter</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAutoConnectPrompt(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#334155',
                  color: '#e2e8f0',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tidak
              </button>
              <button
                onClick={handleConfirmAutoConnect}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ya, Hubungkan Jalur ✓
              </button>
            </div>
          </div>
        </div>
      )}


      {clickedCoord && (
        <>
          <TiangModal
            visible={showTiangModal}
            koordinat={clickedCoord}
            initialData={
              editingTiang ||
              (activeBranchParent && activeBranchDirection
                ? {
                    parentTiangId: activeBranchParent.id,
                    branchDirection: activeBranchDirection,
                    kodeTiang: generateNextBranchCode(
                      activeBranchParent,
                      activeBranchDirection,
                      activeSurvey?.tiangList || []
                    ).kodeTiang,
                  }
                : undefined)
            }
            nextNomorUrut={(activeSurvey?.tiangList?.length || 0) + 1}
            lastJenisJaringan={activeSurvey?.jenisSurvey === 'SUTR' ? 'SUTR' : 'SUTM'}
            onClose={() => {
              setShowTiangModal(false);
              setClickedCoord(null);
              setEditingTiang(null);
            }}
            onSubmit={handleSaveTiang}
          />

          <GarduModal
            visible={showGarduModal}
            koordinat={clickedCoord}
            onClose={() => { setShowGarduModal(false); setClickedCoord(null); }}
            onSubmit={handleSaveGardu}
          />
        </>
      )}

      {(tempLineCoords.length >= 2 || editingJalur) && (
        <JalurModal
          visible={showJalurModal}
          koordinat={editingJalur ? editingJalur.koordinat : tempLineCoords}
          initialData={editingJalur || undefined}
          onClose={() => {
            setShowJalurModal(false);
            setEditingJalur(null);
          }}
          onSubmit={handleSaveJalur}
        />
      )}

      {/* Layer Control Modal (Identical to Mobile MASIV) */}
      <LayerControlModal
        visible={showLayerModal}
        onClose={() => setShowLayerModal(false)}
        layerVisibility={layerVisibility}
        onLayerChange={(update) => setLayerVisibility((prev) => ({ ...prev, ...update }))}
        overlayLayers={overlays}
        onOverlayVisibilityChange={handleOverlayVisibilityChange}
        onOverlayUpdate={handleOverlayUpdate}
      />

      {/* About Modal (MASIV Values, Version, & Team) */}
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Overlay Manager Modal (Data Eksisting KML / KMZ / CSV - Mobile MASIV Standard) */}
      <OverlayManagerModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        overlays={overlays}
        onOverlaysChange={handleOverlaysChange}
      />
    </div>

  );
}



export default App;


