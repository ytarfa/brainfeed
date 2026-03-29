import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import ForgotPassword from "./ForgotPassword";

vi.mock("../../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

vi.mock("../../api/auth", () => ({
  authForgotPassword: vi.fn().mockResolvedValue(undefined),
}));

describe("ForgotPassword", () => {
  it("renders Logo", () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("shows 'Reset password' heading initially", () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
  });

  it("shows email input with placeholder", () => {
    renderWithProviders(<ForgotPassword />);
    const input = screen.getByPlaceholderText("you@example.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("shows 'Send reset link' button", () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows '← Back to sign in' link", () => {
    renderWithProviders(<ForgotPassword />);
    const link = screen.getByRole("link", { name: /back to sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("after submitting with email, shows 'Check your email' heading", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
  });

  it("after submitting, shows the entered email address in confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("after submitting, shows '← Back to sign in' link (still)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    const link = screen.getByRole("link", { name: /back to sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});
