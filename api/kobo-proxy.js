'use strict';

const ALLOWED_KOBO_SERVERS = new Set([
  'kf.kobotoolbox.org',
  'eu.kobotoolbox.org',
  'kobotoolbox.org',
]);

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_PAGES = 100;

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function jsonError(req, res, status, message) {
  setCors(req, res);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json({ error: message });
}

function parseServer(server) {
  try {
    const url = new URL(server);
    if (url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function isAllowedKoboServer(serverUrl) {
  return ALLOWED_KOBO_SERVERS.has(serverUrl.hostname.toLowerCase());
}

async function fetchJsonWithTimeout(url, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Token ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const err = new Error(`KoboToolbox returned status ${response.status}`);
      err.statusCode = response.status;
      throw err;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error('KoboToolbox request timed out');
      timeout.statusCode = 504;
      throw timeout;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return jsonError(req, res, 405, 'Method not allowed');
  }

  const token = process.env.KOBO_API_TOKEN;
  if (!token) {
    return jsonError(req, res, 401, 'Missing KOBO_API_TOKEN environment variable');
  }

  const server = req.query.server || process.env.KOBO_SERVER;
  const asset = req.query.asset || process.env.KOBO_ASSET_UID;

  if (!server || !asset) {
    return jsonError(req, res, 400, 'Missing KOBO_SERVER or KOBO_ASSET_UID');
  }

  const serverUrl = parseServer(server);
  if (!serverUrl) {
    return jsonError(req, res, 400, 'Invalid KOBO_SERVER URL');
  }

  if (!isAllowedKoboServer(serverUrl)) {
    return jsonError(req, res, 403, 'Kobo server domain is not allowed');
  }

  const results = [];
  let pageUrl = new URL(`/api/v2/assets/${encodeURIComponent(asset)}/data/`, serverUrl.origin).toString();
  let pageCount = 0;
  let reportedCount = 0;

  try {
    while (pageUrl) {
      pageCount += 1;
      if (pageCount > DEFAULT_MAX_PAGES) {
        return jsonError(req, res, 502, 'KoboToolbox pagination exceeded the maximum page limit');
      }

      const pageServerUrl = parseServer(pageUrl);
      if (!pageServerUrl || !isAllowedKoboServer(pageServerUrl)) {
        return jsonError(req, res, 403, 'Kobo pagination URL domain is not allowed');
      }

      const data = await fetchJsonWithTimeout(pageUrl, token);
      if (Number.isFinite(data.count)) reportedCount = data.count;
      if (Array.isArray(data.results)) results.push(...data.results);
      pageUrl = data.next || null;
    }
  } catch (err) {
    if (err.statusCode === 504) {
      return jsonError(req, res, 504, 'KoboToolbox request timed out');
    }
    return jsonError(req, res, 502, err.statusCode ? `KoboToolbox returned status ${err.statusCode}` : 'Failed to fetch live KoboToolbox records');
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    count: reportedCount || results.length,
    results,
    next: null,
    fetchedAt: new Date().toISOString(),
    source: 'kobotoolbox-live',
  });
};
