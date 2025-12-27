'use client';

import React, { useRef, useEffect } from 'react';

const useRipple = () => {
  const refs = useRef<{[key: string]: HTMLElement | null}>({});

  useEffect(() => {
    // Cleanup ripples on unmount
    return () => {
      Object.values(refs.current).forEach(ref => {
        if (ref) {
          const ripples = ref.querySelectorAll('.ripple');
          ripples.forEach(ripple => ripple.remove());
        }
      });
    };
  }, []);

  const createRipple = (event: React.MouseEvent<HTMLElement, MouseEvent>, key: string) => {
    const target = refs.current[key];
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');

    ripple.className = 'ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    target.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  return [refs, createRipple] as const;
};

export default useRipple;
