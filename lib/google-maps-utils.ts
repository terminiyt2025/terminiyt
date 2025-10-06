// Utilities for working with Google Maps links and coordinates
export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

function parseLatLngPair(s: string): Coordinates {
  const match = s.match(/([-+]?\d{1,3}\.\d+),\s*([-+]?\d{1,3}\.\d+)/);
  if (!match) return { lat: null, lng: null };
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return { lat: null, lng: null };
}

export function extractCoordinatesFromGoogleMapsLink(
  link: string
): Coordinates {
  if (!link || typeof link !== "string") return { lat: null, lng: null };

  // Work on decoded URL to handle encoded coordinates
  let url = link;
  try {
    url = decodeURIComponent(link);
  } catch (e) {
    // ignore decode errors and continue with original
  }

  // Common patterns:
  // - @lat,lng,zoom (e.g. /@41.3275,19.8187,15z)
  // - q=lat,lng or ?q=lat,lng
  // - /?q=lat,lng
  // - &query=lat,lng (maps API)
  const atMatch = url.match(/@([-+]?\d{1,3}\.\d+),\s*([-+]?\d{1,3}\.\d+)/);
  if (atMatch) return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };

  const qMatch = url.match(/[?&]q=([-+]?\d{1,3}\.\d+),\s*([-+]?\d{1,3}\.\d+)/);
  if (qMatch) return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) };

  const queryMatch = url.match(
    /[?&]query=([-+]?\d{1,3}\.\d+),\s*([-+]?\d{1,3}\.\d+)/
  );
  if (queryMatch)
    return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };

  // Some URLs include coordinates in the path (e.g. /place/.../@lat,lng)
  const pathMatch = url.match(/\/@([-+]?\d{1,3}\.\d+),\s*([-+]?\d{1,3}\.\d+)/);
  if (pathMatch)
    return { lat: Number(pathMatch[1]), lng: Number(pathMatch[2]) };

  // Fallback: try to find any lat,lng pair in the whole string
  const fallback = parseLatLngPair(url);
  return fallback;
}

export function generateGoogleMapsLink(lat: number, lng: number): string {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b))
    throw new Error("Invalid coordinates");
  // Use the stable Google Maps search URL which works across platforms
  return `https://www.google.com/maps/search/?api=1&query=${a},${b}`;
}

export function isValidGoogleMapsUrl(link: string): boolean {
  if (!link || typeof link !== "string") return false;
  // Quick structural check
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    if (
      host.includes("google") ||
      host.includes("maps") ||
      host.includes("goo.gl")
    )
      return true;
  } catch (e) {
    // not an absolute URL, still check for common patterns
    const low = link.toLowerCase();
    if (
      low.includes("google.com/maps") ||
      low.includes("maps.google") ||
      low.includes("goo.gl/maps")
    )
      return true;
  }
  return false;
}

export default {
  extractCoordinatesFromGoogleMapsLink,
  generateGoogleMapsLink,
  isValidGoogleMapsUrl,
};
