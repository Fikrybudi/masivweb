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
import { trafoLoadService } from '../../services/trafoLoadService';

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

  // Loading & Progress
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

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
            element.classList.contains('tiang-target-cursor') ||
            element.classList.contains('gardu-target-cursor') ||
            element.classList.contains('jalur-target-cursor')
          );
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
        setProgressText('Menarik database Beban Trafo Web...');
        setProgressPercent(15);
        try {
          const allBeban = await trafoLoadService.fetchBebanTrafoData();
          if (survey.garduList && survey.garduList.length > 0) {
            for (const g of survey.garduList) {
              const match = trafoLoadService.findBebanTrafoForGardu(g, allBeban);
              if (match) bebanTrafoMap[g.id] = match;
            }
          }
          if (pdfCustomGarduSearch.trim()) {
            const customMatches = trafoLoadService.findBebanTrafoBySearchText(pdfCustomGarduSearch.trim(), allBeban);
            if (customMatches.length > 0) bebanTrafoList = customMatches;
          }
        } catch (e) {
          console.warn('Could not fetch Beban Trafo:', e);
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
        setProgressText('Mengambil gambar peta resolusi tinggi...');
        setProgressPercent(45);

        // If leafletMap available and we have tiangs, fit bounds to entire survey
        if (leafletMap && tiangList.length > 0) {
          const lats = tiangList.map(t => t.koordinat.latitude);
          const lngs = tiangList.map(t => t.koordinat.longitude);
          const bounds = L.latLngBounds(
            L.latLng(Math.min(...lats), Math.min(...lngs)),
            L.latLng(Math.max(...lats), Math.max(...lngs))
          );
          leafletMap.fitBounds(bounds, { padding: [30, 30], animate: false });
          await new Promise(r => setTimeout(r, 450));
        }

        const mapBase64 = await captureMapSnapshot(mapEl);
        if (!mapBase64) {
          alert('Gagal mengambil tangkapan layar peta');
          setIsExporting(false);
          return;
        }

        setProgressText('Menyusun PDF Kop Resmi PLN (Standar CAD)...');
        setProgressPercent(75);

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
          leafletMap.fitBounds(latLngBounds, { padding: [25, 25], animate: false });
          // Wait for tiles to settle
          await new Promise(r => setTimeout(r, 450));
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
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#93c5fd', marginBottom: '4px' }}>
                  Pilih / Ketik Nama Gardu (Contoh: STG / STG240 / LBAN008):
                </label>
                <input
                  type="text"
                  value={pdfCustomGarduSearch}
                  onChange={(e) => setPdfCustomGarduSearch(e.target.value)}
                  placeholder="Ketik nama/kode gardu (misal: STG240)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '6px 10px',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                />

                {/* Quick selection pills from survey gardus */}
                {survey.garduList && survey.garduList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pilih dari Gardu Survey:</span>
                    {survey.garduList.map((g) => {
                      const label = g.namaGardu || g.nomorGardu;
                      const isSelected = pdfCustomGarduSearch.includes(label);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setPdfCustomGarduSearch(prev => {
                              if (!prev) return label;
                              if (prev.includes(label)) return prev;
                              return `${prev}, ${label}`;
                            });
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
