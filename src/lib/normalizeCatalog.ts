// normalizeCatalog.ts — deterministic categorization for uploaded price sheets.
export type CatalogRow = { p: string; i: string; d: string; f: number | null };

export function normalizeDescription(desc: string): string {
  let s = desc || '';
  s = s.replace(/\(\s*[\d.]+\s*(?:degrees|°)[^)]*\)/gi, '');
  s = s.replace(/\([^)]*\b\d+(?:\.\d+)?\s*mm[^)]*\)/gi, '');
  s = s.replace(/\b\d+(?:\.\d+)?\s*(?:degrees|°)/gi, '');
  s = s.replace(/\s*x?\s*\d+(?:\.\d+)?\s*(?:mm|cm)\b/gi, ' ');
  s = s.replace(/\s+x\s+/gi, ' ').replace(/\s+x$/i, '');
  s = s.replace(/-\s+SL\b/g, '-SL');
  s = s.replace(/\s+,/g, ',').replace(/,\s*,/g, ',');
  s = s.replace(/[,\-\s]+$/g, '').replace(/^\s*[,\-]+/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s || desc;
}

export function buildCatalogRows(
  raw: Array<{ system?: string | null; item_number?: string | null; description?: string | null; price?: number | null }>,
): { rows: CatalogRow[]; groups: { name: string; count: number }[]; dropped: number } {
  const seen = new Set<string>();
  const rows: CatalogRow[] = [];
  let dropped = 0;
  for (const r of raw) {
    const i = (r.item_number ?? '').trim();
    const dRaw = (r.description ?? '').trim();
    if (!i && !dRaw) continue;
    const d = normalizeDescription(dRaw);
    const p = (r.system ?? '').trim() || d.split(',')[0].trim() || 'Uncategorized';
    const f = typeof r.price === 'number' ? r.price : null;
    const key = p + '|' + i + '|' + d + '|' + f;
    if (seen.has(key)) { dropped++; continue; }
    seen.add(key);
    rows.push({ p, i, d, f });
  }
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.p, (counts.get(r.p) ?? 0) + 1);
  const groups = [...counts.entries()].map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return { rows, groups, dropped };
}
