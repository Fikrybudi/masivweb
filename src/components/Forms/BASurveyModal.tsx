// =============================================================================
// PLN SURVEY WEB - BA Survey Modal (New Survey & Edit Survey Unified Form)
// Identical to Mobile App (BASurveyForm.tsx) with Digital Signatures
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Survey } from '../../types';
import {
  JENIS_PERMOHONAN_OPTIONS,
  TARIF_DAYA_OPTIONS,
  HASIL_SURVEY_OPTIONS,
  DEFAULT_BA_CHECKLIST,
  CHECKLIST_ITEMS,
} from '../../constants/surveyOptions';
import { X, Check, FileText, PenTool, Printer } from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { generateBASurveyPdf, BASurveyData } from '../../utils/baSurveyPdf';

interface BASurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (surveyData: Partial<Survey>) => void;
  initialData?: Survey | null;
}

export const BASurveyModal: React.FC<BASurveyModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEdit = !!initialData;

  const [jenisPermohonan, setJenisPermohonan] = useState(JENIS_PERMOHONAN_OPTIONS[0]);
  const [tarifDaya, setTarifDaya] = useState(TARIF_DAYA_OPTIONS[2]); // R1 / 1300VA
  const [customTarifDaya, setCustomTarifDaya] = useState('');
  const [showCustomTarif, setShowCustomTarif] = useState(false);

  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [hasilSurvey, setHasilSurvey] = useState(HASIL_SURVEY_OPTIONS[0]);

  const [checklist, setChecklist] = useState({ ...DEFAULT_BA_CHECKLIST });
  const [keterangan, setKeterangan] = useState('');
  const [appDipasang, setAppDipasang] = useState<'Persil' | 'Gardu'>('Persil');
  const [konstruksiOleh, setKonstruksiOleh] = useState<'Pelanggan' | 'PLN'>('Pelanggan');

  // Signatures
  const [namaPerwakilan, setNamaPerwakilan] = useState('');
  const [signaturePelanggan, setSignaturePelanggan] = useState<string>('');

  const [namaSurveyor, setNamaSurveyor] = useState('');
  const [signatureSurveyor, setSignatureSurveyor] = useState<string>('');

  // Active signature modal target
  const [signatureTarget, setSignatureTarget] = useState<'pelanggan' | 'surveyor' | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setJenisPermohonan(initialData.jenisSurvey || JENIS_PERMOHONAN_OPTIONS[0]);

      // Map tarif daya
      if (initialData.tarifDaya && TARIF_DAYA_OPTIONS.includes(initialData.tarifDaya)) {
        setTarifDaya(initialData.tarifDaya);
        setShowCustomTarif(false);
        setCustomTarifDaya('');
      } else if (initialData.tarifDaya) {
        setTarifDaya('Ketik Manual...');
        setShowCustomTarif(true);
        setCustomTarifDaya(initialData.tarifDaya);
      } else {
        setTarifDaya(TARIF_DAYA_OPTIONS[2]);
        setShowCustomTarif(false);
      }

      setIdPelanggan(initialData.idPelanggan || '');
      // If namaPelanggan is empty, try extract from namaSurvey "Jenis - Nama (Tanggal)"
      let extractedName = initialData.namaPelanggan || '';
      if (!extractedName && initialData.namaSurvey) {
        extractedName = initialData.namaSurvey.split(' - ')[1]?.split(' (')[0] || initialData.namaSurvey;
      }
      setNamaPelanggan(extractedName);
      setAlamat(initialData.alamatPelanggan || initialData.lokasi || '');
      setHasilSurvey(initialData.hasilSurvey || HASIL_SURVEY_OPTIONS[0]);
      setChecklist(initialData.baChecklist || { ...DEFAULT_BA_CHECKLIST });
      setKeterangan(initialData.keterangan || '');
      setAppDipasang(initialData.appDipasang || 'Persil');
      setKonstruksiOleh(initialData.konstruksiOleh || 'Pelanggan');

      setNamaPerwakilan(initialData.namaPerwakilan || '');
      setSignaturePelanggan(initialData.signaturePelanggan || '');
      setNamaSurveyor(initialData.surveyor || '');
      setSignatureSurveyor(initialData.signatureSurveyor || '');
    } else {
      // Reset for new survey
      setJenisPermohonan(JENIS_PERMOHONAN_OPTIONS[0]);
      setTarifDaya(TARIF_DAYA_OPTIONS[2]);
      setShowCustomTarif(false);
      setCustomTarifDaya('');
      setIdPelanggan('');
      setNamaPelanggan('');
      setAlamat('');
      setHasilSurvey(HASIL_SURVEY_OPTIONS[0]);
      setChecklist({ ...DEFAULT_BA_CHECKLIST });
      setKeterangan('');
      setAppDipasang('Persil');
      setKonstruksiOleh('Pelanggan');
      setNamaPerwakilan('');
      setSignaturePelanggan('');
      setNamaSurveyor('');
      setSignatureSurveyor('');
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const handleTarifChange = (val: string) => {
    if (val === 'Ketik Manual...') {
      setShowCustomTarif(true);
      setTarifDaya(val);
    } else {
      setShowCustomTarif(false);
      setTarifDaya(val);
    }
  };

  const getFinalTarif = () => (showCustomTarif ? customTarifDaya.trim() || 'R1 / 1300VA' : tarifDaya);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPelanggan.trim()) {
      alert('Nama Pelanggan / Perusahaan wajib diisi');
      return;
    }
    if (!alamat.trim()) {
      alert('Alamat survey wajib diisi');
      return;
    }

    const finalTarif = getFinalTarif();
    const tanggalStr = new Date(initialData?.tanggalSurvey || Date.now()).toLocaleDateString('id-ID');
    const surveyTitle = `${jenisPermohonan} - ${namaPelanggan.trim()} (${tanggalStr})`;

    const surveyData: Partial<Survey> = {
      namaSurvey: surveyTitle,
      jenisSurvey: jenisPermohonan,
      idPelanggan: idPelanggan.trim(),
      namaPelanggan: namaPelanggan.trim(),
      alamatPelanggan: alamat.trim(),
      lokasi: alamat.trim(),
      tarifDaya: finalTarif,
      hasilSurvey,
      baChecklist: checklist,
      keterangan: keterangan.trim(),
      appDipasang,
      konstruksiOleh,
      namaPerwakilan: namaPerwakilan.trim(),
      signaturePelanggan,
      surveyor: namaSurveyor.trim() || 'Surveyor PLN',
      signatureSurveyor,
      updatedAt: new Date(),
    };

    onSubmit(surveyData);
    onClose();
  };

  const handlePrintBAPdf = () => {
    const finalTarif = getFinalTarif();
    const baData: BASurveyData = {
      jenisPermohonan,
      tarifDaya: finalTarif,
      idPelanggan,
      namaPelanggan: namaPelanggan.trim() || 'Pelanggan',
      alamat: alamat.trim() || '-',
      tanggalSurvey: new Date(initialData?.tanggalSurvey || Date.now()),
      hasilSurvey,
      namaSurveyor: namaSurveyor.trim() || 'Surveyor PLN',
      namaPerwakilan: namaPerwakilan.trim(),
      keterangan: keterangan.trim(),
      appDipasang,
      konstruksiOleh,
      checklist,
      signaturePelanggan,
      signatureSurveyor,
    };

    generateBASurveyPdf({ baData });
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        backdropFilter: 'blur(3px)'
      }}>
        <div style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1e293b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#38bdf8" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  {isEdit ? 'EDIT DATA SURVEY & BERITA ACARA' : 'BERITA ACARA SURVEY (SURVEY BARU)'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Format Resmi MASIV PLN UP3 Banten Selatan (Identik Mobile App)
                </p>
              </div>
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

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Jenis Permohonan */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Jenis Permohonan *
                </label>
                <select
                  value={jenisPermohonan}
                  onChange={(e) => setJenisPermohonan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                >
                  {JENIS_PERMOHONAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Tarif / Daya */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Tarif / Daya PLN *
                </label>
                <select
                  value={tarifDaya}
                  onChange={(e) => handleTarifChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                >
                  {TARIF_DAYA_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {showCustomTarif && (
                  <input
                    type="text"
                    placeholder="Ketik tarif/daya manual, cth: R1 / 3500VA"
                    value={customTarifDaya}
                    onChange={(e) => setCustomTarifDaya(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '8px 10px',
                      background: '#1e293b',
                      border: '1px solid #0284c7',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px'
                    }}
                  />
                )}
              </div>

              {/* ID Pelanggan */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  ID Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 12345678901"
                  value={idPelanggan}
                  onChange={(e) => setIdPelanggan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Nama Pelanggan */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Nama Pelanggan / Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Mekarjaya Propertindo"
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Alamat Lengkap */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Alamat Lengkap *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Kp. Cihaseum Kel. Pandeglang"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Hasil Survey Lokasi */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Hasil Survey Lokasi
                </label>
                <select
                  value={hasilSurvey}
                  onChange={(e) => setHasilSurvey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                >
                  {HASIL_SURVEY_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Checklist Pekerjaan Teknis BA */}
              <div style={{
                gridColumn: 'span 2',
                background: '#1e293b',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#38bdf8' }}>
                  Checklist Pekerjaan Teknis Berita Acara
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {CHECKLIST_ITEMS.map((item) => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: '#0f172a',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #334155'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(checklist as any)[item.key]}
                        onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                        style={{ cursor: 'pointer', accentColor: '#0284c7' }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  Keterangan Kebutuhan Jaringan / Sketsa
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kebutuhan tiang 2 btg, penarikan SUTR 80m, gambar terlampir..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Pasal 7: APP Dipasang */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  7. APP Dipasang di
                </label>
                <select
                  value={appDipasang}
                  onChange={(e) => setAppDipasang(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                >
                  <option value="Persil">Persil (Bagian Depan)</option>
                  <option value="Gardu">Gardu</option>
                </select>
              </div>

              {/* Pasal 8: Konstruksi Bangunan Gardu */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>
                  8. Konstruksi Bangunan Gardu Oleh
                </label>
                <select
                  value={konstruksiOleh}
                  onChange={(e) => setKonstruksiOleh(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                >
                  <option value="Pelanggan">Pelanggan</option>
                  <option value="PLN">PLN</option>
                </select>
              </div>

              {/* SEPARATOR: TANDA TANGAN */}
              <div style={{
                gridColumn: 'span 2',
                marginTop: '10px',
                borderTop: '1px solid #334155',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38bdf8'
              }}>
                <PenTool size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>PENGESAHAN & TANDA TANGAN DIGITAL</span>
              </div>

              {/* Tanda Tangan Pelanggan */}
              <div style={{
                background: '#1e293b',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#93c5fd' }}>
                  Perwakilan Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Nama perwakilan penandatangan"
                  value={namaPerwakilan}
                  onChange={(e) => setNamaPerwakilan(e.target.value)}
                  style={{
                    padding: '7px 9px',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
                <div
                  onClick={() => setSignatureTarget('pelanggan')}
                  style={{
                    height: '80px',
                    background: signaturePelanggan ? '#ffffff' : '#0f172a',
                    border: '1px dashed #64748b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {signaturePelanggan ? (
                    <img
                      src={signaturePelanggan}
                      alt="TTD Pelanggan"
                      style={{ maxHeight: '74px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                      <PenTool size={16} />
                      <span style={{ fontSize: '11px' }}>+ Klik untuk TTD Pelanggan</span>
                    </div>
                  )}
                </div>
                {signaturePelanggan && (
                  <button
                    type="button"
                    onClick={() => setSignaturePelanggan('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '11px',
                      cursor: 'pointer',
                      alignSelf: 'flex-end',
                      padding: '2px 4px'
                    }}
                  >
                    Hapus Tanda Tangan
                  </button>
                )}
              </div>

              {/* Tanda Tangan Surveyor */}
              <div style={{
                background: '#1e293b',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#93c5fd' }}>
                  Surveyor PLN
                </label>
                <input
                  type="text"
                  placeholder="Nama petugas surveyor"
                  value={namaSurveyor}
                  onChange={(e) => setNamaSurveyor(e.target.value)}
                  style={{
                    padding: '7px 9px',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
                <div
                  onClick={() => setSignatureTarget('surveyor')}
                  style={{
                    height: '80px',
                    background: signatureSurveyor ? '#ffffff' : '#0f172a',
                    border: '1px dashed #64748b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {signatureSurveyor ? (
                    <img
                      src={signatureSurveyor}
                      alt="TTD Surveyor"
                      style={{ maxHeight: '74px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                      <PenTool size={16} />
                      <span style={{ fontSize: '11px' }}>+ Klik untuk TTD Surveyor</span>
                    </div>
                  )}
                </div>
                {signatureSurveyor && (
                  <button
                    type="button"
                    onClick={() => setSignatureSurveyor('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '11px',
                      cursor: 'pointer',
                      alignSelf: 'flex-end',
                      padding: '2px 4px'
                    }}
                  >
                    Hapus Tanda Tangan
                  </button>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              borderTop: '1px solid #334155',
              paddingTop: '14px'
            }}>
              <div>
                {isEdit && (
                  <button
                    type="button"
                    onClick={handlePrintBAPdf}
                    style={{
                      padding: '8px 14px',
                      background: '#d97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Printer size={15} />
                    <span>Cetak / Download BA Survey</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    background: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Buat Survey Baru'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Signature Pad Popup */}
      <SignaturePadModal
        visible={signatureTarget !== null}
        title={signatureTarget === 'pelanggan' ? 'Tanda Tangan Perwakilan Pelanggan' : 'Tanda Tangan Surveyor PLN'}
        onSave={(dataUrl) => {
          if (signatureTarget === 'pelanggan') {
            setSignaturePelanggan(dataUrl);
          } else if (signatureTarget === 'surveyor') {
            setSignatureSurveyor(dataUrl);
          }
          setSignatureTarget(null);
        }}
        onClose={() => setSignatureTarget(null)}
      />
    </>
  );
};
