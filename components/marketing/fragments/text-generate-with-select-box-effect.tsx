'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface TextGenerateWithSelectBoxEffectProps {
  words: string;
}

export function TextGenerateWithSelectBoxEffect({ words }: TextGenerateWithSelectBoxEffectProps): React.JSX.Element {
  const tokens = words.split(' ');
  return (
    <>
      {tokens.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: 'easeOut' }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}
