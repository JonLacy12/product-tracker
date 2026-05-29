// src/components/AdminPanel.tsx
//
// Self-contained admin UI. Renders nothing for reps/managers; shows a floating
// "Admin" launcher for super_admin / company_admin. Mount once in App.tsx — it does
// not require any changes to Tracker.tsx.
//
// Reads/writes companies, regions, profiles directly (RLS scopes what each admin sees).
// Creating a LOGIN goes through the `admin-create-user` Edge Function (service-key,
// server-side) — the browser never holds the admin key.

import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/store/useUIStore';

type Role = 'super_admin' | 'company_admin' | 'manager' | 'rep';

interface Company { id: string; name: string; managers_can_edit: boolean }
interface Region { id: string; name: string; company_id: string }
interface Profile { id: string; full_name: string | null; role: Role; region_id: string | null; company_id: string | null }

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super admin',
  company_admin: 'Company admin',
  manager: 'Manager',
  rep: 'Rep',
};

export function AdminPanel() {
  const showToast = useUIStore((s) => s.showToast);

  const [me, setMe] = useState<{ id: string; role: Role; company_id: string | null } | null>(null);
  const [open, setOpen] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<string>(''); // company being managed
  const [regions, setRegions] = useState<Region[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);

  // new-entity form state
  const [newCompany, setNewCompany] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [np, setNp] = useState({ email: '', password: '', full_name: '', role: 'rep' as Role, region_id: '' });
  const [busy, setBusy] = useState(false);

  // ---- who am I? (decides whether the launcher even renders) ----
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles').select('id, role, company_id').eq('id', user.id).maybeSingle();
      if (data && (data.role === 'super_admin' || data.role === 'company_admin')) {
        setMe(data as { id: string; role: Role; company_id: string | null });
      }
    })();
  }, []);

  const isSuper = me?.role === 'super_admin';

  const loadCompanies = useCallback(async () => {
    const { data, error } = await supabase.from('companies').select('id, name, managers_can_edit').order('name');
    if (error) { showToast('error', error.message); return; }
    const list = (data ?? []) as Company[];
    setCompanies(list);
    setActiveCompany((prev) => prev || me?.company_id || list[0]?.id || '');
  }, [me, showToast]);

  const loadCompanyDetail = useCallback(async (companyId: string) => {
    if (!companyId) { setRegions([]); setPeople([]); return; }
    const [{ data: regs }, { data: profs }] = await Promise.all([
      supabase.from('regions').select('id, name, company_id').eq('company_id', companyId).order('name'),
      supabase.from('profiles').select('id, full_name, role, region_id, company_id').eq('company_id', companyId),
    ]);
    setRegions((regs ?? []) as Region[]);
    setPeople((profs ?? []) as Profile[]);
  }, []);

  useEffect(() => { if (open && me) loadCompanies(); }, [open, me, loadCompanies]);
  useEffect(() => { if (open && activeCompany) loadCompanyDetail(activeCompany); }, [open, activeCompany, loadCompanyDetail]);

  if (!me) return null; // reps/managers (or signed-out) see nothing

  const activeCompanyObj = companies.find((c) => c.id === activeCompany);

  // ---- actions ----
  const createCompany = async () => {
    if (!newCompany.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('companies').insert({ name: newCompany.trim() });
    setBusy(false);
    if (error) return showToast('error', error.message);
    setNewCompany('');
    showToast('success', 'Company created');
    loadCompanies();
  };

  const createRegion = async () => {
    if (!newRegion.trim() || !activeCompany) return;
    setBusy(true);
    const { error } = await supabase.from('regions').insert({ company_id: activeCompany, name: newRegion.trim() });
    setBusy(false);
    if (error) return showToast('error', error.message);
    setNewRegion('');
    showToast('success', 'Region added');
    loadCompanyDetail(activeCompany);
  };

  const toggleManagerEdit = async () => {
    if (!activeCompanyObj) return;
    const next = !activeCompanyObj.managers_can_edit;
    const { error } = await supabase.from('companies').update({ managers_can_edit: next }).eq('id', activeCompany);
    if (error) return showToast('error', error.message);
    showToast('success', `Managers can ${next ? 'now edit' : 'no longer edit'} reps' entries`);
    loadCompanies();
  };

  const addPerson = async () => {
    if (!np.email.trim() || np.password.length < 6) {
      return showToast('error', 'Email and a 6+ character temporary password are required');
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: np.email.trim(),
        password: np.password,
        full_name: np.full_name.trim(),
        role: np.role,
        company_id: activeCompany,
        region_id: np.region_id || null,
        manager_region_ids: np.role === 'manager' && np.region_id ? [np.region_id] : [],
      },
    });
    setBusy(false);

    // Edge Function returns { error } on 4xx (surfaced via FunctionsHttpError context).
    let errMsg = '';
    if (error) {
      errMsg = error.message;
      try { errMsg = (await (error as { context?: Response }).context?.json())?.error ?? errMsg; } catch { /* keep */ }
    } else if ((data as { error?: string } | null)?.error) {
      errMsg = (data as { error: string }).error;
    }
    if (errMsg) return showToast('error', errMsg);

    showToast('success', `${np.email} created as ${ROLE_LABEL[np.role]}`);
    setNp({ email: '', password: '', full_name: '', role: 'rep', region_id: '' });
    loadCompanyDetail(activeCompany);
  };

  const changeRole = async (id: string, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return showToast('error', error.message);
    loadCompanyDetail(activeCompany);
  };

  const changeRegion = async (id: string, region_id: string) => {
    const { error } = await supabase.from('profiles').update({ region_id: region_id || null }).eq('id', id);
    if (error) return showToast('error', error.message);
    loadCompanyDetail(activeCompany);
  };

  const regionName = (id: string | null) => regions.find((r) => r.id === id)?.name ?? '—';

  // ---- UI ----
  const overlay: CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(8,8,14,0.92)', zIndex: 1000,
    overflowY: 'auto', padding: '1.25rem',
    paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
  };
  const card: CSSProperties = {
    background: '#12121c', border: '1px solid #2a2a3a', borderRadius: 12,
    padding: '1rem', marginBottom: '1rem',
  };
  const launcher: CSSProperties = {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 56px)',
    right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
    zIndex: 999, borderRadius: 999, padding: '0.6rem 1rem',
  };

  if (!open) {
    return (
      <>
        <style>{`@media (min-width:768px){.admin-launcher{top:auto!important;bottom:20px!important;right:20px!important}}`}</style>
        <button className="btn btn-primary admin-launcher" style={launcher} onClick={() => setOpen(true)}>
          ⚙ Admin
        </button>
      </>
    );
  }

  return (
    <div style={overlay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Admin</h2>
        <button className="btn" onClick={() => setOpen(false)}>Close ✕</button>
      </div>

      {/* Company selector (super_admin can switch; company_admin is pinned) */}
      <div style={card}>
        <label className="text-muted">Company</label>
        <select
          className="input"
          value={activeCompany}
          onChange={(e) => setActiveCompany(e.target.value)}
          disabled={!isSuper}
        >
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {activeCompanyObj && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <input type="checkbox" checked={activeCompanyObj.managers_can_edit} onChange={toggleManagerEdit} />
            Managers can edit their reps&apos; entries
          </label>
        )}

        {isSuper && (
          <div className="form-row" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input className="input" placeholder="New company (e.g. Medtronic)" value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)} />
            <button className="btn btn-primary" disabled={busy} onClick={createCompany}>Add</button>
          </div>
        )}
      </div>

      {/* Regions */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Regions</h3>
        {regions.length === 0 && <p className="text-muted">No regions yet.</p>}
        {regions.map((r) => <div key={r.id} style={{ padding: '4px 0' }}>{r.name}</div>)}
        <div className="form-row" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input className="input" placeholder="New region (e.g. Southeast)" value={newRegion}
            onChange={(e) => setNewRegion(e.target.value)} />
          <button className="btn btn-primary" disabled={busy || !activeCompany} onClick={createRegion}>Add</button>
        </div>
      </div>

      {/* People */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>People</h3>
        {people.map((p) => (
          <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 140 }}>{p.full_name || '(no name)'} {p.id === me.id && <em className="text-muted">— you</em>}</span>
            <select className="input" style={{ width: 'auto' }} value={p.role}
              onChange={(e) => changeRole(p.id, e.target.value as Role)} disabled={p.id === me.id}>
              {(['rep', 'manager', 'company_admin', ...(isSuper ? ['super_admin'] : [])] as Role[])
                .map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <select className="input" style={{ width: 'auto' }} value={p.region_id ?? ''}
              onChange={(e) => changeRegion(p.id, e.target.value)}>
              <option value="">No region</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #2a2a3a', marginTop: 12, paddingTop: 12 }}>
          <h4 style={{ margin: '0 0 8px' }}>Add a person</h4>
          <input className="input" placeholder="Email" value={np.email}
            onChange={(e) => setNp({ ...np, email: e.target.value })} />
          <input className="input" placeholder="Temporary password (6+ chars)" value={np.password}
            onChange={(e) => setNp({ ...np, password: e.target.value })} />
          <input className="input" placeholder="Full name" value={np.full_name}
            onChange={(e) => setNp({ ...np, full_name: e.target.value })} />
          <select className="input" value={np.role} onChange={(e) => setNp({ ...np, role: e.target.value as Role })}>
            <option value="rep">Rep</option>
            <option value="manager">Manager</option>
            <option value="company_admin">Company admin</option>
            {isSuper && <option value="super_admin">Super admin</option>}
          </select>
          <select className="input" value={np.region_id} onChange={(e) => setNp({ ...np, region_id: e.target.value })}>
            <option value="">No region</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={addPerson} style={{ marginTop: 8 }}>
            {busy ? 'Creating…' : 'Create login'}
          </button>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
            They sign in with this email + temporary password. (A self-serve password change is a later add.)
          </p>
        </div>
      </div>
    </div>
  );
}
