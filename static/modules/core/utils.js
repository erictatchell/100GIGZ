/**
 * Shared pure utilities for the 100GIGZ browser app.
 *
 * These helpers are intentionally free of DOM, Firebase, and app-state access so
 * they can be imported by UI modules and covered by fast Node smoke tests.
 */

/**
 * Normalizes user-entered display names.
 * Referenced by profile forms, user normalization, and social author labels.
 */
export function normalizeDisplayName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Normalizes names inferred from auth providers or email addresses.
 * Referenced by auth sync, profile rendering, and authorship fields.
 */
export function normalizePersonName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Converts arbitrary text into a three-character public profile route id.
 * Referenced by routing, profile cards, profile forms, and user normalization.
 */
export function normalizeRouteId(value) {
  const routeId = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);

  return /^[A-Z0-9]{3}$/.test(routeId) ? routeId : "";
}

/**
 * Validates a normalized public profile route id.
 * Referenced by route parsing, route uniqueness checks, and profile saving.
 */
export function isValidRouteId(routeId) {
  return /^[A-Z0-9]{3}$/.test(String(routeId || ""));
}

/**
 * Preserves a preferred media display name and applies the fallback extension.
 * Referenced by upload naming and edit-media forms.
 */
export function normalizeMediaDisplayName(value, fallbackName = "") {
  const nextValue = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  const fallback = String(fallbackName || "").trim();
  const extension = getFileExtension(fallback);

  if (!nextValue) {
    return fallback;
  }

  if (!extension || getFileExtension(nextValue)) {
    return nextValue;
  }

  return `${nextValue}.${extension}`;
}

/**
 * Builds the Firebase Storage object filename for uploaded media.
 * Referenced by member media upload flow.
 */
export function buildStorageFileName(file, index, preferredName = "") {
  const sourceName = normalizeMediaDisplayName(preferredName, file.name) || file.name;
  const extension = getFileExtension(sourceName);
  const safeBase = sanitizeFileBaseName(sourceName);
  const timestamp = buildUniqueStamp(index);

  return extension ? `${timestamp}-${safeBase}.${extension}` : `${timestamp}-${safeBase}`;
}

/**
 * Builds a sortable unique id prefix for local document ids and storage names.
 * Referenced by media, comment, wall-post, reply, and attachment creation.
 */
export function buildUniqueStamp(index = 0) {
  const randomSegment = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}${String(index).padStart(4, "0")}-${randomSegment}`;
}

/**
 * Sanitizes a filename into a lowercase storage-safe base segment.
 * Referenced by upload and social attachment storage paths.
 */
export function sanitizeFileBaseName(filename) {
  const withoutExtension = String(filename || "").replace(/\.[^.]+$/, "");
  const sanitized = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "file";
}

/**
 * Extracts a lowercase file extension without the leading period.
 * Referenced by upload, preview, and storage naming flows.
 */
export function getFileExtension(filename) {
  const match = String(filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

/**
 * Returns the subtype of a MIME type for compact file labels.
 * Referenced by archive table and mobile card type labels.
 */
export function simplifyMimeType(mimeType) {
  if (!mimeType) {
    return "";
  }

  const parts = String(mimeType).split("/");
  return parts[1] || parts[0] || "";
}

/**
 * Builds canonical trip ids and slugs from labels.
 * Referenced by trip creation, normalization, and default media names.
 */
export function slugifyTrip(value) {
  const input = String(value || "").trim().toLowerCase();
  if (!input) {
    return "";
  }

  return input
    .replace(/montreal/g, "mtl")
    .replace(/victoria/g, "vic")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds canonical folder ids and slugs from labels.
 * Referenced by folder creation, defaults, text posts, and highlight checks.
 */
export function slugifyFolder(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes short UI labels into uppercase display text.
 * Referenced by trip, item, and text-post normalization.
 */
export function sanitizeUpper(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Formats a byte count for archive file metadata.
 * Referenced by desktop rows, mobile cards, and item metadata.
 */
export function formatBytes(bytes) {
  const size = Number(bytes || 0);

  if (!size) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );
  const value = size / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * Converts Firestore timestamps, numeric timestamps, and fallbacks into ms.
 * Referenced by all Firestore document normalizers and activity sorting.
 */
export function coerceTimestampToMs(timestampValue, fallbackValue = 0) {
  if (timestampValue && typeof timestampValue.toMillis === "function") {
    return timestampValue.toMillis();
  }

  if (Number.isFinite(Number(timestampValue))) {
    return Number(timestampValue);
  }

  if (Number.isFinite(Number(fallbackValue))) {
    return Number(fallbackValue);
  }

  return 0;
}

/**
 * Escapes user-controlled strings before template insertion.
 * Referenced by nearly every HTML rendering function in the archive UI.
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Infers a friendly display name from an auth email address.
 * Referenced by auth sync, profile creation, and friend labels.
 */
export function inferNameFromEmail(email) {
  const localPart = String(email || "")
    .trim()
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!localPart) {
    return "";
  }

  return localPart
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Escapes values for use inside CSS attribute selectors.
 * Referenced by the preview row highlighting/scrolling behavior.
 */
export function escapeCssSelectorToken(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(String(value || ""));
  }

  return String(value || "").replace(/["\\]/g, "\\$&");
}
