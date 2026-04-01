import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InstagramDetailView from "./InstagramDetailView";
import type { Bookmark, MediaItem } from "@brain-feed/types";

function createInstagramBookmark(
  subType: "post" | "reel" | "carousel",
  metadataOverrides: Record<string, string | number> = {},
  bookmarkOverrides: Partial<Bookmark> = {},
): Bookmark {
  let baseMetadata: Record<string, string | number> = {};
  if (subType === "post") {
    baseMetadata = {
      instagramType: "post",
      shortcode: "CxAbCdEf",
      username: "testuser",
      mediaType: "image",
      hasAccessibilityCaption: "true",
    };
  } else if (subType === "reel") {
    baseMetadata = {
      instagramType: "reel",
      shortcode: "CxReElId",
      username: "reelcreator",
      mediaType: "video",
      hasAccessibilityCaption: "false",
    };
  } else {
    baseMetadata = {
      instagramType: "post",
      shortcode: "CxCaRoUs",
      username: "photog",
      mediaType: "carousel",
      carouselMediaCount: 5,
      hasAccessibilityCaption: "true",
    };
  }

  const base: Partial<Bookmark> = {
    id: "bk-ig-1",
    user_id: "user-1",
    url: "https://www.instagram.com/p/CxAbCdEf/",
    title: "Test Instagram Post",
    description: "A beautiful sunset over the ocean #nature #photography",
    notes: "Great photo inspiration",
    thumbnail_url: "https://instagram.com/img/test.jpg",
    content_type: "link",
    source_type: "instagram",
    tags: [{ id: "t1", label: "photography" }],
    raw_content: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    spaceId: "space-1",
    domain: "instagram.com",
    summary: "A test summary",
    savedAt: "5 min ago",
    enrichment_status: "completed",
    enriched_data: {
      summary: "AI-generated summary of this Instagram content.",
      entities: [{ name: "Photography", type: "TOPIC" }],
      topics: ["photography", "nature"],
      tags: ["instagram", "photo"],
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

function createInstagramBookmarkWithMedia(
  media: MediaItem[],
  metadataOverrides: Record<string, string | number> = {},
  bookmarkOverrides: Partial<Bookmark> = {},
): Bookmark {
  const base = createInstagramBookmark("carousel", metadataOverrides, bookmarkOverrides);
  return {
    ...base,
    enriched_data: {
      ...base.enriched_data!,
      media,
    },
  };
}

describe("InstagramDetailView", () => {
  describe("Post", () => {
    it("renders type badge as POST", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("Post")).toBeInTheDocument();
    });

    it("renders @username", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("@testuser")).toBeInTheDocument();
    });

    it("renders shortcode", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("CxAbCdEf")).toBeInTheDocument();
    });

    it("renders thumbnail image", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://instagram.com/img/test.jpg");
    });

    it("renders caption/description", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(
        screen.getByText("A beautiful sunset over the ocean #nature #photography"),
      ).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("Test Instagram Post")).toBeInTheDocument();
    });

    it("does NOT show play overlay for non-reel post", () => {
      const { container } = render(
        <InstagramDetailView bookmark={createInstagramBookmark("post")} />,
      );
      // ReelOverlay renders a Play icon inside a 60x60 circle
      // Posts with mediaType "image" should not have the reel overlay
      const playIcons = container.querySelectorAll("svg");
      const playIcon = Array.from(playIcons).find(
        (svg) => svg.querySelector("polygon") !== null,
      );
      expect(playIcon).toBeUndefined();
    });

    it("omits username gracefully when missing", () => {
      const bk = createInstagramBookmark("post", { username: "" as never }, {});
      // Remove the username key entirely
      delete (bk.enriched_data!.metadata as Record<string, unknown>)["username"];
      render(<InstagramDetailView bookmark={bk} />);
      // No @-prefixed text should appear
      const allText = document.body.textContent || "";
      expect(allText).not.toContain("@");
    });
  });

  describe("Reel", () => {
    it("renders type badge as REEL", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("reel")} />);
      expect(screen.getByText("Reel")).toBeInTheDocument();
    });

    it("renders @username for reel", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("reel")} />);
      expect(screen.getByText("@reelcreator")).toBeInTheDocument();
    });

    it("renders play overlay for reel", () => {
      const { container } = render(
        <InstagramDetailView bookmark={createInstagramBookmark("reel")} />,
      );
      // The ReelOverlay component contains a lucide Play icon (rendered as SVG with class "lucide-play")
      const playSvgs = container.querySelectorAll(".lucide-play");
      expect(playSvgs.length).toBeGreaterThan(0);
    });

    it("renders shortcode for reel", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("reel")} />);
      expect(screen.getByText("CxReElId")).toBeInTheDocument();
    });
  });

  describe("Carousel", () => {
    const mediaItems: MediaItem[] = [
      { url: "https://img1.jpg", type: "image", alt: "Image 1" },
      { url: "https://img2.jpg", type: "image", alt: "Image 2" },
      { url: "https://img3.jpg", type: "image", alt: "Image 3" },
    ];

    it("renders dot indicators for multiple images", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems);
      const { container } = render(<InstagramDetailView bookmark={bk} />);
      const dots = container.querySelectorAll("[role='button'][aria-label^='Go to image']");
      expect(dots.length).toBe(3);
    });

    it("renders navigation arrows for multiple images", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems);
      render(<InstagramDetailView bookmark={bk} />);
      expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
      expect(screen.getByLabelText("Next image")).toBeInTheDocument();
    });

    it("does NOT render dots/arrows for single image in media array", () => {
      const singleMedia: MediaItem[] = [
        { url: "https://single.jpg", type: "image", alt: "Only one" },
      ];
      const bk = createInstagramBookmarkWithMedia(singleMedia);
      const { container } = render(<InstagramDetailView bookmark={bk} />);
      const dots = container.querySelectorAll("[role='button'][aria-label^='Go to image']");
      expect(dots.length).toBe(0);
      expect(screen.queryByLabelText("Previous image")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next image")).not.toBeInTheDocument();
    });

    it("navigates to next image when clicking next arrow", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems);
      render(<InstagramDetailView bookmark={bk} />);
      // Initially shows first image
      expect(screen.getByAltText("Image 1")).toBeInTheDocument();

      // Click next
      fireEvent.click(screen.getByLabelText("Next image"));
      expect(screen.getByAltText("Image 2")).toBeInTheDocument();

      // Click next again
      fireEvent.click(screen.getByLabelText("Next image"));
      expect(screen.getByAltText("Image 3")).toBeInTheDocument();
    });

    it("wraps around when clicking next past last image", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems);
      render(<InstagramDetailView bookmark={bk} />);
      // Click next 3 times to wrap
      fireEvent.click(screen.getByLabelText("Next image"));
      fireEvent.click(screen.getByLabelText("Next image"));
      fireEvent.click(screen.getByLabelText("Next image"));
      expect(screen.getByAltText("Image 1")).toBeInTheDocument();
    });

    it("navigates to previous image", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems);
      render(<InstagramDetailView bookmark={bk} />);
      // Click prev wraps to last
      fireEvent.click(screen.getByLabelText("Previous image"));
      expect(screen.getByAltText("Image 3")).toBeInTheDocument();
    });

    it("renders carousel media count from metadata", () => {
      const bk = createInstagramBookmarkWithMedia(mediaItems, {
        carouselMediaCount: 5,
      });
      render(<InstagramDetailView bookmark={bk} />);
      expect(screen.getByText("5 photos")).toBeInTheDocument();
    });
  });

  describe("No image", () => {
    it("renders placeholder when no thumbnail and no media", () => {
      const bk = createInstagramBookmark("post", {}, {
        thumbnail_url: null as unknown as string,
      });
      const { container } = render(<InstagramDetailView bookmark={bk} />);
      // Should not render an <img> element
      const imgs = container.querySelectorAll("img");
      expect(imgs.length).toBe(0);
    });
  });

  describe("Shared components", () => {
    it("renders AI summary", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(
        screen.getByText("AI-generated summary of this Instagram content."),
      ).toBeInTheDocument();
    });

    it("renders tags", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      const matches = screen.getAllByText("photography");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("renders notes textarea", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Great photo inspiration");
    });

    it("renders space when provided", () => {
      render(
        <InstagramDetailView
          bookmark={createInstagramBookmark("post")}
          spaceName="Design"
          spaceColor="#ff6b6b"
        />,
      );
      expect(screen.getByText("Design")).toBeInTheDocument();
    });

    it("renders domain and savedAt", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("instagram.com")).toBeInTheDocument();
      expect(screen.getByText("5 min ago")).toBeInTheDocument();
    });

    it("renders topics", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      const matches = screen.getAllByText("photography");
      // "photography" appears in both topics and tags
      expect(matches.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("nature")).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders 'Open on Instagram' link", () => {
      render(<InstagramDetailView bookmark={createInstagramBookmark("post")} />);
      expect(screen.getByText("Open on Instagram")).toBeInTheDocument();
      const link = screen.getByText("Open on Instagram").closest("a");
      expect(link).toHaveAttribute("href", "https://www.instagram.com/p/CxAbCdEf/");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("does NOT render footer when url is null", () => {
      const bk = createInstagramBookmark("post", {}, {
        url: null as unknown as string,
      });
      render(<InstagramDetailView bookmark={bk} />);
      expect(screen.queryByText("Open on Instagram")).not.toBeInTheDocument();
    });
  });
});
