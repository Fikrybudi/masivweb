// =============================================================================
// PLN SURVEY WEB - Superadmin Notification Service
// Realtime Push Notifications, Offline Catch-Up & Web Push API
// =============================================================================

import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SuperadminNotification {
  id: string;
  type: 'INSERT' | 'UPDATE';
  surveyId: string;
  namaSurvey: string;
  jenisSurvey: string;
  surveyor: string;
  lokasi?: string;
  updatedBy?: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'masiv_superadmin_notifications_v1';
const LAST_SEEN_KEY = 'masiv_superadmin_last_seen_timestamp';

export const notificationService = {
  /**
   * Request browser Notification permission
   */
  async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch (err) {
        console.warn('Failed to request browser notification permission:', err);
        return false;
      }
    }
    return false;
  },

  /**
   * Trigger native browser OS notification (works when tab is in background)
   */
  showBrowserPushNotification(title: string, body: string, onClick?: () => void) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'masiv-survey-alert',
        silent: false,
      });

      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
    } catch (err) {
      console.warn('Could not fire native browser notification:', err);
    }
  },

  /**
   * Pleasant audio chime using Web Audio API (zero external assets needed)
   */
  playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Tone 1: High crisp bell (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Harmonic pleasant ping (1318.5Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // Audio autoplay may be prevented before user interaction
    }
  },

  /**
   * Get cached notifications from localStorage
   */
  getLocalNotifications(): SuperadminNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Save notifications to localStorage
   */
  saveLocalNotifications(notifications: SuperadminNotification[]) {
    try {
      // Keep at most last 50 notifications
      const trimmed = notifications.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  },

  /**
   * Append a new notification and save
   */
  addNotification(notif: SuperadminNotification): SuperadminNotification[] {
    const list = this.getLocalNotifications();
    // Avoid duplicate IDs
    const filtered = list.filter((n) => n.id !== notif.id);
    const updated = [notif, ...filtered];
    this.saveLocalNotifications(updated);
    return updated;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): SuperadminNotification[] {
    const list = this.getLocalNotifications().map((n) => ({ ...n, read: true }));
    this.saveLocalNotifications(list);
    return list;
  },

  /**
   * Clear all notification history
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  /**
   * Get timestamp when superadmin last checked/opened notifications
   */
  getLastSeenTimestamp(): string | null {
    try {
      return localStorage.getItem(LAST_SEEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Update last seen timestamp
   */
  setLastSeenTimestamp(isoTime: string = new Date().toISOString()) {
    try {
      localStorage.setItem(LAST_SEEN_KEY, isoTime);
    } catch {}
  },

  /**
   * Catch-up query: Fetch all surveys created or updated in cloud since last visit
   */
  async checkCatchupSurveys(currentUserId: string): Promise<SuperadminNotification[]> {
    try {
      const lastSeen = this.getLastSeenTimestamp();
      let query = supabase
        .from('surveys')
        .select('id, user_id, nama_survey, jenis_survey, surveyor, lokasi, updated_by, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (lastSeen) {
        query = query.gt('updated_at', lastSeen);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      const catchupList: SuperadminNotification[] = [];
      for (const row of data) {
        // Skip changes made by the superadmin themselves
        if (row.updated_by === currentUserId || (row.user_id === currentUserId && !row.updated_by)) {
          continue;
        }

        const isInsert = row.created_at === row.updated_at;
        catchupList.push({
          id: `catchup-${row.id}-${row.updated_at}`,
          type: isInsert ? 'INSERT' : 'UPDATE',
          surveyId: row.id,
          namaSurvey: row.nama_survey || 'Survey Tanpa Nama',
          jenisSurvey: row.jenis_survey || 'SUTM',
          surveyor: row.surveyor || 'Surveyor',
          lokasi: row.lokasi || '',
          updatedBy: row.updated_by || row.surveyor,
          timestamp: row.updated_at || row.created_at || new Date().toISOString(),
          read: false,
        });
      }

      return catchupList;
    } catch (err) {
      console.warn('Error during catch-up survey check:', err);
      return [];
    }
  },

  /**
   * Subscribe to Supabase Realtime channel for survey table changes
   */
  subscribeToSuperadminNotifications(
    currentUserId: string,
    onReceive: (notification: SuperadminNotification) => void
  ): () => void {
    const channelName = `superadmin-surveys-${Date.now()}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
        },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow || !newRow.id) return;

          // Don't notify the superadmin of their own immediate actions
          if (newRow.updated_by === currentUserId) return;

          const eventType = payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE';
          const notification: SuperadminNotification = {
            id: `rt-${newRow.id}-${Date.now()}`,
            type: eventType,
            surveyId: newRow.id,
            namaSurvey: newRow.nama_survey || 'Survey Tanpa Nama',
            jenisSurvey: newRow.jenis_survey || 'SUTM',
            surveyor: newRow.surveyor || 'Surveyor',
            lokasi: newRow.lokasi || '',
            updatedBy: newRow.updated_by || newRow.surveyor,
            timestamp: newRow.updated_at || newRow.created_at || new Date().toISOString(),
            read: false,
          };

          this.addNotification(notification);
          this.playNotificationChime();

          const title = eventType === 'INSERT' ? '🔔 Survey Baru Masuk ke Cloud' : '✏️ Survey Diperbarui di Cloud';
          const body = `${notification.namaSurvey} (${notification.jenisSurvey}) oleh ${notification.surveyor}`;
          this.showBrowserPushNotification(title, body);

          onReceive(notification);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Superadmin Realtime Survey Notifications active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
