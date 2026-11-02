import { RequirementLocation } from "../types/domain";

export function scrollToSection(id?: string) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (id) document.getElementById(id)?.scrollIntoView({ behavior: behavior, block: 'start' });
  else window.scrollTo({ top: 0, behavior: behavior });
}

export function locationLabel(location: RequirementLocation): string {
  const parts: string[] = [];
  if (location.source_id) parts.push(location.source_id);
  if (location.page) parts.push('Page ' + location.page + (location.page_end ? '-' + location.page_end : ''));
  if (location.paragraph) parts.push('Paragraph ' + location.paragraph);
  if (location.table) {
    parts.push('Table ' + location.table + (location.row ? ', row ' + location.row : ''));
  }
  return parts.join(' · ') || 'Source location unavailable';
}
