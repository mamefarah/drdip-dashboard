'use strict';

const ALLOWED_KOBO_MEDIA_HOSTS = [
  'kf.kobotoolbox.org',
  'eu.kobotoolbox.org',
  'kobotoolbox.org',
];

const DEFAULT_TIMEOUT_MS = 30000;

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

function isAllowedMediaUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_KOBO_MEDIA_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

async function fetchMediaWithTimeout(url, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Token ${token}`,
        Accept: 'image/*,video/*,audio/*,*/*;q=0.8',
      },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error('KoboToolbox media request timed out');
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

  const { url } = req.query;
  if (!url) {
    return jsonError(req, res, 400, 'Missing parameter: url');
  }

  if (!isAllowedMediaUrl(url)) {
    return jsonError(req, res, 403, 'Media URL is not allowed');
  }

  let mediaRes;
  try {
    mediaRes = await fetchMediaWithTimeout(url, token);
  } catch (err) {
    if (err.statusCode === 504) {
      return jsonError(req, res, 504, 'KoboToolbox media request timed out');
    }
    return jsonError(req, res, 502, 'Failed to fetch KoboToolbox media');
  }

  if (!mediaRes.ok) {
    return jsonError(req, res, 502, `KoboToolbox media returned status ${mediaRes.status}`);
  }

  const contentType = mediaRes.headers.get('content-type') || 'application/octet-stream';
  if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
    return jsonError(req, res, 415, 'Unsupported KoboToolbox media type');
  }

  const buffer = Buffer.from(await mediaRes.arrayBuffer());
  setCors(req, res);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', String(buffer.length));
  return res.status(200).send(buffer);
};
