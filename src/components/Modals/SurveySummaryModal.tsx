// =============================================================================
// PLN SURVEY WEB - Survey Summary (Rekap) Modal
// Displays complete statistics and 5 Export Options
// (Rekap PDF, KML, BA Survey, PDF Gambar Blangko, CSV Excel)
// =============================================================================

import React, { useState } from 'react';
import { Survey } from '../../types';
import {
  X,
  FileText,
  Map,
  ClipboardCheck,
  Image as ImageIcon,
  Table,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { exportToKML, exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { generateBASurveyPdf, BASurveyData } from '../../utils/baSurveyPdf';
import { buildRincianPekerjaan } from '../../utils/rincianPekerjaan';

interface SurveySummaryModalProps {
  visible: boolean;
  survey: Survey | null;
  onClose: () => void;
  onEditSurvey?: (survey: Survey) => void;
  mapElement?: HTMLElement | null;
  onOpenExportPdfGambar?: () => void;
}

export const SurveySummaryModal: React.FC<SurveySummaryModalProps> = ({
  visible,
  survey,
  onClose,
  onEditSurvey,
  mapElement,
  onOpenExportPdfGambar,
}) => {
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  if (!visible || !survey) return null;

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Calculations
  const regularTiang = (survey.tiangList || []).filter(t => !t.konstruksi?.startsWith('JOINTING-'));
  const tiangBaru = regularTiang.filter(t => t.status !== 'existing');
  const tiangEksisting = regularTiang.filter(t => t.status === 'existing');
  const totalPanjangJalur = Math.round((survey.jalurList || []).reduce((sum, j) => sum + (j.panjangMeter || 0), 0));
  const rincianLines = buildRincianPekerjaan(survey);

  // Group Tiang Baru by Konstruksi
  const tiangBaruByKonstruksi = tiangBaru.reduce((acc: Record<string, number>, t) => {
    const k = t.konstruksi || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // Group Tiang Baru by Ukuran
  const tiangBaruByUkuran = tiangBaru.reduce((acc: Record<string, number>, t) => {
    const key = `${t.tinggiTiang || '9m'} / ${t.kekuatanTiang || '-'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Jalur groups
  const jalurSummary = (survey.jalurList || []).reduce((acc: any[], j) => {
    const key = `${j.jenisJaringan} - ${j.jenisPenghantar} ${j.penampangMM}`;
    const found = acc.find(x => x.key === key);
    if (found) {
      found.panjang += j.panjangMeter;
      found.count++;
    } else {
      acc.push({
        key,
        jenis: j.jenisJaringan,
        penghantar: j.jenisPenghantar,
        penampang: j.penampangMM,
        panjang: j.panjangMeter,
        count: 1
      });
    }
    return acc;
  }, []);

  const formatPanjang = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${m} m`;
  };

  // ==========================================
  // 5 EXPORT ACTIONS
  // ==========================================

  // 1. Export Rekap PDF
  const handleExportPDF = () => {
    setExportLoading('pdf');
    try {
      const ok = exportToPDF(survey);
      if (ok) showNotify('Laporan Rekap PDF berhasil dibuka untuk dicetak / simpan');
    } finally {
      setExportLoading(null);
    }
  };

  // 2. Export KML (Google Earth)
  const handleExportKML = () => {
    setExportLoading('kml');
    try {
      const ok = exportToKML(survey);
      if (ok) showNotify('File KML (Google Earth) berhasil diunduh');
    } finally {
      setExportLoading(null);
    }
  };

  // 3. Export BA Survey PDF
  const handleExportBA = () => {
    setExportLoading('ba');
    try {
      const baData: BASurveyData = {
        jenisPermohonan: survey.jenisSurvey || 'Pasang Baru',
        tarifDaya: survey.tarifDaya || 'R1 / 1300VA',
        idPelanggan: survey.idPelanggan || '',
        namaPelanggan: survey.namaPelanggan || survey.namaSurvey,
        alamat: survey.alamatPelanggan || survey.lokasi || '',
        tanggalSurvey: new Date(survey.tanggalSurvey || Date.now()),
        hasilSurvey: survey.hasilSurvey || 'DAPAT DILAKSANAKAN',
        namaSurveyor: survey.surveyor || '',
        namaPerwakilan: survey.namaPerwakilan || '',
        keterangan: survey.keterangan || '',
        appDipasang: survey.appDipasang || 'Persil',
        konstruksiOleh: survey.konstruksiOleh || 'Pelanggan',
        checklist: survey.baChecklist || {
          perluasanJTM: false,
          bangunGardu: false,
          perluasanJTR: false,
          tanamTiang: false,
          dikenakanPFK: false,
        },
        signaturePelanggan: survey.signaturePelanggan,
        signatureSurveyor: survey.signatureSurveyor,
      };

      const ok = generateBASurveyPdf({ baData });
      if (ok) showNotify('Dokumen Berita Acara (BA) PDF dibuka');
    } finally {
      setExportLoading(null);
    }
  };

  // 4. Export PDF Gambar (Blangko dengan Map Snapshot & Kop CAD)
  const handleExportPDFGambar = () => {
    if (onOpenExportPdfGambar) {
      onOpenExportPdfGambar();
    }
  };

  // 5. Export CSV (Excel)
  const handleExportCSV = () => {
    setExportLoading('csv');
    try {
      const ok = exportToCSV(survey);
      if (ok) showNotify('File CSV (Excel) berhasil diunduh');
    } finally {
      setExportLoading(null);
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
      zIndex: 2500,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '94vh',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          background: '#1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                REKAPITULASI HASIL SURVEY
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {survey.namaSurvey || 'Survey PLN'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notification pill */}
        {notification && (
          <div style={{
            background: notification.type === 'success' ? '#166534' : '#991b1b',
            color: 'white',
            padding: '8px 16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {notification.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info Banner */}
          <div style={{
            background: '#1e293b',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid #334155',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            fontSize: '12px'
          }}>
            <div><span style={{ color: '#94a3b8' }}>Jenis Permohonan:</span> <b style={{ color: '#38bdf8' }}>{survey.jenisSurvey || '-'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Tarif / Daya:</span> <b style={{ color: '#f8fafc' }}>{survey.tarifDaya || '-'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Pelanggan:</span> <b style={{ color: '#f8fafc' }}>{survey.namaPelanggan || '-'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Lokasi:</span> <b style={{ color: '#f8fafc' }}>{survey.lokasi || '-'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Surveyor:</span> <b style={{ color: '#f8fafc' }}>{survey.surveyor || '-'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Tanggal:</span> <b style={{ color: '#f8fafc' }}>{new Date(survey.tanggalSurvey || Date.now()).toLocaleDateString('id-ID')}</b></div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>{tiangBaru.length}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Tiang Baru</div>
            </div>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#94a3b8' }}>{tiangEksisting.length}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Tiang Eksisting</div>
            </div>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{survey.garduList?.length || 0}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Gardu Trafo</div>
            </div>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{formatPanjang(totalPanjangJalur)}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Total Jalur Kabel</div>
            </div>
          </div>

          {/* Details Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Tiang Baru Breakdown */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                📍 Konstruksi Tiang Baru
              </div>
              {Object.keys(tiangBaruByKonstruksi).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  {Object.entries(tiangBaruByKonstruksi).map(([konstruksi, count]) => (
                    <div key={konstruksi} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '3px' }}>
                      <span>{konstruksi}</span>
                      <b style={{ color: '#38bdf8' }}>{count} btg</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tidak ada tiang baru</div>
              )}

              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginTop: '12px', marginBottom: '6px' }}>
                📐 Ukuran Tiang Baru (Tinggi/Beban)
              </div>
              {Object.keys(tiangBaruByUkuran).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  {Object.entries(tiangBaruByUkuran).map(([ukuran, count]) => (
                    <div key={ukuran} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '3px' }}>
                      <span>{ukuran}</span>
                      <b style={{ color: '#38bdf8' }}>{count} btg</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b' }}>-</div>
              )}
            </div>

            {/* Jalur Breakdown */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                ⚡ Penarikan Jalur Kabel
              </div>
              {jalurSummary.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  {jalurSummary.map((j) => (
                    <div key={j.key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '3px' }}>
                      <span>{j.key}</span>
                      <b style={{ color: '#10b981' }}>{Math.round(j.panjang)} m ({j.count} span)</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tidak ada data jalur</div>
              )}
            </div>
          </div>

          {/* Rincian Pekerjaan Standar PLN */}
          {rincianLines && rincianLines.length > 0 && (
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
                🛠️ Kebutuhan Material & Pekerjaan Standar Konstruksi PLN:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6' }}>
                {rincianLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ==================================================== */}
          {/* THE 5 EXPORT OPTIONS */}
          {/* ==================================================== */}
          <div style={{
            marginTop: '8px',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #0284c7'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
              🚀 MENU EKSPOR DATA SURVEY
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#94a3b8' }}>
              Pilih salah satu format ekspor berikut untuk pelaporan, analisis, atau cetak dokumen resmi:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {/* 1. Export Rekap PDF */}
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exportLoading !== null}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  opacity: exportLoading ? 0.6 : 1,
                  transition: 'transform 0.1s ease',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <FileText size={22} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Export Rekap PDF</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>Laporan Teknis</span>
              </button>

              {/* 2. Export KML (Earth) */}
              <button
                type="button"
                onClick={handleExportKML}
                disabled={exportLoading !== null}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  opacity: exportLoading ? 0.6 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <Map size={22} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Export KML (Earth)</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>Google Earth GIS</span>
              </button>

              {/* 3. Export BA Survey */}
              <button
                type="button"
                onClick={handleExportBA}
                disabled={exportLoading !== null}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  opacity: exportLoading ? 0.6 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <ClipboardCheck size={22} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Export BA Survey</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>Berita Acara & TTD</span>
              </button>

              {/* 4. Export PDF Gambar (Blangko) */}
              <button
                type="button"
                onClick={handleExportPDFGambar}
                disabled={exportLoading !== null}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  opacity: exportLoading ? 0.6 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <ImageIcon size={22} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Export PDF Gambar</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>Kop CAD & Peta</span>
              </button>

              {/* 5. Export CSV (Excel) */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={exportLoading !== null}
                style={{
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  opacity: exportLoading ? 0.6 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <Table size={22} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Export CSV (Excel)</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>Spreadsheet Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #334155',
          background: '#1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {onEditSurvey && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditSurvey(survey);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #0284c7',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit3 size={14} />
                <span>Edit Data Survey / BA</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              padding: '8px 18px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
