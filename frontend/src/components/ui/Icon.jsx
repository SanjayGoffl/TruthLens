import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Shared icon wrapper. Keeps stroke weight, size and alignment consistent and
 * adds an optional micro-interaction hook (`.icon-lift` in premium.css).
 */
const Icon = forwardRef(function Icon(
  { icon: Glyph, size = 18, strokeWidth = 1.9, className, lift = false, ...props },
  ref
) {
  if (!Glyph) return null;
  return (
    <Glyph
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
      className={cn('ng-icon', lift && 'ng-icon-lift', className)}
      {...props}
    />
  );
});

export default Icon;
