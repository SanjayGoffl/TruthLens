import { forwardRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * shadcn/ui Command (cmdk). Filtering is delegated to the caller so the
 * palette can rank results with its own fuzzy scorer.
 */
export const Command = forwardRef(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn('tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-bg-card tw-text-foreground', className)}
      {...props}
    />
  );
});

export const CommandInput = forwardRef(function CommandInput(
  { className, wrapperClassName, ...props },
  ref
) {
  return (
    <div
      className={cn('tw-flex tw-items-center tw-gap-2.5 tw-border-b tw-border-border tw-px-4', wrapperClassName)}
      cmdk-input-wrapper=""
    >
      <Search className="tw-size-[17px] tw-shrink-0 tw-text-muted-foreground" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'tw-flex tw-h-[52px] tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-text-[15px] tw-outline-none',
          'placeholder:tw-text-muted-foreground disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
          className
        )}
        {...props}
      />
    </div>
  );
});

export const CommandList = forwardRef(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('tw-max-h-[420px] tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-contain', className)}
      {...props}
    />
  );
});

export const CommandEmpty = forwardRef(function CommandEmpty(props, ref) {
  return <CommandPrimitive.Empty ref={ref} className="tw-py-10 tw-text-center tw-text-sm tw-text-muted-foreground" {...props} />;
});

export const CommandGroup = forwardRef(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        'tw-overflow-hidden tw-p-1 tw-text-foreground',
        '[&_[cmdk-group-heading]]:tw-px-2 [&_[cmdk-group-heading]]:tw-pb-1 [&_[cmdk-group-heading]]:tw-pt-2',
        '[&_[cmdk-group-heading]]:tw-text-[10.5px] [&_[cmdk-group-heading]]:tw-font-bold [&_[cmdk-group-heading]]:tw-uppercase',
        '[&_[cmdk-group-heading]]:tw-tracking-[0.09em] [&_[cmdk-group-heading]]:tw-text-muted-foreground',
        className
      )}
      {...props}
    />
  );
});

export const CommandSeparator = forwardRef(function CommandSeparator({ className, ...props }, ref) {
  return <CommandPrimitive.Separator ref={ref} className={cn('tw-h-px tw-bg-border', className)} {...props} />;
});

export const CommandItem = forwardRef(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'tw-relative tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-gap-2.5 tw-rounded-lg tw-px-2.5 tw-py-2',
        'tw-text-[13.5px] tw-font-medium tw-outline-none tw-transition-colors tw-duration-150',
        'data-[disabled=true]:tw-pointer-events-none data-[disabled=true]:tw-opacity-50',
        'data-[selected=true]:tw-bg-muted data-[selected=true]:tw-text-primary',
        '[&>svg]:tw-size-4 [&>svg]:tw-shrink-0',
        className
      )}
      {...props}
    />
  );
});

export const CommandShortcut = ({ className, ...props }) => (
  <span className={cn('tw-ml-auto tw-text-[11px] tw-font-normal tw-tracking-widest tw-text-muted-foreground', className)} {...props} />
);
