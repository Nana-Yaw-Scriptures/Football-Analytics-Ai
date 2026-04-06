/**
 * fetchWithTimeout — drop-in fetch replacement that aborts after `ms` milliseconds.
 * Default 12 s is generous for African 2G/3G networks while still preventing infinite hangs.
 */
export async function fetchWithTimeout(url, options = {}, ms = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${ms / 1000}s — check your connection and try again.`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
