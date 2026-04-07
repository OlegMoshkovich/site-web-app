'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface TextGenerateEffectProps {
  words: string;
}

export function TextGenerateEffect({ words }: TextGenerateEffectProps): React.JSX.Element {
  const tokens = words.split(' ');
  return (
    <>
      {tokens.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}
