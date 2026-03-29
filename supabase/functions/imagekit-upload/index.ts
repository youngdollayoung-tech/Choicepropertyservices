// ============================================================
// Choice Properties — ImageKit Upload Edge Function
// Supabase → Functions → imagekit-upload
//
// Required secret in Supabase Dashboard → Edge Functions → Secrets:
//   IMAGEKIT_PRIVATE_KEY  →  your ImageKit private key
//   IMAGEKIT_URL_ENDPOINT →  e.g. https://ik.imagekit.io/yourID
//
// This function:
//   1. Verifies the caller has an authenticated Supabase session
//   2. Receives a base64-encoded file + metadata from the browser
//   3. Authenticates with ImageKit using the private key (server-side)
//   4. Uploads to ImageKit and returns the final CDN URL
//   5. The private key is NEVER exposed to the browser
// ============================================================

import { corsResponse } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { jsonResponse } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  // ── Auth check — reject unauthenticated callers ───────────
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { supabase } = auth;
  // ── End auth check ────────────────────────────────────────

  try {
    const IMAGEKIT_PRIVATE_KEY  = Deno.env.get('IMAGEKIT_PRIVATE_KEY');
    const IMAGEKIT_URL_ENDPOINT = Deno.env.get('IMAGEKIT_URL_ENDPOINT');

    if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
      return jsonResponse({ success: false, error: 'ImageKit not configured' }, 500);
    }

    const { fileData, fileName, folder } = await req.json();
    if (!fileData || !fileName) {
      return jsonResponse({ success: false, error: 'fileData and fileName required' }, 400);
    }

    const credentials = btoa(`${IMAGEKIT_PRIVATE_KEY}:`);
    const formData = new FormData();
    formData.append('file', fileData);
    formData.append('fileName', fileName);
    if (folder) formData.append('folder', folder);

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
      body: formData,
    });

    if (!ikRes.ok) {
      const errText = await ikRes.text().catch(() => `HTTP ${ikRes.status}`);
      return jsonResponse({ success: false, error: `ImageKit error: ${errText}` }, 502);
    }

    const ikData = await ikRes.json();
    return jsonResponse({ success: true, url: ikData.url, fileId: ikData.fileId });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
});
