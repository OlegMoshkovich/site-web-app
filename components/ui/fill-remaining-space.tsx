import * as React from 'react';

export function FillRemainingSpace({ className }: { className?: string }): React.JSX.Element {
  return <div className={`flex-1 ${className ?? ''}`} />;
}
