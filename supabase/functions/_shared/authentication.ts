// Based on https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/_shared/jwt/default.ts
import * as jose from "jsr:@panva/jose@6";
import { createClient, type User } from "jsr:@supabase/supabase-js@2";
import { createErrorResponse } from "./utils.ts";

const SUPABASE_JWT_ISSUER =
  Deno.env.get("SB_JWT_ISSUER") ?? Deno.env.get("SUPABASE_URL") + "/auth/v1";

const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(Deno.env.get("SUPABASE_URL")! + "/auth/v1/.well-known/jwks.json"),
);

function getAuthToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer") {
    throw new Error(`Auth header is not 'Bearer {token}'`);
  }

  return token;
}

function verifySupabaseJWT(jwt: string) {
  return jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
    issuer: SUPABASE_JWT_ISSUER,
  });
}

/**
 * Validates the Authorization header to ensure that a user is authenticated
 * with two-step verification (aal2), as the database policies require.
 */
export const AuthMiddleware = async (
  req: Request,
  next: (req: Request) => Promise<Response>,
) => {
  if (req.method === "OPTIONS") return await next(req);

  try {
    const token = getAuthToken(req);
    const { payload } = await verifySupabaseJWT(token);

    if (payload.aal !== "aal2") {
      return createErrorResponse(401, "Two-step verification required");
    }
    return await next(req);
  } catch (e) {
    return createErrorResponse(401, e?.toString() || "Unauthorized");
  }
};

/**
 * Claims of the request's JWT. Only call it behind AuthMiddleware, which
 * verified the signature.
 */
export const getVerifiedClaims = (req: Request) =>
  jose.decodeJwt(getAuthToken(req));

/**
 * Get the authenticated user using the authorization header.
 * User will be undefined for OPTIONS requests.
 */
export const UserMiddleware = async (
  req: Request,
  next: (req: Request, user?: User) => Promise<Response>,
) => {
  if (req.method === "OPTIONS") return await next(req);

  try {
    const authHeader = req.headers.get("Authorization")!;
    const localClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_PUBLISHABLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error: authError } = await localClient.auth.getUser();
    if (!data?.user || authError) {
      return createErrorResponse(401, "Unauthorized");
    }

    return next(req, data.user);
  } catch (err) {
    return createErrorResponse(401, err?.toString() || "Unauthorized");
  }
};
