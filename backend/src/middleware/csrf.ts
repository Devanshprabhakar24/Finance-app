import { Request, Response, NextFunction } from 'express';

/**
 * CSRF middleware — disabled for cross-origin SPA with JWT Bearer auth.
 *
 * WHY THIS IS SAFE:
 * This app authenticates via Authorization: Bearer <token> header.
 * The Bearer token is stored in Zustand (memory/localStorage), NOT in a cookie.
 * Cross-origin attackers cannot read localStorage or set Authorization headers,
 * so CSRF attacks are not possible regardless of cookie state.
 *
 * The refresh token IS in an httpOnly cookie, but the refresh endpoint is
 * already protected by requiring a valid expired access token in the body,
 * making CSRF on that endpoint harmless.
 *
 * Traditional CSRF only applies when credentials are sent automatically via
 * cookies — which is not the case for the primary auth flow here.
 */
export const generateCsrfToken = (_req: Request, _res: Response, next: NextFunction) => next();
export const verifyCsrfToken = (_req: Request, _res: Response, next: NextFunction) => next();
