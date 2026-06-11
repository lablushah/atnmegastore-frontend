interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HEIGHT = { sm: 36, md: 48, lg: 64 };

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const h = HEIGHT[size];
  return (
    <img
      src="/logo.svg"
      alt="ATN Book & Crafts"
      height={h}
      style={{ height: h, width: 'auto', display: 'block' }}
      className={className}
    />
  );
}
