import { describe, it, expect, beforeEach, vi } from "vitest";
import { getInitials, getLocalUser, setLocalUser, logoutUser } from "@/lib/auth";

describe("Frontend Auth Utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("computes initials accurately", () => {
    expect(getInitials("Priyanshi")).toBe("PR");
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
    expect(getInitials("")).toBe("U");
  });

  it("stores and retrieves user profile from localStorage", () => {
    const mockUser = {
      name: "Priyanshi",
      email: "demo@basketiq.io",
      initial: "P",
      role: "admin",
    };
    setLocalUser(mockUser);
    const retrieved = getLocalUser();
    expect(retrieved).toEqual(mockUser);
  });

  it("clears user and token on logout", () => {
    setLocalUser({ name: "User", email: "user@test.com", initial: "U" });
    localStorage.setItem("basketiq_token", "jwt_token_sample");
    
    logoutUser();
    
    expect(getLocalUser()).toBeNull();
    expect(localStorage.getItem("basketiq_token")).toBeNull();
  });
});
