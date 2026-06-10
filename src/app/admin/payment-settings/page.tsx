'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageEmployees } from '@/lib/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, Store, Save, ShieldCheck, Info } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';

interface PaymentMethod {
  id:          string;
  key:         string;
  label:       string;
  description: string;
  icon:        React.ElementType;
  warning?:    string;
}

const METHODS: PaymentMethod[] = [
  {
    id:          'stripe',
    key:         'payment_stripe_enabled',
    label:       'Credit / Debit Card',
    description: 'Customers pay online via Stripe. Requires valid Stripe API keys configured in the server environment.',
    icon:        CreditCard,
    warning:     'Ensure Stripe keys are configured before enabling.',
  },
  {
    id:          'interac_etransfer',
    key:         'payment_interac_enabled',
    label:       'Interac e-Transfer',
    description: 'Customers send an e-Transfer to your store email. Orders are held until payment is confirmed manually.',
    icon:        Smartphone,
  },
  {
    id:          'pay_at_store',
    key:         'payment_store_enabled',
    label:       'Pay at Store',
    description: 'Customers place the order online and pay in person when they pick up or visit the store.',
    icon:        Store,
  },
];

export default function PaymentSettingsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    payment_stripe_enabled:  true,
    payment_interac_enabled: true,
    payment_store_enabled:   true,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageEmployees(user)) { router.push('/admin'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/site-settings');
      const map: Record<string, boolean> = { ...enabled };
      (data as { key: string; value: string }[]).forEach(s => {
        if (s.key in map) map[s.key] = s.value === 'true';
      });
      setEnabled(map);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }

  const activeCount = Object.values(enabled).filter(Boolean).length;

  function toggle(key: string) {
    // Prevent disabling the last active method
    if (enabled[key] && activeCount <= 1) {
      toast.error('At least one payment method must remain active.');
      return;
    }
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (activeCount === 0) { toast.error('At least one payment method must be active.'); return; }
    setSaving(true);
    try {
      const settings = Object.entries(enabled).map(([key, value]) => ({ key, value: value ? 'true' : 'false' }));
      await api.put('/admin/site-settings', { settings });
      toast.success('Payment settings saved.');
    } catch { toast.error('Save failed. Please try again.'); }
    finally { setSaving(false); }
  }

  if (!user || loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
            Payment Methods
          </h1>
          <p className="text-[#6b6b6b] mt-1 text-sm">
            Enable or disable payment options shown to customers at checkout.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || activeCount === 0}
          className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-5 py-2.5 text-sm font-medium transition-colors shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Changes take effect immediately at checkout. Disabled methods are hidden from customers and rejected by the server even if submitted directly.</p>
      </div>

      {/* Method cards */}
      <div className="space-y-4">
        {METHODS.map(({ id, key, label, description, icon: Icon, warning }) => {
          const isOn = enabled[key];
          const isLastActive = isOn && activeCount <= 1;
          return (
            <div
              key={id}
              className={`bg-white border-2 p-5 transition-colors ${
                isOn ? 'border-[#213885]' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 shrink-0 ${isOn ? 'bg-[#f9f0f3]' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isOn ? 'text-[#213885]' : 'text-gray-400'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{label}</p>
                      <p className="text-sm text-[#6b6b6b] mt-0.5">{description}</p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggle(key)}
                      disabled={isLastActive}
                      title={isLastActive ? 'Cannot disable — last active method' : undefined}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                        isOn ? 'bg-[#213885]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          isOn ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      isOn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {isOn ? 'Active' : 'Disabled'}
                    </span>
                    {isLastActive && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Last active method — cannot disable
                      </span>
                    )}
                  </div>

                  {/* Warning */}
                  {warning && isOn && (
                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5">
                      ⚠ {warning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <p className="text-xs text-[#6b6b6b] mt-6 text-center">
        {activeCount} of {METHODS.length} payment method{activeCount !== 1 ? 's' : ''} currently active
      </p>
    </div>
  );
}
