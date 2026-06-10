'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User, Save, ShieldCheck, ShieldOff, Copy, Check,
  RefreshCw, Key, Package, Eye, EyeOff, LogOut,
} from 'lucide-react';

type Section = 'profile' | 'security';

export default function AccountPage() {
  const { user, fetchMe, setAuth, token, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [section, setSection] = useState<Section>('profile');

  // Profile form
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // 2FA disable
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/login?redirect=/account'); return; }
    setForm(f => ({ ...f, name: user.name, email: user.email }));
  }, [_hasHydrated, user]);

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    try {
      const payload: any = { name: form.name, email: form.email };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      await api.put('/me', payload);
      await fetchMe();
      toast.success('Profile updated');
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  async function handleDisable2FA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setDisabling(true);
    try {
      await api.post('/2fa/disable', { password: disablePassword });
      toast.success('Two-factor authentication disabled');
      setShowDisable(false); setDisablePassword('');
      const me = await api.get('/me');
      setAuth(me.data, token!);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to disable 2FA');
    } finally { setDisabling(false); }
  }

  async function loadRecoveryCodes() {
    setLoadingCodes(true);
    try {
      const { data } = await api.get('/2fa/recovery-codes');
      setRecoveryCodes(data.recovery_codes);
    } catch { toast.error('Failed to load recovery codes'); }
    finally { setLoadingCodes(false); }
  }

  async function regenerateCodes() {
    setLoadingCodes(true);
    try {
      const { data } = await api.post('/2fa/recovery-codes', { regenerate: true });
      setRecoveryCodes(data.recovery_codes);
      toast.success('Recovery codes regenerated');
    } catch { toast.error('Failed to regenerate'); }
    finally { setLoadingCodes(false); }
  }

  function copyCodes() {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (!user) return null;

  const twoFAEnabled = !!user.two_factor_enabled;
  const twoFAMethod  = user.two_factor_method;
  const initials     = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile',  label: 'Profile',  icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-[80vh] bg-[#f9f5f2] py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Page title */}
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
          My Account
        </h1>

        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="bg-white border border-[#cccacc] p-5 mb-3">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 bg-[#213885] flex items-center justify-center text-white text-lg font-bold mb-2">
                  {initials}
                </div>
                <p className="font-semibold text-[#1a1a1a] text-sm leading-tight">{user.name}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5 break-all">{user.email}</p>
              </div>

              {/* Nav */}
              <nav className="space-y-0.5">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSection(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      section === id
                        ? 'bg-[#fdf4f0] text-[#213885] font-semibold border-l-2 border-[#213885]'
                        : 'text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}

                <Link
                  href="/orders"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-4 h-4 shrink-0" />
                  My Orders
                </Link>
              </nav>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#6b6b6b] hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* ── Profile section ── */}
            {section === 'profile' && (
              <div className="bg-white border border-[#cccacc] p-8">
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Full name</label>
                    <input
                      type="text" value={form.name} required
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Email address</label>
                    <input
                      type="email" value={form.email} required
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-[#cccacc] pt-5">
                    <p className="text-xs text-[#6b6b6b] mb-4">Leave blank to keep your current password.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">New password</label>
                        <div className="relative">
                          <input
                            type={showPw ? 'text' : 'password'} value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                          />
                          <button type="button" tabIndex={-1}
                            onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#1a1a1a]">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Confirm new password</label>
                        <input
                          type="password" value={form.password_confirmation}
                          onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white font-semibold px-6 py-2.5 text-sm transition-colors">
                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Security section ── */}
            {section === 'security' && (
              <div className="bg-white border border-[#cccacc] p-8">
                <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Security</h2>

                {/* 2FA status card */}
                <div className={`border p-5 mb-5 ${twoFAEnabled ? 'border-green-200 bg-green-50' : 'border-[#cccacc] bg-[#fdf4f0]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${twoFAEnabled ? 'bg-green-100' : 'bg-white border border-[#cccacc]'}`}>
                        {twoFAEnabled
                          ? <ShieldCheck className="w-5 h-5 text-green-600" />
                          : <ShieldOff className="w-5 h-5 text-[#6b6b6b]" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-[#6b6b6b] mt-0.5">
                          {twoFAEnabled
                            ? `Enabled — ${twoFAMethod === 'totp' ? 'Authenticator app' : 'Email OTP'}`
                            : 'Not enabled'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 shrink-0 ${
                      twoFAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-[#6b6b6b]'
                    }`}>
                      {twoFAEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {!twoFAEnabled ? (
                  <div>
                    <p className="text-sm text-[#6b6b6b] mb-4">
                      Protect your account with a second verification step when signing in.
                    </p>
                    <Link href="/2fa/setup"
                      className="inline-flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white text-sm font-medium px-5 py-2.5 transition-colors">
                      <ShieldCheck className="w-4 h-4" /> Enable 2FA
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Recovery codes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[#1a1a1a]">Recovery Codes</p>
                        <button
                          onClick={() => recoveryCodes ? setRecoveryCodes(null) : loadRecoveryCodes()}
                          disabled={loadingCodes}
                          className="flex items-center gap-1.5 text-sm text-[#213885] hover:text-[#081849] transition-colors disabled:opacity-50"
                        >
                          <Key className="w-3.5 h-3.5" />
                          {loadingCodes ? 'Loading…' : recoveryCodes ? 'Hide' : 'View codes'}
                        </button>
                      </div>
                      <p className="text-xs text-[#6b6b6b] mb-3">
                        Use recovery codes to access your account if you lose your 2FA device.
                      </p>
                      {recoveryCodes && (
                        <div className="border border-[#cccacc] p-4 bg-[#fdf4f0]">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {recoveryCodes.map(c => (
                              <code key={c} className="bg-white border border-[#cccacc] px-2 py-1 text-xs font-mono text-center tracking-wider">
                                {c}
                              </code>
                            ))}
                          </div>
                          <div className="flex gap-3 pt-2 border-t border-[#cccacc]">
                            <button onClick={copyCodes}
                              className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors">
                              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copied ? 'Copied!' : 'Copy all'}
                            </button>
                            <button onClick={regenerateCodes} disabled={loadingCodes}
                              className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors disabled:opacity-50">
                              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disable 2FA */}
                    <div className="border-t border-[#cccacc] pt-5">
                      {!showDisable ? (
                        <button onClick={() => setShowDisable(true)}
                          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors">
                          <ShieldOff className="w-4 h-4" /> Disable 2FA
                        </button>
                      ) : (
                        <form onSubmit={handleDisable2FA} className="space-y-3 p-4 bg-red-50 border border-red-200">
                          <p className="text-sm font-medium text-red-700">Enter your password to disable 2FA:</p>
                          <input
                            type="password" value={disablePassword} required
                            onChange={e => setDisablePassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full border border-red-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={disabling}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition-colors">
                              {disabling ? 'Disabling…' : 'Confirm Disable'}
                            </button>
                            <button type="button"
                              onClick={() => { setShowDisable(false); setDisablePassword(''); }}
                              className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] px-4 py-2">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
