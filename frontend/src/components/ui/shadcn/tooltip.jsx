import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../../lib/utils';

/**
 * shadcn/ui Tooltip (Radix) — Tailwind utilities are prefixed so this can sit
 * next to Bootstrap without leaking styles into the rest of the app.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 8, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'tw-z-[90] tw-overflow-hidden tw-rounded-md tw-border tw-border-border tw-bg-card tw-px-2.5 tw-py-1.5',
          'tw-text-xs tw-font-medium tw-text-foreground tw-shadow-md',
          'tw-select-none tw-animate-in tw-fade-in-0 tw-zoom-in-95',
          'data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=closed]:tw-zoom-out-95',
          'data-[side=bottom]:tw-slide-in-from-top-1 data-[side=top]:tw-slide-in-from-bottom-1',
          'data-[side=left]:tw-slide-in-from-right-1 data-[side=right]:tw-slide-in-from-left-1',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
