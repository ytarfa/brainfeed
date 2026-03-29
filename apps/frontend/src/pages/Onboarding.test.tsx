import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import Onboarding from "./Onboarding";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(() => mockNavigate) };
});

vi.mock("../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

describe("Onboarding", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders Logo", () => {
    renderWithProviders(<Onboarding />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("step progress: shows step labels", () => {
    renderWithProviders(<Onboarding />);
    expect(screen.getByText("Create Space")).toBeInTheDocument();
    expect(screen.getByText("Browser extension")).toBeInTheDocument();
    expect(screen.getByText("Sync source")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  describe("Step 0 — Create Space", () => {
    it("shows 'Create your first Space' heading", () => {
      renderWithProviders(<Onboarding />);
      expect(screen.getByRole("heading", { name: /create your first space/i })).toBeInTheDocument();
    });

    it("shows space name and description inputs", () => {
      renderWithProviders(<Onboarding />);
      expect(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("What will you save here?")).toBeInTheDocument();
    });

    it("'Create Space →' button is disabled when name is empty", () => {
      renderWithProviders(<Onboarding />);
      const button = screen.getByRole("button", { name: /create space →/i });
      expect(button).toBeDisabled();
    });

    it("'Create Space →' button is enabled when name has text", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Onboarding />);

      await user.type(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…"), "My Space");
      const button = screen.getByRole("button", { name: /create space →/i });
      expect(button).toBeEnabled();
    });

    it("clicking 'Create Space →' advances to step 1", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Onboarding />);

      await user.type(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…"), "My Space");
      await user.click(screen.getByRole("button", { name: /create space →/i }));

      expect(screen.getByRole("heading", { name: /install the browser extension/i })).toBeInTheDocument();
    });
  });

  describe("Step 1 — Browser extension", () => {
    async function goToStep1() {
      const user = userEvent.setup();
      renderWithProviders(<Onboarding />);
      await user.type(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…"), "My Space");
      await user.click(screen.getByRole("button", { name: /create space →/i }));
      return user;
    }

    it("shows 'Install the browser extension' heading", async () => {
      await goToStep1();
      expect(screen.getByRole("heading", { name: /install the browser extension/i })).toBeInTheDocument();
    });

    it("'← Back' goes back to step 0", async () => {
      const user = await goToStep1();
      await user.click(screen.getByRole("button", { name: /← back/i }));
      expect(screen.getByRole("heading", { name: /create your first space/i })).toBeInTheDocument();
    });

    it("'Next →' advances to step 2", async () => {
      const user = await goToStep1();
      await user.click(screen.getByRole("button", { name: /next →/i }));
      expect(screen.getByRole("heading", { name: /connect a sync source/i })).toBeInTheDocument();
    });

    it("'Skip for now' advances to step 2", async () => {
      const user = await goToStep1();
      await user.click(screen.getByRole("button", { name: /skip for now/i }));
      expect(screen.getByRole("heading", { name: /connect a sync source/i })).toBeInTheDocument();
    });
  });

  describe("Step 2 — Sync source", () => {
    async function goToStep2() {
      const user = userEvent.setup();
      renderWithProviders(<Onboarding />);
      await user.type(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…"), "My Space");
      await user.click(screen.getByRole("button", { name: /create space →/i }));
      await user.click(screen.getByRole("button", { name: /next →/i }));
      return user;
    }

    it("shows 'Connect a sync source' heading", async () => {
      await goToStep2();
      expect(screen.getByRole("heading", { name: /connect a sync source/i })).toBeInTheDocument();
    });

    it("shows source options (YouTube, Spotify, Reddit, RSS/Atom)", async () => {
      await goToStep2();
      expect(screen.getByText("YouTube")).toBeInTheDocument();
      expect(screen.getByText("Spotify")).toBeInTheDocument();
      expect(screen.getByText("Reddit")).toBeInTheDocument();
      expect(screen.getByText("RSS / Atom")).toBeInTheDocument();
    });

    it("'Done →' advances to step 3", async () => {
      const user = await goToStep2();
      await user.click(screen.getByRole("button", { name: /done →/i }));
      expect(screen.getByRole("heading", { name: /you're all set/i })).toBeInTheDocument();
    });
  });

  describe("Step 3 — Done", () => {
    async function goToStep3() {
      const user = userEvent.setup();
      renderWithProviders(<Onboarding />);
      await user.type(screen.getByPlaceholderText("e.g. Dev tools, Recipes, Reading list…"), "My Space");
      await user.click(screen.getByRole("button", { name: /create space →/i }));
      await user.click(screen.getByRole("button", { name: /next →/i }));
      await user.click(screen.getByRole("button", { name: /done →/i }));
      return user;
    }

    it("shows 'You're all set!' heading", async () => {
      await goToStep3();
      expect(screen.getByRole("heading", { name: /you're all set/i })).toBeInTheDocument();
    });

    it("'Go to my library →' calls navigate('/library')", async () => {
      const user = await goToStep3();
      await user.click(screen.getByRole("button", { name: /go to my library →/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/library");
    });
  });
});
