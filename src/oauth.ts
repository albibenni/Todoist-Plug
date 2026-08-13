import { requestUrl } from "obsidian";
import { z } from "zod";

export const OAUTH_CLIENT_ID =
  "https://albibenni.github.io/Todoist-Plug/oauth-client.json";
export const OAUTH_REDIRECT_URI =
  "https://albibenni.github.io/Todoist-Plug/todoist-callback.html";
export const OAUTH_PROTOCOL_ACTION = "todoist-plug-auth";

const TOKEN_URL = "https://api.todoist.com/oauth/access_token";
const AUTHORIZATION_URL = "https://app.todoist.com/oauth/authorize";
const TOKEN_SCHEMA = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
  token_type: z.literal("Bearer"),
});

export type OAuthTokens = z.infer<typeof TOKEN_SCHEMA>;

export type OAuthRequest = {
  state: string;
  verifier: string;
  authorizationUrl: string;
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const randomValue = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

const challengeFor = async (verifier: string) => {
  const bytes = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toBase64Url(new Uint8Array(digest));
};

export const createAuthorizationRequest = async (): Promise<OAuthRequest> => {
  const state = randomValue();
  const verifier = randomValue();
  const codeChallenge = await challengeFor(verifier);
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "data:read_write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    state,
    verifier,
    authorizationUrl: `${AUTHORIZATION_URL}?${params.toString()}`,
  };
};

const requestTokens = async (params: URLSearchParams): Promise<OAuthTokens> => {
  const response = await requestUrl({
    url: TOKEN_URL,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    throw: false,
  });
  if (response.status >= 400) {
    throw new Error(`Todoist OAuth error: ${response.status}`);
  }
  return TOKEN_SCHEMA.parse(response.json ?? JSON.parse(response.text));
};

export const exchangeAuthorizationCode = async (
  code: string,
  verifier: string,
) =>
  await requestTokens(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: OAUTH_CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: OAUTH_REDIRECT_URI,
    }),
  );

export const refreshAccessToken = async (refreshToken: string) =>
  await requestTokens(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: OAUTH_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  );
