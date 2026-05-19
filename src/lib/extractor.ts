export interface ExtractedItem {
  vendor: string | null;
  product_name: string | null;
  item_number: string | null;
  lot_number: string | null;
  description: string | null;
  quantity: number | null;
  cost: number | null;
}

export interface ExtractedSheet {
  facility: string | null;
  date: string | null;
  items: ExtractedItem[];
}

export async function extractBillSheet(
  imageBase64: string,
  mediaType = 'image/jpeg',
): Promise<ExtractedSheet> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-billsheet`;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ image_base64: imageBase64, media_type: mediaType }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      detail = body.error ?? body.detail ?? '';
    } catch {
      // ignore parse errors
    }
    throw new Error(`Extraction failed (${res.status})${detail ? ': ' + detail : ''}`);
  }

  return res.json() as Promise<ExtractedSheet>;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
