import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getStoredToken, setStoredToken, getExamples, analyzeBasket } from "@/lib/api";

describe("Frontend API Client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and retrieves JWT token", () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken("sample_token_xyz");
    expect(getStoredToken()).toBe("sample_token_xyz");
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });

  it("attaches Authorization header when token is present", async () => {
    setStoredToken("my_jwt_token");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ "Weekend breakfast": "bread, eggs" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await getExamples();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBe("Bearer my_jwt_token");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("throws formatted error when API returns non-200", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Basket text cannot be empty." }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(analyzeBasket("")).rejects.toThrow("Basket text cannot be empty.");
  });
});
