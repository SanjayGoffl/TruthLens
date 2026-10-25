import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * shadcn/ui DropdownMenu (Radix). All utilities are `tw-` prefixed so the
 * Bootstrap-based design system keeps working untouched.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const surface =
  'tw-z-[80] tw-min-w-[12rem] tw-overflow-hidden tw-rounded-xl tw-border tw-border-border tw-bg-card tw-p-1 tw-text-foreground tw-shadow-lg';

export const DropdownMenuContent = forwardRef(function DropdownMenuContent(
  { className, sideOffset = 8, align = 'end', ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          surface,
          'tw-animate-in tw-fade-in-0 tw-zoom-in-95',
          'data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=closed]:tw-zoom-out-95',
          'data-[side=bottom]:tw-slide-in-from-top-2 data-[side=top]:tw-slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = forwardRef(function DropdownMenuItem(
  { className, inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'tw-relative tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-gap-2 tw-rounded-lg tw-px-2.5 tw-py-2',
        'tw-text-sm tw-font-medium tw-text-foreground tw-outline-none tw-transition-colors',
        'focus:tw-bg-muted focus:tw-text-primary data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50',
        '[&>svg]:tw-size-4 [&>svg]:tw-shrink-0',
        inset && 'tw-pl-8',
        className
      )}
      {...props}
    />
  );
});

export const DropdownMenuCheckboxItem = forwardRef(function DropdownMenuCheckboxItem(
  { className, children, checked, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        'tw-relative tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-rounded-lg tw-py-2 tw-pl-8 tw-pr-2 tw-text-sm tw-outline-none focus:tw-bg-muted data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50',
        className
      )}
      {...props}
    >
      <span className="tw-absolute tw-left-2 tw-flex tw-size-3.5 tw-items-center tw-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="tw-size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = forwardRef(function DropdownMenuRadioItem(
  { className, children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'tw-relative tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-rounded-lg tw-py-2 tw-pl-8 tw-pr-2 tw-text-sm tw-outline-none focus:tw-bg-muted data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50',
        className
      )}
      {...props}
    >
      <span className="tw-absolute tw-left-2 tw-flex tw-size-3.5 tw-items-center tw-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="tw-size-2 tw-fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = forwardRef(function DropdownMenuLabel(
  { className, inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn('tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-muted-foreground', inset && 'tw-pl-8', className)}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('tw-my-1 tw-h-px tw-bg-border', className)}
      {...props}
    />
  );
});

export const DropdownMenuShortcut = ({ className, ...props }) => (
  <span className={cn('tw-ml-auto tw-text-[11px] tw-font-normal tw-tracking-widest tw-text-muted-foreground', className)} {...props} />
);

export const DropdownMenuSubTrigger = forwardRef(function DropdownMenuSubTrigger(
  { className, inset, children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        'tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-sm tw-outline-none focus:tw-bg-muted data-[state=open]:tw-bg-muted',
        inset && 'tw-pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="tw-ml-auto tw-size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = forwardRef(function DropdownMenuSubContent(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        surface,
        'tw-animate-in tw-fade-in-0 tw-zoom-in-95 data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=closed]:tw-zoom-out-95',
        className
      )}
      {...props}
    />
  );
});
