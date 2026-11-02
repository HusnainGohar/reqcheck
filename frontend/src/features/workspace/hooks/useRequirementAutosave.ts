import * as React from 'react';
import { Requirement } from '../../../types/domain';

export type SaveState = 'pending' | 'saving' | 'failed' | 'saved';

export function useRequirementAutosave(options: {
  requirements: Requirement[];
  savedTexts: Record<string, string>;
  saveStates: Record<string, SaveState>;
  busy: boolean;
  savingCount: number;
  unsavedCount: number;
  save: (item: Requirement) => Promise<void>;
}) {
  const { requirements, savedTexts, saveStates, busy, savingCount, unsavedCount, save } = options;
  React.useEffect(function() {
    if (busy || savingCount) return;
    const item = requirements.find(function(requirement) {
      return savedTexts[requirement.id] !== requirement.text
        && requirement.text.trim() && saveStates[requirement.id] !== 'failed';
    });
    if (!item) return;
    const timer = window.setTimeout(function() { save(item); }, 700);
    return function() { window.clearTimeout(timer); };
  }, [requirements, savedTexts, saveStates, busy, savingCount, save]);
  React.useEffect(function() {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!unsavedCount && !savingCount) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return function() { window.removeEventListener('beforeunload', warnBeforeLeaving); };
  }, [unsavedCount, savingCount]);
}
