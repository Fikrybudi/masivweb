// =============================================================================
// PLN SURVEY WEB - Export Utilities (KML, CSV, Rekap PDF)
// =============================================================================

import { Survey } from '../types';
import { PLN_LOGO_PNG_BASE64 } from './plnLogoBase64';
import { buildRincianPekerjaan } from './rincianPekerjaan';

/**
 * Trigger browser file download helper
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilename(name: string): string {
  return (name || 'Survey_PLN').replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * 1. Export Survey to Google Earth KML
 */
export function exportToKML(survey: Survey): boolean {
  try {
    const filename = `${sanitizeFilename(survey.namaSurvey)}.kml`;

    // KML Placemarks for Tiang
    const tiangPlacemarks = (survey.tiangList || []).map((t, idx) => {
      const isExisting = t.status === 'existing';
      const label = t.kodeTiang || `T.${t.nomorUrut || idx + 1}`;
      const desc = `
        <![CDATA[
          <h3>Tiang ${label} (${isExisting ? 'Eksisting' : 'Baru'})</h3>
          <p><b>Konstruksi:</b> ${t.konstruksi || '-'}</p>
          <p><b>Jenis Tiang:</b> ${t.jenisTiang || 'Beton'} ${t.tinggiTiang || '9m'} (${t.kekuatanTiang || '-'})</p>
          <p><b>Jaringan:</b> ${t.jenisJaringan || 'SUTM'}</p>
          <p><b>Penguat:</b> ${t.penguat || 'Tidak Ada'}</p>
          <p><b>Grounding:</b> ${t.grounding ? 'Ada' : 'Tidak Ada'}</p>
          <p><b>Koordinat:</b> ${t.koordinat?.latitude.toFixed(6)}, ${t.koordinat?.longitude.toFixed(6)}</p>
          ${t.catatan ? `<p><b>Catatan:</b> ${t.catatan}</p>` : ''}
        ]]>
      `.trim();

      return `
      <Placemark>
        <name>${label}</name>
        <description>${desc}</description>
        <styleUrl>${isExisting ? '#tiangExistingStyle' : '#tiangNewStyle'}</styleUrl>
        <Point>
          <coordinates>${t.koordinat.longitude},${t.koordinat.latitude},0</coordinates>
        </Point>
      </Placemark>`;
    }).join('\n');

    // KML Placemarks for Gardu
    const garduPlacemarks = (survey.garduList || []).map((g, idx) => {
      const label = g.nomorGardu || `Gardu ${idx + 1}`;
      const desc = `
        <![CDATA[
          <h3>${label} ${g.namaGardu ? `(${g.namaGardu})` : ''}</h3>
          <p><b>Jenis Gardu:</b> ${g.jenisGardu || 'Portal'}</p>
          <p><b>Kapasitas:</b> ${g.kapasitasKVA || 0} kVA</p>
          <p><b>Merek Trafo:</b> ${g.merekTrafo || '-'}</p>
          <p><b>Koordinat:</b> ${g.koordinat?.latitude.toFixed(6)}, ${g.koordinat?.longitude.toFixed(6)}</p>
        ]]>
      `.trim();

      return `
      <Placemark>
        <name>${label}</name>
        <description>${desc}</description>
        <styleUrl>#garduStyle</styleUrl>
        <Point>
          <coordinates>${g.koordinat.longitude},${g.koordinat.latitude},0</coordinates>
        </Point>
      </Placemark>`;
    }).join('\n');

    // KML LineStrings for Jalur
    const jalurPlacemarks = (survey.jalurList || []).map((j, idx) => {
      const jenis = j.jenisJaringan || 'SUTM';
      let styleUrl = '#jalurSUTM';
      if (jenis === 'SUTR') styleUrl = '#jalurSUTR';
      else if (jenis.includes('SKTM') || jenis.includes('SKUTM')) styleUrl = '#jalurSKTM';

      const coordsStr = (j.koordinat || [])
        .map(c => `${c.longitude},${c.latitude},0`)
        .join(' ');

      const desc = `
        <![CDATA[
          <h3>Jalur ${jenis} (#${idx + 1})</h3>
          <p><b>Kabel:</b> ${j.jenisPenghantar || '-'} ${j.penampangMM || ''}</p>
          <p><b>Panjang:</b> ${Math.round(j.panjangMeter || 0)} meter</p>
        ]]>
      `.trim();

      return `
      <Placemark>
        <name>Jalur ${jenis} (${Math.round(j.panjangMeter || 0)}m)</name>
        <description>${desc}</description>
        <styleUrl>${styleUrl}</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coordsStr}</coordinates>
        </LineString>
      </Placemark>`;
    }).join('\n');

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${survey.namaSurvey || 'Survey PLN'}</name>
    <description>Export GIS Survey Jaringan PLN MASIV</description>
    
    <!-- Styles -->
    <Style id="tiangNewStyle">
      <IconStyle>
        <color>ff00aaff</color>
        <scale>1.1</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="tiangExistingStyle">
      <IconStyle>
        <color>ff888888</color>
        <scale>0.9</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="garduStyle">
      <IconStyle>
        <color>ff0088ff</color>
        <scale>1.3</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/square.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="jalurSUTM">
      <LineStyle><color>ff0000ff</color><width>3.5</width></LineStyle>
    </Style>
    <Style id="jalurSUTR">
      <LineStyle><color>ff00cc00</color><width>3.0</width></LineStyle>
    </Style>
    <Style id="jalurSKTM">
      <LineStyle><color>ffcc00cc</color><width>3.5</width></LineStyle>
    </Style>

    <Folder>
      <name>Data Tiang (${survey.tiangList?.length || 0})</name>
      ${tiangPlacemarks}
    </Folder>

    <Folder>
      <name>Data Gardu (${survey.garduList?.length || 0})</name>
      ${garduPlacemarks}
    </Folder>

    <Folder>
      <name>Data Jalur Jaringan (${survey.jalurList?.length || 0})</name>
      ${jalurPlacemarks}
    </Folder>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.error('KML Export failed:', err);
    return false;
  }
}

/**
 * 2. Export Survey to CSV (Excel format)
 */
export function exportToCSV(survey: Survey): boolean {
  try {
    const filename = `${sanitizeFilename(survey.namaSurvey)}.csv`;
    const lines: string[] = [];

    // Header Info
    lines.push(`"INFORMASI SURVEY PLN"`);
    lines.push(`"Nama Survey","${(survey.namaSurvey || '').replace(/"/g, '""')}"`);
    lines.push(`"Jenis Permohonan","${(survey.jenisSurvey || '').replace(/"/g, '""')}"`);
    lines.push(`"ID Pelanggan","${(survey.idPelanggan || '').replace(/"/g, '""')}"`);
    lines.push(`"Nama Pelanggan","${(survey.namaPelanggan || '').replace(/"/g, '""')}"`);
    lines.push(`"Tarif / Daya","${(survey.tarifDaya || '').replace(/"/g, '""')}"`);
    lines.push(`"Lokasi / Alamat","${(survey.lokasi || survey.alamatPelanggan || '').replace(/"/g, '""')}"`);
    lines.push(`"Surveyor","${(survey.surveyor || '').replace(/"/g, '""')}"`);
    lines.push(`"Tanggal Survey","${new Date(survey.tanggalSurvey || Date.now()).toLocaleDateString('id-ID')}"`);
    lines.push(``);

    // Section Tiang
    lines.push(`"DATA TIANG"`);
    lines.push(`"No","Kode Tiang","Jenis Tiang","Tinggi","Kekuatan (daN)","Konstruksi","Status","Penguat","Grounding","Latitude","Longitude","Catatan"`);
    (survey.tiangList || []).forEach((t, i) => {
      lines.push([
        t.nomorUrut || i + 1,
        `"${(t.kodeTiang || '').replace(/"/g, '""')}"`,
        `"${(t.jenisTiang || 'Beton').replace(/"/g, '""')}"`,
        `"${(t.tinggiTiang || '9m').replace(/"/g, '""')}"`,
        `"${(t.kekuatanTiang || '-').replace(/"/g, '""')}"`,
        `"${(t.konstruksi || '').replace(/"/g, '""')}"`,
        `"${t.status === 'existing' ? 'EKSISTING' : 'BARU'}"`,
        `"${(t.penguat || '-').replace(/"/g, '""')}"`,
        `"${t.grounding ? 'ADA' : 'TIDAK'}"`,
        t.koordinat?.latitude?.toFixed(6) || '',
        t.koordinat?.longitude?.toFixed(6) || '',
        `"${(t.catatan || '').replace(/"/g, '""')}"`,
      ].join(','));
    });
    lines.push(``);

    // Section Gardu
    lines.push(`"DATA GARDU DISTRIBUSI"`);
    lines.push(`"No","Nomor Gardu","Nama Gardu","Jenis Gardu","Kapasitas (kVA)","Merek Trafo","Latitude","Longitude"`);
    (survey.garduList || []).forEach((g, i) => {
      lines.push([
        i + 1,
        `"${(g.nomorGardu || '').replace(/"/g, '""')}"`,
        `"${(g.namaGardu || '').replace(/"/g, '""')}"`,
        `"${(g.jenisGardu || 'Portal').replace(/"/g, '""')}"`,
        g.kapasitasKVA || 0,
        `"${(g.merekTrafo || '-').replace(/"/g, '""')}"`,
        g.koordinat?.latitude?.toFixed(6) || '',
        g.koordinat?.longitude?.toFixed(6) || '',
      ].join(','));
    });
    lines.push(``);

    // Section Jalur
    lines.push(`"DATA JALUR KABEL & PENGHANTAR"`);
    lines.push(`"No","Jenis Jaringan","Penghantar","Penampang (mm2)","Panjang (meter)"`);
    (survey.jalurList || []).forEach((j, i) => {
      lines.push([
        i + 1,
        `"${(j.jenisJaringan || '').replace(/"/g, '""')}"`,
        `"${(j.jenisPenghantar || '').replace(/"/g, '""')}"`,
        `"${(j.penampangMM || '').replace(/"/g, '""')}"`,
        Math.round(j.panjangMeter || 0),
      ].join(','));
    });

    const csvString = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.error('CSV Export failed:', err);
    return false;
  }
}

/**
 * 3. Export Rekap Survey to Printable PDF
 */
export function exportToPDF(survey: Survey): boolean {
  try {
    const rincianLines = buildRincianPekerjaan(survey);
    const dateStr = new Date(survey.tanggalSurvey || Date.now()).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalTiangBaru = (survey.tiangList || []).filter(t => t.status !== 'existing').length;
    const totalTiangEksisting = (survey.tiangList || []).filter(t => t.status === 'existing').length;
    const totalPanjangJalur = Math.round((survey.jalurList || []).reduce((acc, j) => acc + (j.panjangMeter || 0), 0));

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Laporan Rekapitulasi Survey - ${survey.namaSurvey || 'PLN'}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
        * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
        body { margin: 0; color: #1e293b; font-size: 11px; line-height: 1.4; }
        
        .header { display: flex; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 15px; }
        .logo { width: 55px; height: auto; margin-right: 15px; }
        .header-title h2 { margin: 0; font-size: 16px; color: #0369a1; text-transform: uppercase; }
        .header-title h3 { margin: 2px 0 0 0; font-size: 13px; color: #334155; }
        .header-title p { margin: 2px 0 0 0; font-size: 10px; color: #64748b; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 15px; font-size: 11px; }
        .info-item { display: flex; }
        .info-label { width: 130px; font-weight: 600; color: #475569; }
        .info-val { flex: 1; color: #0f172a; }

        .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; }
        .card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; text-align: center; }
        .card-num { font-size: 16px; font-weight: 700; color: #0284c7; }
        .card-label { font-size: 10px; color: #64748b; margin-top: 2px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
        th { background: #0284c7; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }

        .section-title { font-size: 12px; font-weight: 700; color: #0369a1; margin: 12px 0 6px 0; border-left: 3px solid #0284c7; padding-left: 6px; }

        .rincian-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 15px; }
        .rincian-list { margin: 4px 0 0 0; padding-left: 18px; font-size: 10px; color: #92400e; }

        .signature-table { width: 100%; margin-top: 25px; border: none; }
        .signature-table td { border: none; text-align: center; width: 33.3%; vertical-align: top; padding: 0 10px; }
        .sign-title { font-weight: 600; color: #334155; margin-bottom: 6px; }
        .sign-box { height: 75px; display: flex; align-items: center; justify-content: center; }
        .sign-img { max-height: 70px; max-width: 160px; }
        .sign-line { border-bottom: 1px solid #334155; width: 140px; margin: 0 auto; margin-top: 60px; }
        .sign-name { margin-top: 4px; font-weight: 700; color: #0f172a; }

        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="data:image/png;base64,${PLN_LOGO_PNG_BASE64}" alt="PLN Logo" />
        <div class="header-title">
          <h2>PT PLN (PERSERO)</h2>
          <h3>LAPORAN REKAPITULASI HASIL SURVEY DISTRIBUSI</h3>
          <p>Sistem Informasi & Verifikasi Aset Distribusi (MASIV - PLN GIS OPTADIS)</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Nama Survey:</span><span class="info-val">${survey.namaSurvey || '-'}</span></div>
        <div class="info-item"><span class="info-label">Jenis Permohonan:</span><span class="info-val">${survey.jenisSurvey || '-'}</span></div>
        <div class="info-item"><span class="info-label">Nama Pelanggan:</span><span class="info-val">${survey.namaPelanggan || '-'} (${survey.idPelanggan || 'ID -'})</span></div>
        <div class="info-item"><span class="info-label">Tarif / Daya:</span><span class="info-val">${survey.tarifDaya || '-'}</span></div>
        <div class="info-item"><span class="info-label">Lokasi / Alamat:</span><span class="info-val">${survey.lokasi || survey.alamatPelanggan || '-'}</span></div>
        <div class="info-item"><span class="info-label">Hari / Tanggal:</span><span class="info-val">${dateStr}</span></div>
        <div class="info-item"><span class="info-label">Penyulang / GI:</span><span class="info-val">${survey.namaFeeder || '-'} / ${survey.namaGarduInduk || '-'}</span></div>
        <div class="info-item"><span class="info-label">Hasil Survey:</span><span class="info-val"><b>${survey.hasilSurvey || 'DAPAT DILAKSANAKAN'}</b></span></div>
      </div>

      <div class="summary-cards">
        <div class="card"><div class="card-num">${totalTiangBaru}</div><div class="card-label">Tiang Rencana Baru</div></div>
        <div class="card"><div class="card-num">${totalTiangEksisting}</div><div class="card-label">Tiang Eksisting</div></div>
        <div class="card"><div class="card-num">${survey.garduList?.length || 0}</div><div class="card-label">Gardu Distribusi</div></div>
        <div class="card"><div class="card-num">${totalPanjangJalur} m</div><div class="card-label">Total Penarikan Jalur</div></div>
      </div>

      ${rincianLines && rincianLines.length > 0 ? `
      <div class="rincian-box">
        <b style="color: #b45309;">Kebutuhan Material & Rincian Pekerjaan Konstruksi PLN:</b>
        <ul class="rincian-list">
          ${rincianLines.map(line => `<li>${line}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="section-title">1. DAFTAR TIANG & TITIK PANCANG</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th>Kode</th>
            <th>Jenis Tiang</th>
            <th>Tinggi / Kekuatan</th>
            <th>Konstruksi</th>
            <th>Status</th>
            <th>Koordinat GPS</th>
          </tr>
        </thead>
        <tbody>
          ${(survey.tiangList || []).map((t, i) => `
            <tr>
              <td>${t.nomorUrut || i + 1}</td>
              <td><b>${t.kodeTiang || '-'}</b></td>
              <td>${t.jenisTiang || 'Beton'}</td>
              <td>${t.tinggiTiang || '9m'} / ${t.kekuatanTiang || '-'}</td>
              <td>${t.konstruksi || '-'}</td>
              <td><span style="color: ${t.status === 'existing' ? '#64748b' : '#16a34a'}; font-weight: bold;">${t.status === 'existing' ? 'EKSISTING' : 'BARU'}</span></td>
              <td>${t.koordinat?.latitude?.toFixed(6)}, ${t.koordinat?.longitude?.toFixed(6)}</td>
            </tr>
          `).join('')}
          ${(!survey.tiangList || survey.tiangList.length === 0) ? '<tr><td colspan="7" style="text-align: center; color: #94a3b8;">Tidak ada data tiang</td></tr>' : ''}
        </tbody>
      </table>

      <div class="section-title">2. DAFTAR JALUR KABEL & PENGHANTAR</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th>Jenis Jaringan</th>
            <th>Jenis Penghantar</th>
            <th>Penampang</th>
            <th>Panjang Kabel</th>
          </tr>
        </thead>
        <tbody>
          ${(survey.jalurList || []).map((j, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><b>${j.jenisJaringan || '-'}</b></td>
              <td>${j.jenisPenghantar || '-'}</td>
              <td>${j.penampangMM || '-'}</td>
              <td>${Math.round(j.panjangMeter || 0)} meter</td>
            </tr>
          `).join('')}
          ${(!survey.jalurList || survey.jalurList.length === 0) ? '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">Tidak ada data jalur</td></tr>' : ''}
        </tbody>
      </table>

      <div class="section-title">3. PERSETUJUAN & PENGESAHAN</div>
      <table class="signature-table">
        <tr>
          <td>
            <div class="sign-title">Pelanggan / Perwakilan</div>
            <div class="sign-box">
              ${survey.signaturePelanggan ? `<img class="sign-img" src="${survey.signaturePelanggan}" />` : '<div class="sign-line"></div>'}
            </div>
            <div class="sign-name">${survey.namaPerwakilan || survey.namaPelanggan || '____________________'}</div>
          </td>
          <td>
            <div class="sign-title">Mengetahui / Supervisor</div>
            <div class="sign-box"><div class="sign-line"></div></div>
            <div class="sign-name">____________________</div>
          </td>
          <td>
            <div class="sign-title">Petugas Surveyor PLN</div>
            <div class="sign-box">
              ${survey.signatureSurveyor ? `<img class="sign-img" src="${survey.signatureSurveyor}" />` : '<div class="sign-line"></div>'}
            </div>
            <div class="sign-name">${survey.surveyor || '____________________'}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup diblokir browser. Izinkan popup untuk mencetak Rekap PDF.');
      return false;
    }
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 500);

    return true;
  } catch (err) {
    console.error('Rekap PDF failed:', err);
    return false;
  }
}
