import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock auth module
vi.mock("@/lib/auth", () => ({
  loginUser: vi.fn().mockResolvedValue({ name: "Demo User", email: "demo@basketiq.io" }),
  registerUser: vi.fn().mockResolvedValue({ name: "New User", email: "new@basketiq.io" }),
  socialLoginUser: vi.fn().mockResolvedValue({ name: "Social User", email: "social@basketiq.io" }),
}));

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders branding, feature list, and login form", () => {
    render(<LoginPage />);

    expect(screen.getByText("BasketIQ")).toBeDefined();
    expect(screen.getByText("AI-Powered Insights")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter your email")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter your password")).toBeDefined();
  });

  it("switches tabs between Sign In and Create Account", async () => {
    render(<LoginPage />);

    const createAccountTab = screen.getByRole("button", { name: "Signup tab" });
    await act(async () => {
      fireEvent.click(createAccountTab);
    });

    expect(screen.getByPlaceholderText("Enter your full name")).toBeDefined();
    expect(screen.getByPlaceholderText("Minimum 6 characters")).toBeDefined();
  });

  it("triggers form submit and authenticates", async () => {
    const { loginUser } = await import("@/lib/auth");
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const signInBtn = screen.getByRole("button", { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: "demo@basketiq.io" } });
    fireEvent.change(passwordInput, { target: { value: "BasketIQ2025!" } });

    await act(async () => {
      fireEvent.click(signInBtn);
    });

    expect(loginUser).toHaveBeenCalledWith("demo@basketiq.io", "BasketIQ2025!");
  });
});
