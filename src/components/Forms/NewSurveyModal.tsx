import React, { useState } from 'react';
import { Survey } from '../../types';
import { JENIS_PERMOHONAN_OPTIONS, TARIF_DAYA_OPTIONS, HASIL_SURVEY_OPTIONS, DEFAULT_BA_CHECKLIST } from '../../constants/surveyOptions';
import { X, Check } from 'lucide-react';

interface NewSurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (survey: Survey) => void;
}

export const NewSurveyModal: React.FC<NewSurveyModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [jenisPermohonan, setJenisPermohonan] = useState(JENIS_PERMOHONAN_OPTIONS[0]);
  const [namaSurvey, setNamaSurvey] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [idPelanggan, setIdPelanggan] = useState('');
  const [tarifDaya, setTarifDaya] = useState(TARIF_DAYA_OPTIONS[2]); // R1 / 1300VA
  const [lokasi, setLokasi] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [namaFeeder, setNamaFeeder] = useState('');
  const [namaGarduInduk, setNamaGarduInduk] = useState('');
  const [surveyor, setSurveyor] = useState('');
  const [namaPerwakilan, setNamaPerwakilan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [appDipasang, setAppDipasang] = useState<'Persil' | 'Gardu'>('Persil');
  const [konstruksiOleh, setKonstruksiOleh] = useState<'Pelanggan' | 'PLN'>('Pelanggan');
  const [checklist, setChecklist] = useState({ ...DEFAULT_BA_CHECKLIST });

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = namaSurvey.trim() || `${jenisPermohonan} - ${namaPelanggan.trim() || 'Pelanggan'}`;
    const newSurvey: Survey = {
      id: crypto.randomUUID(),
      namaSurvey: title,
      jenisSurvey: jenisPermohonan as any,
      lokasi: lokasi.trim(),
      kecamatan: kecamatan.trim(),
      kelurahan: kelurahan.trim(),
      namaFeeder: namaFeeder.trim(),
      namaGarduInduk: namaGarduInduk.trim(),
      surveyor: surveyor.trim(),
      tanggalSurvey: new Date(),
      tiangList: [],
      garduList: [],
      jalurList: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: false,
      idPelanggan: idPelanggan.trim(),
      tarifDaya,
      namaPerwakilan: namaPerwakilan.trim(),
      keterangan: keterangan.trim(),
      appDipasang,
      konstruksiOleh,
      baChecklist: checklist,
    };

    onSubmit(newSurvey);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        border: '1px solid #334155'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              📋 Form Input Survey Baru
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Format standar MASIV PLN (Identik dengan Mobile App)
            </p>
          </div>
          <button
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Jenis Permohonan */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Jenis Permohonan / Survey *
              </label>
              <select
                value={jenisPermohonan}
                onChange={(e) => setJenisPermohonan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
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

            {/* Nama Survey (Optional Custom) */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Nama Project Survey (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Perluasan JTR Kp. Sukamaju"
                value={namaSurvey}
                onChange={(e) => setNamaSurvey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Nama Pelanggan / Pemohon
              </label>
              <input
                type="text"
                placeholder="Nama pemohon"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* ID Pelanggan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                ID Pelanggan / No. Agenda
              </label>
              <input
                type="text"
                placeholder="ID Pelanggan / No Agenda"
                value={idPelanggan}
                onChange={(e) => setIdPelanggan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Tarif / Daya */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Tarif / Daya PLN
              </label>
              <select
                value={tarifDaya}
                onChange={(e) => setTarifDaya(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
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
            </div>

            {/* Lokasi / Alamat */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Lokasi / Alamat Lengkap
              </label>
              <input
                type="text"
                placeholder="Jl. Raya / Dusun / RT RW"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Kecamatan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Kecamatan
              </label>
              <input
                type="text"
                placeholder="Kecamatan"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Kelurahan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Kelurahan / Desa
              </label>
              <input
                type="text"
                placeholder="Kelurahan / Desa"
                value={kelurahan}
                onChange={(e) => setKelurahan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Nama Feeder */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Penyulang / Feeder
              </label>
              <input
                type="text"
                placeholder="Contoh: FDR CIKANDE"
                value={namaFeeder}
                onChange={(e) => setNamaFeeder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Gardu Induk */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Gardu Induk (GI)
              </label>
              <input
                type="text"
                placeholder="Contoh: GI RANGKASBITUNG"
                value={namaGarduInduk}
                onChange={(e) => setNamaGarduInduk(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Surveyor */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Nama Surveyor *
              </label>
              <input
                type="text"
                placeholder="Nama petugas survey"
                required
                value={surveyor}
                onChange={(e) => setSurveyor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Nama Perwakilan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                Perwakilan Pelanggan
              </label>
              <input
                type="text"
                placeholder="Nama saksi / perwakilan"
                value={namaPerwakilan}
                onChange={(e) => setNamaPerwakilan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Checklist Teknis BA */}
            <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '14px', borderRadius: '8px', marginTop: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#38bdf8' }}>
                Kebutuhan Teknis / Checklist BA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { key: 'perluasanJTM', label: 'Perluasan JTM (TM)' },
                  { key: 'bangunGardu', label: 'Bangun Gardu Baru' },
                  { key: 'perluasanJTR', label: 'Perluasan JTR (TR)' },
                  { key: 'tanamTiang', label: 'Tanam Tiang Baru' },
                  { key: 'dikenakanPFK', label: 'Dikenakan PFK' },
                ].map((item) => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(checklist as any)[item.key]}
                      onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
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
                padding: '10px 20px',
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
              Simpan Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
