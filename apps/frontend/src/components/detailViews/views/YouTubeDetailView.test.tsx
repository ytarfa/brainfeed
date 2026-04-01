import React from "react";
import { render, screen } from "@testing-library/react";
import YouTubeDetailView from "./YouTubeDetailView";
import type { Bookmark } from "@brain-feed/types";

function createYouTubeBookmark(
  subType: "video" | "channel" | "playlist",
  metadataOverrides: Record<string, string | number> = {},
  bookmarkOverrides: Partial<Bookmark> = {},
): Bookmark {
  let baseMetadata: Record<string, string | number> = {};
  if (subType === "video") {
    baseMetadata = {
      videoId: "abc123",
      title: "Test Video Title",
      channelTitle: "TestChannel",
      viewCount: "1250000",
      likeCount: "45000",
      duration: "12:34",
      durationSeconds: 754,
      publishedAt: "2024-06-15T10:00:00Z",
      transcriptAvailable: "true",
    };
  } else if (subType === "channel") {
    baseMetadata = {
      channelTitle: "TestChannel",
      channelId: "UC_test123",
      subscriberCount: "890000",
      videoCount: "245",
      viewCount: "42000000",
      customUrl: "@testchannel",
      country: "US",
    };
  } else {
    baseMetadata = {
      playlistId: "PL_test123",
      title: "Test Playlist",
      itemCount: 18,
      channelTitle: "TestChannel",
      publishedAt: "2024-03-10T08:00:00Z",
    };
  }

  const base: Partial<Bookmark> = {
    id: "bk-yt-1",
    user_id: "user-1",
    url: "https://youtube.com/watch?v=abc123",
    title: "Test YouTube Bookmark",
    description: "A test YouTube description",
    notes: "Some notes",
    thumbnail_url: "https://img.youtube.com/vi/abc123/hqdefault.jpg",
    content_type: "link",
    source_type: "youtube",
    tags: [{ id: "t1", label: "tutorial" }],
    raw_content: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    spaceId: "space-1",
    domain: "youtube.com",
    summary: "A test summary",
    savedAt: "10 min ago",
    enrichment_status: "completed",
    enriched_data: {
      summary: "AI-generated summary of this YouTube content.",
      entities: [{ name: "React", type: "TECHNOLOGY" }],
      topics: ["programming"],
      tags: ["youtube", "tutorial"],
      metadata: {
        ...baseMetadata,
        ...metadataOverrides,
      },
      processedAt: "2024-01-01T00:00:00Z",
    },
    ...bookmarkOverrides,
  };

  return base as Bookmark;
}

describe("YouTubeDetailView", () => {
  describe("Video sub-type", () => {
    it("renders video title and channel name", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Test YouTube Bookmark")).toBeInTheDocument();
      expect(screen.getByText("TestChannel")).toBeInTheDocument();
    });

    it("renders thumbnail as a clickable link", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      const link = screen.getByLabelText("Watch on YouTube");
      expect(link).toHaveAttribute("href", "https://youtube.com/watch?v=abc123");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders thumbnail image", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      const img = screen.getByAltText("Test YouTube Bookmark");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://img.youtube.com/vi/abc123/hqdefault.jpg");
    });

    it("renders ThumbnailPlaceholder when no thumbnail_url", () => {
      const bk = createYouTubeBookmark("video", {}, { thumbnail_url: null });
      const { container } = render(<YouTubeDetailView bookmark={bk} />);

      // No <img> should be present
      expect(container.querySelectorAll("img")).toHaveLength(0);
      // Still has the play overlay link
      expect(screen.getByLabelText("Watch on YouTube")).toBeInTheDocument();
    });

    it("renders formatted view count", () => {
      const bk = createYouTubeBookmark("video", { viewCount: "1250000" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("1.3M")).toBeInTheDocument();
    });

    it("renders formatted like count", () => {
      const bk = createYouTubeBookmark("video", { likeCount: "45000" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("45K")).toBeInTheDocument();
    });

    it("renders duration badge on thumbnail", () => {
      const bk = createYouTubeBookmark("video", { duration: "1:04:13" });
      render(<YouTubeDetailView bookmark={bk} />);

      // Duration appears both in badge and stat
      expect(screen.getAllByText("1:04:13").length).toBeGreaterThanOrEqual(1);
    });

    it("renders published date", () => {
      const bk = createYouTubeBookmark("video", { publishedAt: "2024-06-15T10:00:00Z" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Jun 15, 2024")).toBeInTheDocument();
    });

    it("gracefully handles missing metadata fields", () => {
      const bk = createYouTubeBookmark("video", {
        videoId: "abc123",
        title: "Minimal Video",
      });
      // Remove optional fields
      if (bk.enriched_data?.metadata) {
        delete (bk.enriched_data.metadata as Record<string, unknown>).channelTitle;
        delete (bk.enriched_data.metadata as Record<string, unknown>).viewCount;
        delete (bk.enriched_data.metadata as Record<string, unknown>).likeCount;
        delete (bk.enriched_data.metadata as Record<string, unknown>).publishedAt;
      }
      render(<YouTubeDetailView bookmark={bk} />);

      // Should still render the title
      expect(screen.getByText("Test YouTube Bookmark")).toBeInTheDocument();
    });

    it("renders footer with 'Watch on YouTube'", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Watch on YouTube")).toBeInTheDocument();
    });
  });

  describe("Channel sub-type", () => {
    it("renders channel name and 'Channel' label", () => {
      const bk = createYouTubeBookmark("channel");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("TestChannel")).toBeInTheDocument();
      expect(screen.getByText("Channel")).toBeInTheDocument();
    });

    it("renders formatted subscriber count", () => {
      const bk = createYouTubeBookmark("channel", { subscriberCount: "890000" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("890K")).toBeInTheDocument();
    });

    it("renders video count", () => {
      const bk = createYouTubeBookmark("channel", { videoCount: "245" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("245")).toBeInTheDocument();
    });

    it("renders custom URL", () => {
      const bk = createYouTubeBookmark("channel", { customUrl: "@testchannel" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("@testchannel")).toBeInTheDocument();
    });

    it("renders country", () => {
      const bk = createYouTubeBookmark("channel", { country: "US" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("US")).toBeInTheDocument();
    });

    it("renders footer with 'Open on YouTube'", () => {
      const bk = createYouTubeBookmark("channel");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Open on YouTube")).toBeInTheDocument();
    });
  });

  describe("Playlist sub-type", () => {
    it("renders playlist title and 'Playlist' label", () => {
      const bk = createYouTubeBookmark("playlist");
      render(<YouTubeDetailView bookmark={bk} />);

      // The playlist uses metadata.title, not bookmark.title
      expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      expect(screen.getByText("Playlist")).toBeInTheDocument();
    });

    it("renders item count", () => {
      const bk = createYouTubeBookmark("playlist", { itemCount: 18 });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("18")).toBeInTheDocument();
    });

    it("renders channel attribution", () => {
      const bk = createYouTubeBookmark("playlist", { channelTitle: "TestChannel" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("TestChannel")).toBeInTheDocument();
    });

    it("renders published date", () => {
      const bk = createYouTubeBookmark("playlist", { publishedAt: "2024-03-10T08:00:00Z" });
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Mar 10, 2024")).toBeInTheDocument();
    });

    it("renders footer with 'Open on YouTube'", () => {
      const bk = createYouTubeBookmark("playlist");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("Open on YouTube")).toBeInTheDocument();
    });
  });

  describe("Shared components", () => {
    it("renders AI summary", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("AI-generated summary of this YouTube content.")).toBeInTheDocument();
      expect(screen.getByText("AI Summary")).toBeInTheDocument();
    });

    it("renders tags", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("tutorial")).toBeInTheDocument();
    });

    it("renders notes textarea", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      const textarea = screen.getByDisplayValue("Some notes");
      expect(textarea).toBeInTheDocument();
    });

    it("renders space when provided", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} spaceName="Tech" spaceColor="#ff0000" />);

      expect(screen.getByText("Tech")).toBeInTheDocument();
    });

    it("renders domain and savedAt", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("youtube.com")).toBeInTheDocument();
      expect(screen.getByText("10 min ago")).toBeInTheDocument();
    });

    it("renders topics", () => {
      const bk = createYouTubeBookmark("video");
      render(<YouTubeDetailView bookmark={bk} />);

      expect(screen.getByText("programming")).toBeInTheDocument();
    });
  });

  describe("No hero image for non-video types", () => {
    it("channel sub-type does not render an <img>", () => {
      const bk = createYouTubeBookmark("channel");
      const { container } = render(<YouTubeDetailView bookmark={bk} />);

      expect(container.querySelectorAll("img")).toHaveLength(0);
    });

    it("playlist sub-type does not render an <img>", () => {
      const bk = createYouTubeBookmark("playlist");
      const { container } = render(<YouTubeDetailView bookmark={bk} />);

      expect(container.querySelectorAll("img")).toHaveLength(0);
    });
  });
});
