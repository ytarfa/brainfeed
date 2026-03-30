import { serviceClient } from "../config/supabase";

const BUCKET_NAME = "thumbnails";

/**
 * Upload a generated thumbnail image to Supabase Storage.
 *
 * Files are stored as: thumbnails/{bookmarkId}.png
 * Uses the service client (bypasses RLS) for server-side uploads.
 *
 * Returns the public URL of the uploaded image, or null on failure.
 */
export async function uploadThumbnail(
  imageBuffer: Buffer,
  bookmarkId: string,
): Promise<string | null> {
  try {
    const filePath = `${bookmarkId}.png`;

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[storageUploader] Upload failed:", uploadError.message);
      return null;
    }

    const { data } = serviceClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("[storageUploader] Unexpected error:", err);
    return null;
  }
}
