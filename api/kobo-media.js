'use strict';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const ALLOWED_HOSTS = ['kf.kobotoolbox.org', 'kobotoolbox.org'];

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

function jsonError(res, status, message) {
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json({ error: message });
}

function isAllowedUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    return jsonError(res, 405, 'Method not allowed');
  }

  // Extract token from Authorization header only
  const authHeader = req.headers['authorization'] || '';
  const tokenMatch = authHeader.match(/^Token\s+(.+)$/i);
  if (!tokenMatch || !tokenMatch[1]) {
    return jsonError(res, 401, 'Missing Authorization token');
  }
  const token = tokenMatch[1].trim();

  // Validate url param
  const { url } = req.query;
  if (!url) {
    return jsonError(res, 400, 'Missing parameter: url');
  }

  // Domain allowlist check
  if (!isAllowedUrl(url)) {
    return jsonError(res, 403, 'URL not allowed — must be from kobotoolbox.org');
  }

  let mediaRes;
  try {
    mediaRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
  } catch {
    return jsonError(res, 502, 'Failed to fetch media from KoboToolbox');
  }

  if (!mediaRes.ok) {
    return jsonError(res, mediaRes.status, `KoboToolbox media returned status ${mediaRes.status}`);
  }

  const contentType = mediaRes.headers.get('content-type') || 'application/octet-stream';

  // Only allow image and common media content types
  if (!contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('audio/')) {
    return jsonError(res, 415, 'Unsupported media type from KoboToolbox');
  }

  setCors(res);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');

  const buffer = await mediaRes.arrayBuffer();
  res.status(200).send(Buffer.from(buffer));
};
