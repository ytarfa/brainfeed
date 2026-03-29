import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import UserSettings from "./UserSettings";

const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("../api/hooks", () => ({
  useProfile: vi.fn(),
  useUpdateProfile: vi.fn(() => ({ mutate: mockUpdateMutate })),
  useDeleteAccount: vi.fn(() => ({ mutate: mockDeleteMutate })),
}));

import { useProfile } from "../api/hooks";

const mockProfile = {
  id: "user-1",
  display_name: "Jane Doe",
  avatar_url: null,
  email: "jane@example.com",
  onboarding_completed: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("UserSettings", () => {
  beforeEach(() => {
    vi.mocked(useProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as unknown as ReturnType<typeof useProfile>);
    mockUpdateMutate.mockReset();
    mockDeleteMutate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state when isLoading is true", () => {
    vi.mocked(useProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useProfile>);

    renderWithProviders(<UserSettings />);
    expect(screen.getByText("Loading settings...")).toBeInTheDocument();
  });

  it("renders 'Settings' heading", () => {
    renderWithProviders(<UserSettings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders 4 tab buttons", () => {
    renderWithProviders(<UserSettings />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Connected accounts")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });

  it("shows avatar initial from display_name", () => {
    renderWithProviders(<UserSettings />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("shows name input with profile value", () => {
    renderWithProviders(<UserSettings />);
    const nameInput = screen.getByDisplayValue("Jane Doe");
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("type", "text");
  });

  it("shows email input with profile value", () => {
    renderWithProviders(<UserSettings />);
    const emailInput = screen.getByDisplayValue("jane@example.com");
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
  });

  it("'Save changes' calls updateProfile.mutate with display_name", () => {
    renderWithProviders(<UserSettings />);

    // Change the name input
    const nameInput = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(nameInput, { target: { value: "Jane Smith" } });

    // Click save
    fireEvent.click(screen.getByText("Save changes"));
    expect(mockUpdateMutate).toHaveBeenCalledWith({ display_name: "Jane Smith" });
  });

  it("clicking 'Connected accounts' tab shows connected accounts section", () => {
    renderWithProviders(<UserSettings />);

    // Click the Connected accounts tab (the nav button, not the heading)
    const tabs = screen.getAllByText("Connected accounts");
    fireEvent.click(tabs[0]);

    expect(screen.getByText("These accounts can sync content to your Spaces.")).toBeInTheDocument();
  });

  it("shows Google as 'Connected'", () => {
    renderWithProviders(<UserSettings />);
    const tabs = screen.getAllByText("Connected accounts");
    fireEvent.click(tabs[0]);

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows YouTube, Spotify, Reddit with 'Connect' buttons", () => {
    renderWithProviders(<UserSettings />);
    const tabs = screen.getAllByText("Connected accounts");
    fireEvent.click(tabs[0]);

    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("Reddit")).toBeInTheDocument();

    const connectButtons = screen.getAllByText("Connect");
    expect(connectButtons).toHaveLength(3);
  });

  it("clicking 'Notifications' tab shows notification preferences", () => {
    renderWithProviders(<UserSettings />);
    fireEvent.click(screen.getByText("Notifications"));

    expect(screen.getByText("Notification preferences")).toBeInTheDocument();
  });

  it("shows 4 notification preference labels", () => {
    renderWithProviders(<UserSettings />);
    fireEvent.click(screen.getByText("Notifications"));

    expect(screen.getByText("AI categorization activity")).toBeInTheDocument();
    expect(screen.getByText("Sync errors")).toBeInTheDocument();
    expect(screen.getByText("Collaborator activity")).toBeInTheDocument();
    expect(screen.getByText("Weekly digest")).toBeInTheDocument();
  });

  it("clicking 'Danger zone' tab shows delete section", () => {
    renderWithProviders(<UserSettings />);
    fireEvent.click(screen.getByText("Danger zone"));

    expect(screen.getByText("Delete account")).toBeInTheDocument();
    expect(
      screen.getByText(/permanently deletes your account/),
    ).toBeInTheDocument();
  });

  it("'Delete my account' button calls deleteAccount.mutate", () => {
    renderWithProviders(<UserSettings />);
    fireEvent.click(screen.getByText("Danger zone"));

    fireEvent.click(screen.getByText("Delete my account"));
    expect(mockDeleteMutate).toHaveBeenCalledTimes(1);
  });
});
