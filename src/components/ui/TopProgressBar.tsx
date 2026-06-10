'use client';

import NextTopLoader from 'nextjs-toploader';

export default function TopProgressBar() {
  return (
    <NextTopLoader
      color="#213885"
      height={3}
      showSpinner={false}
      shadow="0 0 10px #213885, 0 0 5px #213885"
      easing="ease"
      speed={200}
    />
  );
}
