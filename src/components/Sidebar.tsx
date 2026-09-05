import React, { useState, useMemo } from 'react';
import { Survey } from '../types';
import {
  Folder,
  MapPin,
  Zap,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Trash2,
  User,
  LogOut,
  Search,
  X,
  Cloud,
  Smartphone,
  Calendar,
  ArrowUpDown,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Edit3,
  BarChart2,
} from 'lucide-react';

interface SidebarProps {
  surveys: Survey[];
  activeSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
  onNewSurvey: () => void;
  onDeleteSurvey?: (survey: Survey) => void;
  onEditSurvey?: (survey: Survey) => void;
  onShowSummary?: (survey: Survey) => void;
  onSync: () => void;
  onSyncSingleSurvey?: (survey: Survey) => Promise<void>;
  isSyncing: boolean;
  onOpenAbout?: () => void;
  onOpenImport?: () => void;
  userEmail?: string;
  onLogout?: () => void;
  // Resizing & Responsive props
  width?: number;
  isResizing?: boolean;
  onStartResize?: (e: React.MouseEvent) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  surveys,
  activeSurvey,
  onSelectSurvey,
  onNewSurvey,
  onDeleteSurvey,
  onEditSurvey,
  onShowSummary,
  onSync,
  onSyncSingleSurvey,
  isSyncing,
  onOpenAbout,
  onOpenImport,
  userEmail,
  onLogout,
  width = 340,
  isResizing = false,
  onStartResize,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Search & Filter states (matching MASIV Mobile SurveyHistoryScreen)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'cloud' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'tiang-desc'>('newest');
  const [syncingSingleId, setSyncingSingleId] = useState<string | null>(null);

  // Cloud status counts
  const cloudCount = useMemo(() => surveys.filter((s) => !!s.isSynced).length, [surveys]);
  const localCount = useMemo(() => surveys.filter((s) => !s.isSynced).length, [surveys]);

  // Filter & Search logic
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      // Cloud/Local status filter tab
      if (filterTab === 'cloud' && !s.isSynced) return false;
      if (filterTab === 'local' && s.isSynced) return false;

      // Search Query filter (matches mobile app App / SurveyHistoryScreen)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (s.namaSurvey && s.namaSurvey.toLowerCase().includes(q)) ||
        (s.lokasi && s.lokasi.toLowerCase().includes(q)) ||
        (s.kecamatan && s.kecamatan.toLowerCase().includes(q)) ||
        (s.kelurahan && s.kelurahan.toLowerCase().includes(q)) ||
        (s.surveyor && s.surveyor.toLowerCase().includes(q)) ||
        (s.jenisSurvey && s.jenisSurvey.toLowerCase().includes(q)) ||
        (s.namaFeeder && s.namaFeeder.toLowerCase().includes(q)) ||
        (s.namaGarduInduk && s.namaGarduInduk.toLowerCase().includes(q))
      );
    });
  }, [surveys, filterTab, searchQuery]);

  // Sorting logic
  const sortedSurveys = useMemo(() => {
    return [...filteredSurveys].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
      }
      if (sortBy === 'name-asc') {
        return (a.namaSurvey || '').localeCompare(b.namaSurvey || '');
      }
      if (sortBy === 'tiang-desc') {
        return (b.tiangList?.length || 0) - (a.tiangList?.length || 0);
      }
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [filteredSurveys, sortBy]);

  const handleSingleSync = async (e: React.MouseEvent, survey: Survey) => {
    e.stopPropagation();
    if (!onSyncSingleSurvey || syncingSingleId) return;
    setSyncingSingleId(survey.id);
    try {
      await onSyncSingleSurvey(survey);
    } finally {
      setSyncingSingleId(null);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSelect = (s: Survey) => {
    onSelectSurvey(s);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  // If collapsed on desktop, don't render aside
  if (!isMobile && isCollapsed) {
    return null;
  }

  // Sidebar styling for Mobile Drawer vs Desktop Resizable
  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'min(85vw, 360px)',
        zIndex: 1600,
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #334155',
        height: '100%',
        boxShadow: '4px 0 25px rgba(0,0,0,0.6)',
        transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : {
        width: `${width}px`,
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #334155',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        transition: isResizing ? 'none' : 'width 0.15s ease',
      };

  return (
    <aside style={sidebarStyle}>
      {/* Header (Matching MASIV Mobile App) */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ffffff',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              flexShrink: 0,
            }}>
              <img
                src="/logo_masiv_icon.png"
                alt="MASIV Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                  MASIV
                </span>
                <span style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  letterSpacing: '0.3px',
                }}>
                  PLN
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#38bdf8',
                lineHeight: 1.25,
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Survey Made Easy : Mudah, Cepat, Akurat
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Tutup Menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p style={{
          margin: '8px 0 0 0',
          fontSize: '10.5px',
          color: '#94a3b8',
          lineHeight: 1.35,
        }}>
          Mobile Asset Surveying, Information and Verification system
        </p>

        {/* Quick Collapse Button on Desktop */}
        {!isMobile && onToggleCollapse && (
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title="Ciutkan Sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #1e293b' }}>
        {/* Row 1: Input Survey Baru + Sync Cloud (side-by-side aligned) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onNewSurvey}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '9px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <PlusCircle size={15} />
            Survey Baru
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '9px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
              fontWeight: 600,
              transition: 'background 0.15s ease',
            }}
          >
            <UploadCloud size={15} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Cloud'}
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Chips (Identical to Mobile MASIV SurveyHistoryScreen) */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', background: '#0b1120' }}>
        {/* Search Input Box */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          padding: '0 10px',
          marginBottom: '8px',
        }}>
          <Search size={14} color="#94a3b8" style={{ flexShrink: 0, marginRight: '6px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, lokasi, surveyor..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '12px',
              padding: '7px 0',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills (Semua, Cloud, Lokal) & Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setFilterTab('all')}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterTab === 'all' ? '#0284c7' : '#1e293b',
                color: filterTab === 'all' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Semua ({surveys.length})
            </button>

            <button
              onClick={() => setFilterTab('cloud')}
              title="Survey tersinkronisasi ke Cloud Supabase"
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterTab === 'cloud' ? 'rgba(16, 185, 129, 0.25)' : '#1e293b',
                color: filterTab === 'cloud' ? '#34d399' : '#94a3b8',
                borderWidth: filterTab === 'cloud' ? '1px' : '0px',
                borderColor: '#10b981',
                borderStyle: 'solid',
                transition: 'all 0.15s ease',
              }}
            >
              ☁️ Cloud ({cloudCount})
            </button>

            <button
              onClick={() => setFilterTab('local')}
              title="Survey tersimpan lokal saja / belum tersinkron"
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterTab === 'local' ? 'rgba(245, 158, 11, 0.25)' : '#1e293b',
                color: filterTab === 'local' ? '#fbbf24' : '#94a3b8',
                borderWidth: filterTab === 'local' ? '1px' : '0px',
                borderColor: '#f59e0b',
                borderStyle: 'solid',
                transition: 'all 0.15s ease',
              }}
            >
              📱 Lokal ({localCount})
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '10.5px',
              padding: '3px 6px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">📅 Terbaru</option>
            <option value="oldest">⌛ Terlama</option>
            <option value="name-asc">🔤 Nama A-Z</option>
            <option value="tiang-desc">⚡ Banyak Tiang</option>
          </select>
        </div>
      </div>

      {/* Survey List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Hasil Survey ({sortedSurveys.length})
          </span>
          {searchQuery && (
            <span style={{ fontSize: '11px', color: '#38bdf8' }}>
              Filter: "{searchQuery}"
            </span>
          )}
        </div>

        {surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: '#64748b', fontSize: '13px' }}>
            Belum ada survey tersimpan di browser ini.
            <br />
            Klik <b>Sync Cloud</b> untuk menarik data dari Supabase.
          </div>
        ) : sortedSurveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: '#94a3b8', fontSize: '12.5px' }}>
            Tidak ada survey yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedSurveys.map((s) => {
              const isActive = activeSurvey?.id === s.id;
              const tiangCount = s.tiangList ? s.tiangList.length : 0;
              const garduCount = s.garduList ? s.garduList.length : 0;
              const jalurCount = s.jalurList ? s.jalurList.length : 0;
              const isCloud = !!s.isSynced;
              const isSyncingThis = syncingSingleId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isActive ? '#1e293b' : '#0d1526',
                    border: isActive ? '1.5px solid #0284c7' : '1px solid #1e293b',
                    boxShadow: isActive ? '0 0 14px rgba(2, 132, 199, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* ROW 1: SURVEY TITLE FULL WIDTH (SOLVES TEXT CUT-OFF ISSUE) */}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: isActive ? '#38bdf8' : '#f8fafc',
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                      marginBottom: '6px',
                    }}
                    title={s.namaSurvey}
                  >
                    {s.namaSurvey || 'Survey Tanpa Nama'}
                  </div>

                  {/* ROW 2: STATUS BADGES & QUICK ACTIONS */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '6px',
                    flexWrap: 'wrap',
                  }}>
                    {/* Left: Status & Type Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      {/* Cloud Sync Status Badge */}
                      <span
                        title={isCloud ? 'Data tersinkronisasi di database cloud Supabase' : 'Ada revisi atau data lokal yang belum di-upload ke Cloud Supabase'}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: isCloud ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.18)',
                          color: isCloud ? '#34d399' : '#fbbf24',
                          border: isCloud ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.45)',
                        }}
                      >
                        {isCloud ? '☁️ Cloud' : '🟡 Revisi Lokal'}
                      </span>

                      {/* Survey Type Badge */}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: s.jenisSurvey === 'SUTM' ? '#7f1d1d' : '#1e3a8a',
                        color: s.jenisSurvey === 'SUTM' ? '#fca5a5' : '#93c5fd',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {s.jenisSurvey}
                      </span>

                      {/* Feeder & GI Pill if available */}
                      {(s.namaFeeder || s.namaGarduInduk) && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            maxWidth: '130px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={`Feeder: ${s.namaFeeder || '-'}${s.namaGarduInduk ? ` (GI ${s.namaGarduInduk})` : ''}`}
                        >
                          ⚡ {s.namaFeeder || s.namaGarduInduk}
                        </span>
                      )}
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Quick Single Upload Button if not synced */}
                      {!isCloud && onSyncSingleSurvey && (
                        <button
                          type="button"
                          onClick={(e) => handleSingleSync(e, s)}
                          disabled={isSyncingThis}
                          title="Upload survey ini ke Supabase Cloud"
                          style={{
                            background: 'rgba(2, 132, 199, 0.15)',
                            border: '1px solid rgba(2, 132, 199, 0.3)',
                            color: '#38bdf8',
                            cursor: isSyncingThis ? 'not-allowed' : 'pointer',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {isSyncingThis ? (
                            <RefreshCw size={11} className="spin-animation" />
                          ) : (
                            <UploadCloud size={11} />
                          )}
                          <span>Sync</span>
                        </button>
                      )}

                      {/* Rekap Survey Button */}
                      {onShowSummary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowSummary(s);
                          }}
                          title={`Lihat Rekapitulasi Survey "${s.namaSurvey}"`}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          <BarChart2 size={11} />
                          <span>Rekap</span>
                        </button>
                      )}

                      {/* Edit Survey Button */}
                      {onEditSurvey && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSurvey(s);
                          }}
                          title={`Edit Informasi Survey "${s.namaSurvey}"`}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          <Edit3 size={11} />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteSurvey && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSurvey(s);
                          }}
                          title={`Hapus Survey "${s.namaSurvey}"`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '3px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = '#ef4444';
                            (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = '#64748b';
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ROW 3: SURVEYOR & REVISION META */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }} title={`Surveyor: ${s.surveyor}`}>
                      👤 {s.surveyor || 'PLN'}
                    </span>
                    {s.updatedBy && (
                      <span style={{ fontSize: '10px', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '42%' }} title={`Terakhir diedit oleh: ${s.updatedBy}`}>
                        ✍️ {s.updatedBy.includes('@') ? s.updatedBy.split('@')[0] : s.updatedBy}
                      </span>
                    )}
                  </div>

                  {/* ROW 4: LOCATION & DATE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                      📍 {s.lokasi || s.kecamatan || 'Lokasi tidak diset'}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      📅 {formatDate(s.updatedAt || s.createdAt)}
                    </span>
                  </div>

                  {/* ROW 5: ASSET STATISTICS */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <span title="Jumlah Tiang">🏷️ {tiangCount} Tiang</span>
                    <span title="Jumlah Gardu">⚡ {garduCount} Gardu</span>
                    <span title="Jumlah Jalur Kabel">〰️ {jalurCount} Jalur</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Session & Logout */}
      {userEmail && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '6px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={15} color="white" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Akun Surveyor</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar / Logout"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.12)';
              }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      )}

      {/* Footer Info with Tentang Aplikasi */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #1e293b', fontSize: '10.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>yantekpintar.my.id</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                opacity: 0.85,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
              title="Tentang Aplikasi MASIV"
            >
              ℹ️ Tentang
            </button>
          )}
          <span>MASIV Cloud</span>
        </div>
      </div>

      {/* Splitter Drag Handle for Resizing Sidebar (Desktop Only) */}
      {!isMobile && onStartResize && (
        <div
          className={`sidebar-resizer ${isResizing ? 'resizing' : ''}`}
          onMouseDown={onStartResize}
          title="Tarik ke samping untuk mengubah lebar sidebar"
        />
      )}
    </aside>
  );
};
