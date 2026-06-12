import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

export interface SiteSettings {
  site_name:               string;
  site_tagline:            string;
  site_email:              string;
  site_phone:              string;
  site_phone_2:            string;
  site_address:            string;
  site_city:               string;
  site_country:            string;
  site_hours:              string;
  logo_url:                string;
  promo_bar_text:          string;
  interac_email:           string;
  site_email_2:            string;
  facebook_url:            string;
  instagram_url:           string;
  twitter_url:             string;
  youtube_url:             string;
  meta_description:        string;
  meta_keywords:           string;
  free_shipping_threshold: number;
  free_shipping_enabled:   boolean;
}

const DEFAULTS: SiteSettings = {
  site_name:        'ATN Book & Crafts',
  site_tagline:     "North America's largest Bengali bookstore & crafts shop — serving Toronto's Bangla Town for over 20 years.",
  site_email:       'info@atnmegastore.ca',
  site_phone:       '416-671-6382',
  site_phone_2:     '416-686-3134',
  site_address:     '2972 Danforth Avenue',
  site_city:        'Toronto, ON  M4C 1M6',
  site_country:     'Canada',
  site_hours:       'Mon – Sun · 2:00 PM – 8:00 PM',
  logo_url:         '/logo.svg',
  promo_bar_text:   'Free shipping on orders over $49 · Call us: 416-671-6382 · Open 7 days · 2 PM – 8 PM',
  interac_email:    'info@atnmegastore.ca',
  site_email_2:     'atnmegastore@gmail.com',
  facebook_url:     '',
  instagram_url:    '',
  twitter_url:      '',
  youtube_url:      '',
  meta_description:        "Toronto's destination for Bengali books, Islamic literature, cultural crafts, and unique gifts.",
  meta_keywords:           'Bengali books Toronto, Islamic books Canada, cultural gifts, ATN Book & Crafts',
  free_shipping_threshold: 49,
  free_shipping_enabled:   true,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface SiteSettingsStore {
  settings:   SiteSettings;
  loaded:     boolean;
  loadedAt:   number;
  fetch:      () => Promise<void>;
}

export const useSiteSettingsStore = create<SiteSettingsStore>()(
  persist(
    (set, get) => ({
      settings:  { ...DEFAULTS },
      loaded:    false,
      loadedAt:  0,

      fetch: async () => {
        const { loaded, loadedAt } = get();
        // Skip fetch if settings were loaded within the last 5 minutes
        if (loaded && Date.now() - loadedAt < CACHE_TTL_MS) return;
        try {
          const { data } = await api.get('/site-settings');
          set({
            settings: {
              ...DEFAULTS,
              ...data,
              free_shipping_threshold: Number(data.free_shipping_threshold ?? DEFAULTS.free_shipping_threshold),
              free_shipping_enabled:   data.free_shipping_enabled === true || data.free_shipping_enabled === 'true',
            },
            loaded: true,
            loadedAt: Date.now(),
          });
        } catch {
          set({ loaded: true, loadedAt: Date.now() });
        }
      },
    }),
    {
      name:    'site-settings',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
