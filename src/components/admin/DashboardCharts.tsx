'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

export interface AnalyticsData {
  revenue_by_day:   { date: string; revenue: number; orders: number }[];
  revenue_by_month: { month: string; revenue: number; orders: number }[];
  status_breakdown: { name: string; value: number; color: string }[];
  top_products:     { name: string; revenue: number; units: number }[];
  kpi: {
    total_revenue: number;
    revenue_this_month: number;
    revenue_last_month: number;
    orders_this_month: number;
    new_customers_month: number;
  };
}

const BRAND        = '#213885';
const GOLD         = '#893172';
const CHART_COLORS = ['#213885', '#893172', '#10b981', '#3b82f6', '#f59e0b'];
const CHART_H      = 180;

function fmtCurrency(v: number) {
  return '$' + v.toLocaleString('en-CA', { maximumFractionDigits: 0 });
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-100 rounded w-full" style={{ height: CHART_H }} />;
}

function Panel({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#cccacc] p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default function DashboardCharts() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState<'30d' | '12m'>('30d');

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  type ChartRow = { date?: string; month?: string; revenue: number; orders: number };
  const chartData: ChartRow[] | undefined = range === '30d'
    ? data?.revenue_by_day
    : (data?.revenue_by_month as ChartRow[] | undefined);
  const dateKey = range === '30d' ? 'date' : 'month';

  const totalOrders = data?.status_breakdown.reduce((s, x) => s + x.value, 0) ?? 0;

  /* ── 3-column horizontal row ── */
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>

      {/* Revenue trend — 2× wider */}
      <Panel
        title="Revenue & Orders"
        extra={
          <div className="flex gap-1">
            {(['30d', '12m'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`text-[10px] px-2 py-0.5 border transition-colors ${range === r
                  ? 'bg-[#213885] text-white border-[#213885]'
                  : 'border-[#cccacc] text-gray-400 hover:border-[#213885]'}`}>
                {r === '30d' ? '30d' : '12m'}
              </button>
            ))}
          </div>
        }
      >
        {loading ? <Skeleton /> : (
          <ResponsiveContainer width="100%" height={CHART_H}>
            <AreaChart data={chartData} margin={{ top: 2, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3ede8" />
              <XAxis dataKey={dateKey} tick={{ fontSize: 10 }} tickLine={false}
                interval={range === '30d' ? 6 : 1} />
              <YAxis yAxisId="rev"
                tickFormatter={v => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v}
                tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
              <YAxis yAxisId="ord" orientation="right"
                tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip
                formatter={(val, name) => [name === 'revenue' ? fmtCurrency(val as number) : val, name === 'revenue' ? 'Revenue' : 'Orders']}
                contentStyle={{ fontSize: 11, border: '1px solid #cccacc', borderRadius: 4, padding: '4px 8px' }}
              />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue"
                stroke={BRAND} strokeWidth={1.5} fill="url(#revGrad)" dot={false} />
              <Area yAxisId="ord" type="monotone" dataKey="orders" name="orders"
                stroke={GOLD} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Order status donut */}
      <Panel title="Order Status">
        {loading ? <Skeleton /> : totalOrders === 0 ? (
          <div className="flex items-center justify-center text-gray-400 text-xs" style={{ height: CHART_H }}>
            No orders yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie data={data?.status_breakdown} cx="50%" cy="50%"
                  innerRadius="38%" outerRadius="65%"
                  dataKey="value" strokeWidth={2} stroke="#fff">
                  {data?.status_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, _, p) => [val + ' orders', p.payload.name]}
                  contentStyle={{ fontSize: 11, border: '1px solid #cccacc', borderRadius: 4, padding: '4px 8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {data?.status_breakdown.map(s => (
                <div key={s.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-gray-500 truncate">{s.name}</span>
                  </span>
                  <span className="font-semibold text-gray-700">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* Top products */}
      <Panel title="Top Products">
        {loading ? <Skeleton /> : (data?.top_products.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center text-gray-400 text-xs" style={{ height: CHART_H }}>
            No sales yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={data?.top_products} layout="vertical"
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3ede8" />
              <XAxis type="number" tickFormatter={v => '$' + v}
                tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={70}
                tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={val => [fmtCurrency(val as number), 'Revenue']}
                contentStyle={{ fontSize: 11, border: '1px solid #cccacc', borderRadius: 4, padding: '4px 8px' }}
              />
              <Bar dataKey="revenue" radius={[0, 3, 3, 0]} maxBarSize={16}>
                {data?.top_products.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

    </div>
  );
}
