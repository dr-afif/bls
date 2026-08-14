export type AuthorizedResource = {
  organization_id: string;
  user_id: string;
  resource_id: string;
  resource_version_id: string;
  object_path: string;
  expires_in_seconds: number;
};

export type AccessDependencies = {
  authorize: (
    userId: string,
    resourceVersionId: string,
    requestId: string,
  ) => Promise<AuthorizedResource>;
  createSignedUrl: (objectPath: string, expiresIn: number) => Promise<string>;
  recordIssuance: (
    userId: string,
    resourceVersionId: string,
    requestId: string,
  ) => Promise<void>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json",
  Expires: "0",
  Pragma: "no-cache",
};

type RequestBody = {
  resourceVersionId?: unknown;
  requestId?: unknown;
};

function corsHeaders(origin: string | null, allowedOrigins: ReadonlySet<string>) {
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
  allowedOrigins: ReadonlySet<string>,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      ...corsHeaders(origin, allowedOrigins),
      ...extraHeaders,
    },
  });
}

function isValidBody(body: RequestBody): body is {
  resourceVersionId: string;
  requestId: string;
} {
  return typeof body.resourceVersionId === "string"
    && UUID_PATTERN.test(body.resourceVersionId)
    && typeof body.requestId === "string"
    && UUID_PATTERN.test(body.requestId);
}

function safeFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("RESOURCE_ACCESS_RATE_LIMITED")) {
    return { status: 429, code: "RATE_LIMITED", retryAfter: "60" };
  }
  if (message.includes("RESOURCE_ACCESS_DENIED")) {
    return { status: 403, code: "RESOURCE_ACCESS_DENIED" };
  }
  return { status: 503, code: "RESOURCE_ACCESS_UNAVAILABLE" };
}

export function createIssueResourceAccessHandler(
  dependencies: AccessDependencies,
  allowedOrigins: ReadonlySet<string>,
) {
  return async (request: Request, userId: string | null): Promise<Response> => {
    const origin = request.headers.get("Origin");

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(
        403,
        { code: "RESOURCE_ACCESS_DENIED" },
        null,
        allowedOrigins,
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...NO_STORE_HEADERS,
          ...corsHeaders(origin, allowedOrigins),
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        405,
        { code: "METHOD_NOT_ALLOWED" },
        origin,
        allowedOrigins,
        { Allow: "POST, OPTIONS" },
      );
    }

    if (!userId || !UUID_PATTERN.test(userId)) {
      return jsonResponse(
        401,
        { code: "AUTHENTICATION_REQUIRED" },
        origin,
        allowedOrigins,
      );
    }

    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch {
      return jsonResponse(
        400,
        { code: "INVALID_REQUEST" },
        origin,
        allowedOrigins,
      );
    }

    if (!isValidBody(body)) {
      return jsonResponse(
        400,
        { code: "INVALID_REQUEST" },
        origin,
        allowedOrigins,
      );
    }

    try {
      const authorized = await dependencies.authorize(
        userId,
        body.resourceVersionId,
        body.requestId,
      );
      const signedUrl = await dependencies.createSignedUrl(
        authorized.object_path,
        authorized.expires_in_seconds,
      );
      await dependencies.recordIssuance(
        userId,
        body.resourceVersionId,
        body.requestId,
      );

      return jsonResponse(
        200,
        {
          signedUrl,
          expiresIn: authorized.expires_in_seconds,
          resourceVersionId: authorized.resource_version_id,
        },
        origin,
        allowedOrigins,
      );
    } catch (error) {
      const failure = safeFailure(error);
      return jsonResponse(
        failure.status,
        { code: failure.code },
        origin,
        allowedOrigins,
        failure.retryAfter ? { "Retry-After": failure.retryAfter } : {},
      );
    }
  };
}
