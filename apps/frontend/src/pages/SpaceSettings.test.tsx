import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import SpaceSettings from "./SpaceSettings";

// --- Standalone mock functions for mutations ---

const mockUpdateSpaceMutate = vi.fn();
const mockDeleteSpaceMutate = vi.fn();
const mockShareSpaceMutate = vi.fn();
const mockUnshareSpaceMutate = vi.fn();
const mockCreateRuleMutate = vi.fn();
const mockDeleteRuleMutate = vi.fn();
const mockInviteMemberMutate = vi.fn();
const mockRemoveMemberMutate = vi.fn();
const mockDeleteSyncSourceMutate = vi.fn();

vi.mock("../api/hooks", () => ({
  useSpace: vi.fn(),
  useUpdateSpace: vi.fn(() => ({ mutate: mockUpdateSpaceMutate })),
  useDeleteSpace: vi.fn(() => ({ mutate: mockDeleteSpaceMutate })),
  useShareSpace: vi.fn(() => ({ mutate: mockShareSpaceMutate })),
  useUnshareSpace: vi.fn(() => ({ mutate: mockUnshareSpaceMutate })),
  useRules: vi.fn(),
  useCreateRule: vi.fn(() => ({ mutate: mockCreateRuleMutate })),
  useDeleteRule: vi.fn(() => ({ mutate: mockDeleteRuleMutate })),
  useMembers: vi.fn(),
  useInviteMember: vi.fn(() => ({ mutate: mockInviteMemberMutate })),
  useRemoveMember: vi.fn(() => ({ mutate: mockRemoveMemberMutate })),
  useSyncSources: vi.fn(),
  useDeleteSyncSource: vi.fn(() => ({ mutate: mockDeleteSyncSourceMutate })),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: "space-1" })),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

import {
  useSpace,
  useRules,
  useMembers,
  useSyncSources,
} from "../api/hooks";

// --- Mock data ---

const mockSpace = {
  id: "space-1",
  name: "Test Space",
  description: "A test space",
  color: "#ff0000",
  share_token: null as string | null,
  ai_auto_categorize: true,
  space_members: [
    {
      user_id: "u1",
      role: "owner",
      profiles: { display_name: "Owner", avatar_url: null },
    },
  ],
  bookmarks: { data: [], total: 0, page: 1, limit: 20 },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: "u1",
};

const mockRules = [
  {
    id: "r1",
    space_id: "space-1",
    rule_type: "domain",
    rule_value: "example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockMembers = [
  {
    id: "m1",
    role: "owner",
    invited_at: "2024-01-01T00:00:00Z",
    accepted_at: "2024-01-01T00:00:00Z",
    profiles: { id: "u1", display_name: "Owner", avatar_url: null },
  },
  {
    id: "m2",
    role: "viewer",
    invited_at: "2024-01-02T00:00:00Z",
    accepted_at: null,
    profiles: { id: "u2", display_name: "Viewer", avatar_url: null },
  },
];

const mockSyncSources = [
  {
    id: "ss1",
    platform: "youtube",
    external_id: "ext-1",
    external_name: "My Channel",
    space_id: "space-1",
    sync_frequency: "daily",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_id: "u1",
    spaces: { id: "space-1", name: "Test Space" },
  },
];

// --- Helpers ---

function setupDefaultMocks(spaceOverrides: Partial<typeof mockSpace> = {}) {
  vi.mocked(useSpace).mockReturnValue({
    data: { ...mockSpace, ...spaceOverrides },
    isLoading: false,
  } as unknown as ReturnType<typeof useSpace>);

  vi.mocked(useRules).mockReturnValue({
    data: { data: mockRules },
  } as unknown as ReturnType<typeof useRules>);

  vi.mocked(useMembers).mockReturnValue({
    data: { data: mockMembers },
  } as unknown as ReturnType<typeof useMembers>);

  vi.mocked(useSyncSources).mockReturnValue({
    data: { data: mockSyncSources },
  } as unknown as ReturnType<typeof useSyncSources>);
}

function renderSettings() {
  return renderWithProviders(<SpaceSettings />, {
    routes: ["/spaces/space-1/settings"],
  });
}

// --- Tests ---

describe("SpaceSettings", () => {
  beforeEach(() => {
    mockUpdateSpaceMutate.mockReset();
    mockDeleteSpaceMutate.mockReset();
    mockShareSpaceMutate.mockReset();
    mockUnshareSpaceMutate.mockReset();
    mockCreateRuleMutate.mockReset();
    mockDeleteRuleMutate.mockReset();
    mockInviteMemberMutate.mockReset();
    mockRemoveMemberMutate.mockReset();
    mockDeleteSyncSourceMutate.mockReset();
    mockNavigate.mockReset();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Loading / error states ---

  describe("loading and error states", () => {
    it("shows Loading... when space is loading", () => {
      vi.mocked(useSpace).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useSpace>);

      renderSettings();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows Space not found. when space is null", () => {
      vi.mocked(useSpace).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useSpace>);

      renderSettings();
      expect(screen.getByText("Space not found.")).toBeInTheDocument();
    });
  });

  // --- Layout / navigation ---

  describe("layout and navigation", () => {
    it("renders breadcrumb with space name linking to /spaces/space-1", () => {
      renderSettings();
      const link = screen.getByText("Test Space").closest("a");
      expect(link).toHaveAttribute("href", "/spaces/space-1");
    });

    it("renders Space Settings heading", () => {
      renderSettings();
      expect(screen.getByText("Space Settings")).toBeInTheDocument();
    });

    it("renders all 5 nav buttons", () => {
      renderSettings();
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Categorization")).toBeInTheDocument();
      expect(screen.getByText("Collaborators")).toBeInTheDocument();
      expect(screen.getByText("Sync sources")).toBeInTheDocument();
      expect(screen.getByText("Public sharing")).toBeInTheDocument();
    });
  });

  // --- General section (default tab) ---

  describe("General section", () => {
    it("shows space name input prefilled with space name", () => {
      renderSettings();
      const input = screen.getByDisplayValue("Test Space");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("Save changes calls updateSpace.mutate with id and name", async () => {
      const user = userEvent.setup();
      renderSettings();

      const input = screen.getByDisplayValue("Test Space");
      await user.clear(input);
      await user.type(input, "Updated Name");

      await user.click(screen.getByText("Save changes"));
      expect(mockUpdateSpaceMutate).toHaveBeenCalledWith({
        id: "space-1",
        name: "Updated Name",
      });
    });

    it("shows Danger zone section", () => {
      renderSettings();
      expect(screen.getByText("Danger zone")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Deleting this Space removes all its bookmarks and cannot be undone.",
        ),
      ).toBeInTheDocument();
    });

    it("Delete Space calls deleteSpace.mutate with id", async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText("Delete Space"));
      expect(mockDeleteSpaceMutate).toHaveBeenCalledTimes(1);
      expect(mockDeleteSpaceMutate).toHaveBeenCalledWith(
        "space-1",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("Delete Space navigates to /spaces on success", async () => {
      mockDeleteSpaceMutate.mockImplementation((_id: string, opts: { onSuccess: () => void }) => {
        opts.onSuccess();
      });

      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText("Delete Space"));
      expect(mockNavigate).toHaveBeenCalledWith("/spaces");
    });
  });

  // --- Rules (Categorization) section ---

  describe("Rules section", () => {
    async function switchToRules() {
      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByText("Categorization"));
      return user;
    }

    it("clicking Categorization tab shows rules section", async () => {
      await switchToRules();
      expect(screen.getByText("Categorization rules")).toBeInTheDocument();
    });

    it("renders rule list with rule_type and rule_value", async () => {
      await switchToRules();
      expect(screen.getByText("domain")).toBeInTheDocument();
      expect(screen.getByText(/example\.com/)).toBeInTheDocument();
      expect(screen.getByText("contains")).toBeInTheDocument();
    });

    it("Remove button calls deleteRule.mutate with spaceId and ruleId", async () => {
      const user = await switchToRules();
      await user.click(screen.getByText("Remove"));
      expect(mockDeleteRuleMutate).toHaveBeenCalledWith({
        spaceId: "space-1",
        ruleId: "r1",
      });
    });

    it("renders + Add rule button", async () => {
      await switchToRules();
      expect(screen.getByText("+ Add rule")).toBeInTheDocument();
    });

    it("shows AI auto-categorize toggle label", async () => {
      await switchToRules();
      expect(screen.getByText("AI auto-categorize")).toBeInTheDocument();
    });
  });

  // --- Collaborators section ---

  describe("Collaborators section", () => {
    async function switchToCollaborators() {
      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByText("Collaborators"));
      return user;
    }

    it("clicking Collaborators tab shows collaborators section", async () => {
      await switchToCollaborators();
      expect(
        screen.getByRole("heading", { name: "Collaborators" }),
      ).toBeInTheDocument();
    });

    it("renders member list with names and roles", async () => {
      await switchToCollaborators();
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Viewer")).toBeInTheDocument();
    });

    it("invite input and button calls inviteMember.mutate", async () => {
      const user = await switchToCollaborators();

      const emailInput = screen.getByPlaceholderText("name@example.com");
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByText("Invite"));

      expect(mockInviteMemberMutate).toHaveBeenCalledWith(
        { spaceId: "space-1", email: "test@example.com", role: "viewer" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("Remove button on non-owner calls removeMember.mutate", async () => {
      const user = await switchToCollaborators();

      // There should be exactly one Remove button (only for the viewer, not the owner)
      const removeButton = screen.getByText("Remove");
      await user.click(removeButton);

      expect(mockRemoveMemberMutate).toHaveBeenCalledWith({
        spaceId: "space-1",
        memberId: "m2",
      });
    });

    it("owner member does NOT show Remove button", async () => {
      // Set up with only an owner member
      vi.mocked(useMembers).mockReturnValue({
        data: {
          data: [
            {
              id: "m1",
              role: "owner",
              invited_at: "2024-01-01T00:00:00Z",
              accepted_at: "2024-01-01T00:00:00Z",
              profiles: { id: "u1", display_name: "Owner", avatar_url: null },
            },
          ],
        },
      } as unknown as ReturnType<typeof useMembers>);

      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByText("Collaborators"));

      // Owner is shown, but no Remove button exists
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });
  });

  // --- Sync section ---

  describe("Sync section", () => {
    async function switchToSync() {
      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByText("Sync sources"));
      return user;
    }

    it("clicking Sync sources tab shows sync section heading", async () => {
      await switchToSync();
      expect(
        screen.getByRole("heading", { name: "Sync sources" }),
      ).toBeInTheDocument();
    });

    it("renders sync source with name and frequency", async () => {
      await switchToSync();
      expect(screen.getByText("My Channel")).toBeInTheDocument();
      expect(screen.getByText("daily")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("Disconnect button calls deleteSyncSource.mutate", async () => {
      const user = await switchToSync();
      await user.click(screen.getByText("Disconnect"));
      expect(mockDeleteSyncSourceMutate).toHaveBeenCalledWith("ss1");
    });

    it("renders Connect a source section with platform buttons", async () => {
      await switchToSync();
      expect(screen.getByText("Connect a source")).toBeInTheDocument();
      expect(screen.getByText("YouTube")).toBeInTheDocument();
      expect(screen.getByText("Spotify")).toBeInTheDocument();
      expect(screen.getByText("Reddit")).toBeInTheDocument();
      expect(screen.getByText("RSS feed")).toBeInTheDocument();
    });
  });

  // --- Sharing section ---

  describe("Sharing section", () => {
    async function switchToSharing(spaceOverrides: Partial<typeof mockSpace> = {}) {
      if (Object.keys(spaceOverrides).length > 0) {
        setupDefaultMocks(spaceOverrides);
      }
      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByText("Public sharing"));
      return user;
    }

    it("shows Generate share link button when no share_token", async () => {
      await switchToSharing();
      expect(screen.getByText("Generate share link")).toBeInTheDocument();
    });

    it("Generate share link calls shareSpace.mutate with id", async () => {
      const user = await switchToSharing();
      await user.click(screen.getByText("Generate share link"));
      expect(mockShareSpaceMutate).toHaveBeenCalledWith("space-1");
    });

    it("when share_token exists, shows share link URL and Copy and Revoke link buttons", async () => {
      await switchToSharing({ share_token: "abc123" });
      expect(screen.getByText("https://brainfeed.app/p/abc123")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Revoke link")).toBeInTheDocument();
    });

    it("Revoke link calls unshareSpace.mutate with id", async () => {
      const user = await switchToSharing({ share_token: "abc123" });
      await user.click(screen.getByText("Revoke link"));
      expect(mockUnshareSpaceMutate).toHaveBeenCalledWith("space-1");
    });

    it("Copy button writes share link to clipboard and shows Copied!", () => {
      setupDefaultMocks({ share_token: "abc123" });
      vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      renderSettings();
      fireEvent.click(screen.getByText("Public sharing"));
      fireEvent.click(screen.getByText("Copy"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://brainfeed.app/p/abc123");
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });
});
