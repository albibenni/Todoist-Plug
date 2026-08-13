import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestUrl } = vi.hoisted(() => ({ requestUrl: vi.fn() }));

vi.mock("obsidian", () => ({ requestUrl }));

import {
  exchangeAuthorizationCode,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  refreshAccessToken,
} from "./oauth";

describe("Todoist OAuth", () => {
  beforeEach(() => {
    requestUrl.mockReset();
  });

  it("exchanges an authorization code using PKCE without a client secret", async () => {
    requestUrl.mockResolvedValue({
      status: 200,
      json: {
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "Bearer",
      },
      text: "",
    });

    await exchangeAuthorizationCode("authorization-code", "pkce-verifier");

    expect(requestUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: OAUTH_CLIENT_ID,
          code: "authorization-code",
          code_verifier: "pkce-verifier",
          redirect_uri: OAUTH_REDIRECT_URI,
        }).toString(),
      }),
    );
    expect(requestUrl.mock.calls[0]?.[0].body).not.toContain("client_secret");
  });

  it("uses the rotated refresh token to request new credentials", async () => {
    requestUrl.mockResolvedValue({
      status: 200,
      json: {
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
        token_type: "Bearer",
      },
      text: "",
    });

    await refreshAccessToken("old-refresh");

    expect(requestUrl.mock.calls[0]?.[0].body).toContain(
      "grant_type=refresh_token",
    );
    expect(requestUrl.mock.calls[0]?.[0].body).toContain(
      "refresh_token=old-refresh",
    );
  });
});
