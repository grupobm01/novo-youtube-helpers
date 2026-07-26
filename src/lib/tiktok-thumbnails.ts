export async function fetchTikTokThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch (e) {
    console.error("Failed to fetch TikTok thumbnail:", e);
    return null;
  }
}
