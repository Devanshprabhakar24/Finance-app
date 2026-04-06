import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from './errorHandler';

/**
 * Generate a fresh CSRF token and set it on the response cookie.
 * Called on every request so the frontend always has a valid token.
 *
 * Cookie settings for cross-origin (Vercel → Render):
 *   sameSite: 'none'  — required for cross-site cookie delivery
 *   secure: true      — required when sameSite is 'none'
 *   httpOnly: false   — frontend JS must be able to read this cookie
 *
 * NOTE: Because the frontend (vercel.app) and backend (onrender.com) are on
 * different domains, document.cookie on the frontend CANNOT read the backend
 * cookie. The token is therefore returned in the JSON body of GET /api/csrf-token
 * and stored in memory by the frontend (see axios.ts initCsrfToken).
 */
const setTokenCookie = (res: Response, token: string) => {
  res.cookie('csrfToken', token, {
    httpOnly: false,
    secure: true,                // always secure — required for sameSite: 'none'
    sameSite: 'none',            // required for cross-origin cookie delivery
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  // Always issue a token. If the cookie already arrived (same-origin / local dev),
  // reuse it so the frontend doesn't need to re-fetch. Otherwise generate fresh.
  const existing = req.cookies?.csrfToken;
  const token = existing || crypto.randomBytes(32).toString('hex');

  if (!existing) {
    setTokenCookie(res, token);
  }

  (req as any).csrfToken = token;
  next();
};

/**
 * Verify CSRF token for state-mutating requests.
 *
 * Strategy:
 *  1. Safe methods (GET/HEAD/OPTIONS) — always skip.
 *  2. Refresh-token endpoint — skip (uses httpOnly refresh cookie, no CSRF risk).
 *  3. All other POST/PUT/PATCH/DELETE — require X-CSRF-Token header to match
 *     the token stored in memory on the backend (req.csrfToken set above).
 *
 * For cross-origin SPAs the frontend fetches the token via GET /api/csrf-token,
 * stores it in memory, and sends it back as the X-CSRF-Token header. The cookie
 * value is irrelevant for verification — we compare header vs req.csrfToken.
 */
export const verifyCsrfToken = (req: Request, _res: Response, next: NextFunction) => {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip refresh-token (httpOnly cookie flow, no CSRF risk)
  if (req.path === '/api/auth/refresh-token') {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'] as string | undefined;
  const tokenFromRequest = (req as any).csrfToken as string | undefined;

  if (!tokenFromHeader || !tokenFromRequest || tokenFromHeader !== tokenFromRequest) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
};
