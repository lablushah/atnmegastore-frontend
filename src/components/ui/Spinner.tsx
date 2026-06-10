interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZES = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export default function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${SIZES[size]} border-[#213885]/20 border-t-[#213885] rounded-full animate-spin`} />
      {label && <p className="text-sm text-[#777]">{label}</p>}
    </div>
  );
}
