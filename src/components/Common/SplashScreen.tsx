// =============================================================================
// PLN SURVEY WEB - Splash Screen
// =============================================================================
// Exact 1:1 match with mobile app splash screen (App.tsx):
// - Background: #FFFFFF
// - Image: /splashs.png (220x220)
// - Spinner color: #0D47A1
// - Tagline: "Survey Made Easy : Mudah, Cepat, Akurat"
// - Footer: "PLN OPTADIS GIS SYSTEM"
// =============================================================================

import React from 'react';

interface SplashScreenProps {
  opacity?: number;
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  opacity = 1,
  message,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        opacity,
        transition: 'opacity 0.4s ease-out',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'masiv-scale-up 0.5s ease-out',
        }}
      >
        <img
          src="/splashs.png"
          alt="MASIV PLN"
          style={{
            width: '220px',
            height: '220px',
            objectFit: 'contain',
            marginBottom: '4px',
          }}
        />

        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Blue Spinner */}
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #E3F2FD',
              borderTop: '3px solid #0D47A1',
              borderRadius: '50%',
              animation: 'masiv-spin 0.8s linear infinite',
              marginBottom: '12px',
            }}
          />

          {message && (
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              {message}
            </div>
          )}

          {/* Tagline */}
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#0D47A1',
              letterSpacing: '0.2px',
            }}
          >
            Survey Made Easy : Mudah, Cepat, Akurat
          </div>

          {/* Footer Sub-brand */}
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#9E9E9E',
              letterSpacing: '2px',
              marginTop: '5px',
              textTransform: 'uppercase',
            }}
          >
            PLN OPTADIS GIS SYSTEM
          </div>
        </div>
      </div>

      <style>{`
        @keyframes masiv-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes masiv-scale-up {
          0% { transform: scale(0.92); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
