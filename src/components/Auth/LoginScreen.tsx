// =============================================================================
// PLN SURVEY WEB - Login Screen
// =============================================================================
// Direct port of mobile app's LoginScreen.tsx for web.
// Connected to Supabase Authentication for MASIV PLN survey accounts.
// =============================================================================

import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2, MessageCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Mohon masukkan email dan kata sandi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Email atau password salah. Pastikan akun Anda sudah terdaftar.');
      } else {
        setErrorMsg(err.message || 'Gagal masuk ke akun Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #0f2744 0%, #07192f 50%, #050d1a 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Glow */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13, 71, 161, 0.35) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
        bottom: '15%',
        right: '25%',
        pointerEvents: 'none',
        filter: 'blur(50px)',
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Logo and App Title */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '28px',
        }}>
          {/* Logo Card */}
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '20px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}>
            <img
              src="/logo_masiv_icon.png"
              alt="MASIV Icon"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback if image not loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h1 style={{
            margin: '0 0 4px 0',
            fontSize: '30px',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '1.5px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            MASIV
          </h1>
          <p style={{
            margin: '0 0 6px 0',
            fontSize: '12.5px',
            color: '#94a3b8',
            maxWidth: '360px',
            lineHeight: 1.4,
          }}>
            Mobile Asset Surveying, Information and Verification system
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            fontSize: '10.5px',
            fontWeight: 600,
            color: '#38bdf8',
            marginTop: '4px'
          }}>
            ⚡ PT PLN (PERSERO) • OPTADIS GIS
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '28px 26px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          boxSizing: 'border-box',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: 700,
              color: '#f8fafc',
            }}>
              Masuk ke Aplikasi
            </h2>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#94a3b8',
            }}>
              Gunakan akun resmi PLN yang terhubung ke database cloud
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '12.5px',
              marginBottom: '18px',
              lineHeight: 1.4,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}>
                Email Akun PLN
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0 12px',
                transition: 'all 0.2s',
              }}>
                <Mail size={18} color="#64748b" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="surveyor@pln.co.id"
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    padding: '12px 0',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}>
                Kata Sandi
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0 12px',
                transition: 'all 0.2s',
              }}>
                <Lock size={18} color="#64748b" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    padding: '12px 0',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: loading ? '#0369a1' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Note with WhatsApp Link to Admin */}
          <div style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '12.5px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span>Belum punya akun?</span>
            <a
              href="https://wa.me/6287773068968?text=Halo%20Admin%20MASIV%20PLN,%20saya%20ingin%20mendaftar%20akun%20surveyor"
              target="_blank"
              rel="noopener noreferrer"
              title="Hubungi Admin MASIV PLN via WhatsApp (087773068968)"
              style={{
                color: '#22c55e',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(34, 197, 94, 0.24)';
                (e.currentTarget as HTMLElement).style.borderColor = '#22c55e';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(34, 197, 94, 0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34, 197, 94, 0.35)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <MessageCircle size={14} color="#22c55e" />
              <span>Hubungi Admin (WhatsApp)</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#475569',
        }}>
          MASIV Web v2.2.5 • Terhubung ke Supabase Database Cloud
        </div>
      </div>
    </div>
  );
};
