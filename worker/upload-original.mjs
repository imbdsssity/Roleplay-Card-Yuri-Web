// Library for a separately authenticated administrative uploader. This module
// does not register an HTTP route and is not imported by the public Worker.
// `entry` must come from the reviewed upload ledger, not from request data.
const hex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

export async function putReviewedOriginal(bucket, entry, body) {
  if (!entry || typeof entry.key !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9/_-]*(?:\.[A-Za-z0-9]+)?$/.test(entry.key) || entry.key.includes('//')) throw new TypeError('Invalid reviewed object key');
  if (typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new TypeError('Invalid reviewed SHA-256');
  if (body == null) throw new TypeError('Missing original body');
  // Cloudflare validates the expected full-object digest while receiving the
  // bytes. If-None-Match prevents an existing object being overwritten.
  const onlyIf = new Headers({ 'If-None-Match': '*' });
  const written = await bucket.put(entry.key, body, { sha256: entry.sha256, onlyIf, storageClass: 'Standard' });
  if (!written) throw new Error('Object already exists or write precondition failed');
  const stored = await bucket.head(entry.key);
  if (!stored?.checksums?.sha256 || hex(stored.checksums.sha256) !== entry.sha256) throw new Error('Stored native SHA-256 does not match reviewed digest');
  return { key: entry.key, sha256: entry.sha256, size: stored.size };
}
