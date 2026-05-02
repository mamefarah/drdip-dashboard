'use strict';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

function jsonError(res, status, message) {
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json({ error: message });
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

  // Extract token from Authorization header only — never from query string
  const authHeader = req.headers['authorization'] || '';
  const tokenMatch = authHeader.match(/^Token\s+(.+)$/i);
  if (!tokenMatch || !tokenMatch[1]) {
    return jsonError(res, 401, 'Missing Authorization token');
  }
  const token = tokenMatch[1].trim();

  // Validate required query params
  const { server, asset } = req.query;
  if (!server || !asset) {
    return jsonError(res, 400, 'Missing parameters: server, asset');
  }

  // Build KoboToolbox API URL
  let koboUrl;
  try {
    const base = new URL(server);
    koboUrl = `${base.origin}/api/v2/assets/${encodeURIComponent(asset)}/data.json?limit=30000`;
  } catch {
    return jsonError(res, 400, 'Invalid server URL');
  }

  let koboRes;
  try {
    koboRes = await fetch(koboUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    });
  } catch (err) {
    return jsonError(res, 502, 'Failed to reach KoboToolbox server');
  }

  // Forward non-2xx errors as safe messages
  if (!koboRes.ok) {
    const status = koboRes.status;
    let safeMessage = `KoboToolbox returned status ${status}`;
    if (status === 401 || status === 403) {
      safeMessage = 'KoboToolbox authentication failed — check your API token';
    } else if (status === 404) {
      safeMessage = 'KoboToolbox asset not found — check the Asset UID';
    }
    return jsonError(res, status, safeMessage);
  }

  let data;
  try {
    data = await koboRes.json();
  } catch {
    return jsonError(res, 502, 'Invalid JSON response from KoboToolbox');
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(data);
};
