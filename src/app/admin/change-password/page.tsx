'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router              = useRouter();
  const { user, fetchMe }   = useAuthStore();
  const [password, setPass] = useState('');
  const [confirm, setConf]  = useState('');
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = [
    { label: 'At least 8 characters',      ok: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)',  ok: /[A-Z]/.test(password) },
    { label: 'One number (0–9)',            ok: /[0-9]/.test(password) },
    { label: 'One special character (!@#…)',ok: /[\W_]/.test(password) },
    { label: 'Passwords match',             ok: password === confirm && confirm.length > 0 },
  ];
  const allValid = rules.every(r => r.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) return;
    setLoading(true);
    try {
      await api.put('/change-password', { password, password_confirmation: confirm });
      await fetchMe();
      toast.success('Password changed! Welcome aboard.');
      router.push('/admin');
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.password?.[0]
               || err?.response?.data?.message
               || 'Something went wrong.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5ede3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-white border border-[#cccacc] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#213885] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a]">Set Your Password</h1>
              <p className="text-sm text-[#6b6b6b]">
                {user?.name ? `Welcome, ${user.name}!` : 'Welcome!'} Please set a permanent password to continue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPass(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]"
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConf(e.target.value)}
                required
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]"
                placeholder="Repeat your password"
              />
            </div>

            {/* Live requirements checklist */}
            {password.length > 0 && (
              <ul className="space-y-1.5 bg-gray-50 border border-gray-100 px-4 py-3">
                {rules.map(r => (
                  <li key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${r.ok ? 'text-green-500' : 'text-gray-300'}`} />
                    {r.label}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={!allValid || loading}
              className="w-full bg-[#213885] hover:bg-[#081849] disabled:opacity-40 text-white font-bold py-3 text-sm tracking-wide transition-colors"
            >
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ATN Book & Crafts Staff Portal
        </p>
      </div>
    </div>
  );
}
