// =============================================================================
// PLN SURVEY WEB - Export PDF Modal (Form Data Kop Gambar PLN)
// Standar Gambar Teknik & Survey Peta Jaringan PLN (OPTADIS GIS System)
// 100% Identical Parity to Mobile App
// =============================================================================

import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import L from 'leaflet';
import { Survey, BebanTrafoItem } from '../../types';
import {
  SurveyInfo,
  PageMeta,
  generatePdfWithMap,
  generateMultiPagePdf,
  downloadPdfBlob
} from '../../utils/pdfGambarExport';
import { buildRincianPekerjaan } from '../../utils/rincianPekerjaan';
import {
  groupTiangBySegment,
  calculateBoundsForGroup,
  SegmentMode
} from '../../utils/geoUtils';
import { trafoLoadService, normalizeGarduCode } from '../../services/trafoLoadService';

interface ExportPdfModalProps {
  visible: boolean;
  survey: Survey;
  mapElement?: HTMLElement | null;
  leafletMap?: L.Map | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const STORAGE_KEY = 'pln_pdf_config';

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  visible,
  survey,
  mapElement,
  leafletMap,
  onClose,
  onSuccess
}) => {
  // Modal State
  const [pdfUidName, setPdfUidName] = useState('UID Banten');
  const [pdfUp3Name, setPdfUp3Name] = useState('UP3 Banten Selatan');
  const [pdfUlpName, setPdfUlpName] = useState('ULP Labuan');
  const [pdfSurveyorName, setPdfSurveyorName] = useState('');
  const [pdfPemeriksaTitle, setPdfPemeriksaTitle] = useState('TL HAR');
  const [pdfPemeriksaName, setPdfPemeriksaName] = useState('');
  const [pdfManagerName, setPdfManagerName] = useState('');

  // Features State
  const [includeBebanTrafo, setIncludeBebanTrafo] = useState(true);
  const [pdfCustomGarduSearch, setPdfCustomGarduSearch] = useState('');
  const [isUpratingTrafo, setIsUpratingTrafo] = useState(false);
  const [upratingKva, setUpratingKva] = useState('250 kVA');
  const [pdfRincianPosition, setPdfRincianPosition] = useState<'first' | 'all'>('first');
  const [selectedSegmentMode, setSelectedSegmentMode] = useState<SegmentMode | 'single'>('scale');

  // Live Beban Trafo Autocomplete State
  const [allTrafoList, setAllTrafoList] = useState<BebanTrafoItem[]>([]);
  const [trafoSuggestions, setTrafoSuggestions] = useState<BebanTrafoItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeBebanItem, setActiveBebanItem] = useState<BebanTrafoItem | null>(null);
  const [isLoadingTrafo, setIsLoadingTrafo] = useState(false);

  // Loading & Progress
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Fetch live trafo data when modal becomes visible
  useEffect(() => {
    if (visible) {
      setIsLoadingTrafo(true);
      trafoLoadService.fetchBebanTrafoData().then((data) => {
        setAllTrafoList(data);
        setIsLoadingTrafo(false);

        // Auto-match if survey has gardu
        if (survey.garduList && survey.garduList.length > 0) {
          for (const g of survey.garduList) {
            const match = trafoLoadService.findBebanTrafoForGardu(g, data);
            if (match) {
              setActiveBebanItem(match);
              if (!pdfCustomGarduSearch) {
                setPdfCustomGarduSearch(match.gardu);
              }
              break;
            }
          }
        }
      }).catch(err => {
        console.warn('Failed to load trafo data:', err);
        setIsLoadingTrafo(false);
      });
    }
  }, [visible, survey]);

  // Update suggestions & active match when search text changes
  useEffect(() => {
    if (!pdfCustomGarduSearch.trim()) {
      setTrafoSuggestions([]);
      setActiveBebanItem(null);
      return;
    }

    if (allTrafoList.length > 0) {
      const results = trafoLoadService.searchBebanTrafo(pdfCustomGarduSearch, allTrafoList, 8);
      setTrafoSuggestions(results);

      const exactMatch = allTrafoList.find(t =>
        normalizeGarduCode(t.gardu) === normalizeGarduCode(pdfCustomGarduSearch)
      );
      if (exactMatch) {
        setActiveBebanItem(exactMatch);
      } else if (results.length > 0) {
        setActiveBebanItem(results[0]);
      } else {
        setActiveBebanItem(null);
      }
    }
  }, [pdfCustomGarduSearch, allTrafoList]);

  // Load saved config on mount or open
  useEffect(() => {
    if (visible) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.uidName !== undefined) setPdfUidName(data.uidName);
          if (data.up3Name !== undefined) setPdfUp3Name(data.up3Name);
          if (data.ulpName !== undefined) setPdfUlpName(data.ulpName);
          if (data.surveyorName !== undefined) setPdfSurveyorName(data.surveyorName);
          else if (survey.surveyor) setPdfSurveyorName(survey.surveyor);
          if (data.pemeriksaTitle !== undefined) setPdfPemeriksaTitle(data.pemeriksaTitle);
          if (data.pemeriksaName !== undefined) setPdfPemeriksaName(data.pemeriksaName);
          if (data.managerName !== undefined) setPdfManagerName(data.managerName);
          if (data.rincianPosition !== undefined) setPdfRincianPosition(data.rincianPosition);
        } else if (survey.surveyor) {
          setPdfSurveyorName(survey.surveyor);
        }
      } catch (e) {
        if (survey.surveyor) setPdfSurveyorName(survey.surveyor);
      }
    }
  }, [visible, survey]);

  if (!visible) return null;

  // Capture helper for Leaflet Map HTML
  const captureMapSnapshot = async (targetEl: HTMLElement): Promise<string | null> => {
    try {
      const canvas = await html2canvas(targetEl, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 2, // 2x sharp high-resolution CAD output
        ignoreElements: (element) => {
          return (
            element.classList.contains('leaflet-control-container') ||
            element.classList.contains('leaflet-top') ||
            element.classList.contains('leaflet-bottom') ||
            element.classList.contains('map-control-btn') ||
            element.classList.contains('map-type-floating-btn') ||
            element.classList.contains('gis-legend') ||
            element.classList.contains('tiang-target-cursor') ||
            element.classList.contains('gardu-target-cursor') ||
            element.classList.contains('jalur-target-cursor')
          );
        },
        onclone: (clonedDoc) => {
          // Neutralize Leaflet translate3d transform on .leaflet-map-pane so html2canvas doesn't double-offset markers and canvas
          const mapPane = clonedDoc.querySelector('.leaflet-map-pane') as HTMLElement;
          if (mapPane) {
            const transform = mapPane.style.transform || window.getComputedStyle(mapPane).transform;
            if (transform && transform !== 'none') {
              let x = 0;
              let y = 0;
              const translateMatch = transform.match(/translate3d\(([-0-9.]+)px,\s*([-0-9.]+)px/);
              if (translateMatch) {
                x = parseFloat(translateMatch[1]);
                y = parseFloat(translateMatch[2]);
              } else {
                const matrixMatch = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-0-9.]+),\s*([-0-9.]+)\)/);
                if (matrixMatch) {
                  x = parseFloat(matrixMatch[1]);
                  y = parseFloat(matrixMatch[2]);
                }
              }
              mapPane.style.transform = 'none';
              mapPane.style.left = `${x}px`;
              mapPane.style.top = `${y}px`;
            }
          }
        }
      });
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (e) {
      console.error('Failed to capture map screenshot:', e);
      return null;
    }
  };

  // Main Export Handler
  const handleProcessExport = async () => {
    setIsExporting(true);
    setProgressPercent(5);
    setProgressText('Mempersiapkan data survey & database PLN...');

    try {
      // 1. Fetch live Beban Trafo if selected
      let bebanTrafoMap: Record<string, BebanTrafoItem> = {};
      let bebanTrafoList: BebanTrafoItem[] = [];

      if (includeBebanTrafo) {
        setProgressText('Menyiapkan data Beban Trafo...');
        setProgressPercent(15);
        try {
          const allBeban = allTrafoList.length > 0 ? allTrafoList : await trafoLoadService.fetchBebanTrafoData();
          if (survey.garduList && survey.garduList.length > 0) {
            for (const g of survey.garduList) {
              const match = trafoLoadService.findBebanTrafoForGardu(g, allBeban);
              if (match) bebanTrafoMap[g.id] = match;
            }
          }
          if (pdfCustomGarduSearch.trim()) {
            const customMatches = trafoLoadService.findBebanTrafoBySearchText(pdfCustomGarduSearch.trim(), allBeban);
            if (customMatches.length > 0) {
              bebanTrafoList = customMatches;
            } else if (activeBebanItem) {
              bebanTrafoList = [activeBebanItem];
            }
          } else if (activeBebanItem) {
            bebanTrafoList = [activeBebanItem];
          }
        } catch (e) {
          console.warn('Could not fetch Beban Trafo:', e);
          if (activeBebanItem) {
            bebanTrafoList = [activeBebanItem];
          }
        }
      }

      // 2. Build SurveyInfo
      const fullSurveyInfo: SurveyInfo = {
        name: survey.namaSurvey || 'Survey Jaringan',
        location: survey.lokasi || survey.alamatPelanggan || '',
        uidName: pdfUidName.trim() || 'UID Banten',
        up3Name: pdfUp3Name.trim() || 'UP3 Banten Selatan',
        ulpName: pdfUlpName.trim() || 'ULP Labuan',
        surveyorName: pdfSurveyorName.trim(),
        pemeriksaTitle: pdfPemeriksaTitle.trim() || 'TL HAR',
        pemeriksaName: pdfPemeriksaName.trim(),
        managerName: pdfManagerName.trim(),
        rincianMode: pdfRincianPosition,
        rincianLines: buildRincianPekerjaan(survey, {
          bebanTrafoMap: includeBebanTrafo ? bebanTrafoMap : undefined,
          bebanTrafoList: includeBebanTrafo ? bebanTrafoList : undefined,
          isUpratingTrafo,
          upratingKva: upratingKva.trim(),
          targetGarduName: pdfCustomGarduSearch.trim() || (survey.garduList?.[0]?.namaGardu || survey.garduList?.[0]?.nomorGardu),
        })
      };

      // 3. Save remembered inputs
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          uidName: pdfUidName.trim(),
          up3Name: pdfUp3Name.trim(),
          ulpName: pdfUlpName.trim(),
          surveyorName: pdfSurveyorName.trim(),
          pemeriksaTitle: pdfPemeriksaTitle.trim(),
          pemeriksaName: pdfPemeriksaName.trim(),
          managerName: pdfManagerName.trim(),
          rincianPosition: pdfRincianPosition,
        }));
      } catch (e) {}

      // Find map container element
      let mapEl = mapElement;
      if (!mapEl) {
        mapEl = document.querySelector('.leaflet-container') as HTMLElement;
      }
      if (!mapEl) {
        alert('Elemen peta Leaflet tidak ditemukan untuk tangkapan layar');
        setIsExporting(false);
        return;
      }

      const tiangList = survey.tiangList || [];

      // 4. Single-page mode or no tiangs to segment
      if (selectedSegmentMode === 'single' || tiangList.length <= 1) {
        setProgressText('Memuat dan menstabilkan tile peta satelit/jalan...');
        setProgressPercent(40);

        // Collect all survey coordinates (tiang, gardu, jalur) to fit complete bounds
        const allCoords: { latitude: number; longitude: number }[] = [];
        (survey.tiangList || []).forEach(t => t?.koordinat && allCoords.push(t.koordinat));
        (survey.garduList || []).forEach(g => g?.koordinat && allCoords.push(g.koordinat));
        (survey.jalurList || []).forEach(j => (j?.koordinat || []).forEach(c => allCoords.push(c)));

        if (leafletMap && allCoords.length > 0) {
          const lats = allCoords.map(c => c.latitude);
          const lngs = allCoords.map(c => c.longitude);
          const bounds = L.latLngBounds(
            L.latLng(Math.min(...lats), Math.min(...lngs)),
            L.latLng(Math.max(...lats), Math.max(...lngs))
          );
          leafletMap.fitBounds(bounds, { padding: [40, 40], animate: false });
          // Generous wait for all satellite / road tiles to finish loading over network
          await new Promise(r => setTimeout(r, 1500));
        }

        setProgressText('Mengambil gambar peta resolusi tinggi (2x CAD)...');
        setProgressPercent(60);

        const mapBase64 = await captureMapSnapshot(mapEl);
        if (!mapBase64) {
          alert('Gagal mengambil tangkapan layar peta');
          setIsExporting(false);
          return;
        }

        setProgressText('Menyusun PDF Kop Resmi PLN (Standar CAD)...');
        setProgressPercent(80);

        const pdfBytes = await generatePdfWithMap(mapBase64, fullSurveyInfo);
        if (!pdfBytes) {
          alert('Gagal membuat dokumen PDF');
          setIsExporting(false);
          return;
        }

        setProgressText('Menyelesaikan download PDF...');
        setProgressPercent(100);

        const filename = `Survey_PLN_${(fullSurveyInfo.name || 'Peta').replace(/[/\\?%*:|"<>]/g, '_')}_${Date.now()}.pdf`;
        downloadPdfBlob(pdfBytes, filename);

        if (onSuccess) onSuccess('PDF Gambar Resmi PLN (1 Halaman) berhasil diunduh!');
        onClose();
        return;
      }

      // 5. Multi-page mode (Segmented)
      setProgressText('Menganalisis segmen halaman jalur tiang...');
      setProgressPercent(20);

      const currentZoom = leafletMap ? leafletMap.getZoom() : 18;
      const centerLat = tiangList[0]?.koordinat?.latitude || -6.8;
      const segments = groupTiangBySegment(tiangList, selectedSegmentMode as SegmentMode, currentZoom, centerLat);
      const totalPages = segments.length;

      const mapBase64s: string[] = [];
      const pageMetas: PageMeta[] = [];

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const pagePercent = Math.min(85, Math.round(25 + ((i + 0.5) / totalPages) * 60));
        setProgressText(`Mengambil peta halaman ${i + 1} dari ${totalPages}...`);
        setProgressPercent(pagePercent);

        const prevAnchor = i > 0 ? seg.tiangList[0].koordinat : undefined;
        const nextAnchor = i < segments.length - 1 ? seg.tiangList[seg.tiangList.length - 1].koordinat : undefined;
        const bounds = calculateBoundsForGroup(seg.tiangList, prevAnchor, nextAnchor);

        if (leafletMap) {
          const latLngBounds = L.latLngBounds(
            L.latLng(bounds[0][0], bounds[0][1]),
            L.latLng(bounds[1][0], bounds[1][1])
          );
          leafletMap.fitBounds(latLngBounds, { padding: [30, 30], animate: false });
          // Wait for tiles to settle on segment jump
          await new Promise(r => setTimeout(r, 1200));
        }

        const base64 = await captureMapSnapshot(mapEl);
        if (!base64) {
          alert(`Gagal mengambil gambar peta untuk segmen halaman ${i + 1}`);
          setIsExporting(false);
          return;
        }

        let pageRincianLines: string[] | undefined = undefined;
        if (pdfRincianPosition === 'all') {
          const pageTiangs = seg.tiangList;
          const pageTiangIds = new Set(pageTiangs.map(t => t.id));
          const pageJalurs = (survey.jalurList || []).filter(j =>
            j.tiangIds?.some(id => pageTiangIds.has(id)) ||
            j.koordinat.some(c => pageTiangs.some(t => Math.abs(t.koordinat.latitude - c.latitude) < 0.00005 && Math.abs(t.koordinat.longitude - c.longitude) < 0.00005))
          );
          const pageGardus = (survey.garduList || []).filter(g =>
            pageTiangs.some(t => Math.abs(t.koordinat.latitude - g.koordinat.latitude) < 0.0001 && Math.abs(t.koordinat.longitude - g.koordinat.longitude) < 0.0001)
          );
          const pageSurvey: Survey = {
            ...survey,
            tiangList: pageTiangs,
            jalurList: pageJalurs,
            garduList: pageGardus,
          };
          const firstTiangCode = seg.firstKode || `T.${seg.firstNomor}`;
          const lastTiangCode = seg.lastKode || `T.${seg.lastNomor}`;

          pageRincianLines = buildRincianPekerjaan(pageSurvey, {
            bebanTrafoMap: includeBebanTrafo ? bebanTrafoMap : undefined,
            isUpratingTrafo,
            upratingKva: upratingKva.trim(),
            targetGarduName: pdfCustomGarduSearch.trim() || (pageGardus[0]?.namaGardu || pageGardus[0]?.nomorGardu),
            headerTitle: `RINCIAN PEKERJAAN (${firstTiangCode} s/d ${lastTiangCode}) :`,
          });
        }

        mapBase64s.push(base64);
        pageMetas.push({
          pageNumber: seg.pageNumber,
          totalPages: seg.totalPages,
          firstNomor: seg.firstNomor,
          lastNomor: seg.lastNomor,
          firstKode: seg.firstKode,
          lastKode: seg.lastKode,
          panjangMeter: seg.panjangMeter,
          rincianLines: pageRincianLines,
        });

        await new Promise(r => setTimeout(r, 200));
      }

      setProgressText(`Menyusun PDF Multi-Halaman (${totalPages} lembar)...`);
      setProgressPercent(90);

      const pdfBytes = await generateMultiPagePdf(mapBase64s, fullSurveyInfo, pageMetas);
      if (!pdfBytes) {
        alert('Gagal menyusun PDF multi-halaman');
        setIsExporting(false);
        return;
      }

      setProgressText('Menyelesaikan download PDF...');
      setProgressPercent(100);

      const filename = `Survey_PLN_${(fullSurveyInfo.name || 'Peta').replace(/[/\\?%*:|"<>]/g, '_')}_${totalPages}hal_${Date.now()}.pdf`;
      downloadPdfBlob(pdfBytes, filename);

      if (onSuccess) onSuccess(`PDF Gambar Resmi PLN (${totalPages} Halaman) berhasil diunduh!`);
      onClose();
    } catch (err: any) {
      console.error('Export PDF Gambar error:', err);
      alert('Terjadi kesalahan saat membuat PDF: ' + (err?.message || 'Error tidak diketahui'));
    } finally {
      setIsExporting(false);
      setProgressText(null);
      setProgressPercent(0);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2600,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #334155',
          background: 'linear-gradient(135deg, #003B73 0%, #002244 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
                Form Data Kop Gambar PLN
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                Standar Gambar Teknik Resmi PT PLN (Persero)
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              padding: '6px 10px',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Isi data pengesahan resmi untuk Kop Gambar PLN (Tersimpan otomatis):
          </p>

          {/* Row 1: 3 Column Unit Hierarchy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#60a5fa', marginBottom: '4px' }}>
                ⚡ Nama UID
              </label>
              <input
                type="text"
                value={pdfUidName}
                onChange={(e) => setPdfUidName(e.target.value)}
                placeholder="Contoh: UID Banten"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '7px 10px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#60a5fa', marginBottom: '4px' }}>
                🏢 Nama UP3
              </label>
              <input
                type="text"
                value={pdfUp3Name}
                onChange={(e) => setPdfUp3Name(e.target.value)}
                placeholder="Contoh: UP3 Banten Selatan"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '7px 10px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#60a5fa', marginBottom: '4px' }}>
                📍 Nama ULP
              </label>
              <input
                type="text"
                value={pdfUlpName}
                onChange={(e) => setPdfUlpName(e.target.value)}
                placeholder="Contoh: ULP Labuan"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '7px 10px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Row 2: Surveyor */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              👷 Disurvey Oleh (Nama Surveyor)
            </label>
            <input
              type="text"
              value={pdfSurveyorName}
              onChange={(e) => setPdfSurveyorName(e.target.value)}
              placeholder="Nama Lengkap Surveyor / Tim Field"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '7px 10px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Row 3: Pemeriksa with Quick Pills */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
                🔍 Diperiksa Oleh (Pemeriksa)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['TL HAR', 'TL RENSIS', 'ASMAN KONS', 'TL TEKNIK'].map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setPdfPemeriksaTitle(title)}
                    style={{
                      background: pdfPemeriksaTitle === title ? '#2563eb' : '#334155',
                      color: pdfPemeriksaTitle === title ? '#ffffff' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={pdfPemeriksaName}
              onChange={(e) => setPdfPemeriksaName(e.target.value)}
              placeholder="Nama Lengkap Spv / Pemeriksa"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '7px 10px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Row 4: Manager */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              👔 Disetujui Oleh (Manager ULP / UP3)
            </label>
            <input
              type="text"
              value={pdfManagerName}
              onChange={(e) => setPdfManagerName(e.target.value)}
              placeholder="Nama Lengkap Manager PLN"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '7px 10px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Option 1: Beban Trafo Web Database */}
          <div style={{
            background: 'rgba(30, 58, 138, 0.25)',
            border: '1px solid #1e40af',
            borderRadius: '10px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>
                  ⚡ Sisipkan Data Beban Trafo Terupdate
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Tarik data beban live dari web (fikrybudi.github.io)
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeBebanTrafo}
                onChange={(e) => setIncludeBebanTrafo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>

            {includeBebanTrafo && (
              <div style={{ marginTop: '10px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>
                    Cari / Pilih Gardu Database Web (2.151 Gardu):
                  </label>
                  {isLoadingTrafo && (
                    <span style={{ fontSize: '10px', color: '#60a5fa' }}>⏳ Memuat database...</span>
                  )}
                  {!isLoadingTrafo && allTrafoList.length > 0 && (
                    <span style={{ fontSize: '10px', color: '#34d399' }}>✓ {allTrafoList.length} gardu siap</span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={pdfCustomGarduSearch}
                    onChange={(e) => {
                      setPdfCustomGarduSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Ketik nama/kode gardu (contoh: MDCA240, RKG240, LBAN008)"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0f172a',
                      border: activeBebanItem ? '1.5px solid #10b981' : '1px solid #3b82f6',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  {pdfCustomGarduSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setPdfCustomGarduSearch('');
                        setActiveBebanItem(null);
                        setShowSuggestions(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Floating Autocomplete Suggestions Dropdown */}
                {showSuggestions && trafoSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      background: '#0f172a',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      marginTop: '4px',
                      zIndex: 9999,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    {trafoSuggestions.map((item) => (
                      <div
                        key={item.gardu}
                        onClick={() => {
                          setPdfCustomGarduSearch(item.gardu);
                          setActiveBebanItem(item);
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #1e293b',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e3a8a')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
                      >
                        <div>
                          <b style={{ color: '#60a5fa' }}>{item.gardu}</b> - {item.kapasitasKVA} kVA
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Penyulang: {item.penyulang} | {item.unitLayanan}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: item.statusBeban === 'Overload' ? '#dc2626' : item.statusBeban === 'Underload' ? '#d97706' : '#16a34a',
                              color: '#ffffff'
                            }}
                          >
                            {item.persenDayaTrafo}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick selection pills from survey gardus */}
                {survey.garduList && survey.garduList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Gardu Survey:</span>
                    {survey.garduList.map((g) => {
                      const label = g.namaGardu || g.nomorGardu;
                      const isSelected = pdfCustomGarduSearch.includes(label) || activeBebanItem?.gardu === label;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setPdfCustomGarduSearch(label);
                            setShowSuggestions(true);
                          }}
                          style={{
                            background: isSelected ? '#2563eb' : '#334155',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          🏷️ {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Visual Preview Card when Gardu is selected */}
                {activeBebanItem ? (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                        ✓ Data Siap Dimuat: Gardu {activeBebanItem.gardu} ({activeBebanItem.kapasitasKVA} kVA)
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: activeBebanItem.statusBeban === 'Overload' ? '#dc2626' : '#059669',
                        color: '#ffffff'
                      }}>
                        {activeBebanItem.persenDayaTrafo}% ({activeBebanItem.statusBeban})
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                      Arus: R=<b>{activeBebanItem.bebanR}A</b>, S=<b>{activeBebanItem.bebanS}A</b>, T=<b>{activeBebanItem.bebanT}A</b> | Unbalance: {activeBebanItem.unbalancePercent}%
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      Penyulang: {activeBebanItem.penyulang} | Waktu Ukur: {activeBebanItem.tanggalUkur || '-'} {activeBebanItem.waktuUkur || ''}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                    💡 Ketik nama atau kode gardu di atas untuk memilih data beban yang akan dicantumkan pada PDF.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option 2: Pekerjaan Uprating Trafo */}
          <div style={{
            background: 'rgba(124, 45, 18, 0.25)',
            border: '1px solid #c2410c',
            borderRadius: '10px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fdba74' }}>
                  ⚡ Pekerjaan Uprating Trafo
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Cantumkan item Uprating Trafo pada Rincian Pekerjaan
                </div>
              </div>
              <input
                type="checkbox"
                checked={isUpratingTrafo}
                onChange={(e) => setIsUpratingTrafo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ea580c' }}
              />
            </div>

            {isUpratingTrafo && (
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#fdba74', marginBottom: '4px' }}>
                  Target Kapasitas Uprating (kVA):
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={upratingKva}
                    onChange={(e) => setUpratingKva(e.target.value)}
                    placeholder="Contoh: 250 kVA"
                    style={{
                      flex: 1,
                      boxSizing: 'border-box',
                      background: '#0f172a',
                      border: '1px solid #ea580c',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '6px 10px',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  {['100 kVA', '160 kVA', '250 kVA', '400 kVA'].map((kva) => (
                    <button
                      key={kva}
                      type="button"
                      onClick={() => setUpratingKva(kva)}
                      style={{
                        background: upratingKva === kva ? '#ea580c' : '#431407',
                        color: '#ffffff',
                        border: '1px solid #ea580c',
                        borderRadius: '12px',
                        padding: '3px 9px',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {kva}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Option 3: Posisi Tabel Rincian Pekerjaan */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
              📋 Posisi & Mode Tabel Rincian Pekerjaan:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPdfRincianPosition('first')}
                style={{
                  background: pdfRincianPosition === 'first' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${pdfRincianPosition === 'first' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  📄 Hal 1 (Total Akumulasi)
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Ringkasan Total Seluruh Survey di Hal 1
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPdfRincianPosition('all')}
                style={{
                  background: pdfRincianPosition === 'all' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${pdfRincianPosition === 'all' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  📑 Per Halaman (Breakdown)
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Breakdown tiang & kabel khusus lembar tsb
                </div>
              </button>
            </div>
          </div>

          {/* Option 4: Mode Segmentasi Halaman PDF */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
              📐 Mode Segmentasi Halaman PDF:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedSegmentMode('scale')}
                style={{
                  background: selectedSegmentMode === 'scale' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${selectedSegmentMode === 'scale' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  📐 Skala Terkunci (Fixed Scale)
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Multi-page skala konsisten (Rekomendasi)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSegmentMode('tm8')}
                style={{
                  background: selectedSegmentMode === 'tm8' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${selectedSegmentMode === 'tm8' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  ⚡ 8 Tiang TM / Halaman
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Dipotong per 8 tiang SUTM
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSegmentMode('dist400')}
                style={{
                  background: selectedSegmentMode === 'dist400' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${selectedSegmentMode === 'dist400' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  📏 Per 400 Meter / Halaman
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Dipotong per 400m fisik jalur
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSegmentMode('single')}
                style={{
                  background: selectedSegmentMode === 'single' ? '#1e3a8a' : '#1e293b',
                  border: `1px solid ${selectedSegmentMode === 'single' ? '#3b82f6' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                  📄 1 Halaman Full
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Seluruh jalur dalam 1 lembar PDF
                </div>
              </button>
            </div>
          </div>

          {/* Progress Bar Display if Generating */}
          {isExporting && (
            <div style={{
              background: '#0284c7',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                <span>{progressText || 'Memproses PDF...'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.3)',
                height: '6px',
                borderRadius: '3px',
                marginTop: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#ffffff',
                  height: '100%',
                  width: `${progressPercent}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #334155',
          background: '#1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            style={{
              background: '#334155',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleProcessExport}
            style={{
              background: isExporting ? '#64748b' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
            }}
          >
            {isExporting ? '⏳ MENGEKSPOR...' : '🚀 EXPORT PDF RESMI'}
          </button>
        </div>
      </div>
    </div>
  );
};
