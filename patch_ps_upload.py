"""
Patch Tracker.tsx to implement the Price Sheets upload + review flow.
Changes:
  1. Add supabase import
  2. Add psReview / psSaving state after psQ
  3. Replace handlePSUpload stub with OCR + setPsReview logic
  4. Add savePriceSheet function after handlePSUpload
  5. Replace prices tab body with: if psReview → review screen, else → existing catalog UI
"""
import re

with open('src/components/Tracker.tsx', 'r') as f:
    src = f.read()

# ── 1. Add supabase import ────────────────────────────────────────────────
OLD_IMPORT = "import { pdfToImages } from '@/lib/pdfToImages';"
NEW_IMPORT = """import { pdfToImages } from '@/lib/pdfToImages';
import { supabase } from '@/lib/supabase';"""
if OLD_IMPORT not in src:
    raise ValueError('import anchor not found')
src = src.replace(OLD_IMPORT, NEW_IMPORT, 1)

# ── 2. Add psReview / psSaving state ─────────────────────────────────────
OLD_STATE = "  const [psQ, setPsQ] = useState('');"
NEW_STATE = """  const [psQ, setPsQ] = useState('');
  const [psReview, setPsReview] = useState(null); // { rows, vendor, label, facility }
  const [psSaving, setPsSaving] = useState(false);"""
if OLD_STATE not in src:
    raise ValueError('psQ state anchor not found')
src = src.replace(OLD_STATE, NEW_STATE, 1)

# ── 3. Replace handlePSUpload stub ────────────────────────────────────────
# Find exact span
stub_start = src.index('  const handlePSUpload = async (e) => {')
stub_end_marker = '  const updateReviewSheet'
stub_end = src.index(stub_end_marker, stub_start)

NEW_HANDLER = """\
  const handlePSUpload = async (e) => {
    const CONCURRENCY = 6;
    const MAX_PAGES = 25;
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    setExtracting(true);
    setExtractDone(0);
    setExtractTotal(files.length);

    // OCR all files, collect {p,i,d,f} rows
    const allRows = [];
    let guessedVendor = '';
    let guessedLabel = files[0]?.name ?? '';

    for (const file of files) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        let allPages = [];
        try { allPages = await pdfToImages(file); } catch { setExtractDone(d => d + 1); continue; }
        const skipped = allPages.length > MAX_PAGES ? allPages.length - MAX_PAGES : 0;
        const pages = allPages.slice(0, MAX_PAGES);
        if (skipped > 0) notify(`First ${MAX_PAGES} of ${allPages.length} pages used (${skipped} skipped)`, true);
        setExtractTotal(t => t - 1 + pages.length);
        for (let i = 0; i < pages.length; i += CONCURRENCY) {
          const batch = pages.slice(i, i + CONCURRENCY);
          const batchSheets = await Promise.all(batch.map(async b64 => {
            try { return await extractBillSheet(b64, 'image/jpeg'); } catch { return null; }
          }));
          for (const sheet of batchSheets) {
            if (!sheet) continue;
            if (sheet.items?.length && !guessedVendor) {
              guessedVendor = sheet.items.find(x => x.vendor)?.vendor ?? '';
            }
            for (const item of sheet.items ?? []) {
              allRows.push({
                p: item.product_name?.trim() || 'Uncategorized',
                i: item.item_number?.trim() || '',
                d: item.description?.trim() || '',
                f: item.cost ?? 0,
              });
            }
          }
          setExtractDone(d => d + batch.length);
        }
      } else {
        try {
          const base64 = await fileToBase64(file);
          const sheet = await extractBillSheet(base64, file.type || 'image/jpeg');
          if (sheet.items?.length && !guessedVendor) {
            guessedVendor = sheet.items.find(x => x.vendor)?.vendor ?? '';
          }
          for (const item of sheet.items ?? []) {
            allRows.push({
              p: item.product_name?.trim() || 'Uncategorized',
              i: item.item_number?.trim() || '',
              d: item.description?.trim() || '',
              f: item.cost ?? 0,
            });
          }
        } catch { /* silent */ }
        setExtractDone(d => d + 1);
      }
    }

    setExtracting(false);
    if (!allRows.length) { notify('No items extracted — try a clearer image', false); return; }
    setPsReview({
      rows: allRows,
      vendor: guessedVendor,
      label: guessedLabel.replace(/\\.[^.]+$/, ''),
      facility: psFac,
    });
  };
  const savePriceSheet = async () => {
    if (!psReview || psSaving) return;
    if (!psReview.vendor.trim()) { notify('Enter a vendor name before saving', false); return; }
    if (!psReview.label.trim())  { notify('Enter a label before saving', false); return; }
    setPsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('price_sheets').insert({
        user_id:  user.id,
        vendor:   psReview.vendor.trim(),
        label:    psReview.label.trim(),
        facility: psReview.facility,
        rows:     psReview.rows,
      });
      if (error) throw new Error(error.message);
      notify(`"${psReview.label}" saved to Price Sheets`, true);
      setPsReview(null);
    } catch (err) {
      notify(`Save failed: ${err?.message ?? err}`, false);
    } finally {
      setPsSaving(false);
    }
  };
"""

src = src[:stub_start] + NEW_HANDLER + src[stub_end:]

# ── 4. Wrap prices tab body with psReview conditional ─────────────────────
# The prices tab opens with: {tab === 'prices' && (\n          <div className="fade">
# and closes just before {tab === 'vendors'
# Strategy: insert the review screen JSX right after <div className="fade">
# and wrap the existing content in an else branch.

PRICES_OPEN = '        {tab === \'prices\' && (\n          <div className="fade">'
if PRICES_OPEN not in src:
    raise ValueError('prices tab open not found')

# Find the closing )} of the prices tab (just before vendors tab)
PRICES_CLOSE_MARKER = '\n        {tab === \'vendors\' &&'
prices_start = src.index(PRICES_OPEN)
prices_body_start = prices_start + len(PRICES_OPEN)
prices_end = src.index(PRICES_CLOSE_MARKER, prices_start)
# The "        )}" before vendors tab
close_tag_end = src.rindex('\n        )}', prices_start, prices_end) + len('\n        )}')

existing_prices_body = src[prices_body_start:close_tag_end - len('\n        )}')]

REVIEW_SCREEN = """
            {psReview ? (
              /* ── Price Sheet review screen ── */
              <div className="fade">
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📄 Review Extracted Price Sheet</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <input
                      placeholder="Vendor name"
                      value={psReview.vendor}
                      onChange={e => setPsReview(r => ({ ...r, vendor: e.target.value }))}
                      style={{ ...S.inp, flex: 1, minWidth: 120 }}
                    />
                    <input
                      placeholder="Label (e.g. Northside 2026)"
                      value={psReview.label}
                      onChange={e => setPsReview(r => ({ ...r, label: e.target.value }))}
                      style={{ ...S.inp, flex: 2, minWidth: 160 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#667', marginBottom: 12 }}>
                    {psReview.rows.length} rows extracted · {psReview.facility}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={savePriceSheet}
                      disabled={psSaving}
                      style={{ ...S.inp, background: '#2a0a4a', color: '#c8a0ff', border: '1px solid #a6f4', fontWeight: 700, cursor: 'pointer', flex: 1 }}
                    >
                      {psSaving ? 'Saving…' : '💾 Save to Price Sheets'}
                    </button>
                    <button
                      onClick={() => setPsReview(null)}
                      style={{ ...S.inp, background: '#1a1a28', color: '#667', border: '1px solid #333', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '18%' }} />
                      <col />
                      <col style={{ width: 70 }} />
                      <col style={{ width: 36 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a1a28', background: '#0d0d1a' }}>
                        {['Group', 'Item #', 'Description', 'Price', ''].map(h => (
                          <th key={h} style={{ padding: '6px 8px', fontSize: 10, color: '#556', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {psReview.rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid #111118' }}>
                          <td style={{ padding: '3px 4px' }}>
                            <input value={row.p} onChange={e => setPsReview(r => { const rows = [...r.rows]; rows[ri] = { ...rows[ri], p: e.target.value }; return { ...r, rows }; })}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#bbc', fontSize: 11, outline: 'none' }} />
                          </td>
                          <td style={{ padding: '3px 4px' }}>
                            <input value={row.i} onChange={e => setPsReview(r => { const rows = [...r.rows]; rows[ri] = { ...rows[ri], i: e.target.value }; return { ...r, rows }; })}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#667', fontFamily: 'monospace', fontSize: 11, outline: 'none' }} />
                          </td>
                          <td style={{ padding: '3px 4px', wordBreak: 'break-word' }}>
                            <input value={row.d} onChange={e => setPsReview(r => { const rows = [...r.rows]; rows[ri] = { ...rows[ri], d: e.target.value }; return { ...r, rows }; })}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#bbc', fontSize: 11, outline: 'none' }} />
                          </td>
                          <td style={{ padding: '3px 4px' }}>
                            <input type="number" value={row.f} onChange={e => setPsReview(r => { const rows = [...r.rows]; rows[ri] = { ...rows[ri], f: Number(e.target.value) }; return { ...r, rows }; })}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#6f6', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                            <button onClick={() => setPsReview(r => ({ ...r, rows: r.rows.filter((_, i) => i !== ri) }))}
                              style={{ background: 'none', border: 'none', color: '#f44', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : ("""

# Insert the review screen at the start of the prices body, wrap existing in else
new_prices_body = REVIEW_SCREEN + existing_prices_body + '\n            )}'

src = (
    src[:prices_body_start]
    + new_prices_body
    + '\n        )}'
    + src[close_tag_end:]
)

with open('src/components/Tracker.tsx', 'w') as f:
    f.write(src)

print('Patch applied.')
# Quick sanity checks
assert "import { supabase } from '@/lib/supabase';" in src
assert 'const [psReview, setPsReview]' in src
assert 'const [psSaving, setPsSaving]' in src
assert 'const savePriceSheet' in src
assert 'supabase.from(\'price_sheets\').insert' in src
assert 'psReview ? (' in src
print('All assertions passed.')
