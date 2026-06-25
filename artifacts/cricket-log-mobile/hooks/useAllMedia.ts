import { useQuery } from "@tanstack/react-query";

export interface MediaPhoto {
  id: number;
  matchId: number | null;
  url: string;
  caption: string | null;
  opponent: string | null;
  date: string | null;
  matchType: string | null;
}

export interface MediaVideo {
  id: number;
  matchId: number | null;
  objectPath: string;
  caption: string | null;
  opponent: string | null;
  date: string | null;
  matchType: string | null;
}

function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

async function fetchAllPhotos(): Promise<MediaPhoto[]> {
  const res = await fetch(`${getApiBase()}/api/media/photos`);
  if (!res.ok) throw new Error("Failed to fetch photos");
  return res.json();
}

async function fetchAllVideos(): Promise<MediaVideo[]> {
  const res = await fetch(`${getApiBase()}/api/media/videos`);
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export function useAllPhotos() {
  return useQuery({
    queryKey: ["media", "photos"],
    queryFn: fetchAllPhotos,
  });
}

export function useAllVideos() {
  return useQuery({
    queryKey: ["media", "videos"],
    queryFn: fetchAllVideos,
  });
}

// Caption prefix conventions for categorisation
export const SCORECARD_PREFIX = "[SC] ";
export const CUTTING_PREFIX = "[NC] ";

export type PhotoCategory = "all" | "photos" | "scorecards" | "cuttings";

export function filterPhotosByCategory(
  photos: MediaPhoto[],
  category: PhotoCategory
): MediaPhoto[] {
  switch (category) {
    case "scorecards":
      return photos.filter((p) => p.caption?.startsWith(SCORECARD_PREFIX));
    case "cuttings":
      return photos.filter((p) => p.caption?.startsWith(CUTTING_PREFIX));
    case "photos":
      return photos.filter(
        (p) =>
          !p.caption?.startsWith(SCORECARD_PREFIX) &&
          !p.caption?.startsWith(CUTTING_PREFIX)
      );
    default:
      return photos;
  }
}

export function stripPrefix(caption: string | null): string {
  if (!caption) return "";
  if (caption.startsWith(SCORECARD_PREFIX)) return caption.slice(SCORECARD_PREFIX.length);
  if (caption.startsWith(CUTTING_PREFIX)) return caption.slice(CUTTING_PREFIX.length);
  return caption;
}

export function videoUrl(objectPath: string): string {
  return `${getApiBase()}/api/storage${objectPath}`;
}
