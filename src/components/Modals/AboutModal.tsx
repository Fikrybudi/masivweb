import React from 'react';
import { X, Check, Info, Users, Phone, ShieldCheck, Zap, Award } from 'lucide-react';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;

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
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '85vh',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Tentang Aplikasi
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
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Logo & Version */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: '#ffffff',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 10px 25px rgba(2, 132, 199, 0.35), 0 4px 10px rgba(0,0,0,0.2)',
              border: '2px solid rgba(56, 189, 248, 0.3)',
            }}>
              <img
                src="/logo_masiv_icon.png"
                alt="MASIV Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
              />
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>
              MASIV
            </h2>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              Mobile Asset Surveying, Information and Verification System
            </p>
            <span style={{
              fontSize: '11px',
              background: '#1e293b',
              color: '#94a3b8',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              Versi 2.2.5 (Web & Cloud Sync Edition)
            </span>

            <div style={{
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              borderRadius: '20px',
              padding: '6px 14px',
              marginTop: '12px',
              display: 'inline-block'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                Survey Made Easy : Mudah, Cepat, Akurat
              </span>
            </div>
          </div>

          {/* Nilai Utama MASIV */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #334155'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="#eab308" /> Nilai Utama MASIV
            </h4>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8' }}>⚡ Kecepatan</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                Bisa dieksekusi langsung dari smartphone maupun browser web homelab tanpa perlengkapan CAD yang rumit.
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8' }}>🛡️ Validitas</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                Memastikan semua data konstruksi dan standar K3 PLN Banten Selatan tervalidasi dan tersimpan rapi secara digital.
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8' }}>🎯 Presisi</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                Berfokus pada pendataan aset secara aktual di titik koordinat lokasi bumi.
              </div>
            </div>
          </div>

          {/* Tim Pengembang */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #334155'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#10b981" /> Tim MASIV
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
              <div>• <b>Fikry Budi H</b></div>
              <div>• <b>Rifzki Yanika Sukoco</b></div>
              <div>• <b>Dinda Widi Mirna</b></div>
            </div>

            <div style={{ borderTop: '1px solid #334155', marginTop: '12px', paddingTop: '10px' }}>
              <a
                href="https://wa.me/6287773068968"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#22c55e',
                  fontWeight: 700,
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Phone size={14} /> WhatsApp: 087773068968
              </a>
            </div>
          </div>
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
