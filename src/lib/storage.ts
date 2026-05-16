import { supabase } from "@/lib/supabase";

interface StorageValue {
  value: string;
}

const PRODUCTS_SUFFIX = "-products-v3";

function toDbRow(e: any, systemId: string, userId: string) {
  return {
    user_id: userId,
    system_id: systemId,
    client_id: e.id,
    vendor: e.vendor,
    facility: e.facility,
    date: e.date,
    cost: Number(e.cost),
    patient: e.patient,
    product_name: e.productName,
    item_number: e.productNumber ?? "",
    description: e.description ?? null,
    quantity: Number(e.quantity) || 1,
    date_submitted: e.dateSubmitted || null,
    submitted_by: e.submittedBy || null,
  };
}

function fromDbRow(r: any) {
  return {
    id: r.client_id ?? r.id,
    vendor: r.vendor,
    facility: r.facility,
    date: r.date,
    cost: r.cost,
    patient: r.patient,
    productName: r.product_name,
    productNumber: r.item_number,
    description: r.description ?? "",
    quantity: r.quantity ?? 1,
    dateSubmitted: r.date_submitted ?? "",
    submittedBy: r.submitted_by ?? "",
  };
}

function systemPrefixFromKey(key: string): string {
  return key.slice(0, key.length - PRODUCTS_SUFFIX.length);
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("no auth");
  return data.user.id;
}

async function get(key: string, _scoped?: boolean): Promise<StorageValue | null> {
  if (key.endsWith(PRODUCTS_SUFFIX)) {
    const systemId = systemPrefixFromKey(key);
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", uid)
      .eq("system_id", systemId);
    if (error || !data) return null;
    return { value: JSON.stringify(data.map(fromDbRow)) };
  }

  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("kv_store")
    .select("value")
    .eq("user_id", uid)
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return { value: typeof data.value === "string" ? data.value : JSON.stringify(data.value) };
}

async function set(key: string, value: string, _scoped?: boolean): Promise<void> {
  if (key.endsWith(PRODUCTS_SUFFIX)) {
    const systemId = systemPrefixFromKey(key);
    const uid = await currentUserId();
    const incoming: any[] = JSON.parse(value);
    const rows = incoming.map((e) => toDbRow(e, systemId, uid));
    const incomingIds = new Set(rows.map((r) => r.client_id));

    const { data: existing } = await supabase
      .from("entries")
      .select("client_id")
      .eq("user_id", uid)
      .eq("system_id", systemId);

    const toDelete = (existing ?? [])
      .map((r: any) => r.client_id as string)
      .filter((cid) => cid && !incomingIds.has(cid));

    if (toDelete.length) {
      await supabase
        .from("entries")
        .delete()
        .eq("user_id", uid)
        .eq("system_id", systemId)
        .in("client_id", toDelete);
    }

    if (rows.length) {
      await supabase
        .from("entries")
        .upsert(rows, { onConflict: "user_id,system_id,client_id" });
    }
    return;
  }

  const uid = await currentUserId();
  await supabase
    .from("kv_store")
    .upsert(
      { user_id: uid, key, value: JSON.parse(value), updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
}

async function list(): Promise<string[]> {
  const uid = await currentUserId();
  const { data } = await supabase.from("kv_store").select("key").eq("user_id", uid);
  return (data ?? []).map((r: any) => r.key as string);
}

async function del(key: string): Promise<void> {
  const uid = await currentUserId();
  if (key.endsWith(PRODUCTS_SUFFIX)) {
    const systemId = systemPrefixFromKey(key);
    await supabase.from("entries").delete().eq("user_id", uid).eq("system_id", systemId);
    return;
  }
  await supabase.from("kv_store").delete().eq("user_id", uid).eq("key", key);
}

export const storage = { get, set, list, delete: del };

declare global {
  interface Window {
    storage: typeof storage;
  }
}
