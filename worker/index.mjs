import published from './.generated/published.mjs';

// Bundled from the shared selectPublished() contract at build time. No request data
// is ever used as a bucket key until it has matched this exact allowlist.
const byKey = new Map(published.map((entry) => [entry.key, entry]));
const hex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
const baseHeaders = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' };
const error = (status, text, extra = {}) => new Response(text, { status, headers: { ...baseHeaders, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });

function disposition(filename, inline) {
  // Fixed ASCII fallback, with UTF-8 encoded name in filename*. Never interpolate raw text.
  const encoded = encodeURIComponent(filename.toWellFormed().replace(/[\u0000-\u001f\u007f]/g, '_')).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${inline ? 'inline' : 'attachment'}; filename="download"; filename*=UTF-8''${encoded}`;
}

export function createHandler(entries = byKey) {
  return {
    async fetch(request, env) {
      const path = new URL(request.url).pathname;
      const match = /^\/(download|media)\/(.+)$/.exec(path);
      if (!match) {
        // Reserved paths cannot fall through to static assets.
        if (/^\/(download|media)(?:\/|$)/.test(path)) return error(404, 'Not found');
        return env.ASSETS.fetch(request);
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return error(405, 'Method not allowed', { Allow: 'GET, HEAD' });
      const [, route, key] = match;
      // The canonical schema permits only URL-unreserved ASCII segments. Reject all
      // percent escapes, path ambiguity, backslashes, queries do not alter the key.
      if (!/^[A-Za-z0-9][A-Za-z0-9/_-]*(?:\.[A-Za-z0-9]+)?$/.test(key) || key.includes('//')) return error(404, 'Not found');
      const entry = entries.get(key);
      if (!entry || (route === 'media' && entry.kind !== 'png')) return error(404, 'Not found');
      let object;
      try {
        object = request.method === 'HEAD' ? await env.ORIGINALS.head(entry.key) : await env.ORIGINALS.get(entry.key);
      } catch {
        return error(503, 'File unavailable');
      }
      if (!object) return error(404, 'Not found');
      // Require R2's native SHA-256, not mutable user-supplied custom metadata.
      // Unknown or mismatched object bytes fail closed; see the upload runbook.
      if (!object.checksums?.sha256 || hex(object.checksums.sha256) !== entry.sha256) return error(503, 'File unavailable');
      const headers = new Headers(baseHeaders);
      headers.set('Content-Type', entry.kind === 'png' ? 'image/png' : 'application/json; charset=utf-8');
      headers.set('Content-Disposition', disposition(entry.filename, route === 'media'));
      headers.set('Content-Length', String(object.size));
      headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
      return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
    }
  };
}
export default createHandler();
