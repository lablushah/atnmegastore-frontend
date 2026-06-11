'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/navigation';
import api from '@/lib/api';
import { CalendarDays, MapPin, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';

type Event = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  image_url: string | null;
  tickets_url: string | null;
  is_featured: boolean;
};

function fmtDate(d: string) {
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent]   = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/events/${slug}`)
      .then(res => setEvent(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageLoader />;
  if (notFound || !event) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500">Event not found.</p>
      <Link href="/events" className="mt-4 inline-block text-[#213885] font-semibold">← Back to Events</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#213885] mb-6">
        <ArrowLeft size={15} /> Back to Events
      </Link>

      {/* Hero image */}
      {event.image_url && (
        <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden mb-8">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2">
          {event.is_featured && (
            <span className="inline-block bg-[#893172] text-[#213885] text-xs font-bold px-3 py-1 rounded-full mb-3">Featured Event</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
          {event.short_description && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6">{event.short_description}</p>
          )}
          {event.description && (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          )}
        </div>

        {/* Sidebar: details */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-5 border space-y-4">
            <div className="flex items-start gap-3">
              <CalendarDays size={18} className="text-[#213885] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                <p className="text-sm font-medium text-gray-800">{fmtDate(event.date)}</p>
              </div>
            </div>
            {event.start_time && (
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-[#213885] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Time</p>
                  <p className="text-sm font-medium text-gray-800">
                    {fmtTime(event.start_time)}{event.end_time ? ` – ${fmtTime(event.end_time)}` : ''}
                  </p>
                </div>
              </div>
            )}
            {(event.location || event.address) && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#213885] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Location</p>
                  {event.location && <p className="text-sm font-medium text-gray-800">{event.location}</p>}
                  {event.address && <p className="text-sm text-gray-500">{event.address}</p>}
                </div>
              </div>
            )}
          </div>

          {event.tickets_url && (
            <a href={event.tickets_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#213885] text-white py-3 rounded-xl font-semibold hover:bg-[#5f3475] transition-colors">
              Get Tickets <ExternalLink size={15} />
            </a>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">ATN Book & Crafts</p>
            <p className="text-sm text-gray-400">Bangla Town, Toronto, ON</p>
          </div>
        </div>
      </div>
    </div>
  );
}
