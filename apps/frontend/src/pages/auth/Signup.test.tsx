import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import Signup from "./Signup";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(() => mockNavigate) };
});

vi.mock("../../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

vi.mock("../../api/auth", () => ({
  authSignUp: vi.fn().mockResolvedValue({ user: { id: "u1", email: "test@example.com" } }),
  authGetOAuthUrl: vi.fn().mockResolvedValue("https://oauth.example.com"),
}));

describe("Signup", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders Logo", () => {
    renderWithProviders(<Signup />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("shows 'Create your account' subtitle", () => {
    renderWithProviders(<Signup />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("renders 'Sign up with Google' button", () => {
    renderWithProviders(<Signup />);
    const button = screen.getByRole("button", { name: /sign up with google/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("renders name input with 'Your name' placeholder", () => {
    renderWithProviders(<Signup />);
    const input = screen.getByPlaceholderText("Your name");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders email input", () => {
    renderWithProviders(<Signup />);
    const input = screen.getByPlaceholderText("you@example.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders password input with 'Min. 8 characters' placeholder", () => {
    renderWithProviders(<Signup />);
    const input = screen.getByPlaceholderText("Min. 8 characters");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders 'Sign in' link to /login", () => {
    renderWithProviders(<Signup />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders 'Create account' submit button", () => {
    renderWithProviders(<Signup />);
    const button = screen.getByRole("button", { name: /create account/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("form submission navigates to /onboarding", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    await user.type(screen.getByPlaceholderText("Your name"), "Test User");
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Min. 8 characters"), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/confirm-email");
  });
});
