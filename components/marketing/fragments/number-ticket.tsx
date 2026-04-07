'use client';

import * as React from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface NumberTickerProps {
  value: number;
  decimals?: number;
}

export function NumberTicker({ value, decimals = 0 }: NumberTickerProps): React.JSX.Element {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const [display, setDisplay] = React.useState('0');

  React.useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, motionValue, value]);

  React.useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplay(v.toFixed(decimals));
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return <span ref={ref}>{display}</span>;
}
