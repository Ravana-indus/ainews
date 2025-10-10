export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}

export function isAdminRequest(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN || '';
  if (!token) return false;
  const hdr = req.headers.get('x-admin-token');
  if (hdr && hdr === token) return true;
  const cookies = parseCookies(req.headers.get('cookie'));
  return cookies['admin_token'] === token;
}

