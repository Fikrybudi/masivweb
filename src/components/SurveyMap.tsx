import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, ScaleControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Coordinate, Survey, Tiang } from '../types';
import { OverlayFile } from '../types/overlayTypes';
import { calculateDistance, getNumericScaleString } from '../utils/geoUtils';

// Live Numeric Scale Indicator Badge (MASIV Mobile Standard)
function NumericScaleBadge() {
  const map = useMap();
  const [scaleText, setScaleText] = useState(() => getNumericScaleString(map.getZoom(), map.getCenter().lat));

  useEffect(() => {
    const updateScale = () => {
      const zoom = map.getZoom();
      const lat = map.getCenter().lat;
      setScaleText(getNumericScaleString(zoom, lat));
    };
    map.on('zoomend moveend', updateScale);
    return () => {
      map.off('zoomend moveend', updateScale);
    };
  }, [map]);

  return (
    <div
      className="map-numeric-scale-badge"
      style={{
        position: 'absolute',
        bottom: 36,
        right: 12,
        zIndex: 900,
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#38bdf8',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '11px' }}>📐</span>
      <span style={{ color: '#94a3b8', fontSize: '10px' }}>Skala:</span>
      <span style={{ color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.4px', fontWeight: 800 }}>{scaleText}</span>
    </div>
  );
}

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 8 Quadrants for Smart Label Placement: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
const QUADRANTS = [
  { angle: 90, offsetX: 0, offsetY: 1 },     // 0: N
  { angle: 45, offsetX: 1, offsetY: 1 },     // 1: NE
  { angle: 0, offsetX: 1, offsetY: 0 },      // 2: E
  { angle: -45, offsetX: 1, offsetY: -1 },   // 3: SE
  { angle: -90, offsetX: 0, offsetY: -1 },   // 4: S
  { angle: -135, offsetX: -1, offsetY: -1 }, // 5: SW
  { angle: 180, offsetX: -1, offsetY: 0 },   // 6: W
  { angle: 135, offsetX: -1, offsetY: 1 },   // 7: NW
];

const activeClickIcon = new L.DivIcon({
  className: 'custom-active-point',
  html: '<div style="background-color:#eab308;width:16px;height:16px;border-radius:50%;border:2.5px solid #0f172a;box-shadow:0 0 10px #eab308;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const OVERLAY_FEEDER_COLORS = [
  '#FF6600', '#CC00FF', '#009900', '#0066FF', '#FF0066', '#00CCCC',
  '#996633', '#FF3333', '#6600CC', '#339966', '#CC6600', '#3366FF'
];

export interface LayerVisibilityState {
  tiang: boolean;
  gardu: boolean;
  titikTiang: boolean;
  titikGardu: boolean;
  sutr: boolean;
  sutm: boolean;
  skutm: boolean;
  sktm: boolean;
}

interface SurveyMapProps {
  survey: Survey | null;
  selectedAsset?: any | null;
  onSelectAsset?: (asset: any, type: 'tiang' | 'gardu' | 'jalur') => void;
  onTiangClick?: (tiang: Tiang) => void;
  onTiangLabelShift?: (tiangId: string, newPosition: number, newDistance?: number) => void;
  movingTiang?: Tiang | null;
  onTiangMove?: (tiangId: string, newCoord: Coordinate) => void;
  mapType?: 'osm' | 'satellite' | 'google-sat' | 'google-hybrid';
  onToggleMapType?: () => void;
  mode?: string;
  onMapClick?: (coord: Coordinate) => void;
  tempLineCoords?: Coordinate[];
  underbuildTiangIds?: string[];
  layerVisibility?: LayerVisibilityState;
  overlayLayers?: OverlayFile[];
  onMapReady?: (map: L.Map) => void;
}

function MapReadyHandler({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapEventsHandler({
  onMapClick,
  onMouseMove,
}: {
  onMapClick?: (coord: Coordinate) => void;
  onMouseMove?: (coord: Coordinate) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
    mousemove: (e) => {
      if (onMouseMove) {
        onMouseMove({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  return null;
}


export const SurveyMap: React.FC<SurveyMapProps> = ({
  survey,
  selectedAsset,
  onSelectAsset,
  onTiangClick,
  onTiangLabelShift,
  movingTiang,
  onTiangMove,
  mapType = 'osm',
  onToggleMapType,
  mode = 'none',
  onMapClick,
  tempLineCoords = [],
  underbuildTiangIds = [],
  layerVisibility = {
    tiang: true,
    gardu: true,
    titikTiang: true,
    titikGardu: true,
    sutr: true,
    sutm: true,
    skutm: true,
    sktm: true,
  },
  overlayLayers = [],
  onMapReady,
}) => {
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  const [center, setCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    if (survey?.tiangList && survey.tiangList.length > 0) {
      const first = survey.tiangList.find(
        (t) => t?.koordinat && typeof t.koordinat.latitude === 'number' && typeof t.koordinat.longitude === 'number' && !isNaN(t.koordinat.latitude) && !isNaN(t.koordinat.longitude)
      );
      if (first?.koordinat) {
        setCenter([first.koordinat.latitude, first.koordinat.longitude]);
        return;
      }
    }
    if (survey?.garduList && survey.garduList.length > 0) {
      const first = survey.garduList.find(
        (g) => g?.koordinat && typeof g.koordinat.latitude === 'number' && typeof g.koordinat.longitude === 'number' && !isNaN(g.koordinat.latitude) && !isNaN(g.koordinat.longitude)
      );
      if (first?.koordinat) {
        setCenter([first.koordinat.latitude, first.koordinat.longitude]);
        return;
      }
    }
    if (survey?.jalurList && survey.jalurList.length > 0) {
      const first = survey.jalurList.find(
        (j) => Array.isArray(j?.koordinat) && j.koordinat.length > 0 && typeof j.koordinat[0]?.latitude === 'number' && !isNaN(j.koordinat[0]?.latitude)
      );
      if (first?.koordinat?.[0]) {
        setCenter([first.koordinat[0].latitude, first.koordinat[0].longitude]);
        return;
      }
    }
  }, [survey]);

  // Basemap tile configurations
  const TILE_CONFIGS: Record<string, { url: string; attribution: string; maxZoom?: number; maxNativeZoom?: number }> = {
    'osm': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 22,
      maxNativeZoom: 19,
    },
    'satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 22,
      maxNativeZoom: 18,
    },
    'google-sat': {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      maxZoom: 22,
      maxNativeZoom: 20,
    },
    'google-hybrid': {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      maxZoom: 22,
      maxNativeZoom: 20,
    },
  };

  const tileConfig = TILE_CONFIGS[mapType] || TILE_CONFIGS['osm'];
  const tileUrl = tileConfig.url;
  const attribution = tileConfig.attribution;

  const isSatellite = mapType !== 'osm';
  const leaderLineColor = isSatellite ? '#facc15' : '#334155';

  const [mouseCoord, setMouseCoord] = useState<Coordinate | null>(null);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Find last tiang in active survey
  const lastTiang = survey?.tiangList && survey.tiangList.length > 0
    ? survey.tiangList.filter((t) => t?.koordinat && typeof t.koordinat.latitude === 'number' && !isNaN(t.koordinat.latitude)).pop() || null
    : null;

  // Live distance from last tiang to cursor/center
  const liveDist = (mode === 'add-tiang' && lastTiang?.koordinat && mouseCoord && typeof mouseCoord.latitude === 'number')
    ? calculateDistance(lastTiang.koordinat, mouseCoord)
    : null;

  const isAddMode = mode === 'add-tiang' || mode === 'add-gardu' || mode === 'draw-jalur';
  const modeClass = isAddMode ? 'map-mode-add-tiang' : 'map-mode-default';

  return (
    <div
      className={modeClass}
      onMouseMove={(e) => {
        if (isAddMode) {
          const rect = e.currentTarget.getBoundingClientRect();
          setScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      onMouseLeave={() => setScreenPos(null)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 1. Unique Floating Target Cursor for Add Tiang */}
      {mode === 'add-tiang' && screenPos && (
        <div
          className="tiang-target-cursor"
          style={{ left: screenPos.x, top: screenPos.y }}
        >
          <div className="tiang-target-pin">
            <div className="tiang-target-pin-inner" />
          </div>
          <div className="tiang-target-dot" />
        </div>
      )}

      {/* 2. Unique Floating Target Cursor for Add Gardu (Orange Box + Lightning) */}
      {mode === 'add-gardu' && screenPos && (
        <div
          className="gardu-target-cursor"
          style={{ left: screenPos.x, top: screenPos.y }}
        >
          <div className="gardu-target-box">
            ⚡
          </div>
        </div>
      )}

      {/* 3. Unique Floating Target Cursor for Draw Jalur (Pen/Circle Crosshair) */}
      {mode === 'draw-jalur' && screenPos && (
        <div
          className="jalur-target-cursor"
          style={{ left: screenPos.x, top: screenPos.y }}
        >
          <div className="jalur-target-circle">
            <div className="jalur-target-center" />
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={17}
        minZoom={3}
        maxZoom={22}
        zoomSnap={0.1}
        zoomDelta={0.5}
        preferCanvas={true}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        <MapReadyHandler onMapReady={onMapReady} />
        <MapUpdater center={center} />
        <MapEventsHandler
          onMapClick={onMapClick}
          onMouseMove={(c) => {
            if (mode === 'add-tiang' || mode === 'draw-jalur' || mode === 'add-gardu') {
              setMouseCoord(c);
            }
          }}
        />
        <TileLayer
          url={tileUrl}
          attribution={attribution}
          maxZoom={22}
          maxNativeZoom={tileConfig.maxNativeZoom || 19}
        />

        {/* Map Scale Control (distance scale bar - metric only) */}
        <ScaleControl position="bottomright" metric={true} imperial={false} />
        <NumericScaleBadge />


        {/* Live Distance Estimation Line from Last Tiang to Cursor (Mobile MASIV Feature) */}
        {mode === 'add-tiang' && lastTiang && mouseCoord && (
          <>
            <Polyline
              positions={[
                [lastTiang.koordinat.latitude, lastTiang.koordinat.longitude],
                [mouseCoord.latitude, mouseCoord.longitude]
              ]}
              pathOptions={{ color: '#f97316', weight: 2.6, dashArray: '8, 8', opacity: 0.9 }}
              interactive={false}
            />
            {liveDist !== null && (
              <Marker
                position={[(lastTiang.koordinat.latitude + mouseCoord.latitude) / 2, (lastTiang.koordinat.longitude + mouseCoord.longitude) / 2]}
                icon={new L.DivIcon({
                  className: 'live-dist-icon',
                  html: `<div style="background:#f97316;color:white;font-weight:bold;font-size:11px;padding:3px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid white;">📏 ${liveDist >= 1000 ? (liveDist/1000).toFixed(2) + 'km' : Math.round(liveDist) + 'm'}</div>`,
                  iconSize: [80, 22],
                  iconAnchor: [40, 11]
                })}
                interactive={false}
              />
            )}
          </>
        )}

        {/* Temporary plotting draft for Jalur / Jembatan */}
        {tempLineCoords.length > 0 && (
          <>
            <Polyline
              positions={tempLineCoords.map((c) => [c.latitude, c.longitude])}
              pathOptions={{ color: '#eab308', weight: 3.5, dashArray: '6, 8' }}
            />
            {tempLineCoords.map((c, idx) => (
              <Marker
                key={`temp-${idx}`}
                position={[c.latitude, c.longitude]}
                icon={activeClickIcon}
              />
            ))}
          </>
        )}        {/* 1. JALUR KABEL (4 JENIS STANDAR PLN: SUTM, SKTM, SKUTM, SUTR) */}
        {survey?.jalurList?.map((j) => {
          if (!j || !j.koordinat || !Array.isArray(j.koordinat) || j.koordinat.length < 2) return null;

          const validCoords = j.koordinat.filter(
            (c) => c && typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude) && !isNaN(c.longitude)
          );
          if (validCoords.length < 2) return null;

          // Check layer visibility
          if (j.jenisJaringan === 'SUTM' && !layerVisibility.sutm) return null;
          if (j.jenisJaringan === 'SKTM' && !layerVisibility.sktm) return null;
          if (j.jenisJaringan === 'SKUTM' && !layerVisibility.skutm) return null;
          if (j.jenisJaringan === 'SUTR' && !layerVisibility.sutr) return null;

          // Calculate offset coordinates for SUTR to show side-by-side with SUTM (identical to mobile)
          const offsetMeters = j.jenisJaringan === 'SUTR' ? 0.000015 : 0;
          const positions: [number, number][] = validCoords.map((c, idx, arr) => {
            if (offsetMeters === 0 || arr.length < 2) {
              return [c.latitude, c.longitude];
            }
            let dx: number, dy: number;
            if (idx === 0) {
              dy = arr[1].latitude - c.latitude;
              dx = arr[1].longitude - c.longitude;
            } else {
              dy = c.latitude - arr[idx - 1].latitude;
              dx = c.longitude - arr[idx - 1].longitude;
            }
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return [c.latitude, c.longitude];
            return [c.latitude + (dx / len) * offsetMeters, c.longitude - (dy / len) * offsetMeters];
          });

          // 4 Standar Warna & Garis Jalur Kabel PLN
          let color = '#E91E63';
          let dashArray = '12, 4, 3, 4';
          let distBadgeColor = '#E91E63';

          if (j.jenisJaringan === 'SUTR') {
            color = '#00E676';
            dashArray = '';
            distBadgeColor = '#2E7D32';
          } else if (j.jenisJaringan === 'SKTM') {
            color = '#9C27B0';
            dashArray = '2, 4';
            distBadgeColor = '#7b1fa2';
          } else if (j.jenisJaringan === 'SKUTM') {
            color = '#00BCD4';
            dashArray = '10, 8';
            distBadgeColor = '#00838F';
          } else {
            color = '#E91E63';
            dashArray = '12, 4, 3, 4';
            distBadgeColor = '#c2185b';
          }

          // Calculate Segment Distances
          const segments: { midLat: number; midLng: number; distLabel: string }[] = [];
          for (let i = 0; i < validCoords.length - 1; i++) {
            const p1 = validCoords[i];
            const p2 = validCoords[i + 1];
            const dist = calculateDistance(p1, p2);
            const distLabel = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;
            segments.push({
              midLat: (p1.latitude + p2.latitude) / 2,
              midLng: (p1.longitude + p2.longitude) / 2,
              distLabel
            });
          }

          return (
            <React.Fragment key={j.id}>
              <Polyline
                positions={positions}
                pathOptions={{
                  color,
                  weight: 3.2,
                  dashArray,
                }}
                eventHandlers={{
                  click: () => onSelectAsset && onSelectAsset(j, 'jalur'),
                }}
              />

              {/* Per-segment live distance markers */}
              {segments.map((seg, sIdx) => {
                const distIcon = new L.DivIcon({
                  className: 'segment-distance-icon',
                  html: `<div class="segment-distance-badge" style="color:${distBadgeColor};border-color:${distBadgeColor};">${seg.distLabel}</div>`,
                  iconSize: [50, 18],
                  iconAnchor: [25, 9]
                });

                return (
                  <Marker
                    key={`seg-${j.id}-${sIdx}`}
                    position={[seg.midLat, seg.midLng]}
                    icon={distIcon}
                    interactive={false}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* 2. TIANG MARKERS, SMART LABELS, LEADER LINES, SKUR & GROUNDING */}
        {survey?.tiangList?.map((t, tiangIdx) => {
          if (
            !t ||
            !t.koordinat ||
            typeof t.koordinat.latitude !== 'number' ||
            typeof t.koordinat.longitude !== 'number' ||
            isNaN(t.koordinat.latitude) ||
            isNaN(t.koordinat.longitude)
          ) {
            return null;
          }

          const isSelected = selectedAsset && selectedAsset.id === t.id;
          const isExisting = t.status === 'existing';
          const isSUTR = t.jenisJaringan === 'SUTR';
          const isSKUTM = t.jenisJaringan === 'SKUTM';

          let dotColor = '#1565C0';
          let dotBorder = '#0D47A1';
          let badgeBorderColor = '#1565C0';
          let labelTextColor = '#1565C0';

          const isUnderbuildSelected = underbuildTiangIds.includes(t.id);

          if (isExisting) {
            dotColor = '#757575';
            dotBorder = '#424242';
            badgeBorderColor = '#757575';
            labelTextColor = '#616161';
          } else if (isSUTR) {
            dotColor = '#00E676';
            dotBorder = '#00A844';
            badgeBorderColor = '#4CAF50';
            labelTextColor = '#2E7D32';
          } else if (isSKUTM) {
            dotColor = '#00BCD4';
            dotBorder = '#00838F';
            badgeBorderColor = '#00BCD4';
            labelTextColor = '#00838F';
          }

          // If selected in Underbuild mode OR selectedAsset, highlight bright yellow (like mobile app)
          if (isSelected || isUnderbuildSelected) {
            dotColor = '#FFEB3B';
            dotBorder = '#FF9800';
            badgeBorderColor = '#FF9800';
            labelTextColor = '#E65100';
          }

          const primaryColor = badgeBorderColor;

          // Extract height & strength safely
          const tinggiNum = t.tinggiTiang ? String(t.tinggiTiang).replace(/[^0-9]/g, '') : '-';
          const kekuatanNum = t.kekuatanTiang ? String(t.kekuatanTiang).replace(/[^0-9]/g, '') : '-';
          const ukuranLabel = `${tinggiNum}/<br>${kekuatanNum}`;
          const konstruksiLabel = t.konstruksi || '-';
          const nomorLabel = t.kodeTiang || `T.${t.nomorUrut || tiangIdx + 1}`;

          // Smart Placement Quadrant (defaults alternating N/S if not set)
          const qIdx =
            typeof t.labelPosition === 'number' && !isNaN(t.labelPosition) && t.labelPosition >= 0 && t.labelPosition <= 7
              ? Math.floor(t.labelPosition)
              : tiangIdx % 2 === 0
              ? 0
              : 4;
          const quad = QUADRANTS[qIdx] || QUADRANTS[0];
          const offsetDeg =
            typeof t.labelDistance === 'number' && !isNaN(t.labelDistance) && t.labelDistance > 0
              ? t.labelDistance
              : 0.00028;
          const labelLat = t.koordinat.latitude + quad.offsetY * offsetDeg;
          const labelLng = t.koordinat.longitude + quad.offsetX * offsetDeg;

          // Smart Circular Badge Icon
          const badgeSize = isSelected ? 52 : 46;
          const badgeIcon = new L.DivIcon({
            className: 'tiang-icon',
            html: `
              <div class="tiang-label-badge" style="width:${badgeSize}px;height:${badgeSize}px;border:2px solid ${primaryColor};color:${labelTextColor};${isSelected ? 'box-shadow:0 0 12px #38bdf8;' : ''}">
                <div class="tiang-badge-top" style="border-color:${primaryColor};">
                  <div class="tiang-badge-code" style="border-color:${primaryColor};">${nomorLabel}</div>
                  <div class="tiang-badge-specs">${ukuranLabel}</div>
                </div>
                <div class="tiang-badge-bottom">${konstruksiLabel}</div>
              </div>
            `,
            iconSize: [badgeSize, badgeSize],
            iconAnchor: [badgeSize / 2, badgeSize / 2]
          });

          // Skur / Stayset Icon (Inverted Y ⅄ SVG)
          const skurIcon = new L.DivIcon({
            className: 'stayset-icon',
            html: `
              <div style="width:40px;height:40px;pointer-events:none;">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <g transform="rotate(0, 20, 20)">
                    <path d="M20,20 L20,8 L12,1 M20,8 L28,1" stroke="${primaryColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  </g>
                </svg>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          // Grounding Symbol (⏚ SVG)
          const groundingIcon = new L.DivIcon({
            className: 'grounding-icon',
            html: `
              <div style="width:32px;height:38px;pointer-events:none;">
                <svg width="32" height="38" viewBox="0 0 32 38">
                  <line x1="16" y1="14" x2="16" y2="26" stroke="${primaryColor}" stroke-width="2.2"/>
                  <line x1="7" y1="26" x2="25" y2="26" stroke="${primaryColor}" stroke-width="2.4" stroke-linecap="round"/>
                  <line x1="10" y1="30" x2="22" y2="30" stroke="${primaryColor}" stroke-width="2.4" stroke-linecap="round"/>
                  <line x1="13" y1="34" x2="19" y2="34" stroke="${primaryColor}" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
              </div>
            `,
            iconSize: [32, 38],
            iconAnchor: [16, 14]
          });

          // Pondasi Box Icon
          const pondasiIcon = new L.DivIcon({
            className: 'pondasi-icon',
            html: `<div style="width:20px;height:20px;border:2.4px solid ${primaryColor};background:transparent;border-radius:2px;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          return (
            <React.Fragment key={t.id}>
              {/* Leader Line (visible if tiang label is visible) */}
              {layerVisibility.tiang && (
                <Polyline
                  positions={[
                    [t.koordinat.latitude, t.koordinat.longitude],
                    [labelLat, labelLng]
                  ]}
                  pathOptions={{
                    color: leaderLineColor,
                    weight: 1.6,
                    dashArray: '3, 4',
                    opacity: 0.95
                  }}
                  interactive={false}
                />
              )}

              {/* Pondasi Box */}
              {t.penguat === 'Pondasi' && layerVisibility.titikTiang && (
                <Marker
                  position={[t.koordinat.latitude, t.koordinat.longitude]}
                  icon={pondasiIcon}
                  interactive={false}
                />
              )}

              {/* Stayset Skur */}
              {t.penguat === 'Stayset' && layerVisibility.titikTiang && (
                <Marker
                  position={[t.koordinat.latitude, t.koordinat.longitude]}
                  icon={skurIcon}
                  interactive={false}
                />
              )}

              {/* Grounding Symbol */}
              {t.grounding && layerVisibility.titikTiang && (
                <Marker
                  position={[t.koordinat.latitude, t.koordinat.longitude]}
                  icon={groundingIcon}
                  interactive={false}
                />
              )}

              {/* Exact Coordinate Dot Marker (Respect layerVisibility.titikTiang) */}
              {layerVisibility.titikTiang && (
                <CircleMarker
                  center={[t.koordinat.latitude, t.koordinat.longitude]}
                  radius={isSelected || isUnderbuildSelected ? 6.5 : 4.5}
                  pathOptions={{
                    fillColor: dotColor,
                    color: dotBorder,
                    weight: 2.2,
                    fillOpacity: 1
                  }}
                  eventHandlers={{
                    click: (e) => {
                      if (e.originalEvent) {
                        e.originalEvent.stopPropagation();
                        e.originalEvent.preventDefault();
                      }
                      if (onTiangClick) onTiangClick(t);
                      else if (onSelectAsset) onSelectAsset(t, 'tiang');
                    }
                  }}
                />
              )}

              {/* Active Move-Tiang Draggable Handle (Snap Connected Lines) */}
              {mode === 'move-tiang' && movingTiang?.id === t.id && (
                <Marker
                  position={[t.koordinat.latitude, t.koordinat.longitude]}
                  draggable={true}
                  zIndexOffset={3000}
                  icon={new L.DivIcon({
                    className: 'custom-moving-tiang-pin',
                    html: `
                      <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:grab;">
                        <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(234,179,8,0.35);box-shadow:0 0 16px rgba(234,179,8,0.7);animation:pulseScale 1.2s infinite ease-in-out;"></div>
                        <div style="width:20px;height:20px;border-radius:50%;background:#eab308;border:2.5px solid #ffffff;box-shadow:0 0 12px #eab308;display:flex;align-items:center;justify-content:center;color:#0f172a;font-weight:900;font-size:11px;">
                          📍
                        </div>
                      </div>
                    `,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                  })}
                  eventHandlers={{
                    dragend: (e) => {
                      const latlng = e.target.getLatLng();
                      if (onTiangMove) {
                        onTiangMove(t.id, {
                          latitude: latlng.lat,
                          longitude: latlng.lng,
                        });
                      }
                    },
                  }}
                />
              )}

              {/* Draggable Smart Circular Tiang Badge (Respect layerVisibility.tiang) */}
              {layerVisibility.tiang && (
                <Marker
                  position={[labelLat, labelLng]}
                  icon={badgeIcon}
                  draggable={true}
                  eventHandlers={{
                    click: (e) => {
                      if (e.originalEvent) {
                        e.originalEvent.stopPropagation();
                        e.originalEvent.preventDefault();
                      }
                      if (onTiangClick) onTiangClick(t);
                      else if (onSelectAsset) onSelectAsset(t, 'tiang');
                    },
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      const dy = pos.lat - t.koordinat.latitude;
                      const dx = pos.lng - t.koordinat.longitude;
                      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

                      const quadrantAngles = [90, 45, 0, -45, -90, -135, 180, 135];
                      let bestIdx = 0;
                      let minDiff = 360;
                      quadrantAngles.forEach((ang, idx) => {
                        let diff = Math.abs(ang - angleDeg);
                        if (diff > 180) diff = 360 - diff;
                        if (diff < minDiff) {
                          minDiff = diff;
                          bestIdx = idx;
                        }
                      });

                      const distDeg = Math.sqrt(dx * dx + dy * dy);
                      const actualOffset = Math.max(0.00015, distDeg);

                      if (onTiangLabelShift) {
                        onTiangLabelShift(t.id, bestIdx, actualOffset);
                      }
                    }
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* 3. GARDU MARKERS (Respect layerVisibility.titikGardu and layerVisibility.gardu) */}
        {survey?.garduList?.map((g) => {
          if (
            !g ||
            !g.koordinat ||
            typeof g.koordinat.latitude !== 'number' ||
            typeof g.koordinat.longitude !== 'number' ||
            isNaN(g.koordinat.latitude) ||
            isNaN(g.koordinat.longitude)
          ) {
            return null;
          }

          const garduBoxIcon = new L.DivIcon({
            className: 'gardu-baru-icon',
            html: `
              <div style="width:24px;height:24px;background:#f97316;border:2px solid #c2410c;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
                <span style="color:white;font-weight:900;font-size:11px;">⚡</span>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const garduLabelIcon = new L.DivIcon({
            className: 'gardu-label-icon',
            html: `<div class="gardu-label-badge">${g.nomorGardu || '-'}<br><span style="font-size:9px;color:#c2410c;">${g.kapasitasKVA || '-'} kVA</span></div>`,
            iconSize: [80, 26],
            iconAnchor: [-8, -6]
          });

          return (
            <React.Fragment key={g.id}>
              {layerVisibility.titikGardu && (
                <Marker
                  position={[g.koordinat.latitude, g.koordinat.longitude]}
                  icon={garduBoxIcon}
                  eventHandlers={{
                    click: () => onSelectAsset && onSelectAsset(g, 'gardu'),
                  }}
                >
                  <Popup>
                    <div style={{ padding: '4px', fontSize: '13px' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#c2410c' }}>
                        Gardu {g.nomorGardu || '-'} ({g.namaGardu || 'Gardu'})
                      </h4>
                      <p style={{ margin: '2px 0' }}>
                        <b>Tipe:</b> {g.jenisGardu || '-'} - {g.kapasitasKVA || '-'} kVA
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '11px', color: '#666' }}>
                        Lat: {g.koordinat.latitude.toFixed(6)}, Lng: {g.koordinat.longitude.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {layerVisibility.gardu && (
                <Marker
                  position={[g.koordinat.latitude, g.koordinat.longitude]}
                  icon={garduLabelIcon}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}


        {/* 4. PERSIL PELANGGAN RECTANGLES (Standard MASIV PLN) */}
        {survey?.persilList?.map((p) => {
          if (
            !p ||
            !p.koordinatSudut ||
            !Array.isArray(p.koordinatSudut) ||
            p.koordinatSudut.length < 2 ||
            !p.koordinatSudut[0] ||
            !p.koordinatSudut[1]
          ) {
            return null;
          }

          const sw = p.koordinatSudut[0];
          const ne = p.koordinatSudut[1];
          if (
            typeof sw.latitude !== 'number' ||
            typeof sw.longitude !== 'number' ||
            typeof ne.latitude !== 'number' ||
            typeof ne.longitude !== 'number' ||
            isNaN(sw.latitude) ||
            isNaN(sw.longitude) ||
            isNaN(ne.latitude) ||
            isNaN(ne.longitude)
          ) {
            return null;
          }

          const bounds: [[number, number], [number, number]] = [
            [Math.min(sw.latitude, ne.latitude), Math.min(sw.longitude, ne.longitude)],
            [Math.max(sw.latitude, ne.latitude), Math.max(sw.longitude, ne.longitude)]
          ];
          const midLat = (sw.latitude + ne.latitude) / 2;
          const midLng = (sw.longitude + ne.longitude) / 2;
          const minLat = Math.min(sw.latitude, ne.latitude);
          const color = p.warnaBorder || '#E91E63';
          const coordStr = `${midLat.toFixed(6)}, ${midLng.toFixed(6)}`;

          const persilNameIcon = new L.DivIcon({
            className: 'persil-label',
            html: `<div style="color:${color};font-size:11px;font-weight:bold;white-space:nowrap;text-align:center;text-shadow:1px 1px 2px white,-1px -1px 2px white,1px -1px 2px white,-1px 1px 2px white,0 0 3px white;pointer-events:none;">${p.namaPersil || 'Persil'}</div>`,
            iconSize: [120, 20],
            iconAnchor: [60, 10]
          });

          const persilCoordIcon = new L.DivIcon({
            className: 'persil-coord-label',
            html: `<div style="color:#222;font-size:8px;font-weight:bold;white-space:nowrap;text-align:center;background:rgba(255,255,255,0.92);padding:1px 5px;border-radius:4px;border:0.8px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,0.2);pointer-events:none;display:inline-block;">${coordStr}</div>`,
            iconSize: [140, 18],
            iconAnchor: [70, -3]
          });

          return (
            <React.Fragment key={p.id}>
              {/* @ts-ignore - React-Leaflet Rectangle */}
              <Polyline
                positions={[
                  [bounds[0][0], bounds[0][1]],
                  [bounds[0][0], bounds[1][1]],
                  [bounds[1][0], bounds[1][1]],
                  [bounds[1][0], bounds[0][1]],
                  [bounds[0][0], bounds[0][1]],
                ]}
                pathOptions={{
                  color,
                  weight: 2.2,
                  fillColor: color,
                  fillOpacity: 0.15,
                }}
              />
              <Marker
                position={[midLat, midLng]}
                icon={persilNameIcon}
                interactive={false}
              />
              <Marker
                position={[minLat, midLng]}
                icon={persilCoordIcon}
                interactive={false}
              />
            </React.Fragment>
          );
        })}

        {/* 5. DATA JARINGAN EKSISTING OVERLAYS (JTM / GARDU / PROTEKSI / OBSERVASI) */}
        {overlayLayers.filter((ol) => ol.visible).map((ol) => {
          const opacity = ol.opacity ?? 0.7;
          const uniqueFeeders = Array.from(new Set(ol.data.polylines.map((pl) => pl.name || 'Unknown')));

          return (
            <React.Fragment key={ol.id}>
              {/* --- POLYLINES (JTM Feeders) --- */}
              {ol.data.polylines.map((pl, plIdx) => {
                if (ol.hiddenFeeders && ol.hiddenFeeders.includes(pl.name)) return null;
                const feederIdx = uniqueFeeders.indexOf(pl.name || 'Unknown');
                const color = ol.color || OVERLAY_FEEDER_COLORS[feederIdx % OVERLAY_FEEDER_COLORS.length];
                const positions: [number, number][] = pl.coords.map((c) => [c.lat, c.lng]);

                return (
                  <Polyline
                    key={`ovl-pl-${ol.id}-${plIdx}`}
                    positions={positions}
                    pathOptions={{
                      color,
                      weight: 2.6,
                      opacity,
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '4px', fontSize: '13px' }}>
                        <b style={{ color, fontSize: '14px' }}>{pl.name || 'JTM Eksisting'}</b>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          <i>Layer: {ol.name}</i>
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}

              {/* --- POINTS (Gardu / Proteksi / Observasi / Custom) --- */}
              {ol.data.points.map((pt, ptIdx) => {
                const lowerName = pt.name.toLowerCase();
                const isObservation =
                  lowerName.includes('pohon') ||
                  lowerName.includes('mangga') ||
                  lowerName.includes('bambu') ||
                  lowerName.includes('kelapa') ||
                  lowerName.includes('tebang') ||
                  lowerName.includes('row') ||
                  lowerName.includes('areuy') ||
                  lowerName.includes('pepohonan') ||
                  lowerName.includes('rambat') ||
                  lowerName.includes('jambu');

                const effectivePointType =
                  (ol.type === 'jtm' || ol.type === 'custom') && ol.data.polylines.length > 0
                    ? 'gardu'
                    : ol.type;

                const isGarduPoint =
                  (effectivePointType === 'gardu' || ol.type === 'gardu') &&
                  !isObservation &&
                  (pt.properties['CLASSIFICATION']?.includes('GD') ||
                    pt.properties['TYPE_GARDU'] === 'GD' ||
                    pt.name.match(/^[A-Za-z]{2,4}\d{3}[A-Za-z]?$/));

                const isProteksiPoint =
                  ol.type === 'proteksi' ||
                  /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.name) ||
                  /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.properties['JENIS'] || pt.properties['jenis'] || '') ||
                  /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(pt.properties['TYPE'] || pt.properties['type'] || '');

                const ptFeeder =
                  pt.properties['feeder'] ||
                  pt.properties['FEEDER'] ||
                  pt.properties['PENYULANG'] ||
                  pt.properties['penyulang'] ||
                  '';

                // Check hidden states
                if (ptFeeder && ol.hiddenFeeders && ol.hiddenFeeders.includes(ptFeeder)) return null;
                if (isGarduPoint) {
                  if (ol.hiddenTypes && (ol.hiddenTypes.includes('gardu') || (ptFeeder && ol.hiddenTypes.includes('gardu_' + ptFeeder)))) return null;
                }
                if (isProteksiPoint) {
                  if (ol.hiddenTypes && (ol.hiddenTypes.includes('proteksi') || (ptFeeder && ol.hiddenTypes.includes('proteksi_' + ptFeeder)))) return null;
                }
                if (!isGarduPoint && !isProteksiPoint && !isObservation) {
                  if (ol.hiddenTypes && (ol.hiddenTypes.includes('custom') || (ptFeeder && ol.hiddenTypes.includes('custom_' + ptFeeder)))) return null;
                }

                if (isObservation) {
                  return (
                    <CircleMarker
                      key={`ovl-obs-${ol.id}-${ptIdx}`}
                      center={[pt.lat, pt.lng]}
                      radius={4}
                      pathOptions={{
                        fillColor: '#4CAF50',
                        color: 'white',
                        weight: 1.5,
                        fillOpacity: opacity,
                        opacity,
                      }}
                    >
                      <Popup>
                        <div style={{ padding: '4px', fontSize: '13px' }}>
                          <b>{pt.name}</b>
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}><i>Observasi Pohon / ROW</i></div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }

                if (isGarduPoint) {
                  const desc = pt.properties['DESCRIPTION'] || pt.properties['ex_description'];
                  const alamat = pt.properties['ALAMAT'] || pt.properties['alamat'];
                  const jenisPel = pt.properties['JENIS_PEL'];

                  const garduMarkerIcon = new L.DivIcon({
                    className: `overlay-gardu overlay-${ol.id}`,
                    html: `<div style="width:14px;height:14px;background:#4285F4;border:2px solid white;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.4);opacity:${opacity}"></div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                  });

                  const garduLabelIcon = new L.DivIcon({
                    className: `overlay-gardu-label overlay-${ol.id}`,
                    html: `<div style="color:#1a73e8;font-size:9.5px;font-weight:bold;white-space:nowrap;text-shadow:1px 1px 1px white,-1px -1px 1px white,1px -1px 1px white,-1px 1px 1px white,0 0 3px white;opacity:${opacity}">${pt.name}</div>`,
                    iconSize: [80, 16],
                    iconAnchor: [-10, 5],
                  });

                  return (
                    <React.Fragment key={`ovl-gd-${ol.id}-${ptIdx}`}>
                      <Marker position={[pt.lat, pt.lng]} icon={garduMarkerIcon}>
                        <Popup>
                          <div style={{ padding: '4px', fontSize: '13px' }}>
                            <b style={{ color: '#1a73e8', fontSize: '14px' }}>{pt.name}</b>
                            {desc && <div style={{ fontSize: '12px', marginTop: '2px' }}><b>Kode:</b> {desc}</div>}
                            {jenisPel && <div style={{ fontSize: '12px' }}><b>Jenis:</b> {jenisPel}</div>}
                            {alamat && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{alamat}</div>}
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}><i>Layer: {ol.name}</i></div>
                          </div>
                        </Popup>
                      </Marker>
                      <Marker position={[pt.lat, pt.lng]} icon={garduLabelIcon} interactive={false} />
                    </React.Fragment>
                  );
                }

                if (isProteksiPoint) {
                  let jenis = (pt.properties['JENIS'] || pt.properties['jenis'] || '').toUpperCase();
                  if (!jenis) {
                    const nu = pt.name.toUpperCase();
                    if (nu.includes('GH')) jenis = 'GH';
                    else if (nu.includes('LBS')) jenis = 'LBS';
                    else if (nu.includes('PMR') || nu.includes('RECLOSER')) jenis = 'PMR';
                    else if (nu.includes('SSO')) jenis = 'SSO';
                  }

                  let markerColor = '#FF6600';
                  if (jenis === 'GH') markerColor = '#D32F2F';
                  else if (jenis === 'LBS') markerColor = '#E65100';
                  else if (jenis === 'PMR') markerColor = '#C2185B';
                  else if (jenis === 'SSO') markerColor = '#F57C00';

                  const ulp = pt.properties['ULP'] || pt.properties['ulp'];
                  const pnl1 = pt.properties['PNL1'] || pt.properties['pnl1'];
                  const labelText = jenis && !pt.name.toUpperCase().startsWith(jenis) ? `[${jenis}] ${pt.name}` : pt.name;

                  const proteksiMarkerIcon = new L.DivIcon({
                    className: `overlay-proteksi overlay-${ol.id}`,
                    html: `<div style="width:16px;height:16px;background:${markerColor};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);opacity:${opacity}"></div>`,
                    iconSize: [21, 21],
                    iconAnchor: [10, 10],
                  });

                  const proteksiLabelIcon = new L.DivIcon({
                    className: `overlay-proteksi-label overlay-${ol.id}`,
                    html: `<div style="color:${markerColor};font-size:10px;font-weight:bold;white-space:nowrap;text-shadow:1px 1px 2px white,-1px -1px 2px white,1px -1px 2px white,-1px 1px 2px white,0 0 3px white;opacity:${opacity}">${labelText}</div>`,
                    iconSize: [100, 16],
                    iconAnchor: [-12, 6],
                  });

                  return (
                    <React.Fragment key={`ovl-pr-${ol.id}-${ptIdx}`}>
                      <Marker position={[pt.lat, pt.lng]} icon={proteksiMarkerIcon}>
                        <Popup>
                          <div style={{ padding: '4px', fontSize: '13px' }}>
                            <b style={{ color: markerColor, fontSize: '14px' }}>{pt.name}</b>
                            {jenis && <div style={{ fontSize: '12px', marginTop: '2px' }}><b>Jenis:</b> {jenis}</div>}
                            {ulp && <div style={{ fontSize: '12px' }}><b>ULP:</b> {ulp}</div>}
                            {pnl1 && <div style={{ fontSize: '12px' }}><b>PNL:</b> {pnl1}</div>}
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}><i>Layer: {ol.name}</i></div>
                          </div>
                        </Popup>
                      </Marker>
                      <Marker position={[pt.lat, pt.lng]} icon={proteksiLabelIcon} interactive={false} />
                    </React.Fragment>
                  );
                }

                // Default Custom Point
                return (
                  <CircleMarker
                    key={`ovl-cst-${ol.id}-${ptIdx}`}
                    center={[pt.lat, pt.lng]}
                    radius={5}
                    pathOptions={{
                      fillColor: '#607D8B',
                      color: 'white',
                      weight: 2,
                      fillOpacity: opacity,
                      opacity,
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '4px', fontSize: '13px' }}>
                        <b>{pt.name}</b>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}><i>Layer: {ol.name}</i></div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Map Type Switcher (Top-Right, below header) */}
      {onToggleMapType && (
        <button
          className="map-type-floating-btn"
          onClick={onToggleMapType}
          title="Ganti Mode Peta (OSM / Satelit / Google)"
        >
          {mapType === 'osm' ? '🗺️' : mapType === 'satellite' ? '🛰️' : mapType === 'google-sat' ? '🌍' : '🌐'}
          <span>{mapType === 'osm' ? 'OSM' : mapType === 'satellite' ? 'Esri' : mapType === 'google-sat' ? 'Google' : 'Hybrid'}</span>
        </button>
      )}


      {/* GIS Map Legend (Clean standard matching mobile app) */}
      <div className="gis-legend">
        <div className="gis-legend-title">📌 Legenda Peta PLN</div>
        <div className="gis-legend-item">
          <svg width="24" height="6" style={{ marginRight: 8 }}><line x1="0" y1="3" x2="24" y2="3" stroke="#E91E63" strokeWidth="3" strokeDasharray="8,2,2,2" /></svg>
          <span>SUTM</span>
        </div>
        <div className="gis-legend-item">
          <svg width="24" height="6" style={{ marginRight: 8 }}><line x1="0" y1="3" x2="24" y2="3" stroke="#9C27B0" strokeWidth="3" strokeDasharray="2,3" /></svg>
          <span>SKTM</span>
        </div>
        <div className="gis-legend-item">
          <svg width="24" height="6" style={{ marginRight: 8 }}><line x1="0" y1="3" x2="24" y2="3" stroke="#00BCD4" strokeWidth="3" strokeDasharray="6,3" /></svg>
          <span>SKUTM</span>
        </div>
        <div className="gis-legend-item">
          <svg width="24" height="6" style={{ marginRight: 8 }}><line x1="0" y1="3" x2="24" y2="3" stroke="#00E676" strokeWidth="3" /></svg>
          <span>SUTR</span>
        </div>
        <div className="gis-legend-item">
          <svg width="18" height="12" style={{ marginRight: 8 }}><circle cx="9" cy="6" r="4.5" fill="#1565C0" stroke="#0D47A1" strokeWidth="1.5" /></svg>
          <span>Tiang Baru TM</span>
        </div>
        <div className="gis-legend-item">
          <svg width="18" height="12" style={{ marginRight: 8 }}><circle cx="9" cy="6" r="4.5" fill="#00E676" stroke="#00A844" strokeWidth="1.5" /></svg>
          <span>Tiang Baru TR</span>
        </div>
        <div className="gis-legend-item">
          <svg width="18" height="12" style={{ marginRight: 8 }}><circle cx="9" cy="6" r="4.5" fill="#757575" stroke="#424242" strokeWidth="1.5" /></svg>
          <span>Tiang Existing</span>
        </div>
        <div className="gis-legend-item">
          <svg width="18" height="14" style={{ marginRight: 8 }}>
            <rect x="2" y="1" width="13" height="12" rx="2" fill="#FF9800" stroke="#E65100" strokeWidth="1.2" />
            <polygon points="8.5,2.5 5.5,6.5 8,6.5 5,9.5 10.5,5 8,5" fill="#D32F2F" />
          </svg>
          <span>Gardu Distribusi</span>
        </div>

        {/* Dynamic Legend items for Overlays (Matching mobile app) */}
        {overlayLayers.some((o) => o.visible && (o.type === 'jtm' || o.data?.polylines?.length > 0)) && (
          <div className="gis-legend-item">
            <svg width="24" height="6" style={{ marginRight: 8 }}>
              <line x1="0" y1="3" x2="24" y2="3" stroke="#FF6600" strokeWidth="3" />
            </svg>
            <span>JTM Eksisting</span>
          </div>
        )}
        {overlayLayers.some(
          (o) =>
            o.visible &&
            (o.type === 'proteksi' ||
              o.data?.points?.some(
                (p) =>
                  /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(p.name) ||
                  /lbs|gh|pmr|sso|recloser|fuse|cutout|fco|proteksi/i.test(p.properties['JENIS'] || '')
              ))
        ) && (
          <div className="gis-legend-item">
            <svg width="18" height="12" style={{ marginRight: 8 }}>
              <circle cx="9" cy="6" r="4.5" fill="#E65100" stroke="white" strokeWidth="1.5" />
            </svg>
            <span>Proteksi Eksisting</span>
          </div>
        )}
      </div>


    </div>
  );
};


