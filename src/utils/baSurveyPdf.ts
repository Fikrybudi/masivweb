// =============================================================================
// PLN SURVEY WEB - Berita Acara (BA) Survey PDF & Print Generator
// =============================================================================

export interface BASurveyData {
  jenisPermohonan: string;
  tarifDaya: string;
  idPelanggan: string;
  namaPelanggan: string;
  alamat: string;
  tanggalSurvey: Date;
  hasilSurvey: string;
  namaSurveyor: string;
  namaPerwakilan: string;
  keterangan: string;
  appDipasang: 'Persil' | 'Gardu';
  konstruksiOleh: 'Pelanggan' | 'PLN';
  checklist: {
    perluasanJTM: boolean;
    bangunGardu: boolean;
    perluasanJTR: boolean;
    tanamTiang: boolean;
    dikenakanPFK: boolean;
  };
  signaturePelanggan?: string;
  signatureSurveyor?: string;
}

export interface BAPdfOptions {
  baData: BASurveyData;
  unitPLN?: string;
}

/**
 * Generate official Berita Acara Survey and open browser print / PDF export dialog
 */
export function generateBASurveyPdf(options: BAPdfOptions): boolean {
  try {
    const { baData, unitPLN = 'PLN UP3 Banten Selatan' } = options;

    const tanggal = new Date(baData.tanggalSurvey || Date.now()).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Berita Acara Survey - ${baData.namaPelanggan || 'PLN'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 25mm 20mm; }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 12pt; 
          padding: 40px 50px;
          line-height: 1.4;
          color: #000;
        }
        h1 { 
          text-align: center; 
          font-size: 16pt; 
          font-weight: bold;
          margin-bottom: 24px;
          text-decoration: underline;
          letter-spacing: 1px;
        }
        .header-table { 
          width: 100%; 
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .header-table td { 
          padding: 4px 0; 
          vertical-align: top;
        }
        .header-table .label { 
          width: 250px; 
          font-weight: 500;
        }
        .header-table .separator { 
          width: 15px; 
        }
        .checklist-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .checklist-table td {
          padding: 4px 10px;
          vertical-align: top;
        }
        .checklist-table .col-left { width: 52%; }
        .checklist-table .col-right { width: 48%; }
        .checklist-item { margin-bottom: 6px; }
        .sketsa-section {
          margin: 20px 0;
        }
        .sketsa-title {
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 8px;
        }
        .note-section {
          margin: 20px 0;
          font-size: 10pt;
        }
        .signature-section {
          width: 100%;
          margin-top: 35px;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signature-table td {
          width: 50%;
          text-align: center;
          padding: 10px;
          vertical-align: top;
        }
        .signature-box {
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px 0;
        }
        .signature-box img {
          max-height: 85px;
          max-width: 240px;
        }
        .signature-line {
          margin-top: 65px;
          border-bottom: 1px solid black;
          display: inline-block;
          width: 170px;
        }
        .sign-name {
          margin-top: 6px;
          font-weight: bold;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>BERITA ACARA SURVEY</h1>

      <table class="header-table">
        <tr>
          <td class="label">Jenis Permohonan / Tarif / Daya</td>
          <td class="separator">:</td>
          <td><b>${baData.jenisPermohonan} / ${baData.tarifDaya}</b></td>
        </tr>
        <tr>
          <td class="label">ID Pelanggan / Nama</td>
          <td class="separator">:</td>
          <td>${baData.idPelanggan ? baData.idPelanggan + ' / ' : ''}<b>${baData.namaPelanggan}</b></td>
        </tr>
        <tr>
          <td class="label">Alamat</td>
          <td class="separator">:</td>
          <td>${baData.alamat}</td>
        </tr>
        <tr>
          <td class="label">Hari / Tanggal</td>
          <td class="separator">:</td>
          <td>${tanggal}</td>
        </tr>
        <tr>
          <td class="label">Hasil Survey Lokasi</td>
          <td class="separator">:</td>
          <td><b>${baData.hasilSurvey}</b></td>
        </tr>
      </table>

      <table class="checklist-table">
        <tr>
          <td class="col-left">
            <div class="checklist-item">1. Perluasan JTM* : <b>${baData.checklist?.perluasanJTM ? 'Iya' : 'Tidak'}</b></div>
            <div class="checklist-item">2. Bangun Gardu* : <b>${baData.checklist?.bangunGardu ? 'Iya' : 'Tidak'}</b></div>
            <div class="checklist-item">3. Perluasan JTR* : <b>${baData.checklist?.perluasanJTR ? 'Iya' : 'Tidak'}</b></div>
            <div class="checklist-item">4. Tanam Tiang* : <b>${baData.checklist?.tanamTiang ? 'Iya' : 'Tidak'}</b></div>
            <div class="checklist-item">5. Dikenakan PFK* : <b>${baData.checklist?.dikenakanPFK ? 'Iya' : 'Tidak'}</b></div>
            <div class="checklist-item" style="margin-top: 8px;">6. Dokumen BATG</div>
            <div style="padding-left: 18px; font-size: 10pt; line-height: 1.5;">
              - FC Sertifikat Tanah<br>
              - FC KTP sesuai dengan sertifikat tanah<br>
              - FC Akta Pendirian Perusahaan dan atau perubahannya
            </div>
          </td>
          <td class="col-right">
            <div class="checklist-item">7. APP dipasang di bagian depan <u><b>${baData.appDipasang || 'Persil'}</b></u></div>
            <div class="checklist-item" style="margin-top: 12px;">8. Konstruksi bangunan gardu distribusi dilakukan oleh <u><b>${baData.konstruksiOleh || 'Pelanggan'}</b></u></div>
            <div style="padding-left: 18px; font-size: 10pt; margin-top: 6px; line-height: 1.5;">
              - Konstruksi bangunan mengikuti standar konstruksi yang berlaku di PT. PLN (PERSERO) ${unitPLN}<br>
              - Saat proses konstruksi harus dalam pengawasan PT. PLN (PERSERO) ${unitPLN}
            </div>
          </td>
        </tr>
      </table>

      <div class="sketsa-section">
        <div class="sketsa-title">Sketsa Perluasan Jaringan :</div>
        <div>- ${baData.keterangan || 'Kebutuhan tiang sesuai lampiran'}</div>
        <div>- gambar <b>TERLAMPIR</b></div>
      </div>

      <div class="note-section">
        <b>note :</b><br>
        <i>*Pilih salah satu / coret yang tidak perlu</i><br>
        Demikian Berita Acara ini dibuat untuk dipergunakan sebagaimana mestinya.
      </div>

      <div class="signature-section">
        <table class="signature-table">
          <tr>
            <td>
              <div><b>Pelanggan / Perwakilan Pelanggan</b></div>
              <div class="signature-box">
                ${baData.signaturePelanggan ? `<img src="${baData.signaturePelanggan}" />` : '<div class="signature-line"></div>'}
              </div>
              <div class="sign-name">${baData.namaPerwakilan || baData.namaPelanggan || '____________________'}</div>
            </td>
            <td>
              <div><b>PT. PLN (PERSERO) ${unitPLN}</b></div>
              <div class="signature-box">
                ${baData.signatureSurveyor ? `<img src="${baData.signatureSurveyor}" />` : '<div class="signature-line"></div>'}
              </div>
              <div class="sign-name">${baData.namaSurveyor || '____________________'}</div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup diblokir browser. Izinkan popup untuk mencetak Dokumen BA.');
      return false;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 500);

    return true;
  } catch (err) {
    console.error('Error generating BA Survey PDF:', err);
    return false;
  }
}
