'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import api from '@/lib/api';
import { CalendarDays, MapPin, Clock, ExternalLink, ChevronRight } from 'lucide-react';

type Event = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
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

function EventCard({ ev, featured = false }: { ev: Event; featured?: boolean }) {
  return (
    <Link href={`/events/${ev.slug}`} className={`group block bg-white rounded-xl border hover:border-[#213885]/30 hover:shadow-md transition-all overflow-hidden ${featured ? 'md:flex' : ''}`}>
      <div className={`relative bg-gray-100 overflow-hidden ${featured ? 'md:w-80 md:flex-shrink-0 h-48 md:h-auto' : 'h-48'}`}>
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#213885] to-[#5f3475]">
            <CalendarDays size={40} className="text-white/40" />
          </div>
        )}
        {ev.is_featured && (
          <span className="absolute top-3 left-3 bg-[#893172] text-[#213885] text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>
        )}
      </div>
      <div className="p-5 flex flex-col">
        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#213885] transition-colors leading-snug mb-2">{ev.title}</h3>
        {ev.short_description && <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">{ev.short_description}</p>}
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays size={14} className="text-[#213885] flex-shrink-0" />
            {fmtDate(ev.date)}
          </div>
          {ev.start_time && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-[#213885] flex-shrink-0" />
              {fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}
            </div>
          )}
          {ev.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} className="text-[#213885] flex-shrink-0" />
              {ev.location}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#213885]">
          View Details <ChevronRight size={15} />
        </div>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [past, setPast]         = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/events')
      .then(res => { setUpcoming(res.data.upcoming); setPast(res.data.past); })
      .finally(() => setLoading(false));
  }, []);

  const featured  = upcoming.filter(e => e.is_featured);
  const regular   = upcoming.filter(e => !e.is_featured);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">In-Store Events</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Join us at ATN Book & Crafts for book signings, cultural celebrations, author readings, and community gatherings.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading events…</div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No upcoming events at the moment. Check back soon!</p>
        </div>
      ) : (
        <>
          {/* Featured events */}
          {featured.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Featured</h2>
              <div className="space-y-5">
                {featured.map(ev => <EventCard key={ev.id} ev={ev} featured />)}
              </div>
            </section>
          )}

          {/* Upcoming events */}
          {(regular.length > 0 || (featured.length === 0 && upcoming.length > 0)) && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(featured.length > 0 ? regular : upcoming).map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </section>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-gray-500">Past Events</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
                {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
