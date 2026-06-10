import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#ecdfd2', color: '#1a1a1a' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: '5rem', fontWeight: 700, color: '#213885', margin: '0 0 0.5rem' }}>404</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#555' }}>Page not found.</p>
            <Link href="/" style={{ background: '#213885', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem' }}>
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
