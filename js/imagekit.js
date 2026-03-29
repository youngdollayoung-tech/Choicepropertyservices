// ============================================================
// Choice Properties — ImageKit Upload Client
// js/imagekit.js
//
// All photo uploads (property photos, avatars) go through
// this module. It calls the Supabase Edge Function which
// holds the ImageKit private key securely server-side.
//
// Usage:
//   import { uploadToImageKit } from '../js/imagekit.js';
//
//   const url = await uploadToImageKit(file, {
//     folder:   '/properties/PROP-ABC123',
//     onProgress: (pct) => console.log(pct + '%'),
//   });
// ============================================================

/**
 * Convert a File object to a base64 data URI string.
 * ImageKit's upload API accepts base64 strings directly.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result); // full data URI
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a single file to ImageKit via the Supabase Edge Function.
 *
 * @param {File}   file             - The file to upload
 * @param {object} options
 * @param {string} options.folder        - ImageKit folder path, e.g. '/properties/PROP-XYZ'
 * @param {function} options.onProgress  - Optional callback(percent: number)
 * @param {string} options.supabaseUrl   - CONFIG.SUPABASE_URL
 * @param {string} options.anonKey       - CONFIG.SUPABASE_ANON_KEY
 *
 * @returns {Promise<string>} The ImageKit CDN URL of the uploaded file
 */
export async function uploadToImageKit(file, options = {}) {
  const {
    folder      = '/properties',
    onProgress  = null,
    supabaseUrl = CONFIG.SUPABASE_URL,
    anonKey     = CONFIG.SUPABASE_ANON_KEY,
  } = options;

  // Resolve the authenticated user's JWT so the Edge Function can verify
  // the caller is a real logged-in user (not just the public anon key).
  const session = await window.CP?.Auth?.getSession?.();
  const userToken = session?.access_token || anonKey;

  // Validate file type client-side
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image file.`);
  }

  // Soft size cap — warn but still upload (ImageKit handles large files fine)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`${file.name} exceeds 10MB. Please use a smaller file.`);
  }

  // Signal start (10%)
  onProgress?.(10);

  // Convert to base64
  const base64DataUri = await fileToBase64(file);
  onProgress?.(30);

  // Build a clean filename
  const ext      = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  onProgress?.(50);

  // Call the Edge Function — use the authenticated user JWT, not the anon key,
  // so the server-side auth check can verify a real user session.
  const res = await fetch(`${supabaseUrl}/functions/v1/imagekit-upload`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':        anonKey,
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      fileData: base64DataUri,
      fileName:   safeName,
      folder,
    }),
  });

  onProgress?.(85);

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Upload failed');
  }

  onProgress?.(100);
  // I-028 FIX: return both url and fileId so callers can persist fileId
  // for later CDN deletion (I-015). Previously only data.url was returned.
  return { url: data.url, fileId: data.fileId ?? null };
}

/**
 * Upload multiple files with capped concurrency (3 at a time) and aggregate progress.
 *
 * I-016 FIX: The previous implementation used a sequential for-await loop —
 * each photo waited for the previous to finish. With the 20-photo max and
 * typical mobile latency this meant 20+ seconds of blocking upload time.
 * Replaced with a worker-pool pattern: up to 3 uploads run simultaneously,
 * reducing wall-clock time ~3x while staying well inside ImageKit rate limits.
 *
 * Result order is preserved — results[i] always corresponds to files[i]
 * regardless of which worker picked up which file.
 *
 * @param {File[]}  files
 * @param {object}  options  - Same as uploadToImageKit, plus:
 * @param {function} options.onFileProgress  - callback(fileIndex, percent)
 * @param {function} options.onTotalProgress - callback(overallPercent 0–100)
 *
 * @returns {Promise<Array<{url: string, fileId: string|null}>>} url+fileId pairs in input order
 */
export async function uploadMultipleToImageKit(files, options = {}) {
  const { onFileProgress, onTotalProgress, ...baseOptions } = options;
  const CONCURRENCY = 3;

  const results      = new Array(files.length);
  const fileProgress = new Array(files.length).fill(0); // per-file 0–100

  const updateTotal = () => {
    const sum     = fileProgress.reduce((a, b) => a + b, 0);
    const overall = Math.round(sum / files.length);
    onTotalProgress?.(overall);
  };

  // Worker pool: each worker claims the next unclaimed file index until exhausted.
  // JS is single-threaded — index++ is atomic, no mutex needed.
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < files.length) {
      const i = nextIndex++;
      results[i] = await uploadToImageKit(files[i], {
        ...baseOptions,
        onProgress: (pct) => {
          fileProgress[i] = pct;
          onFileProgress?.(i, pct);
          updateTotal();
        },
      });
    }
  }

  // Spawn min(CONCURRENCY, files.length) workers and wait for all to finish.
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
  );

  return results;
}

/**
 * Delete a single file from ImageKit via the imagekit-delete Edge Function.
 *
 * This is best-effort — callers should fire-and-forget and not surface
 * CDN errors to the user. A failure here does not affect DB state.
 *
 * @param {string} fileId       - ImageKit fileId returned at upload time
 * @param {object} options
 * @param {string} options.supabaseUrl   - CONFIG.SUPABASE_URL
 * @param {string} options.anonKey       - CONFIG.SUPABASE_ANON_KEY
 * @param {string} options.userToken     - JWT from the active session
 *
 * @returns {Promise<boolean>} true if deleted (or already gone), false on error
 */
export async function deleteFromImageKit(fileId, { supabaseUrl, anonKey, userToken }) {
  if (!fileId) return false;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/imagekit-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        anonKey,
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({ fileId }),
    });
    const data = await res.json().catch(() => ({}));
    return data.success === true;
  } catch {
    return false;
  }
}

