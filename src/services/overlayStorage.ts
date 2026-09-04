// =============================================================================
// PLN SURVEY WEB - Overlay Storage Service (IndexedDB Based)
// =============================================================================
// Persists imported overlay layers to IndexedDB via idb-keyval.
// =============================================================================

import { get, set } from 'idb-keyval';
import { OverlayFile } from '../types/overlayTypes';

const STORAGE_KEY = 'pln_overlay_files';

export const overlayStorage = {
  async getAllOverlays(): Promise<OverlayFile[]> {
    try {
      const data = await get<OverlayFile[]>(STORAGE_KEY);
      return data || [];
    } catch (e) {
      console.error('Error loading overlays:', e);
      return [];
    }
  },

  async saveOverlay(overlay: OverlayFile): Promise<void> {
    const all = await this.getAllOverlays();
    const idx = all.findIndex((o) => o.id === overlay.id);
    if (idx >= 0) {
      all[idx] = overlay;
    } else {
      all.push(overlay);
    }
    await set(STORAGE_KEY, all);
  },

  async updateVisibility(id: string, visible: boolean): Promise<void> {
    const all = await this.getAllOverlays();
    const idx = all.findIndex((o) => o.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], visible };
      await set(STORAGE_KEY, all);
    }
  },

  async updateOpacity(id: string, opacity: number): Promise<void> {
    const all = await this.getAllOverlays();
    const idx = all.findIndex((o) => o.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], opacity };
      await set(STORAGE_KEY, all);
    }
  },

  async updateOverlay(updated: OverlayFile): Promise<void> {
    const all = await this.getAllOverlays();
    const idx = all.findIndex((o) => o.id === updated.id);
    if (idx >= 0) {
      all[idx] = updated;
      await set(STORAGE_KEY, all);
    }
  },

  async deleteOverlay(id: string): Promise<void> {
    const all = await this.getAllOverlays();
    const filtered = all.filter((o) => o.id !== id);
    await set(STORAGE_KEY, filtered);
  },
};
