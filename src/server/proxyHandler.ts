import type { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Handles incoming requests to `/api/proxy-stream`.
 * Acts as an intermediary relay to prevent school filters (Fortinet, Palo Alto, Lightspeed)
 * from classifying student traffic as 'Media Player' or blocking external video hosts.
 */
export function handleStreamProxyRequest(req: IncomingMessage, res: ServerResponse): void {
  // 1. Handle CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método no permitido. Solo se acepta GET o HEAD.' }));
    return;
  }

  // 2. Parse Query Parameters (supports direct 'url' or base64 'doc_ref' / 'edu_res' for LanSchool Air query bypass)
  const parsedReqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  let targetUrl = parsedReqUrl.searchParams.get('url');

  const b64Param =
    parsedReqUrl.searchParams.get('doc_ref') ||
    parsedReqUrl.searchParams.get('edu_res') ||
    parsedReqUrl.searchParams.get('b64');

  if (!targetUrl && b64Param) {
    try {
      targetUrl = Buffer.from(b64Param, 'base64').toString('utf-8');
    } catch {
      // invalid base64, fall back
    }
  }

  const isEduRoute =
    parsedReqUrl.pathname.includes('edu-asset') ||
    parsedReqUrl.pathname.includes('academic-cache') ||
    parsedReqUrl.pathname.includes('docs-stream');

  const isDisguised =
    parsedReqUrl.searchParams.get('disguise') === '1' ||
    Boolean(b64Param) ||
    isEduRoute;

  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Falta el parámetro "url" o "doc_ref" en la solicitud.' }));
    return;
  }

  let validatedUrl: URL;
  try {
    validatedUrl = new URL(targetUrl);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'La URL proporcionada no es válida.' }));
    return;
  }

  // Reject Google Drive from being proxied (per user request: "no Google Drive")
  const hostname = validatedUrl.hostname.toLowerCase();
  if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Google Drive no requiere proxy ya que utiliza su visor oficial integrado.',
    }));
    return;
  }

  // 3. Prepare headers to forward
  const forwardHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
  };

  if (req.headers.range) {
    forwardHeaders.Range = String(req.headers.range);
  }

  // 4. Recursive fetch to follow redirects up to 5 times
  function fetchUpstream(currentUrl: URL, redirectCount = 0): void {
    if (redirectCount > 5) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Demasiadas redirecciones del servidor de origen.' }));
      return;
    }

    const client = currentUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      protocol: currentUrl.protocol,
      hostname: currentUrl.hostname,
      port: currentUrl.port || (currentUrl.protocol === 'https:' ? 443 : 80),
      path: currentUrl.pathname + currentUrl.search,
      method: req.method,
      headers: {
        ...forwardHeaders,
        Host: currentUrl.hostname,
        Referer: `${currentUrl.protocol}//${currentUrl.hostname}/`,
      },
      timeout: 30000,
    };

    const upstreamReq = client.request(requestOptions, (upstreamRes) => {
      // Follow Redirects (301, 302, 303, 307, 308)
      if (
        upstreamRes.statusCode &&
        [301, 302, 303, 307, 308].includes(upstreamRes.statusCode) &&
        upstreamRes.headers.location
      ) {
        try {
          const nextUrl = new URL(upstreamRes.headers.location, currentUrl.href);
          fetchUpstream(nextUrl, redirectCount + 1);
          return;
        } catch {
          // Fall through if location is invalid
        }
      }

      // Copy response status
      res.statusCode = upstreamRes.statusCode || 200;

      // Copy essential streaming headers (Range support, length, etc.)
      const passHeaders = [
        'content-range',
        'accept-ranges',
        'content-length',
        'last-modified',
        'etag',
      ];

      for (const header of passHeaders) {
        if (upstreamRes.headers[header]) {
          res.setHeader(header, upstreamRes.headers[header] as string);
        }
      }

      // Always advertise byte ranges to allow scrubber seeking
      if (!res.hasHeader('accept-ranges')) {
        res.setHeader('Accept-Ranges', 'bytes');
      }

      // Anti-filter Content-Type & Payload masking (LanSchool Air, Securly, GoGuardian, Fortinet)
      const upstreamContentType = upstreamRes.headers['content-type'] || '';
      if (isDisguised) {
        // Disguise as generic educational data stream to prevent DPI categorization as 'Media Player'
        res.setHeader('Content-Type', 'application/octet-stream; charset=binary');
        res.setHeader('Content-Disposition', 'inline; filename="academic_resource.dat"');
        res.setHeader('X-Edu-Classification', 'academic-document-cache');
        res.setHeader('X-LanSchool-Safe', 'verified-clean');
      } else {
        res.setHeader('Content-Type', upstreamContentType || 'video/mp4');
      }

      // Institutional filter bypass metadata
      res.setHeader('X-School-Safe-Relay', 'active');
      res.setHeader('X-Domain-Intermediary', 'cinestream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=3600, no-transform');

      // Pipe data stream directly to the client
      upstreamRes.pipe(res);

      upstreamRes.on('error', (err) => {
        console.error('[StreamProxy] Upstream error:', err);
        if (!res.headersSent) {
          res.statusCode = 502;
          res.end();
        }
      });
    });

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.statusCode = 504;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Tiempo de espera agotado al conectar con el servidor de video.' }));
      }
    });

    upstreamReq.on('error', (err) => {
      console.error('[StreamProxy] Request error:', err);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Error conectando al video remoto: ${err.message}` }));
      }
    });

    req.on('close', () => {
      upstreamReq.destroy();
    });

    upstreamReq.end();
  }

  fetchUpstream(validatedUrl, 0);
}
