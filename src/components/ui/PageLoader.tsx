import Spinner from './Spinner';

export default function PageLoader({ label = 'Loading…', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
      <Spinner size="lg" label={label} />
    </div>
  );
}
