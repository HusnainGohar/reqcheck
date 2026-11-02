import * as React from 'react';

export function useDialogFocus(open: boolean, busy: boolean, dismiss: () => void) {
  React.useEffect(function() {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const initialControl = dialog?.querySelector<HTMLElement>('input, textarea')
      || dialog?.querySelector<HTMLElement>('button:not(:disabled)');
    initialControl?.focus();
    return function() { previousFocus?.focus(); };
  }, [open]);
  return function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !busy) dismiss();
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)'
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
}
