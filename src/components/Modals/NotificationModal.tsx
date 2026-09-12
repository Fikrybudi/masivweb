import React from 'react';
import { SuperadminNotification } from '../../services/notificationService';
import { Bell, CheckCheck, Trash2, X, ExternalLink, Clock, User, MapPin } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SuperadminNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectSurvey: (surveyId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onSelectSurvey,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          color: 'white',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #0f172a, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(2, 132, 199, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                Aktivitas Survey Cloud
              </h3>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                Notifikasi Realtime Khusus Superadmin
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ea580c',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {unreadCount} Baru
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#131d33',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#94a3b8' }}>
              Total: <strong>{notifications.length}</strong> pemberitahuan
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCheck size={13} />
                  Tandai Dibaca
                </button>
              )}
              <button
                onClick={onClearAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                Bersihkan
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Bell size={36} strokeWidth={1.5} opacity={0.4} />
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#94a3b8' }}>
                Belum ada notifikasi survey
              </div>
              <div style={{ fontSize: '12px', maxWidth: '320px', lineHeight: 1.4 }}>
                Ketika surveyor lapangan mengupload survey baru atau mengubah data di cloud, notifikasi realtime akan otomatis muncul di sini.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => {
                const isInsert = notif.type === 'INSERT';
                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: notif.read ? '#1e293b' : 'rgba(2, 132, 199, 0.12)',
                      border: notif.read ? '1px solid #334155' : '1px solid rgba(56, 189, 248, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Type Badge + Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            backgroundColor: isInsert ? '#15803d' : '#0369a1',
                            color: 'white',
                          }}
                        >
                          {isInsert ? 'Survey Baru' : 'Diperbarui'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: '#e2e8f0',
                          }}
                        >
                          {notif.jenisSurvey}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px' }}>
                        <Clock size={11} />
                        <span>{formatTime(notif.timestamp)}</span>
                      </div>
                    </div>

                    {/* Survey Name */}
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                      {notif.namaSurvey}
                    </div>

                    {/* Metadata Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '11.5px',
                        color: '#94a3b8',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} color="#38bdf8" />
                        <span>{notif.surveyor}</span>
                      </div>
                      {notif.lokasi && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#f59e0b" />
                          <span>{notif.lokasi}</span>
                        </div>
                      )}
                    </div>

                    {/* Open Survey Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        onClick={() => {
                          onSelectSurvey(notif.surveyId);
                          onClose();
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#0284c7',
                          color: 'white',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
                      >
                        <ExternalLink size={12} />
                        Buka di Peta
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0b1120',
            fontSize: '11px',
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          Notifikasi terhubung secara live ke Supabase Realtime Channel.
        </div>
      </div>
    </div>
  );
};
