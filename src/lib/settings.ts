const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';

const DEFAULTS: Record<string, string> = {
  site_name:      'ATN Book & Crafts',
  site_email:     'info@atnmegastore.ca',
  site_phone:     '416-671-6382',
  site_phone_2:   '416-686-3134',
  site_address:   '2972 Danforth Avenue',
  site_city:      'Toronto, ON  M4C 1M6',
  site_country:   'Canada',
  site_hours:     'Mon – Sun · 2:00 PM – 8:00 PM',
  interac_email:  'info@atnmegastore.ca',
  site_email_2:   'atnmegastore@gmail.com',
};

/** Fetch site settings server-side with 5-minute cache. Falls back to defaults. */
export async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API}/site-settings`, { next: { revalidate: 300 } });
    if (!res.ok) return { ...DEFAULTS };
    const data = await res.json();
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}
