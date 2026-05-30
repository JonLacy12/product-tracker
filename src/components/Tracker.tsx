// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { extractBillSheet, fileToBase64 } from '@/lib/extractor';
import { pdfToImages } from '@/lib/pdfToImages';
import { supabase } from '@/lib/supabase';
import { buildCatalogRows } from '@/lib/normalizeCatalog';

const VENDORS = [
  '4Web',
  'Altus',
  'Amplify',
  'BoneStim',
  'Carlsmed',
  'Cellerate',
  'Choice',
  'Curiteva',
  'Eminent',
  'ISTO',
  'MiMedx',
  'Providence Medical Technology',
  'Royal',
  'SpinalSimplicity',
  'Spinewave',
  'Stimulan',
  'Stryker',
  'Xtant',
  'ZavationCorelink',
];
function normalizeVendor(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  return VENDORS.find((v) => {
    const vl = v.toLowerCase();
    return vl.includes(lower) || lower.includes(vl);
  }) ?? trimmed;
}
// Spinewave — Northside Health GA — 2026 pricing (Preferred/contracted column)
// Source: Northside_Health-GA_Spine_Wave_Pricing PDF (38 pp). f = Preferred Pricing.
// 2532 rows across 22 product families. Generated; do not hand-edit.


// Searches all hardcoded price catalogs by item number.
// Returns catalog price + matched vendor name, or null if not in any catalog.
// Checks user-added overrides (passed in) before the hardcoded seed catalogs.
const SYSTEMS = {
  test: {
    label: 'Test',
    prefix: 'goodole2026',
    facilities: ['Northside'],
    csv: 'Test_Products_2026.csv',
    color: '#f80',
  },
  kancherla: {
    label: 'Kancherla',
    prefix: 'kancherla',
    facilities: ['Northside'],
    csv: 'Kancherla_Products_2026.csv',
    color: '#0f0',
  },
  burch: {
    label: 'Burch',
    prefix: 'burch',
    facilities: ['Northside'],
    csv: 'Burch_Products_2026.csv',
    color: '#6af',
  },
};
const fmt = (n) =>
  '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lineTotal = (e) => (Number(e.cost) || 0) * (Number(e.quantity) || 1);
const canonicalProductName = (raw) =>
  (raw || '').replace(/(\d[\d.]*)\s*[xX]\s*(\d)/g, '$1 x $2').replace(/\s+/g, ' ').trim();
const canonicalProductKey = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/(\d)\s*x\s*(\d)/g, '$1x$2')   // normalize "6.5 x 50" -> "6.5x50"
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .trim()
    .replace(/[^a-z0-9]/g, '')               // remove spaces/punctuation for the key
    .replace(/s$/, '');                      // ignore trailing plurals
export default function Tracker() {
  const [sys, setSys] = useState('test');
  const [sysReady, setSysReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('prodtracker-active-system');
        if (r && SYSTEMS[r.value]) setSys(r.value);
      } catch {}
      setSysReady(true);
    })();
  }, []);
  const CFG = SYSTEMS[sys];
  const sk = (key) => CFG.prefix + '-' + key;
  async function loadData() {
    try {
      const r = await window.storage.get(sk('products-v3'), true);
      return JSON.parse(r.value);
    } catch {
      return null;
    }
  }
  async function saveData(d) {
    try {
      await window.storage.set(sk('products-v3'), JSON.stringify(d), true);
      return true;
    } catch {
      return false;
    }
  }
  const switchSys = async (newSys) => {
    if (newSys === sys) return;
    try {
      await window.storage.set('prodtracker-active-system', newSys);
    } catch {}
    setSys(newSys);
    setEntries([]);
    setStatus('loading');
    setPoImages({});
    setBsImages({});
    setCommRates([]);
    setCommReports([]);
    setCommDocs({});
  };
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('products');
  const [vf, setVf] = useState('All');
  const [ff, setFf] = useState('All');
  const [yearF, setYearF] = useState('All');
  const [monthF, setMonthF] = useState('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date-asc');
  const [status, setStatus] = useState('loading');
  const [note, setNote] = useState(null);
  const [form, setForm] = useState({
    vendor: '',
    date: '',
    cost: '',
    case_label: '',
    facility: 'Northside',
    productName: '',
    productNumber: '',
    description: '',
    quantity: 1,
    submittedBy: '',
  });
  const [psVendor, setPsVendor] = useState('Xtant');
  const [psFac, setPsFac] = useState('Northside');
  const [psQ, setPsQ] = useState('');
  const [psReview, setPsReview] = useState(null); // { rows, vendor, label, facility }
  const [psSaving, setPsSaving] = useState(false);
  const [savedSheets, setSavedSheets] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [openPatients, setOpenPatients] = useState({});
  const [poImages, setPoImages] = useState({});
  const [bsImages, setBsImages] = useState({});
  const [viewingPO, setViewingPO] = useState(null);
  const poFileRef = useRef(null);
  const [poTarget, setPoTarget] = useState(null);

  const [snapOpen, setSnapOpen] = useState(false);
  const [snapForm, setSnapForm] = useState({ case_label: '', date: '', vendor: '', docType: 'bs' });
  const [inbox, setInbox] = useState([]);
  const inboxRef = useRef(null);
  const snapFileRef = useRef(null);
  const psUploadRef = useRef(null);
  const [sumMonth, setSumMonth] = useState('all');
  const [extracting, setExtracting] = useState(false);
  const [extractDone, setExtractDone] = useState(0);
  const [extractTotal, setExtractTotal] = useState(0);
  const [reviewData, setReviewData] = useState(null);
  const [reviewSubmittedBy, setReviewSubmittedBy] = useState('');
  const [reviewCaseLabel, setReviewCaseLabel] = useState('');
  // Commission system
  const [commRates, setCommRates] = useState([]);
  const [commReports, setCommReports] = useState([]);
  const [commDocs, setCommDocs] = useState({});
  const [commView, setCommView] = useState('reconcile');
  const [commVf, setCommVf] = useState('All');
  const [commMf, setCommMf] = useState('all');
  const [crForm, setCrForm] = useState({
    vendor: '',
    type: 'flat',
    pct: '',
    product: '',
    perProduct: [],
  });
  const [clForm, setClForm] = useState({
    vendor: '',
    date: '',
    product: '',
    saleAmount: '',
    commPaid: '',
    note: '',
  });
  const commDocRef = useRef(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewingBS, setViewingBS] = useState(null); // { url, fileType }
  const DEFAULT_COMM_RATES = [
    { vendor: 'Amplify', type: 'flat', pct: 45, perProduct: [] },
    { vendor: '4WEB', type: 'per-product', pct: 50, perProduct: [{ product: 'TLIF', pct: 60 }] },
    { vendor: 'Altus', type: 'flat', pct: 55, perProduct: [] },
    { vendor: 'Spinewave', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'Choice', type: 'per-product', pct: 35, perProduct: [{ product: 'SIJ', pct: 40 }] },
    {
      vendor: 'Royal',
      type: 'per-product',
      pct: 50,
      perProduct: [
        { product: 'Magnus', pct: 40 },
        { product: 'MaxxCell', pct: 40 },
      ],
    },
    { vendor: 'Xtant', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'MiMedx', type: 'flat', pct: 35, perProduct: [] },
    { vendor: 'Cellerate', type: 'flat', pct: 30, perProduct: [] },
    { vendor: 'Stimulan', type: 'flat', pct: 25, perProduct: [] },
    { vendor: 'CoreLink', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'Curiteva', type: 'flat', pct: 30, perProduct: [] },
    {
      vendor: 'Providence',
      type: 'per-product',
      pct: 25,
      perProduct: [{ product: 'Bonus (100k+)', pct: 30 }],
    },
  ];
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(sk('comm-rates'), true);
        if (r) {
          const parsed = JSON.parse(r.value);
          if (parsed.length > 0) {
            setCommRates(parsed);
            return;
          }
        }
      } catch {}
      setCommRates(DEFAULT_COMM_RATES);
      try {
        await window.storage.set(sk('comm-rates'), JSON.stringify(DEFAULT_COMM_RATES), true);
      } catch {}
    })();
  }, [sys]);
  useEffect(() => {
    (async () => {
      try {
        const r2 = await window.storage.get(sk('comm-reports'), true);
        if (r2) setCommReports(JSON.parse(r2.value));
      } catch {}
      try {
        const r3 = await window.storage.get(sk('comm-docs'), true);
        if (r3) setCommDocs(JSON.parse(r3.value));
      } catch {}
      try {
        const r4 = await window.storage.get(sk('inbox'), true);
        if (r4) setInbox(JSON.parse(r4.value));
      } catch {}
    })();
  }, [sys]);
  const saveCommRates = async (d) => {
    setCommRates(d);
    try {
      await window.storage.set(sk('comm-rates'), JSON.stringify(d), true);
    } catch {}
  };
  const saveCommReports = async (d) => {
    setCommReports(d);
    try {
      await window.storage.set(sk('comm-reports'), JSON.stringify(d), true);
    } catch {}
  };
  const saveCommDocs = async (d) => {
    setCommDocs(d);
    try {
      await window.storage.set(sk('comm-docs'), JSON.stringify(d), true);
    } catch {}
  };
  const saveInbox = async (d) => {
    setInbox(d);
    try {
      await window.storage.set(sk('inbox'), JSON.stringify(d), true);
    } catch {}
  };
  const handleInboxUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const updated = [...inbox];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          updated.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
            status: 'pending',
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await saveInbox(updated);
    e.target.value = '';
    notify(`${files.length} bill sheet(s) uploaded — send to Claude in chat for extraction`);
  };
  const getRate = (vendor, product) => {
    const vr = commRates.find((r) => r.vendor === vendor);
    if (!vr) return null;
    if (vr.type === 'per-product' && vr.perProduct?.length > 0) {
      const lp = (product || '').toLowerCase();
      const pp = vr.perProduct.find((p) => lp.includes(p.product.toLowerCase()));
      return pp ? pp.pct : vr.pct || null;
    }
    return vr.pct || null;
  };
  const vendorMatches = (a, b) => {
    const x = (a || '').toLowerCase().trim();
    const y = (b || '').toLowerCase().trim();
    return !!x && !!y && (x.includes(y) || y.includes(x));
  };
  const lookupCanonicalProduct = (vendor, itemNumber) => {
    const iNum = (itemNumber || '').trim().toLowerCase();
    if (!iNum) return null;
    for (const sheet of savedSheets) {
      if (!vendorMatches(sheet.vendor, vendor)) continue;
      const match = (sheet.rows || []).find((r) => (r.i || '').trim().toLowerCase() === iNum);
      if (match) return match;
    }
    return null;
  };
  // DB-first price lookup: overrides -> Supabase price sheets -> hardcoded fallback
  const lookupCatalogPriceDB = (vendor, itemNumber, facility, overrides = []) => {
    if (!itemNumber) return null;
    const normItem = String(itemNumber).trim().toUpperCase().replace(/\s+/g, '');
    const normFacility = (facility || '').trim();
    let exactMatch = null;
    let fallbackMatch = null;
    for (const ov of overrides) {
      if (String(ov.item_number || '').trim().toUpperCase().replace(/\s+/g, '') !== normItem) continue;
      const ovFacility = (ov.facility || '').trim();
      if (!ovFacility) {
        if (!fallbackMatch) fallbackMatch = ov;
      } else if (ovFacility === normFacility) {
        exactMatch = ov;
        break;
      }
    }
    const ovHit = exactMatch || fallbackMatch;
    if (ovHit) return { price: ovHit.price, matchedVendor: ovHit.vendor, source: 'override' };
    const norm = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
    if (vendor) {
      for (const sh of savedSheets) {
        if (!vendorMatches(sh.vendor, vendor)) continue;
        const m = (sh.rows || []).find((x) => norm(x.i) === normItem);
        if (m) return { price: m.f, matchedVendor: sh.vendor };
      }
    }
    for (const sh of savedSheets) {
      const m = (sh.rows || []).find((x) => norm(x.i) === normItem);
      if (m) return { price: m.f, matchedVendor: sh.vendor };
    }
    return null;
  };
  const handleCommDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const updated = { ...commDocs };
    const vendor = clForm.vendor || 'General';
    if (!updated[vendor]) updated[vendor] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          updated[vendor].push({
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await saveCommDocs(updated);
    e.target.value = '';
    notify(`${files.length} commission doc(s) attached to ${vendor}`);
  };
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(sk('po-images'), true);
        if (r) setPoImages(JSON.parse(r.value));
      } catch {}
      try {
        const r2 = await window.storage.get(sk('bs-images'), true);
        if (r2) setBsImages(JSON.parse(r2.value));
      } catch {}
    })();
  }, [sys]);
  const savePOs = async (updated) => {
    setPoImages(updated);
    try {
      await window.storage.set(sk('po-images'), JSON.stringify(updated), true);
    } catch {}
  };
  const saveBSs = async (updated) => {
    setBsImages(updated);
    try {
      await window.storage.set(sk('bs-images'), JSON.stringify(updated), true);
    } catch {}
  };
  const [catalogOverrides, setCatalogOverrides] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(sk('catalog-overrides-v1'), true);
        if (r) setCatalogOverrides(JSON.parse(r.value));
      } catch {}
    })();
  }, [sys]);
  const addCatalogOverride = async (entry) => {
    const newEntry = { ...entry, addedAt: new Date().toISOString() };
    setCatalogOverrides((prev) => {
      const updated = [...prev, newEntry];
      window.storage.set(sk('catalog-overrides-v1'), JSON.stringify(updated), true).catch(() => {});
      return updated;
    });
  };
  const handlePOUpload = async (e) => {
    if (!poTarget) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPOs = { ...poImages };
    if (!newPOs[poTarget]) newPOs[poTarget] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          newPOs[poTarget].push({
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await savePOs(newPOs);
    setPoTarget(null);
    e.target.value = '';
    notify(`${files.length} PO(s) attached`);
  };
  const launchBSScan = async (targetKey = '') => {
    const [preCaseLabel, preDate, preVendor] = (targetKey || '||').split('|');
    let photos;
    try {
      const result = await Camera.pickImages({ quality: 80, limit: 0 });
      photos = result.photos;
    } catch {
      notify('Camera unavailable or cancelled', false);
      return;
    }
    if (!photos?.length) return;
    setExtracting(true);
    setExtractDone(0);
    setExtractTotal(photos.length);
    const results = await Promise.all(
      photos.map(async (photo) => {
        const fileName = `scan.${photo.format || 'jpg'}`;
        try {
          const blob = await fetch(photo.webPath).then((r) => r.blob());
          const mimeType = blob.type || `image/${photo.format || 'jpeg'}`;
          const file = new File([blob], fileName, { type: mimeType });
          const base64 = await fileToBase64(file);
          const sheet = await extractBillSheet(base64, mimeType);
          setExtractDone((d) => d + 1);
          const normalizedFacility = normalizeFacility(sheet.facility, form.facility);
          return {
            fileName,
            file,
            error: null,
            sheet: {
              facility: normalizedFacility,
              date: sheet.date || preDate || '',
              case_label: preCaseLabel || '',
              items: (sheet.items || []).map((item) => {
                const ocrCost = item.cost ?? 0;
                const catalogResult = lookupCatalogPriceDB(
                  item.vendor || preVendor,
                  item.item_number,
                  normalizedFacility,
                  catalogOverrides,
                );
                return {
                  checked: true,
                  vendor: item.vendor || preVendor || '',
                  product_name: item.product_name || '',
                  item_number: item.item_number || '',
                  lot_number: item.lot_number || '',
                  description: item.description || '',
                  quantity: item.quantity ?? 1,
                  cost: catalogResult ? catalogResult.price : ocrCost,
                  ocrCost,
                  priceSource: catalogResult ? 'catalog' : 'ocr',
                };
              }),
            },
          };
        } catch (err) {
          setExtractDone((d) => d + 1);
          return { fileName, file: null, error: String(err.message || err), sheet: null };
        }
      })
    );
    setExtracting(false);
    setReviewData(results);
  };
  const handlePSUpload = async (e) => {
    const CONCURRENCY = 6;
    const MAX_PAGES = 25;
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    setExtracting(true);
    setExtractDone(0);
    setExtractTotal(files.length);

    // Collect raw price-sheet items across all pages/files
    const allItems = [];
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
            try { return await extractBillSheet(b64, 'image/jpeg', 'price-sheet'); } catch { return null; }
          }));
          for (const sheet of batchSheets) {
            if (!sheet) continue;
            if (sheet.vendor && !guessedVendor) guessedVendor = sheet.vendor;
            for (const item of sheet.items ?? []) allItems.push(item);
          }
          setExtractDone(d => d + batch.length);
        }
      } else {
        try {
          const base64 = await fileToBase64(file);
          const sheet = await extractBillSheet(base64, file.type || 'image/jpeg', 'price-sheet');
          if (sheet.vendor && !guessedVendor) guessedVendor = sheet.vendor;
          for (const item of sheet.items ?? []) allItems.push(item);
        } catch { /* silent */ }
        setExtractDone(d => d + 1);
      }
    }

    setExtracting(false);
    const result = buildCatalogRows(allItems);
    if (!result.rows.length) { notify('No items extracted — try a clearer image', false); return; }
    setPsReview({
      rows: result.rows,
      groups: result.groups,
      dropped: result.dropped,
      vendor: guessedVendor,
      label: guessedLabel.replace(/\.[^.]+$/, ''),
      facility: psFac,
    });
  };
  const fetchSavedSheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('price_sheets')
        .select('id, vendor, label, facility, rows')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setSavedSheets(data);
    } catch {}
  };
  useEffect(() => {
    if (tab === 'prices') fetchSavedSheets();
  }, [tab]);
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
      fetchSavedSheets();
    } catch (err) {
      notify(`Save failed: ${err?.message ?? err}`, false);
    } finally {
      setPsSaving(false);
    }
  };
  const updateReviewSheet = (si, field, value) =>
    setReviewData((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], sheet: { ...next[si].sheet, [field]: value } };
      return next;
    });
  const updateReviewItem = (si, ii, field, value) =>
    setReviewData((prev) => {
      const next = [...prev];
      const items = [...next[si].sheet.items];
      items[ii] = { ...items[ii], [field]: value };
      next[si] = { ...next[si], sheet: { ...next[si].sheet, items } };
      return next;
    });
  const deleteReviewItem = (si, ii) =>
    setReviewData((prev) => {
      const next = [...prev];
      const items = next[si].sheet.items.filter((_, i) => i !== ii);
      next[si] = { ...next[si], sheet: { ...next[si].sheet, items } };
      return next;
    });
  const discardReviewResult = (si) =>
    setReviewData((prev) => prev.filter((_, i) => i !== si));
  // Maps fuzzy facility strings returned by OCR to canonical app values.
  // Add future facilities here (e.g. Forsyth, Cherokee, Duluth, Lawrenceville) as needed.
  const normalizeFacility = (_raw, _fallback) => 'Northside';
  const saveExtracted = async () => {
    // Snapshot BEFORE clearing state — setReviewData is async and reading
    // reviewData afterward yields the cleared value, skipping uploads.
    const snapshot = reviewData;
    setReviewData(null);

    // Fetch auth user once; if unavailable, uploads are skipped (ids stay null).
    let authUser = null;
    try { ({ data: { user: authUser } } = await supabase.auth.getUser()); } catch {}

    // Upload each result's file and obtain a bill_sheets row id.
    // Failures are non-blocking: set that slot to null and continue.
    const billSheetIds = [];
    for (const result of snapshot) {
      if (!result.file || !result.sheet || !authUser) {
        billSheetIds.push(null);
        continue;
      }
      try {
        const file = result.file;
        const ext = file.type.includes('pdf') ? 'pdf' : file.type.includes('png') ? 'png' : 'jpg';
        const uid_part = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
        const path = `${authUser.id}/${uid_part}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('bill-sheets')
          .upload(path, file, { contentType: file.type });
        if (uploadErr) {
          notify('Bill sheet attach error: ' + (uploadErr.message || String(uploadErr)), false);
          billSheetIds.push(null);
          continue;
        }
        const { data: bsRow, error: insertErr } = await supabase
          .from('bill_sheets')
          .insert({
            file_path: path,
            file_type: file.type,
            facility: result.sheet.facility || '',
            date: result.sheet.date || form.date || '',
            case_label: reviewCaseLabel || result.sheet.case_label || '',
          })
          .select()
          .single();
        if (insertErr) {
          notify('Bill sheet attach error: ' + (insertErr.message || String(insertErr)), false);
          billSheetIds.push(null);
          continue;
        }
        billSheetIds.push(bsRow?.id ?? null);
      } catch (err) {
        notify('Bill sheet attach error: ' + (err && err.message ? err.message : String(err)), false);
        billSheetIds.push(null);
      }
    }

    // Build entries from the snapshot, each carrying the id for its source result.
    const newEntries = [];
    snapshot.forEach((result, ri) => {
      if (!result.sheet) return;
      const { facility, date, case_label, items } = result.sheet;
      for (const item of items) {
        if (!item.checked) continue;
        const entryVendor = normalizeVendor(item.vendor || '');
        const catalogMatch = lookupCanonicalProduct(entryVendor, item.item_number);
        newEntries.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          vendor: entryVendor,
          facility: normalizeFacility(facility, form.facility),
          date: date || form.date,
          cost: Number(item.cost) || 0,
          case_label: reviewCaseLabel || case_label || '',
          productName: catalogMatch ? catalogMatch.d : (item.product_name || ''),
          productNumber: item.item_number || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          dateSubmitted: new Date().toISOString().slice(0, 10),
          submittedBy: reviewSubmittedBy || form.submittedBy || '',
          bill_sheet_id: billSheetIds[ri] ?? null,
        });
      }
    });

    if (newEntries.length === 0) return;

    await save([...entries, ...newEntries], null);
    setReviewSubmittedBy('');
    setReviewCaseLabel('');
    notify(`${newEntries.length} item${newEntries.length !== 1 ? 's' : ''} saved`);
  };
  const notify = (m, ok = true) => {
    setNote({ m, ok });
    setTimeout(() => setNote(null), 3000);
  };
  useEffect(() => {
    (async () => {
      try {
        const s = await loadData();
        if (s && s.length > 0) {
          const normalized = s.map((e) => {
            const nv = normalizeVendor(e.vendor);
            return nv !== e.vendor ? { ...e, vendor: nv } : e;
          });
          setEntries(normalized);
          if (normalized.some((e, i) => e !== s[i])) await saveData(normalized);
        }
        setStatus('connected');
      } catch {
        setEntries([]);
        setStatus('offline');
      }
    })();
  }, [sys]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (status !== 'connected') return;
      try {
        const s = await loadData();
        if (s && s.length !== entries.length) setEntries(s);
      } catch {}
    }, 30000);
    return () => clearInterval(t);
  }, [status, entries.length]);
  const save = async (u, m) => {
    const chrono = [...u].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    setEntries(chrono);
    await saveData(chrono);
    if (m) notify(m);
  };
  const refresh = async () => {
    try {
      const s = await loadData();
      if (s) {
        setEntries(s);
        notify('Refreshed — ' + s.length + ' items');
      }
    } catch {
      notify('Failed', false);
    }
  };
  const lookup = (item, fac) => {
    for (const sh of savedSheets) {
      const m = (sh.rows || []).find((x) => String(x.i).trim() === String(item).trim());
      if (m) return m.f;
    }
    return null;
  };
  const pick = (item) => {
    const price = lookup(item.i, form.facility);
    setForm((f) => ({
      ...f,
      productName: item.p,
      productNumber: item.i,
      description: item.d,
      cost: price || item.f,
    }));
    setTab('add');
    notify(`${item.d} — ${fmt(price || item.f)} (${form.facility})`);
  };
  const add = async () => {
    if (
      !form.vendor ||
      !form.date ||
      !form.cost ||
      !form.productName ||
      !form.facility
    ) {
      notify('Fill all required fields', false);
      return;
    }
    const e = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      vendor: normalizeVendor(form.vendor),
      facility: form.facility,
      date: form.date,
      cost: Number(form.cost),
      case_label: form.case_label,
      productName: form.productName,
      productNumber: form.productNumber,
      description: form.description,
      quantity: Number(form.quantity) || 1,
      dateSubmitted: new Date().toISOString().slice(0, 10),
      submittedBy: form.submittedBy || '',
    };
    await save([...entries, e], `Added: ${e.productName} — ${e.facility} — ${fmt(e.cost)}`);
    setForm((f) => ({
      ...f,
      cost: '',
      case_label: '',
      productName: '',
      productNumber: '',
      description: '',
      quantity: 1,
    }));
  };
  const del = async (id) => {
    if (!window.confirm('Archive this entry? You can restore it later.')) return;
    const e = entries.find((x) => x.id === id);
    const updated = entries.map((x) => x.id === id ? { ...x, archived_at: new Date().toISOString() } : x);
    await save(updated, `Archived: ${e?.productName || 'entry'}`);
  };
  const clearAll = async () => {
    const active = entries.filter((e) => !e.archived_at);
    if (!active.length) return;
    if (!window.confirm(`Archive all ${active.length} test products? You can restore them from the archive.`)) return;
    const now = new Date().toISOString();
    const updated = entries.map((e) => e.archived_at ? e : { ...e, archived_at: now });
    await save(updated, `Archived all ${active.length} entries`);
  };
  const restoreEntry = async (id) => {
    const e = entries.find((x) => x.id === id);
    const updated = entries.map((x) => x.id === id ? { ...x, archived_at: null } : x);
    await save(updated, `Restored: ${e?.productName || 'entry'}`);
  };
  const permanentlyDelete = async (id) => {
    if (!window.confirm('Permanently delete this entry? This cannot be undone.')) return;
    const e = entries.find((x) => x.id === id);
    await save(entries.filter((x) => x.id !== id), `Deleted: ${e?.productName || 'entry'}`);
  };
  const purgeArchived = async () => {
    const archived = entries.filter((e) => e.archived_at);
    if (!window.confirm(`Permanently delete all ${archived.length} archived entries? This cannot be undone.`)) return;
    await save(entries.filter((e) => !e.archived_at), `Purged ${archived.length} archived entries`);
  };
  const openBillSheet = async (billSheetId) => {
    try {
      const { data: bsRow, error: fetchErr } = await supabase
        .from('bill_sheets')
        .select('file_path, file_type')
        .eq('id', billSheetId)
        .single();
      if (fetchErr || !bsRow) { notify('Could not load attachment', false); return; }
      const { data: signed, error: urlErr } = await supabase.storage
        .from('bill-sheets')
        .createSignedUrl(bsRow.file_path, 300);
      if (urlErr || !signed?.signedUrl) { notify('Could not generate file URL', false); return; }
      setViewingBS({ url: signed.signedUrl, fileType: bsRow.file_type });
    } catch {
      notify('Could not open attachment', false);
    }
  };
  const csv = () => {
    const c =
      'Vendor,Facility,Date,Cost,Case Label,Product,Item#,Description,Qty,Extended,DateSubmitted,SubmittedBy\n' +
      activeEntries
        .map(
          (e) =>
            `"${e.vendor}","${e.facility}","${e.date}",${e.cost},"${e.case_label || ''}","${e.productName}","${e.productNumber || ''}","${e.description || ''}",${e.quantity || 1},${lineTotal(e)},"${e.dateSubmitted || ''}","${e.submittedBy || ''}"`
        )
        .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([c], { type: 'text/csv' }));
    a.download = CFG.csv;
    a.click();
    notify('CSV downloaded!');
  };
  const dlFile = (content, filename) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    a.download = filename;
    a.click();
  };
  const exportRates = () => {
    const rows = ['Vendor,Type,Default %,Product-Specific Rates'];
    commRates.forEach((r) => {
      const ppStr = (r.perProduct || []).map((p) => `${p.product}: ${p.pct}%`).join(' | ');
      rows.push(`"${r.vendor}","${r.type}",${r.pct},"${ppStr}"`);
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Rates.csv');
    notify('Rates exported!');
  };
  const exportReports = () => {
    const rows = ['Vendor,Date,Product,Sale Amount,Commission Paid,Note,Added'];
    commReports.forEach((r) => {
      rows.push(
        `"${r.vendor}","${r.date}","${r.product || ''}",${r.saleAmount || 0},${r.commPaid},"${r.note || ''}","${r.addedAt || ''}"`
      );
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Reports.csv');
    notify('Reports exported!');
  };
  const exportReconciliation = () => {
    const rows = [
      'Status,Vendor,Date,Product,Sale Amount,Rate %,Expected Commission,Received Commission,Difference,Case Label',
    ];
    const fe = activeEntries.filter(
      (e) =>
        (commVf === 'All' || e.vendor === commVf) &&
        (commMf === 'all' ||
          !e.date ||
          new Date(e.date).getFullYear() +
            '-' +
            String(new Date(e.date).getMonth() + 1).padStart(2, '0') ===
            commMf)
    );
    const cr = commReports.filter(
      (r) =>
        (commVf === 'All' || r.vendor === commVf) &&
        (commMf === 'all' ||
          !r.date ||
          new Date(r.date).getFullYear() +
            '-' +
            String(new Date(r.date).getMonth() + 1).padStart(2, '0') ===
            commMf)
    );
    const matchedIds = new Set();
    fe.forEach((e) => {
      const rate = getRate(e.vendor, e.productName);
      const exp = rate ? (lineTotal(e) * rate) / 100 : 0;
      const match = cr.find(
        (r) =>
          r.vendor === e.vendor &&
          r.date === e.date &&
          !matchedIds.has(r.id) &&
          (r.product?.toLowerCase().includes(e.productName?.toLowerCase().slice(0, 8)) ||
            Math.abs(r.saleAmount - lineTotal(e)) < 1)
      );
      let status = 'Missing',
        received = 0;
      if (match) {
        matchedIds.add(match.id);
        received = match.commPaid;
        status = !rate
          ? 'No Rate'
          : Math.abs(received - exp) < 1
            ? 'Match'
            : received < exp
              ? 'Underpaid'
              : 'Overpaid';
      } else {
        status = rate ? 'Missing' : 'No Rate';
      }
      const diff = received - exp;
      rows.push(
        `"${status}","${e.vendor}","${e.date}","${e.productName}",${lineTotal(e)},${rate || 0},${exp.toFixed(2)},${received.toFixed(2)},${diff.toFixed(2)},"${e.case_label || ''}"`
      );
    });
    cr.filter((r) => !matchedIds.has(r.id)).forEach((r) => {
      rows.push(
        `"Unmatched","${r.vendor}","${r.date}","${r.product || ''}",${r.saleAmount || 0},0,0,${r.commPaid},${r.commPaid},"—"`
      );
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Reconciliation.csv');
    notify('Reconciliation exported!');
  };
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const activeEntries = entries.filter((e) => !e.archived_at);
  const allYears = [...new Set(activeEntries.map((e) => e.date?.slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const monthsInYear = [...new Set(
    activeEntries
      .filter((e) => yearF === 'All' || e.date?.startsWith(yearF))
      .map((e) => e.date?.slice(5, 7))
      .filter(Boolean)
  )].sort();
  let fil = activeEntries;
  if (yearF !== 'All') fil = fil.filter((e) => e.date?.startsWith(yearF));
  if (monthF !== 'All') fil = fil.filter((e) => e.date?.slice(5, 7) === monthF);
  if (vf !== 'All') fil = fil.filter((e) => e.vendor === vf);
  if (ff !== 'All') fil = fil.filter((e) => e.facility === ff);
  if (q) {
    const lq = q.toLowerCase();
    fil = fil.filter((e) =>
      [e.productName, e.productNumber, e.case_label, e.description, e.vendor, e.facility].some((x) =>
        x?.toLowerCase().includes(lq)
      )
    );
  }
  if (sort === 'date-desc')
    fil = [...fil].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  else if (sort === 'date-asc')
    fil = [...fil].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  else if (sort === 'cost-desc') fil = [...fil].sort((a, b) => lineTotal(b) - lineTotal(a));
  else if (sort === 'vendor') fil = [...fil].sort((a, b) => a.vendor.localeCompare(b.vendor));
  const total = activeEntries.reduce((s, e) => s + lineTotal(e), 0);
  const uv = [...new Set(activeEntries.map((e) => e.vendor))];
  const up = [...new Set(activeEntries.map((e) => e.productName).filter(Boolean))].length;
  const allVendors = [...new Set(savedSheets.map((s) => s.vendor))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  const psFacilities = [...new Set(savedSheets.filter((s) => s.vendor === psVendor).map((s) => s.facility))];
  let sheet = null;
  {
    const sv =
      savedSheets.find((s) => s.vendor === psVendor && s.facility === psFac) ||
      savedSheets.find((s) => s.vendor === psVendor);
    if (sv) sheet = { label: sv.label, data: sv.rows };
  }
  let sd = sheet?.data || [];
  if (sd.length > 0) {
    sd = sd.map((row) => ({
      ...row,
      p: row.p?.trim() || (row.d ? row.d.split(',')[0].trim() : 'Uncategorized'),
    }));
  }
  if (psQ) {
    const lq = psQ.toLowerCase();
    sd = sd.filter(
      (x) =>
        x.p.toLowerCase().includes(lq) ||
        x.i.toLowerCase().includes(lq) ||
        x.d.toLowerCase().includes(lq)
    );
  }
  const groups = [...new Set(sd.map((x) => x.p))].sort((a, b) =>
    (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' }),
  );
  const S = {
    inp: {
      padding: '10px 13px',
      borderRadius: 8,
      border: '1px solid #2a2a35',
      background: '#0e0e18',
      color: '#eee',
      fontSize: 13,
      fontFamily: 'inherit',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    card: {
      background: '#0e0e18',
      borderRadius: 12,
      border: '1px solid #1a1a28',
      padding: '16px 18px',
    },
  };
  const fc = (_f) => '#f0a';
  const fl = (_f) => 'NS';
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080e',
        color: '#ddd',
        fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
        fontSize: 14,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn .2s ease-out both}.hr:hover{background:rgba(80,160,255,.04)!important}.hb:hover{filter:brightness(1.2)}*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{max-width:100%!important;box-sizing:border-box!important}input[type="date"]{-webkit-appearance:none!important;appearance:none!important;min-width:0!important;width:100%!important;box-sizing:border-box!important}input[type="date"]::-webkit-date-and-time-value{text-align:center;margin:0}input[type="date"]::-webkit-calendar-picker-indicator{margin:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:2px}select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23556' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:30px!important}`}</style>
      {note && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 8px)',
            right: 'calc(env(safe-area-inset-right) + 12px)',
            zIndex: 999,
            padding: '10px 18px',
            borderRadius: 10,
            background: note.ok ? '#0a2a1a' : '#2a1a0a',
            border: `1px solid ${note.ok ? '#2d5a3d' : '#5a3d2d'}`,
            color: note.ok ? '#6f6' : '#fa6',
            fontSize: 13,
            fontWeight: 600,
            animation: 'slideIn .2s ease-out',
            maxWidth: 360,
          }}
        >
          {note.ok ? '✓' : '!'} {note.m}
        </div>
      )}
      <div
        style={{
          borderBottom: '1px solid #1a1a28',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: CFG.color }}>◆</span> Product Tracker
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#445',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {activeEntries.length} items · {up} products · {fmt(total)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 700,
                background: status === 'connected' ? '#0a1a0a' : '#1a0a0a',
                color: status === 'connected' ? '#4f4' : '#f66',
                border: `1px solid ${status === 'connected' ? '#1e3e1e' : '#3e1e1e'}`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: status === 'connected' ? '#4f4' : '#f44',
                }}
              />
              {status === 'connected' ? 'SHARED' : 'LOCAL'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={sys}
            onChange={(e) => switchSys(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid ' + CFG.color + '44',
              background: '#0e0e18',
              color: CFG.color,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              appearance: 'none',
              paddingRight: 24,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23556' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            {Object.entries(SYSTEMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            className="hb"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a35',
              background: '#0e0e18',
              color: '#6af',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            🔄
          </button>
          <button
            onClick={csv}
            className="hb"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #2a2a35',
              background: '#0e0e18',
              color: '#6af',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ⬇ CSV
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 20,
            background: '#0e0e18',
            borderRadius: 10,
            padding: 3,
            width: 'fit-content',
            flexWrap: 'wrap',
          }}
        >
          {[
            { k: 'products', l: 'Products', e: '📦' },
            { k: 'add', l: 'Add', e: '➕' },
            { k: 'patients', l: 'Cases', e: '🗂️' },
            { k: 'mimedx', l: 'MiMedx', e: '🩹' },
            { k: 'commission', l: 'Commission', e: '💵' },
            { k: 'prices', l: 'Price Sheets', e: '💰' },
            { k: 'vendors', l: 'Vendors', e: '🏢' },
            { k: 'summary', l: 'Summary', e: '📊' },
            { k: 'archive', l: 'Archive', e: '🗄️' },
            { k: 'emails', l: 'Emails', e: '📧' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="hb"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: tab === t.k ? '#1a1a2a' : 'transparent',
                color: tab === t.k ? '#fff' : '#556',
              }}
            >
              {t.e} {t.l}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="fade">
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ ...S.inp, maxWidth: 200, background: '#0b0b14' }}
              />
              <select
                value={yearF}
                onChange={(e) => { setYearF(e.target.value); setMonthF('All'); }}
                style={{ ...S.inp, width: 'auto', minWidth: 120 }}
              >
                <option value="All">All Years</option>
                {allYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={monthF}
                onChange={(e) => setMonthF(e.target.value)}
                style={{ ...S.inp, width: 'auto', minWidth: 140 }}
              >
                <option value="All">All Months</option>
                {monthsInYear.map((m) => (
                  <option key={m} value={m}>{MONTH_NAMES[parseInt(m, 10) - 1]}</option>
                ))}
              </select>
              <select
                value={vf}
                onChange={(e) => setVf(e.target.value)}
                style={{ ...S.inp, width: 150 }}
              >
                <option value="All">All Vendors</option>
                {VENDORS.filter((v) => entries.some((e) => e.vendor === v)).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={ff}
                onChange={(e) => setFf(e.target.value)}
                style={{ ...S.inp, width: 170 }}
              >
                <option value="All">All Facilities</option>
                {CFG.facilities.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ ...S.inp, width: 130 }}
              >
                <option value="date-asc">Chronological</option>
                <option value="date-desc">Newest First</option>
                <option value="cost-desc">Cost ↓</option>
                <option value="vendor">Vendor</option>
              </select>
              {sys === 'test' && activeEntries.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{ ...S.inp, background: '#1a0a0a', color: '#f66', border: '1px solid #3e1e1e', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
                >
                  Clear All
                </button>
              )}
              <span style={{ fontSize: 11, color: '#445', marginLeft: 'auto' }}>
                {fil.length} items · {fmt(fil.reduce((s, e) => s + lineTotal(e), 0))}
              </span>
            </div>
            {fil.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                <div style={{ fontWeight: 600 }}>
                  {activeEntries.length === 0 ? 'No products yet' : 'No matches'}
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: 500 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
                    <thead>
                      <tr>
                        {[
                          'FAC',
                          'VENDOR',
                          'DOS',
                          'PRODUCT',
                          'ITEM#',
                          'DESCRIPTION',
                          'QTY',
                          'COST',
                          'CASE LABEL',
                          'DATE SUBMITTED',
                          'BY',
                          '',
                        ].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: '10px 8px',
                              textAlign: 'left',
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#f80',
                              borderBottom: '1px solid #1a1a28',
                              background: '#08080e',
                              position: 'sticky',
                              top: 0,
                              zIndex: 1,
                              letterSpacing: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fil.map((e, i) => (
                        <tr
                          key={e.id || i}
                          className="hr"
                          style={{ borderBottom: '1px solid #0e0e18' }}
                        >
                          <td style={{ padding: '7px 8px' }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 5,
                                background: e.facility === 'Northside' ? '#200020' : '#001a2a',
                                color: fc(e.facility),
                                border: `1px solid ${e.facility === 'Northside' ? '#401040' : '#003050'}`,
                              }}
                            >
                              {fl(e.facility)}
                            </span>
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 12, fontWeight: 600 }}>
                            {e.vendor}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 11,
                              color: '#667',
                              fontFamily: 'monospace',
                            }}
                          >
                            {e.date}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#cdf',
                            }}
                          >
                            {e.productName}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: '#556',
                            }}
                          >
                            {e.productNumber || '—'}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 11,
                              color: '#889',
                              maxWidth: 170,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {e.description || '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 12, textAlign: 'center' }}>
                            {e.quantity || 1}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 13,
                              color: '#6f6',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fmt(e.cost)}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 13 }}>{e.case_label || '—'}</td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 10,
                              color: '#6af',
                              fontFamily: 'monospace',
                            }}
                          >
                            {e.dateSubmitted || '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 11, color: '#9be' }}>
                            {e.submittedBy || '—'}
                          </td>
                          <td style={{ padding: '7px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {e.bill_sheet_id && (
                                <button
                                  onClick={() => openBillSheet(e.bill_sheet_id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                                  title="View bill sheet"
                                >
                                  📎
                                </button>
                              )}
                              <button
                                onClick={() => del(e.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#f44',
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  opacity: 0.3,
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="fade">
            <div style={S.card}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Add Product Entry
              </div>
              <button
                onClick={() => launchBSScan('')}
                className="hb"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg,#7a3ff5,#4a6cf7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                📷 Scan Bill Sheet
              </button>
              <div style={{ fontSize: 11, color: '#556', textAlign: 'center', marginBottom: 16 }}>
                AI extracts all fields — no setup required
              </div>
              <div style={{ fontSize: 11, color: '#445', marginBottom: 14 }}>
                — or enter manually —
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: '#f0a', marginBottom: 4, fontWeight: 700 }}>
                    FACILITY *
                  </div>
                  <select
                    value={form.facility}
                    onChange={(e) => setForm((f) => ({ ...f, facility: e.target.value }))}
                    style={{
                      ...S.inp,
                      borderColor: form.facility === 'Northside' ? '#401040' : '#003050',
                    }}
                  >
                    {CFG.facilities.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    VENDOR *
                  </div>
                  <select
                    value={form.vendor}
                    onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                    style={S.inp}
                  >
                    <option value="">Select...</option>
                    {VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ maxWidth: '60%' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    DATE *
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    CASE LABEL
                  </div>
                  <input
                    placeholder="e.g. Case A, Tue OR"
                    value={form.case_label}
                    onChange={(e) => setForm((f) => ({ ...f, case_label: e.target.value }))}
                    style={S.inp}
                  />
                  <div style={{ fontSize: 9, color: '#445', marginTop: 4 }}>
                    Optional. Do not enter patient identifiers (names, initials, MRN, DOB).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 200px' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    PRODUCT NAME *
                  </div>
                  <input
                    placeholder="e.g. OsteoFactor Pro"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div style={{ flex: '1 1 130px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    ITEM # / REF
                  </div>
                  <input
                    placeholder="e.g. 122010"
                    value={form.productNumber}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, productNumber: e.target.value }));
                      const pr = lookup(e.target.value, form.facility);
                      if (pr) setForm((f) => ({ ...f, cost: pr }));
                    }}
                    style={S.inp}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '3 1 220px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    DESCRIPTION
                  </div>
                  <input
                    placeholder="e.g. 10cc, Syringe 5.0cc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div style={{ flex: '0 0 65px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    QTY
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    style={{ ...S.inp, textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    COST ($) *
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    style={S.inp}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                  />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <div style={{ fontSize: 10, color: '#6af', marginBottom: 4, fontWeight: 700 }}>
                    SUBMITTED BY
                  </div>
                  <input
                    placeholder="Team member name"
                    value={form.submittedBy}
                    onChange={(e) => setForm((f) => ({ ...f, submittedBy: e.target.value }))}
                    style={S.inp}
                  />
                </div>
              </div>
              <button
                onClick={add}
                className="hb"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg,#f80,#e44)',
                }}
              >
                Add Product Entry ↵
              </button>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      const vKey = (form.case_label || '') + '|' + (form.date || '') + '|' + (form.vendor || '');
                      launchBSScan(vKey);
                    }}
                    className="hb"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1px solid #3a1a5a',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#a6f',
                      background: '#1a0a2a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    📋 Scan &amp; attach{form.vendor ? ` to ${form.vendor}` : ''}
                  </button>
                  <button
                    onClick={() => {
                      const vKey = (form.case_label || '') + '|' + (form.date || '') + '|' + (form.vendor || '');
                      setPoTarget(vKey);
                      setTimeout(() => poFileRef.current?.click(), 50);
                    }}
                    className="hb"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1px solid #3a2a15',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#f80',
                      background: '#1a1208',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    📎 PO{form.vendor ? ` to ${form.vendor}` : ''}
                  </button>
                </div>
              <div style={{ fontSize: 11, color: '#445', marginTop: 8 }}>
                💡 Type an item # and cost auto-fills for the selected facility.
                Vendor/date/facility persist for batch entry.
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={poFileRef}
          style={{ display: 'none' }}
          onChange={handlePOUpload}
        />
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={inboxRef}
          style={{ display: 'none' }}
          onChange={handleInboxUpload}
        />
        {extracting && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.92)',
              zIndex: 1500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
              Extracting {extractDone} of {extractTotal}&hellip;
            </div>
            <div style={{ color: '#a6f', fontSize: 13 }}>Analyzing page {extractDone} of {extractTotal} with AI</div>
          </div>
        )}
        {reviewData &&
          (() => {
            const selectedCount = reviewData.reduce(
              (sum, r) => (r.sheet ? sum + r.sheet.items.filter((i) => i.checked).length : sum),
              0
            );
            return (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: '#08080e',
                  zIndex: 1400,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
                    borderBottom: '1px solid #1a1a28',
                    background: '#08080e',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#eee' }}>
                    Extraction Review
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginTop: 2 }}>
                    Review and edit extracted items before saving
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div className="form-row">
                      <label className="label">Submitted by</label>
                      <input
                        className="input"
                        placeholder="Team member name"
                        value={reviewSubmittedBy}
                        onChange={(e) => setReviewSubmittedBy(e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Case label</label>
                      <input
                        className="input"
                        placeholder="e.g. Case A, Tue OR"
                        value={reviewCaseLabel}
                        onChange={(e) => setReviewCaseLabel(e.target.value)}
                      />
                    </div>
                  </div>
                  {reviewData.map((result, si) =>
                    result.error ? (
                      <div
                        key={si}
                        style={{
                          ...S.card,
                          border: '1px solid #5a1a1a',
                          background: '#1a0808',
                          marginBottom: 16,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{ fontSize: 12, fontWeight: 700, color: '#f66', marginBottom: 4 }}
                          >
                            ⚠ Extraction failed
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>{result.fileName}</div>
                          <div style={{ fontSize: 11, color: '#f66', marginTop: 4 }}>
                            {result.error}
                          </div>
                        </div>
                        <button
                          onClick={() => discardReviewResult(si)}
                          className="hb"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid #5a1a1a',
                            background: 'transparent',
                            color: '#f66',
                            fontSize: 12,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    ) : (
                      <div key={si} style={{ ...S.card, marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: '#556', marginBottom: 10 }}>
                          {result.fileName}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#556', marginBottom: 3 }}>DATE</div>
                            <input
                              type="date"
                              value={result.sheet.date}
                              onChange={(e) => updateReviewSheet(si, 'date', e.target.value)}
                              style={S.inp}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: '#556', marginBottom: 3 }}>
                              FACILITY
                            </div>
                            <input
                              value={result.sheet.facility}
                              onChange={(e) => updateReviewSheet(si, 'facility', e.target.value)}
                              style={S.inp}
                              placeholder="Facility"
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: '#556', marginBottom: 3 }}>
                            CASE LABEL — do not enter patient identifiers
                          </div>
                          <input
                            value={result.sheet.case_label}
                            onChange={(e) => updateReviewSheet(si, 'case_label', e.target.value)}
                            style={S.inp}
                            placeholder="e.g. Case A, Tue OR"
                          />
                        </div>
                        {result.sheet.items.length === 0 ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#556',
                              textAlign: 'center',
                              padding: '12px 0',
                            }}
                          >
                            No items extracted
                          </div>
                        ) : (
                          result.sheet.items.map((item, ii) => (
                            <div
                              key={ii}
                              style={{
                                background: '#0a0a14',
                                borderRadius: 8,
                                border: `1px solid ${item.checked ? '#2a2a40' : '#181820'}`,
                                padding: '10px 12px',
                                marginBottom: 8,
                                opacity: item.checked ? 1 : 0.45,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={(e) =>
                                    updateReviewItem(si, ii, 'checked', e.target.checked)
                                  }
                                  style={{
                                    width: 16,
                                    height: 16,
                                    accentColor: '#a6f',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontSize: 12, color: '#aaa', flex: 1 }}>
                                  {item.product_name || item.description || `Item ${ii + 1}`}
                                </span>
                                <button
                                  onClick={() => deleteReviewItem(si, ii)}
                                  className="hb"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#556',
                                    cursor: 'pointer',
                                    fontSize: 18,
                                    lineHeight: 1,
                                    padding: '0 4px',
                                  }}
                                >
                                  &times;
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 6, marginBottom: 6 }}>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                    VENDOR
                                  </div>
                                  <input
                                    value={item.vendor}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'vendor', e.target.value)
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    placeholder="Vendor"
                                  />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                    PRODUCT
                                  </div>
                                  <input
                                    value={item.product_name}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'product_name', e.target.value)
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    placeholder="Product name"
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 6, marginBottom: 6 }}>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                    ITEM #
                                  </div>
                                  <input
                                    value={item.item_number}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'item_number', e.target.value)
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    placeholder="Item number"
                                  />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                    LOT #
                                  </div>
                                  <input
                                    value={item.lot_number}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'lot_number', e.target.value)
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    placeholder="Lot number"
                                  />
                                </div>
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                  DESCRIPTION
                                </div>
                                <input
                                  value={item.description}
                                  onChange={(e) =>
                                    updateReviewItem(si, ii, 'description', e.target.value)
                                  }
                                  style={{ ...S.inp, fontSize: 12 }}
                                  placeholder="Description"
                                />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 6 }}>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2 }}>
                                    QTY
                                  </div>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'quantity', Number(e.target.value))
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    min={1}
                                  />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: '#445', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    COST
                                    {item.priceSource === 'catalog' ? (
                                      <span
                                        title={`OCR read: $${item.ocrCost}`}
                                        style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#0a2a0a', color: '#4f4', border: '1px solid #1a4a1a', opacity: 0.8 }}
                                      >📋 catalog</span>
                                    ) : (
                                      <>
                                        <span
                                          title="Not in catalog — verify manually"
                                          style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#2a2a0a', color: '#ff4', border: '1px solid #4a4a1a', opacity: 0.8 }}
                                        >👁 ocr</span>
                                        {item.item_number && item.cost ? (
                                          <button
                                            onClick={async () => {
                                              await addCatalogOverride({
                                                vendor: item.vendor,
                                                item_number: item.item_number,
                                                description: item.description,
                                                price: item.cost,
                                                facility: result.sheet.facility,
                                              });
                                              updateReviewItem(si, ii, 'priceSource', 'catalog');
                                            }}
                                            className="hb"
                                            style={{ background: 'none', border: '1px solid #2a4a1a', borderRadius: 3, color: '#8f8', fontSize: 9, padding: '1px 4px', cursor: 'pointer', lineHeight: 1 }}
                                          >+ catalog</button>
                                        ) : null}
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="number"
                                    value={item.cost}
                                    onChange={(e) =>
                                      updateReviewItem(si, ii, 'cost', Number(e.target.value))
                                    }
                                    style={{ ...S.inp, fontSize: 12 }}
                                    step="0.01"
                                    min={0}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  )}
                  <div style={{ height: 100 }} />
                </div>
                <div
                  style={{
                    padding: '16px',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                    borderTop: '1px solid #1a1a28',
                    background: '#08080e',
                    display: 'flex',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => { setReviewData(null); setReviewSubmittedBy(''); setReviewCaseLabel(''); }}
                    className="hb"
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: 10,
                      border: '1px solid #2a2a35',
                      background: 'transparent',
                      color: '#888',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveExtracted}
                    className="hb"
                    style={{
                      flex: 2,
                      padding: '13px',
                      borderRadius: 10,
                      border: 'none',
                      background:
                        selectedCount > 0
                          ? 'linear-gradient(135deg,#f80,#e44)'
                          : '#2a2a35',
                      color: selectedCount > 0 ? '#fff' : '#556',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            );
          })()}
        {viewingBS && (
          <div
            onClick={() => setViewingBS(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <div
              onClick={(ev) => ev.stopPropagation()}
              style={{ position: 'relative', background: '#12121e', borderRadius: 16, border: '1px solid #2a2a3a', padding: 16, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}
            >
              <button
                onClick={() => setViewingBS(null)}
                style={{ position: 'absolute', top: -12, right: -12, width: 30, height: 30, borderRadius: 15, background: '#f44', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', fontWeight: 700, zIndex: 1 }}
              >
                ✕
              </button>
              {viewingBS.fileType?.includes('image') ? (
                <img src={viewingBS.url} style={{ maxWidth: '85vw', maxHeight: '75vh', borderRadius: 8, objectFit: 'contain' }} alt="Bill sheet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <iframe src={viewingBS.url} style={{ width: '80vw', height: '70vh', border: 'none', borderRadius: 8 }} title="Bill sheet PDF" />
                  <a href={viewingBS.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6af' }}>Open in new tab ↗</a>
                </div>
              )}
            </div>
          </div>
        )}

        {viewingPO && (
          <div
            onClick={() => setViewingPO(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: 20,
              cursor: 'zoom-out',
            }}
          >
            <div
              style={{ maxWidth: '90vw', maxHeight: '80vh', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewingPO(null)}
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: '#f44',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                  fontWeight: 700,
                  zIndex: 1001,
                }}
              >
                ✕
              </button>
              {viewingPO.data && viewingPO.data.startsWith('data:image') ? (
                <img
                  src={viewingPO.data}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '75vh',
                    borderRadius: 8,
                    objectFit: 'contain',
                  }}
                  alt="doc"
                />
              ) : (
                <div
                  style={{ background: '#111', borderRadius: 8, padding: 40, textAlign: 'center' }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                  <div style={{ color: '#aab', fontSize: 13 }}>PDF attached</div>
                </div>
              )}
            </div>
            <div
              style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: viewingPO.docType === 'bs' ? '#1a0a3a' : '#1a1a2a',
                  color: viewingPO.docType === 'bs' ? '#a6f' : '#f80',
                  border: '1px solid ' + (viewingPO.docType === 'bs' ? '#3a1a5a' : '#3a2a15'),
                }}
              >
                {viewingPO.docType === 'bs' ? 'BILL SHEET' : 'PO'}
              </span>
              {viewingPO.name && (
                <span style={{ color: '#889', fontSize: 12 }}>{viewingPO.name}</span>
              )}
              <button
                onClick={async () => {
                  const store = viewingPO.docType === 'bs' ? bsImages : poImages;
                  const saveFn = viewingPO.docType === 'bs' ? saveBSs : savePOs;
                  const updated = { ...store };
                  updated[viewingPO.id] = (updated[viewingPO.id] || []).filter(
                    (_, i) => i !== viewingPO.idx
                  );
                  if (updated[viewingPO.id].length === 0) delete updated[viewingPO.id];
                  await saveFn(updated);
                  setViewingPO(null);
                  notify((viewingPO.docType === 'bs' ? 'Bill Sheet' : 'PO') + ' removed');
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 7,
                  background: '#f44',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  if (viewingPO.docType === 'bs') {
                    const id = viewingPO.id;
                    setViewingPO(null);
                    launchBSScan(id);
                  } else {
                    setPoTarget(viewingPO.id);
                    setViewingPO(null);
                    setTimeout(() => poFileRef.current?.click(), 50);
                  }
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 7,
                  background: '#1a3a5a',
                  border: '1px solid #2a4a6a',
                  color: '#6af',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Add Another
              </button>
            </div>
          </div>
        )}

        {tab === 'patients' && (
          <div className="fade">
            {(() => {
              const cases = {};
              activeEntries.forEach((e) => {
                const k = (e.case_label || '') + '|' + e.date;
                if (!cases[k])
                  cases[k] = {
                    case_label: e.case_label,
                    date: e.date,
                    facility: e.facility,
                    items: [],
                    vendors: new Set(),
                    total: 0,
                  };
                cases[k].items.push(e);
                cases[k].vendors.add(e.vendor);
                cases[k].total += lineTotal(e);
                if (e.facility) cases[k].facility = e.facility;
              });
              const sorted = Object.values(cases).sort((a, b) =>
                (a.date || '').localeCompare(b.date || '')
              );
              if (sorted.length === 0)
                return (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🧑‍⚕️</div>
                    <div style={{ fontWeight: 600 }}>No case data yet</div>
                  </div>
                );
              return sorted.map((c, ci) => {
                const key = (c.case_label || '') + '|' + c.date;
                const isOpen = openPatients[key] || false;
                const vg = {};
                c.items.forEach((e) => {
                  if (!vg[e.vendor]) vg[e.vendor] = [];
                  vg[e.vendor].push(e);
                });
                const totalPOs = Object.keys(vg).reduce(
                  (s, v) => (poImages[key + '|' + v] || []).length + s,
                  0
                );
                const totalBSs = Object.keys(vg).reduce(
                  (s, v) => (bsImages[key + '|' + v] || []).length + s,
                  0
                );
                const totalDocs = totalPOs + totalBSs;
                return (
                  <div
                    key={ci}
                    style={{ ...S.card, marginBottom: 10, padding: 0, overflow: 'hidden' }}
                  >
                    <div
                      onClick={() => setOpenPatients((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="hr"
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#556',
                            transition: 'transform .2s',
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                          }}
                        >
                          ▶
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{c.case_label || '—'}</span>
                            {totalDocs > 0 && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: '#1a1a2a',
                                  color: '#f80',
                                  border: '1px solid #3a2a15',
                                }}
                              >
                                📎 {totalDocs}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#667',
                              fontFamily: 'monospace',
                              marginTop: 2,
                            }}
                          >
                            {c.date}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#6f6' }}>
                          {fmt(c.total)}
                        </div>
                        <div style={{ fontSize: 10, color: '#556', marginTop: 2 }}>
                          {c.items.length} items · {[...c.vendors].join(', ')}
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #1a1a28', padding: '8px 16px 12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 10,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: c.facility === 'Northside' ? '#200020' : '#001a2a',
                              color: fc(c.facility),
                              border:
                                '1px solid ' + (c.facility === 'Northside' ? '#401040' : '#003050'),
                            }}
                          >
                            {fl(c.facility)}
                          </span>
                        </div>
                        {Object.entries(vg).map(([vendor, items], vi) => {
                          const vKey = key + '|' + vendor;
                          const vendorPOs = poImages[vKey] || [];
                          const hasPO = vendorPOs.length > 0;
                          const vendorBSs = bsImages[vKey] || [];
                          const hasBS = vendorBSs.length > 0;
                          return (
                            <div key={vi} style={{ marginBottom: 10 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#f80',
                                  marginBottom: 6,
                                  paddingBottom: 4,
                                  borderBottom: '1px solid #1a1a28',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>
                                  {vendor} — {fmt(items.reduce((s, e) => s + lineTotal(e), 0))}
                                </span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <button
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (hasPO) {
                                        setViewingPO({
                                          id: vKey,
                                          idx: 0,
                                          data: vendorPOs[0]?.data,
                                          name: vendor + ' — ' + (c.case_label || '—'),
                                          docType: 'po',
                                        });
                                      } else {
                                        setPoTarget(vKey);
                                        setTimeout(() => poFileRef.current?.click(), 50);
                                      }
                                    }}
                                    className="hb"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: 13,
                                      opacity: hasPO ? 1 : 0.25,
                                      filter: hasPO ? 'none' : 'grayscale(1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                    title={hasPO ? 'View PO' : 'Attach PO'}
                                  >
                                    <span style={{ color: hasPO ? '#f80' : '#556' }}>📎</span>
                                    <span
                                      style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: hasPO ? '#f80' : '#556',
                                      }}
                                    >
                                      PO{hasPO ? ` ${vendorPOs.length}` : ''}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (hasBS) {
                                        setViewingPO({
                                          id: vKey,
                                          idx: 0,
                                          data: vendorBSs[0]?.data,
                                          name: vendor + ' — ' + (c.case_label || '—'),
                                          docType: 'bs',
                                        });
                                      } else {
                                        launchBSScan(vKey);
                                      }
                                    }}
                                    className="hb"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: 13,
                                      opacity: hasBS ? 1 : 0.25,
                                      filter: hasBS ? 'none' : 'grayscale(1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                    title={hasBS ? 'View Bill Sheet' : 'Attach Bill Sheet'}
                                  >
                                    <span style={{ color: hasBS ? '#a6f' : '#556' }}>📋</span>
                                    <span
                                      style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: hasBS ? '#a6f' : '#556',
                                      }}
                                    >
                                      BS{hasBS ? ` ${vendorBSs.length}` : ''}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {items.map((e, ei) => (
                                    <tr key={ei} style={{ borderBottom: '1px solid #111118' }}>
                                      <td
                                        style={{
                                          padding: '4px 0',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#cdf',
                                        }}
                                      >
                                        {e.productName}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: 10,
                                          fontFamily: 'monospace',
                                          color: '#556',
                                        }}
                                      >
                                        {e.productNumber || ''}
                                      </td>
                                      <td
                                        style={{ padding: '4px 8px', fontSize: 11, color: '#889' }}
                                      >
                                        {e.description || ''}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: 11,
                                          color: '#aab',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {e.quantity > 1 ? 'x' + e.quantity : ''}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 0',
                                          fontSize: 12,
                                          color: '#6f6',
                                          fontWeight: 600,
                                          fontFamily: 'monospace',
                                          textAlign: 'right',
                                        }}
                                      >
                                        {fmt(e.cost)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {tab === 'mimedx' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                🩹 MiMedx Tracking
              </div>
              <div style={{ fontSize: 11, color: '#556', marginBottom: 12 }}>
                All MiMedx products sorted by surgery date — full lot numbers (GS44-...)
              </div>
            </div>
            {(() => {
              const mm = activeEntries
                .filter((e) => e.vendor === 'MiMedx')
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
              if (mm.length === 0)
                return (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🩹</div>
                    <div style={{ fontWeight: 600 }}>No MiMedx products yet</div>
                  </div>
                );
              const total = mm.reduce((s, e) => s + lineTotal(e), 0);
              return (
                <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr>
                          {['CASE LABEL', 'DATE', 'ITEM # (LOT)', 'FACILITY', 'COST'].map((h, i) => (
                            <th
                              key={i}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'left',
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#f80',
                                borderBottom: '1px solid #1a1a28',
                                background: '#08080e',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                                letterSpacing: 1,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mm.map((e, i) => (
                          <tr
                            key={e.id || i}
                            className="hr"
                            style={{ borderBottom: '1px solid #0e0e18' }}
                          >
                            <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700 }}>
                              {e.case_label || '—'}
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: '#aab',
                              }}
                            >
                              {e.date}
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#6af',
                                fontFamily: 'monospace',
                              }}
                            >
                              {e.productNumber}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: e.facility === 'Northside' ? '#200020' : '#001a2a',
                                  color: fc(e.facility),
                                  border: `1px solid ${e.facility === 'Northside' ? '#401040' : '#003050'}`,
                                }}
                              >
                                {fl(e.facility)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 13,
                                color: '#6f6',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                              }}
                            >
                              {fmt(e.cost)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #2a2a3a', background: '#0a0a14' }}>
                          <td
                            colSpan={2}
                            style={{
                              padding: '10px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#f80',
                            }}
                          >
                            {mm.length} units
                          </td>
                          <td colSpan={2}></td>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#6f6',
                              fontFamily: 'monospace',
                            }}
                          >
                            {fmt(total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab === 'commission' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>💵 Commission Tracker</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['reconcile', 'rates', 'reports', 'docs'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setCommView(v)}
                      className="hb"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        border: '1px solid ' + (commView === v ? '#2a5a2a' : '#2a2a3a'),
                        background: commView === v ? '#0a1a0a' : 'transparent',
                        color: commView === v ? '#6f6' : '#556',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={commVf}
                  onChange={(e) => setCommVf(e.target.value)}
                  style={{ ...S.inp, width: 150 }}
                >
                  <option value="All">All Vendors</option>
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {commView === 'reconcile' &&
                  (() => {
                    const MONTHS = [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ];
                    const am = [
                      ...new Set(
                        entries
                          .filter((e) => e.date)
                          .map((e) => {
                            const d = new Date(e.date);
                            return (
                              d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
                            );
                          })
                      ),
                    ].sort();
                    return (
                      <select
                        value={commMf}
                        onChange={(e) => setCommMf(e.target.value)}
                        style={{ ...S.inp, width: 150 }}
                      >
                        <option value="all">All Months</option>
                        {am.map((m) => {
                          const [y, mo] = m.split('-');
                          return (
                            <option key={m} value={m}>
                              {MONTHS[parseInt(mo) - 1]} {y}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === 'rates') exportRates();
                    else if (e.target.value === 'reports') exportReports();
                    else if (e.target.value === 'reconcile') exportReconciliation();
                    e.target.value = '';
                  }}
                  style={{ ...S.inp, width: 130, color: '#6f6', borderColor: '#2a5a2a' }}
                >
                  <option value="" disabled>
                    ⬇ Export...
                  </option>
                  <option value="rates">Commission Rates</option>
                  <option value="reports">Report Line Items</option>
                  <option value="reconcile">Reconciliation</option>
                </select>
              </div>
            </div>

            {/* RATES SUB-VIEW */}
            {commView === 'rates' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Set Commission Rates
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Define what each vendor should pay you. Flat % applies to all products;
                    per-product lets you set different rates.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={crForm.vendor}
                        onChange={(e) => setCrForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select vendor...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        TYPE
                      </div>
                      <select
                        value={crForm.type}
                        onChange={(e) => setCrForm((f) => ({ ...f, type: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="flat">Flat % (all products)</option>
                        <option value="per-product">Per-Product %</option>
                      </select>
                    </div>
                  </div>
                  {crForm.type === 'flat' && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        COMMISSION %
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 20"
                        value={crForm.pct}
                        onChange={(e) => setCrForm((f) => ({ ...f, pct: e.target.value }))}
                        style={{ ...S.inp, maxWidth: 120 }}
                      />
                    </div>
                  )}
                  {crForm.type === 'per-product' && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        DEFAULT % (fallback)
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 15"
                        value={crForm.pct}
                        onChange={(e) => setCrForm((f) => ({ ...f, pct: e.target.value }))}
                        style={{ ...S.inp, maxWidth: 120, marginBottom: 8 }}
                      />
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                      >
                        PRODUCT-SPECIFIC RATES
                      </div>
                      {(crForm.perProduct || []).map((pp, i) => (
                        <div
                          key={i}
                          style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}
                        >
                          <input
                            placeholder="Product name"
                            value={pp.product}
                            onChange={(e) => {
                              const u = [...crForm.perProduct];
                              u[i] = { ...u[i], product: e.target.value };
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{ ...S.inp, flex: 1 }}
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="%"
                            value={pp.pct}
                            onChange={(e) => {
                              const u = [...crForm.perProduct];
                              u[i] = { ...u[i], pct: e.target.value };
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{ ...S.inp, width: 70 }}
                          />
                          <button
                            onClick={() => {
                              const u = [...crForm.perProduct];
                              u.splice(i, 1);
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 16,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setCrForm((f) => ({
                            ...f,
                            perProduct: [...(f.perProduct || []), { product: '', pct: '' }],
                          }))
                        }
                        className="hb"
                        style={{
                          fontSize: 11,
                          color: '#6af',
                          background: 'none',
                          border: '1px solid #2a2a3a',
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          marginTop: 4,
                        }}
                      >
                        + Add Product Rate
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!crForm.vendor || !crForm.pct) {
                        notify('Set vendor and rate', false);
                        return;
                      }
                      const existing = commRates.filter((r) => r.vendor !== crForm.vendor);
                      const newRate = {
                        vendor: crForm.vendor,
                        type: crForm.type,
                        pct: parseFloat(crForm.pct),
                        perProduct: (crForm.perProduct || [])
                          .filter((p) => p.product && p.pct)
                          .map((p) => ({ product: p.product, pct: parseFloat(p.pct) })),
                      };
                      saveCommRates([...existing, newRate]);
                      notify(`Rate saved: ${crForm.vendor} → ${crForm.pct}%`);
                      setCrForm({ vendor: '', type: 'flat', pct: '', product: '', perProduct: [] });
                    }}
                    className="hb"
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg,#4a4,#2a6)',
                      width: '100%',
                    }}
                  >
                    Save Rate
                  </button>
                </div>
                {commRates.length > 0 && (
                  <div style={S.card}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                      Current Rates
                    </div>
                    {commRates
                      .filter((r) => commVf === 'All' || r.vendor === commVf)
                      .map((r, i) => (
                        <div
                          key={i}
                          className="hr"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 0',
                            borderBottom: '1px solid #111118',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#cdf' }}>
                            {r.vendor}
                          </span>
                          <span style={{ fontSize: 11, color: '#6f6', fontWeight: 700 }}>
                            {r.pct}%{r.type === 'per-product' ? ' (default)' : ''}
                          </span>
                          {r.type === 'per-product' && r.perProduct?.length > 0 && (
                            <span style={{ fontSize: 10, color: '#889' }}>
                              +{r.perProduct.length} custom
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCrForm({
                                vendor: r.vendor,
                                type: r.type,
                                pct: String(r.pct),
                                perProduct: (r.perProduct || []).map((p) => ({
                                  product: p.product,
                                  pct: String(p.pct),
                                })),
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6af',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              saveCommRates(commRates.filter((_, j) => j !== i));
                              notify('Rate removed');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* REPORTS SUB-VIEW — Line items from commission reports */}
            {commView === 'reports' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Add Commission Line Item
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Enter line items from vendor commission reports. Send me the actual
                    PDF/spreadsheet in chat and I'll extract these for you.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={clForm.vendor}
                        onChange={(e) => setClForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        DATE (DOS)
                      </div>
                      <input
                        type="date"
                        value={clForm.date}
                        onChange={(e) => setClForm((f) => ({ ...f, date: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}>
                      PRODUCT / DESCRIPTION
                    </div>
                    <input
                      placeholder="e.g. EpiFix 4.0x4.0cm"
                      value={clForm.product}
                      onChange={(e) => setClForm((f) => ({ ...f, product: e.target.value }))}
                      style={S.inp}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                      >
                        SALE AMOUNT ($)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={clForm.saleAmount}
                        onChange={(e) => setClForm((f) => ({ ...f, saleAmount: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        COMM PAID ($)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={clForm.commPaid}
                        onChange={(e) => setClForm((f) => ({ ...f, commPaid: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#445', marginBottom: 4 }}
                      >
                        NOTE
                      </div>
                      <input
                        placeholder="Optional"
                        value={clForm.note}
                        onChange={(e) => setClForm((f) => ({ ...f, note: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!clForm.vendor || !clForm.date || !clForm.commPaid) {
                        notify('Fill vendor, date & commission paid', false);
                        return;
                      }
                      const item = {
                        id: Date.now().toString(36),
                        vendor: clForm.vendor,
                        date: clForm.date,
                        product: clForm.product,
                        saleAmount: parseFloat(clForm.saleAmount) || 0,
                        commPaid: parseFloat(clForm.commPaid) || 0,
                        note: clForm.note,
                        addedAt: new Date().toISOString(),
                      };
                      saveCommReports([...commReports, item]);
                      notify(`Commission line added: ${clForm.vendor}`);
                      setClForm((f) => ({
                        ...f,
                        product: '',
                        saleAmount: '',
                        commPaid: '',
                        note: '',
                      }));
                    }}
                    className="hb"
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg,#4a4,#2a6)',
                      width: '100%',
                    }}
                  >
                    Add Line Item
                  </button>
                </div>
                {commReports.length > 0 && (
                  <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                          <tr>
                            {['VENDOR', 'DATE', 'PRODUCT', 'SALE $', 'COMM PAID', 'NOTE', ''].map(
                              (h, i) => (
                                <th
                                  key={i}
                                  style={{
                                    padding: '10px 8px',
                                    textAlign: 'left',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#6f6',
                                    borderBottom: '1px solid #1a1a28',
                                    background: '#08080e',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    letterSpacing: 1,
                                  }}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {commReports
                            .filter((r) => commVf === 'All' || r.vendor === commVf)
                            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                            .map((r, i) => (
                              <tr
                                key={r.id || i}
                                className="hr"
                                style={{ borderBottom: '1px solid #0e0e18' }}
                              >
                                <td style={{ padding: '7px 8px', fontSize: 12, fontWeight: 600 }}>
                                  {r.vendor}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: '#aab',
                                  }}
                                >
                                  {r.date}
                                </td>
                                <td style={{ padding: '7px 8px', fontSize: 12, color: '#cdf' }}>
                                  {r.product}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: '#889',
                                  }}
                                >
                                  {r.saleAmount ? fmt(r.saleAmount) : ''}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: '#6f6',
                                    fontWeight: 600,
                                  }}
                                >
                                  {fmt(r.commPaid)}
                                </td>
                                <td style={{ padding: '7px 8px', fontSize: 10, color: '#556' }}>
                                  {r.note}
                                </td>
                                <td style={{ padding: '7px 8px' }}>
                                  <button
                                    onClick={() => {
                                      saveCommReports(commReports.filter((x) => x.id !== r.id));
                                      notify('Removed');
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#f44',
                                      cursor: 'pointer',
                                      fontSize: 11,
                                    }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#0a0a14', borderTop: '2px solid #2a2a3a' }}>
                            <td
                              colSpan={4}
                              style={{
                                padding: '10px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#6f6',
                              }}
                            >
                              {
                                commReports.filter((r) => commVf === 'All' || r.vendor === commVf)
                                  .length
                              }{' '}
                              line items
                            </td>
                            <td
                              style={{
                                padding: '10px 8px',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#6f6',
                                fontFamily: 'monospace',
                              }}
                            >
                              {fmt(
                                commReports
                                  .filter((r) => commVf === 'All' || r.vendor === commVf)
                                  .reduce((s, r) => s + r.commPaid, 0)
                              )}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DOCS SUB-VIEW — Attached commission report files */}
            {commView === 'docs' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Commission Report Files
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Drop PDF/image files here for reference. Send the actual files to me in chat for
                    data extraction.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={clForm.vendor}
                        onChange={(e) => setClForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select vendor...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => {
                          if (!clForm.vendor) {
                            notify('Select a vendor first', false);
                            return;
                          }
                          commDocRef.current?.click();
                        }}
                        className="hb"
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: '1px solid #2a5a2a',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#6f6',
                          background: '#0a1a0a',
                          width: '100%',
                        }}
                      >
                        📄 Upload File
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf,.xlsx,.xls,.csv"
                    multiple
                    ref={commDocRef}
                    style={{ display: 'none' }}
                    onChange={handleCommDocUpload}
                  />
                </div>
                {Object.keys(commDocs)
                  .filter((v) => commVf === 'All' || v === commVf)
                  .map((vendor) => (
                    <div key={vendor} style={{ ...S.card, marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#f80', marginBottom: 8 }}
                      >
                        {vendor} — {commDocs[vendor].length} file(s)
                      </div>
                      {commDocs[vendor].map((doc, i) => (
                        <div
                          key={i}
                          className="hr"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 0',
                            borderBottom: '1px solid #111118',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>
                            {doc.name?.endsWith('.pdf') ? '📄' : '🖼️'}
                          </span>
                          <span style={{ fontSize: 12, flex: 1, color: '#cdf' }}>{doc.name}</span>
                          <span style={{ fontSize: 10, color: '#556' }}>
                            {new Date(doc.date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => setViewingDoc({ data: doc.data, name: doc.name })}
                            className="hb"
                            style={{
                              background: 'none',
                              border: '1px solid #2a2a3a',
                              color: '#6af',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '3px 8px',
                              borderRadius: 5,
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              const updated = { ...commDocs };
                              updated[vendor] = updated[vendor].filter((_, j) => j !== i);
                              if (updated[vendor].length === 0) delete updated[vendor];
                              await saveCommDocs(updated);
                              notify('File removed');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                {Object.keys(commDocs).filter((v) => commVf === 'All' || v === commVf).length ===
                  0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600 }}>No commission documents yet</div>
                  </div>
                )}
              </div>
            )}

            {/* RECONCILE SUB-VIEW — The money view */}
            {commView === 'reconcile' && (
              <div>
                {(() => {
                  const MONTHS = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ];
                  const fe = activeEntries.filter((e) => {
                    if (commVf !== 'All' && e.vendor !== commVf) return false;
                    if (commMf !== 'all' && e.date) {
                      const d = new Date(e.date);
                      if (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') !==
                        commMf
                      )
                        return false;
                    }
                    return true;
                  });
                  const cr = commReports.filter((r) => {
                    if (commVf !== 'All' && r.vendor !== commVf) return false;
                    if (commMf !== 'all' && r.date) {
                      const d = new Date(r.date);
                      if (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') !==
                        commMf
                      )
                        return false;
                    }
                    return true;
                  });
                  // Build expected commissions from usage
                  const expected = fe.map((e) => {
                    const rate = getRate(e.vendor, e.productName);
                    const expComm = rate ? (lineTotal(e) * rate) / 100 : null;
                    return { ...e, rate, expComm };
                  });
                  const totalExpected = expected.reduce((s, e) => s + (e.expComm || 0), 0);
                  const totalReceived = cr.reduce((s, r) => s + r.commPaid, 0);
                  const diff = totalReceived - totalExpected;
                  // Match report lines to usage by date+vendor
                  const matchedIds = new Set();
                  const reconciled = expected.map((e) => {
                    const match = cr.find(
                      (r) =>
                        r.vendor === e.vendor &&
                        r.date === e.date &&
                        !matchedIds.has(r.id) &&
                        (r.product
                          ?.toLowerCase()
                          .includes(e.productName?.toLowerCase().slice(0, 8)) ||
                          Math.abs(r.saleAmount - lineTotal(e)) < 1)
                    );
                    if (match) {
                      matchedIds.add(match.id);
                      const status = !e.rate
                        ? 'no-rate'
                        : Math.abs(match.commPaid - (e.expComm || 0)) < 1
                          ? 'match'
                          : match.commPaid < (e.expComm || 0)
                            ? 'under'
                            : 'over';
                      return { ...e, match, status };
                    }
                    return { ...e, match: null, status: e.rate ? 'missing' : 'no-rate' };
                  });
                  const unmatched = cr.filter((r) => !matchedIds.has(r.id));
                  const counts = { match: 0, under: 0, missing: 0, over: 0, 'no-rate': 0 };
                  reconciled.forEach((r) => counts[r.status]++);
                  const mLabel =
                    commMf === 'all'
                      ? 'All Time'
                      : MONTHS[parseInt(commMf.split('-')[1]) - 1] + ' ' + commMf.split('-')[0];
                  return (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        {[
                          { l: 'EXPECTED', v: fmt(totalExpected), c: '#f80' },
                          { l: 'RECEIVED', v: fmt(totalReceived), c: '#6f6' },
                          {
                            l: 'DIFFERENCE',
                            v: (diff >= 0 ? '+' : '') + fmt(diff),
                            c: diff >= 0 ? '#6f6' : '#f44',
                          },
                          { l: '✅ MATCHED', v: counts.match, c: '#6f6' },
                          { l: '⚠️ UNDERPAID', v: counts.under, c: '#fa0' },
                          { l: '❌ MISSING', v: counts.missing, c: '#f44' },
                          { l: '❓ NO RATE', v: counts['no-rate'], c: '#889' },
                        ].map((c, i) => (
                          <div key={i} style={S.card}>
                            <div
                              style={{
                                fontSize: 9,
                                color: '#445',
                                letterSpacing: 1,
                                marginBottom: 6,
                                fontWeight: 700,
                              }}
                            >
                              {c.l}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: c.c }}>{c.v}</div>
                          </div>
                        ))}
                      </div>
                      {reconciled.length > 0 && (
                        <div
                          style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 14 }}
                        >
                          <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                            <table
                              style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}
                            >
                              <thead>
                                <tr>
                                  {[
                                    'STATUS',
                                    'VENDOR',
                                    'DATE',
                                    'PRODUCT',
                                    'SALE $',
                                    'RATE',
                                    'EXPECTED',
                                    'RECEIVED',
                                  ].map((h, i) => (
                                    <th
                                      key={i}
                                      style={{
                                        padding: '10px 8px',
                                        textAlign: 'left',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#6f6',
                                        borderBottom: '1px solid #1a1a28',
                                        background: '#08080e',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1,
                                        letterSpacing: 1,
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {reconciled.map((r, i) => {
                                  const sc = {
                                    match: '#6f6',
                                    under: '#fa0',
                                    missing: '#f44',
                                    over: '#0af',
                                    'no-rate': '#556',
                                  };
                                  const sl = {
                                    match: '✅',
                                    under: '⚠️',
                                    missing: '❌',
                                    over: '💰',
                                    'no-rate': '—',
                                  };
                                  return (
                                    <tr
                                      key={r.id || i}
                                      className="hr"
                                      style={{ borderBottom: '1px solid #0e0e18' }}
                                    >
                                      <td style={{ padding: '7px 8px', fontSize: 13 }}>
                                        <span title={r.status}>{sl[r.status]}</span>
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {r.vendor}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 11,
                                          fontFamily: 'monospace',
                                          color: '#aab',
                                        }}
                                      >
                                        {r.date}
                                      </td>
                                      <td
                                        style={{ padding: '7px 8px', fontSize: 12, color: '#cdf' }}
                                      >
                                        {r.productName}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          color: '#889',
                                        }}
                                      >
                                        {fmt(lineTotal(r))}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 11,
                                          color: r.rate ? '#f80' : '#333',
                                        }}
                                      >
                                        {r.rate ? r.rate + '%' : '—'}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          color: '#f80',
                                        }}
                                      >
                                        {r.expComm ? fmt(r.expComm) : '—'}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          fontWeight: 600,
                                          color: sc[r.status],
                                        }}
                                      >
                                        {r.match ? fmt(r.match.commPaid) : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {unmatched.length > 0 && (
                        <div style={S.card}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 10,
                              color: '#fa0',
                            }}
                          >
                            ❓ Unmatched Commission Payments ({unmatched.length})
                          </div>
                          <div style={{ fontSize: 11, color: '#556', marginBottom: 10 }}>
                            These payments from vendors don't match any tracked usage
                          </div>
                          {unmatched.map((r, i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#cdf' }}>
                                {r.vendor}
                              </span>
                              <span
                                style={{ fontSize: 11, fontFamily: 'monospace', color: '#667' }}
                              >
                                {r.date}
                              </span>
                              <span style={{ fontSize: 12, color: '#889', flex: 1 }}>
                                {r.product}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: 'monospace',
                                  color: '#6f6',
                                  fontWeight: 600,
                                }}
                              >
                                {fmt(r.commPaid)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {fe.length === 0 && (
                        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
                          <div style={{ fontWeight: 600 }}>
                            No usage data{commVf !== 'All' ? ' for ' + commVf : ''}
                            {commMf !== 'all' ? ' in ' + mLabel : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#556', marginTop: 6 }}>
                            Add products first, then set rates and enter commission reports
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Doc viewer modal */}
            {viewingDoc && (
              <div
                onClick={() => setViewingDoc(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,.85)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: 20,
                  cursor: 'zoom-out',
                }}
              >
                <div
                  style={{ maxWidth: '90vw', maxHeight: '80vh', position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setViewingDoc(null)}
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      background: '#f44',
                      border: 'none',
                      color: '#fff',
                      fontSize: 16,
                      cursor: 'pointer',
                      fontWeight: 700,
                      zIndex: 1001,
                    }}
                  >
                    ✕
                  </button>
                  {viewingDoc.data?.startsWith('data:image') ? (
                    <img
                      src={viewingDoc.data}
                      style={{
                        maxWidth: '90vw',
                        maxHeight: '75vh',
                        borderRadius: 8,
                        objectFit: 'contain',
                      }}
                      alt="doc"
                    />
                  ) : (
                    <div
                      style={{
                        background: '#111',
                        borderRadius: 8,
                        padding: 40,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <div style={{ color: '#aab', fontSize: 13 }}>{viewingDoc.name}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'prices' && (
          <div className="fade">
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
                  <div style={{ fontSize: 11, color: '#667', marginBottom: 6 }}>
                    {psReview.rows.length} rows · {(psReview.groups ?? []).length} groups
                    {psReview.dropped > 0 && ` · ${psReview.dropped} duplicates removed`}
                    {' · '}{psReview.facility}
                  </div>
                  {(psReview.groups ?? []).length > 0 && (
                    <div style={{ marginBottom: 12, maxHeight: 120, overflowY: 'auto', background: '#0d0d1a', borderRadius: 6, padding: '6px 10px' }}>
                      {(psReview.groups ?? []).map(g => (
                        <div key={g.name} style={{ fontSize: 10, color: '#889', lineHeight: 1.7 }}>
                          <span style={{ color: '#aac' }}>{g.name}</span>
                          {' — '}{g.count} {g.count === 1 ? 'item' : 'items'}
                        </div>
                      ))}
                    </div>
                  )}
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
            ) : (
              <>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>💰 Price Sheets</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    value={psVendor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPsVendor(v);
                      const facs = [...new Set(savedSheets.filter((s) => s.vendor === v).map((s) => s.facility))];
                      if (facs.length && !facs.includes(psFac)) setPsFac(facs[0]);
                    }}
                    style={{ ...S.inp, width: 120 }}
                  >
                    {allVendors.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <select
                    value={psFac}
                    onChange={(e) => setPsFac(e.target.value)}
                    style={{
                      ...S.inp,
                      width: 170,
                      borderColor: psFac === 'Northside' ? '#401040' : '#003050',
                    }}
                  >
                    {psFacilities.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => psUploadRef.current?.click()}
                    style={{
                      ...S.inp,
                      cursor: 'pointer',
                      background: '#1a1a2e',
                      color: '#a6f',
                      border: '1px solid #a6f4',
                      fontWeight: 600,
                      fontSize: 12,
                      padding: '6px 12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📄 Upload PDF / Photo
                  </button>
                  <input
                    ref={psUploadRef}
                    type="file"
                    accept="application/pdf,image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePSUpload}
                  />
                </div>
              </div>
              {sheet && (
                <div style={{ fontSize: 11, color: '#667', marginBottom: 10 }}>
                  {sheet.label} ·{' '}
                  <span style={{ color: fc(psFac), fontWeight: 600 }}>
                    {sheet.data.length} products
                  </span>
                </div>
              )}
              <input
                placeholder="Search products, item #, description..."
                value={psQ}
                onChange={(e) => setPsQ(e.target.value)}
                style={{ ...S.inp, marginBottom: 8 }}
              />
              <div style={{ fontSize: 10, color: '#556' }}>
                Click any row to auto-fill the Add form with that product + correct facility price
              </div>
            </div>
            {groups.map((g) => {
              const isOpen = openGroups[g] || false;
              const items = sd.filter((x) => x.p === g);
              return (
                <div key={g} style={{ ...S.card, marginBottom: 8, padding: 0, overflow: 'hidden' }}>
                  <div
                    onClick={() => setOpenGroups((p) => ({ ...p, [g]: !p[g] }))}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none',
                    }}
                    className="hr"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#556',
                          transition: 'transform .2s',
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                        }}
                      >
                        ▶
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f80' }}>{g}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#445' }}>{items.length} items</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #1a1a28', padding: '4px 14px 8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: 110 }} />
                          <col />
                          {/* 90px holds up to $99,999.00 (10 chars) in 12px monospace; max seeded price is $8,676.00 */}
                          <col style={{ width: 90 }} />
                        </colgroup>
                        <tbody>
                          {items.map((x, i) => (
                            <tr
                              key={i}
                              className="hr"
                              onClick={() => pick(x)}
                              style={{ cursor: 'pointer', borderBottom: '1px solid #111118' }}
                            >
                              <td
                                style={{
                                  padding: '5px 8px',
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: '#667',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {x.i}
                              </td>
                              <td style={{ padding: '5px 8px', fontSize: 12, color: '#bbc', wordBreak: 'break-word' }}>
                                {x.d}
                              </td>
                              <td
                                style={{
                                  padding: '5px 8px',
                                  fontSize: 12,
                                  color: '#6f6',
                                  fontWeight: 600,
                                  fontFamily: 'monospace',
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {fmt(x.f)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
              </>
            )}
          </div>
        )}

        {tab === 'vendors' && (
          <div className="fade">
            {uv.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
                <div style={{ fontWeight: 600 }}>No data yet</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 14,
                }}
              >
                {uv.map((v) => {
                  const rows = activeEntries.filter((e) => e.vendor === v);
                  const t = rows.reduce((s, r) => s + lineTotal(r), 0);
                  const nst = rows.reduce((s, r) => s + lineTotal(r), 0);
                  return (
                    <div key={v} style={S.card}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{v}</div>
                      <div
                        style={{ fontSize: 20, fontWeight: 700, color: '#f80', marginBottom: 8 }}
                      >
                        {fmt(t)}{' '}
                        <span style={{ fontSize: 11, color: '#556' }}>({rows.length})</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {nst > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#f0a',
                              background: '#200020',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            NS: {fmt(nst)}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const groups = {};
                        rows.forEach((e) => {
                          const catalogEntry = lookupCanonicalProduct(e.vendor, e.productNumber);
                          const iNum = (e.productNumber || '').trim().toUpperCase();
                          const key = (catalogEntry && iNum) ? iNum : canonicalProductKey(e.productName);
                          const displayName = catalogEntry ? catalogEntry.d : canonicalProductName(e.productName);
                          if (!groups[key]) groups[key] = { name: displayName, qty: 0, total: 0 };
                          groups[key].qty += Number(e.quantity) || 1;
                          groups[key].total += lineTotal(e);
                        });
                        return Object.values(groups)
                          .sort((a, b) => b.total - a.total)
                          .map((g, i) => (
                            <div
                              key={i}
                              style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, borderBottom: '1px solid #111118' }}
                            >
                              <span style={{ color: '#889' }}>{g.name}</span>
                              <span style={{ color: '#6f6', fontFamily: 'monospace', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                ×{g.qty} — {fmt(g.total)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'summary' && (
          <div className="fade">
            {(() => {
              const MONTHS = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ];
              const availMonths = [
                ...new Set(
                  activeEntries
                    .filter((e) => e.date)
                    .map((e) => {
                      const d = new Date(e.date);
                      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                    })
                ),
              ].sort();
              const fe =
                sumMonth === 'all'
                  ? activeEntries
                  : activeEntries.filter((e) => {
                      if (!e.date) return false;
                      const d = new Date(e.date);
                      return (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') ===
                        sumMonth
                      );
                    });
              const mTotal = fe.reduce((s, e) => s + lineTotal(e), 0);
              const mUp = [...new Set(fe.map((e) => e.productName))].length;
              const mUv = [...new Set(fe.map((e) => e.vendor))];
              const mLabel =
                sumMonth === 'all'
                  ? 'All Time'
                  : MONTHS[parseInt(sumMonth.split('-')[1]) - 1] + ' ' + sumMonth.split('-')[0];
              return (
                <>
                  <div
                    style={{
                      ...S.card,
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700 }}>📊 Summary</div>
                    <select
                      value={sumMonth}
                      onChange={(e) => setSumMonth(e.target.value)}
                      style={{ ...S.inp, width: 180 }}
                    >
                      <option value="all">All Time</option>
                      {availMonths.map((m) => {
                        const [y, mo] = m.split('-');
                        return (
                          <option key={m} value={m}>
                            {MONTHS[parseInt(mo) - 1]} {y}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      { l: mLabel.toUpperCase(), v: fmt(mTotal), c: '#6f6' },
                      { l: 'ENTRIES', v: fe.length, c: '#f80' },
                      {
                        l: 'NORTHSIDE',
                        v: fmt(fe.reduce((s, e) => s + lineTotal(e), 0)),
                        c: '#f0a',
                      },
                      { l: 'PRODUCTS', v: mUp, c: '#6af' },
                      { l: 'VENDORS', v: mUv.length, c: '#c6f' },
                    ].map((c, i) => (
                      <div key={i} style={S.card}>
                        <div
                          style={{
                            fontSize: 9,
                            color: '#445',
                            letterSpacing: 1,
                            marginBottom: 6,
                            fontWeight: 700,
                          }}
                        >
                          {c.l}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: c.c }}>{c.v}</div>
                      </div>
                    ))}
                  </div>
                  {fe.length > 0 && (
                    <div style={S.card}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Vendor Breakdown — {mLabel}
                      </div>
                      {(() => {
                        const vb = {};
                        fe.forEach((e) => {
                          if (!vb[e.vendor]) vb[e.vendor] = { count: 0, cost: 0 };
                          vb[e.vendor].count++;
                          vb[e.vendor].cost += lineTotal(e);
                        });
                        return Object.entries(vb)
                          .sort((a, b) => b[1].cost - a[1].cost)
                          .map(([v, d], i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span
                                style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#cdf' }}
                              >
                                {v}
                              </span>
                              <span style={{ fontSize: 11, color: '#f80', fontWeight: 700 }}>
                                {d.count} items
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  width: 100,
                                  textAlign: 'right',
                                  fontWeight: 600,
                                }}
                              >
                                {fmt(d.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length > 0 && (
                    <div style={{ ...S.card, marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Most Used Products — {mLabel}
                      </div>
                      {(() => {
                        const c = {};
                        fe.forEach((e) => {
                          const iNum = (e.productNumber || '').trim().toUpperCase();
                          const catEntry = lookupCanonicalProduct(e.vendor, iNum);
                          const key = (catEntry && iNum) ? iNum : canonicalProductKey(e.productName);
                          const displayName = catEntry ? catEntry.d : canonicalProductName(e.productName);
                          if (!c[key]) c[key] = { n: 0, cost: 0, name: displayName, itemNumber: '' };
                          if (catEntry && iNum) c[key].itemNumber = iNum;
                          c[key].n += Number(e.quantity) || 1;
                          c[key].cost += lineTotal(e);
                        });
                        return Object.values(c)
                          .sort((a, b) => b.n - a.n)
                          .slice(0, 15)
                          .map((d, i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#cdf', flex: 1 }}>{d.name}</span>
                              <span style={{ fontSize: 10, color: '#556', fontFamily: 'monospace', width: 80, textAlign: 'left', flexShrink: 0 }}>
                                {d.itemNumber || '—'}
                              </span>
                              <span style={{ fontSize: 11, color: '#f80', fontWeight: 700 }}>
                                {d.n}x
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  width: 85,
                                  textAlign: 'right',
                                }}
                              >
                                {fmt(d.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length > 0 && (
                    <div style={{ ...S.card, marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Cases — {mLabel}
                      </div>
                      {(() => {
                        const pc = {};
                        fe.forEach((e) => {
                          const k = (e.case_label || '') + '|' + e.date;
                          if (!pc[k])
                            pc[k] = {
                              case_label: e.case_label,
                              date: e.date,
                              facility: e.facility,
                              cost: 0,
                              items: 0,
                              vendors: new Set(),
                            };
                          pc[k].cost += lineTotal(e);
                          pc[k].items++;
                          pc[k].vendors.add(e.vendor);
                        });
                        return Object.values(pc)
                          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                          .map((p, i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span style={{ fontSize: 14, fontWeight: 700, width: 40 }}>
                                {p.case_label || '—'}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: '#667',
                                  width: 80,
                                }}
                              >
                                {p.date}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: p.facility === 'Northside' ? '#200020' : '#001a2a',
                                  color: fc(p.facility),
                                  border:
                                    '1px solid ' +
                                    (p.facility === 'Northside' ? '#401040' : '#003050'),
                                }}
                              >
                                {fl(p.facility)}
                              </span>
                              <span style={{ flex: 1 }}></span>
                              <span style={{ fontSize: 10, color: '#889' }}>
                                {p.items} items · {p.vendors.size} vendors
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  width: 100,
                                  textAlign: 'right',
                                }}
                              >
                                {fmt(p.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length === 0 && (
                    <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                      <div style={{ fontWeight: 600 }}>No data for {mLabel}</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {tab === 'archive' && (
          <div className="fade">
            {(() => {
              const archived = entries.filter((e) => e.archived_at).sort((a, b) => (b.archived_at || '').localeCompare(a.archived_at || ''));
              return (
                <>
                  <div style={{ ...S.card, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>🗄️ Archive</div>
                      <div style={{ fontSize: 11, color: '#556' }}>
                        {archived.length} archived {archived.length === 1 ? 'entry' : 'entries'} — restore or permanently delete
                      </div>
                    </div>
                    {archived.length > 0 && (
                      <button
                        onClick={purgeArchived}
                        style={{ ...S.inp, width: 'auto', background: '#1a0a0a', color: '#f66', border: '1px solid #3e1e1e', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12 }}
                      >
                        Purge All ({archived.length})
                      </button>
                    )}
                  </div>
                  {archived.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🗄️</div>
                      <div style={{ fontWeight: 600 }}>No archived entries</div>
                    </div>
                  ) : (
                    <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto', maxHeight: 500 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
                          <thead>
                            <tr>
                              {['FAC', 'VENDOR', 'DOS', 'PRODUCT', 'ITEM#', 'DESCRIPTION', 'QTY', 'COST', 'CASE LABEL', 'DATE SUBMITTED', 'BY', 'ARCHIVED', ''].map((h, i) => (
                                <th key={i} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#f80', borderBottom: '1px solid #1a1a28', background: '#08080e', position: 'sticky', top: 0, zIndex: 1, letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {archived.map((e, i) => (
                              <tr key={e.id || i} className="hr" style={{ borderBottom: '1px solid #0e0e18' }}>
                                <td style={{ padding: '7px 8px' }}>
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: e.facility === 'Northside' ? '#200020' : '#001a2a', color: fc(e.facility), border: `1px solid ${e.facility === 'Northside' ? '#401040' : '#003050'}` }}>
                                    {fl(e.facility)}
                                  </span>
                                </td>
                                <td style={{ padding: '7px 8px', fontSize: 12, fontWeight: 600 }}>{e.vendor}</td>
                                <td style={{ padding: '7px 8px', fontSize: 11, color: '#667', fontFamily: 'monospace' }}>{e.date}</td>
                                <td style={{ padding: '7px 8px', fontSize: 13, fontWeight: 600, color: '#cdf' }}>{e.productName}</td>
                                <td style={{ padding: '7px 8px', fontSize: 10, fontFamily: 'monospace', color: '#556' }}>{e.productNumber || '—'}</td>
                                <td style={{ padding: '7px 8px', fontSize: 11, color: '#889', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                                <td style={{ padding: '7px 8px', fontSize: 12, textAlign: 'center' }}>{e.quantity || 1}</td>
                                <td style={{ padding: '7px 8px', fontSize: 13, color: '#6f6', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fmt(e.cost)}</td>
                                <td style={{ padding: '7px 8px', fontSize: 13 }}>{e.case_label || '—'}</td>
                                <td style={{ padding: '7px 8px', fontSize: 10, color: '#6af', fontFamily: 'monospace' }}>{e.dateSubmitted || '—'}</td>
                                <td style={{ padding: '7px 8px', fontSize: 11, color: '#9be' }}>{e.submittedBy || '—'}</td>
                                <td style={{ padding: '7px 8px', fontSize: 10, color: '#f80', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{e.archived_at ? new Date(e.archived_at).toLocaleDateString() : '—'}</td>
                                <td style={{ padding: '7px 8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {e.bill_sheet_id && (
                                      <button onClick={() => openBillSheet(e.bill_sheet_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }} title="View bill sheet">📎</button>
                                    )}
                                    <button onClick={() => restoreEntry(e.id)} style={{ background: '#0a1a0a', border: '1px solid #1e3e1e', color: '#4f4', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, flexShrink: 0 }}>Restore</button>
                                    <button onClick={() => permanentlyDelete(e.id)} style={{ background: 'none', border: 'none', color: '#f44', cursor: 'pointer', fontSize: 11, opacity: 0.3 }}>✕</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {tab === 'emails' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                📧 Vendor Email Directory
              </div>
              <div style={{ fontSize: 11, color: '#556' }}>
                Contact emails organized by vendor — click any email to copy
              </div>
            </div>
            {(() => {
              const VE = [
                {
                  v: '4Web',
                  emails: [
                    'Rhodge@4webmedical.com',
                    'customerservice@4webmedical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Altus',
                  note: '(Sua Sponte Med)',
                  emails: [
                    'jacqi@suamed.com',
                    'justin@suamed.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Amplify',
                  emails: [
                    'customerservice@amplifysurgical.com',
                    'achoi@amplifysurgical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Carlsmed',
                  emails: [
                    'Billing@carlsmed.com',
                    'Dperry@carlsmed.com',
                    'lsonnino@carlsmed.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Cellerate',
                  emails: [
                    'hjarriel@sanaramedtech.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Choice',
                  emails: [
                    'chouck@choicespine.com',
                    'customerservice@choicespine.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'CoreLink',
                  note: '(Zavation)',
                  emails: [
                    'craig.barrett@zavation.com',
                    'zachary.jost@zavation.com',
                    'salesorders@zavation.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'ISTO',
                  emails: [
                    'stantonteam@istobiologics.com',
                    'Chamby@istobiologics.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'MiMedx',
                  emails: [
                    'dschmidt@mimedx.com',
                    'seaston@mimedx.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Providence',
                  emails: [
                    'jwalters@providencemt.com',
                    'ddunning@providencemt.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Royal',
                  emails: [
                    'salvatore@royalbiologics.com',
                    'billsheets@royalbiologics.com',
                    'kristen.kilbourn@royalbiologics.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Spinewave',
                  emails: [
                    'customerservice@spinewave.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Stimulan',
                  note: '(Biocomposites)',
                  emails: [
                    'jes@biocomposites.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Xtant',
                  emails: [
                    'CS@xtantmedical.com',
                    'breitzfeld@xtantmedical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
              ];
              const copyEmail = (email) => {
                navigator.clipboard.writeText(email);
                notify('Copied: ' + email);
              };
              const copyAll = (v) => {
                const found = VE.find((x) => x.v === v);
                if (found) {
                  navigator.clipboard.writeText(found.emails.join('; '));
                  notify('Copied all ' + found.v + ' emails');
                }
              };
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
                    gap: 12,
                  }}
                >
                  {VE.map((ve) => (
                    <div key={ve.v} style={{ ...S.card, padding: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f80' }}>
                            {ve.v}
                          </span>
                          {ve.note && (
                            <span style={{ fontSize: 10, color: '#556', marginLeft: 6 }}>
                              {ve.note}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => copyAll(ve.v)}
                          className="hb"
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #2a2a35',
                            background: '#0e0e18',
                            color: '#6af',
                            cursor: 'pointer',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          Copy All
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {ve.emails.map((em, i) => (
                          <div
                            key={i}
                            onClick={() => copyEmail(em)}
                            className="hr"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontFamily: 'monospace',
                              color: em.includes('eleven-medical')
                                ? '#888'
                                : em.includes('Coled7152')
                                  ? '#888'
                                  : '#adf',
                              background: '#0a0a14',
                              border: '1px solid #1a1a28',
                            }}
                          >
                            {em}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Floating Camera Button */}
        <style>{`@media (min-width:768px){.floating-cam{top:auto!important;right:auto!important;bottom:20px!important;left:20px!important}}`}</style>
        <button
          className="floating-cam"
          onClick={() => inboxRef.current?.click()}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#a6f',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Upload Bill Sheet"
        >
          📷
        </button>

        {/* Targeted snap modal — only used from patient cards for direct attach */}
        {snapOpen && (
          <div
            onClick={() => setSnapOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.8)',
              zIndex: 950,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#12121e',
                borderRadius: 16,
                padding: 24,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #2a2a3a',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                📷 Attach to Case
              </div>
              <div style={{ fontSize: 11, color: '#556', marginBottom: 16 }}>
                Attach a file directly to an existing case/vendor
              </div>
              {(() => {
                const pts = [...new Set(activeEntries.map((e) => (e.case_label || '') + '|' + e.date))].map((k) => {
                  const [p, d] = k.split('|');
                  return { label: p + ' — ' + d, value: k };
                });
                const isNew = snapForm.case_label === '__new__';
                const vendorsInCase =
                  snapForm.case_label && !isNew
                    ? [
                        ...new Set(
                          activeEntries
                            .filter((e) => (e.case_label || '') + '|' + e.date === snapForm.case_label)
                            .map((e) => e.vendor)
                        ),
                      ]
                    : [];
                return (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#a6f', marginBottom: 4 }}
                      >
                        CASE LABEL
                      </div>
                      <select
                        value={snapForm.case_label}
                        onChange={(e) =>
                          setSnapForm((f) => ({
                            ...f,
                            case_label: e.target.value,
                            vendor: '',
                            newCaseLabel: '',
                            newDate: '',
                            newVendor: '',
                          }))
                        }
                        style={S.inp}
                      >
                        <option value="">Select case...</option>
                        {pts.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                        <option value="__new__">＋ New Case</option>
                      </select>
                    </div>
                    {isNew && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#a6f',
                              marginBottom: 4,
                            }}
                          >
                            CASE LABEL
                          </div>
                          <input
                            placeholder="e.g. Case A"
                            value={snapForm.newCaseLabel || ''}
                            onChange={(e) =>
                              setSnapForm((f) => ({ ...f, newCaseLabel: e.target.value }))
                            }
                            style={S.inp}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#a6f',
                              marginBottom: 4,
                            }}
                          >
                            DOS
                          </div>
                          <input
                            type="date"
                            value={snapForm.newDate || ''}
                            onChange={(e) =>
                              setSnapForm((f) => ({ ...f, newDate: e.target.value }))
                            }
                            style={S.inp}
                          />
                        </div>
                      </div>
                    )}
                    {isNew && (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                        >
                          VENDOR
                        </div>
                        <select
                          value={snapForm.newVendor || ''}
                          onChange={(e) =>
                            setSnapForm((f) => ({ ...f, newVendor: e.target.value }))
                          }
                          style={S.inp}
                        >
                          <option value="">Select vendor...</option>
                          {VENDORS.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {!isNew && snapForm.case_label && (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                        >
                          VENDOR
                        </div>
                        {vendorsInCase.length > 0 ? (
                          <select
                            value={snapForm.vendor}
                            onChange={(e) => setSnapForm((f) => ({ ...f, vendor: e.target.value }))}
                            style={S.inp}
                          >
                            <option value="">Select vendor...</option>
                            {vendorsInCase.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                            <option value="__all__">— All Vendors for this case —</option>
                          </select>
                        ) : (
                          <div style={{ fontSize: 11, color: '#556' }}>
                            No vendors found for this case
                          </div>
                        )}
                      </div>
                    )}
                    {(snapForm.case_label && snapForm.case_label !== '__new__' && snapForm.vendor) ||
                    (isNew && snapForm.newCaseLabel && snapForm.newDate && snapForm.newVendor) ? (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#667',
                              marginBottom: 4,
                            }}
                          >
                            DOCUMENT TYPE
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setSnapForm((f) => ({ ...f, docType: 'bs' }))}
                              className="hb"
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border:
                                  '1px solid ' + (snapForm.docType === 'bs' ? '#a6f' : '#2a2a3a'),
                                background: snapForm.docType === 'bs' ? '#1a0a3a' : 'transparent',
                                color: snapForm.docType === 'bs' ? '#a6f' : '#556',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              📋 Bill Sheet
                            </button>
                            <button
                              onClick={() => setSnapForm((f) => ({ ...f, docType: 'po' }))}
                              className="hb"
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border:
                                  '1px solid ' + (snapForm.docType === 'po' ? '#f80' : '#2a2a3a'),
                                background: snapForm.docType === 'po' ? '#1a1208' : 'transparent',
                                color: snapForm.docType === 'po' ? '#f80' : '#556',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              📎 PO
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => snapFileRef.current?.click()}
                          className="hb"
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg,#a6f,#63f)',
                          }}
                        >
                          📷 Attach to Case
                        </button>
                      </>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={snapFileRef}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            const isNew = snapForm.case_label === '__new__';
            const pid = isNew ? snapForm.newCaseLabel : snapForm.case_label.split('|')[0];
            const dt = isNew ? snapForm.newDate : snapForm.case_label.split('|')[1];
            const vendors = isNew
              ? [snapForm.newVendor]
              : snapForm.vendor === '__all__'
                ? [
                    ...new Set(
                      entries
                        .filter((x) => (x.case_label || '') + '|' + x.date === snapForm.case_label)
                        .map((x) => x.vendor)
                    ),
                  ]
                : [snapForm.vendor];
            const store = snapForm.docType === 'bs' ? { ...bsImages } : { ...poImages };
            const saveFn = snapForm.docType === 'bs' ? saveBSs : savePOs;
            for (const vendor of vendors) {
              const vKey = pid + '|' + dt + '|' + vendor;
              if (!store[vKey]) store[vKey] = [];
              for (const file of files) {
                const reader = new FileReader();
                await new Promise((resolve) => {
                  reader.onload = () => {
                    store[vKey].push({
                      name: file.name,
                      data: reader.result,
                      date: new Date().toISOString(),
                    });
                    resolve();
                  };
                  reader.readAsDataURL(file);
                });
              }
            }
            await saveFn(store);
            e.target.value = '';
            const label = snapForm.docType === 'bs' ? 'Bill Sheet' : 'PO';
            notify(
              `${files.length} ${label}(s) → ${vendors.length > 1 ? vendors.length + ' vendors' : vendors[0]}`
            );
            setSnapOpen(false);
            setSnapForm({ case_label: '', date: '', vendor: '', docType: 'bs' });
          }}
        />
      </div>
    </div>
  );
}
