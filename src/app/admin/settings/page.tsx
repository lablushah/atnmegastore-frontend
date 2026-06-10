'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRef } from 'react';
import {
  Save, Globe, Phone, Search, Share2, Wrench,
  CreditCard, Store, ImageIcon, Eye, EyeOff,
  Upload, X, Loader2,
} from 'lucide-react';

interface Setting {
  id:          number;
  key:         string;
  value:       string | null;
  label:       string | null;
  description: string | null;
  type:        string | null;
  group:       string | null;
  sort_order:  number;
}

const TABS = [
  { id: 'general',     label: 'General',     icon: Globe,       description: 'Site name, tagline, and logo' },
  { id: 'contact',     label: 'Contact',     icon: Phone,       description: 'Email, phone, address, hours' },
  { id: 'seo',         label: 'SEO',         icon: Search,      description: 'Meta description and keywords' },
  { id: 'social',      label: 'Social Media',icon: Share2,      description: 'Links to social profiles' },
  { id: 'social_api',  label: 'Social API',  icon: Share2,      description: 'API credentials for social posting (Facebook, Instagram, X/Twitter)' },
  { id: 'store',       label: 'Store',       icon: Store,       description: 'Promo bar and storefront text' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench,      description: 'Maintenance mode settings' },
  { id: 'payments',    label: 'Payments',    icon: CreditCard,  description: 'Payment method toggles' },
];

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [values,   setValues]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/site-settings');
      setSettings(data);
      const v: Record<string, string> = {};
      (data as Setting[]).forEach(s => { v[s.key] = s.value ?? ''; });
      setValues(v);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { settings: Object.entries(values).map(([key, value]) => ({ key, value })) };
      await api.put('/admin/site-settings', payload);
      toast.success('Settings saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const tabSettings = settings.filter(s => (s.group ?? 'general') === activeTab);
  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Site Settings
          </h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">{settings.length} settings across {TABS.length} groups</p>
        </div>
        <button
          form="settings-form"
          type="submit"
          disabled={saving || loading}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-5 py-2.5 text-sm font-medium transition-colors shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 mb-8 rounded-lg">
        {TABS.map(tab => {
          const count = settings.filter(s => (s.group ?? 'general') === tab.id).length;
          if (count === 0) return null;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center sm:flex-initial ${
                isActive
                  ? 'bg-white text-[#213885] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-[#f0e0e6] text-[#213885]' : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab header */}
      {!loading && activeTabMeta && (
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#f9f0f3] rounded-lg">
            <activeTabMeta.icon className="w-5 h-5 text-[#213885]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a]">{activeTabMeta.label}</h2>
            <p className="text-xs text-[#6b6b6b]">{activeTabMeta.description}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse h-20 rounded" />
          ))}
        </div>
      ) : (
        <form id="settings-form" onSubmit={handleSave}>
          <div className="space-y-4">
            {tabSettings.length === 0 ? (
              <p className="text-[#6b6b6b] text-sm">No settings in this group.</p>
            ) : (
              tabSettings.map(s => (
                <SettingField
                  key={s.key}
                  setting={s}
                  value={values[s.key] ?? ''}
                  onChange={val => setValues(v => ({ ...v, [s.key]: val }))}
                />
              ))
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function ImageUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image must be under 5 MB');      return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/admin/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally  { setUploading(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded cursor-pointer transition-colors py-8 px-4
          ${dragging   ? 'border-[#213885] bg-[#f0f4ff]' : 'border-gray-300 bg-gray-50 hover:border-[#213885] hover:bg-[#f8f9ff]'}
          ${uploading  ? 'cursor-wait opacity-70' : ''}
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-[#213885] animate-spin" />
            <p className="text-sm text-[#213885] font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drag &amp; drop an image here, or <span className="text-[#213885] underline">browse</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WebP, GIF — max 5 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Current image preview */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Logo preview"
            className="h-12 max-w-[160px] object-contain rounded"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 shrink-0" /> Current image
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fallback URL input */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or paste a URL</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://…"
        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]"
      />
    </div>
  );
}

function SettingField({
  setting: s,
  value,
  onChange,
}: {
  setting: Setting;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const isBoolean  = s.type === 'boolean';
  const isTextarea = s.type === 'textarea';
  const isImage    = s.type === 'image';
  const isUrl      = s.type === 'url';
  const isSecret   = s.type === 'secret';

  return (
    <div className={`bg-white border border-gray-200 p-5 hover:border-[#d4a0b0] transition-colors ${
      isBoolean ? 'flex items-center justify-between gap-6' : ''
    }`}>
      <div className={isBoolean ? 'flex-1' : 'mb-3'}>
        <p className="text-sm font-semibold text-[#1a1a1a]">{s.label ?? s.key}</p>
        {s.description && (
          <p className="text-xs text-[#6b6b6b] mt-0.5">{s.description}</p>
        )}
      </div>

      {isBoolean ? (
        <button
          type="button"
          onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
            value === 'true' ? 'bg-[#213885]' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value === 'true' ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      ) : isTextarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] resize-y"
        />
      ) : isImage ? (
        <ImageUploadField value={value} onChange={onChange} />
      ) : isSecret ? (
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Paste token or key here…"
            className="w-full border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] font-mono"
          />
          <button type="button" onClick={() => setShowSecret(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <input
          type={isUrl ? 'url' : s.type === 'email' ? 'email' : s.type === 'phone' ? 'tel' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]"
        />
      )}
    </div>
  );
}
