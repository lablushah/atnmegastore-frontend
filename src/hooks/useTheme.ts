'use client';

import { useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('atn-admin-theme') === 'dark';
  });

  function toggle() {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('atn-admin-theme', next ? 'dark' : 'light');
      return next;
    });
  }

  return { isDark, toggle };
}
