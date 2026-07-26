import { VideoItem } from "./types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export function getInitial(text?: string | null) {
  return text?.trim()?.charAt(0)?.toUpperCase() || "U";
}

export function getVideoThumbnail(video: VideoItem) {
  if (video.thumbnail) return video.thumbnail;
  return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
}
