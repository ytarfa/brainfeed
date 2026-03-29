import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import Login from "./Login";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(() => mockNavigate) };
});

vi.mock("../../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders Logo", () => {
    renderWithProviders(<Login />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("shows 'Save everything. Lose nothing.' tagline", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText("Save everything. Lose nothing.")).toBeInTheDocument();
  });

  it("renders 'Continue with Google' button", () => {
    renderWithProviders(<Login />);
    const button = screen.getByRole("button", { name: /continue with google/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("renders email input with placeholder", () => {
    renderWithProviders(<Login />);
    const input = screen.getByPlaceholderText("you@example.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders password input with placeholder", () => {
    renderWithProviders(<Login />);
    const input = screen.getByPlaceholderText("••••••••");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders 'Forgot password?' link to /forgot-password", () => {
    renderWithProviders(<Login />);
    const link = screen.getByRole("link", { name: /forgot password/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  it("renders 'Sign up free' link to /signup", () => {
    renderWithProviders(<Login />);
    const link = screen.getByRole("link", { name: /sign up free/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("renders 'Sign in' submit button", () => {
    renderWithProviders(<Login />);
    const button = screen.getByRole("button", { name: /^sign in$/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("form submission navigates to /library", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/library");
  });

  it("'or' divider text is shown", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText("or")).toBeInTheDocument();
  });
});
