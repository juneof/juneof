/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Build slug variants for matching.
 * Example: "/" or "product/juneof-jacket" ->
 * ["/", "product/juneof-jacket", "/product/juneof-jacket", "juneof-jacket"]
 */
export function buildSlugVariants(slug?: string) {
  const raw = typeof slug === "string" ? slug : "";
  const normalized = raw.replace(/^\/+|\/+$/g, "");
  const variants = new Set<string>();

  if (raw !== "") variants.add(raw);
  variants.add(normalized);
  variants.add(normalized ? `/${normalized}` : "/");
  if (normalized) variants.add(`product/${normalized}`);
  if (normalized) variants.add(normalized);

  return Array.from(variants);
}

/** Normalize and compare a value against modal.slugs */
function slugArrayIncludes(slugs: any[] | undefined, value: string) {
  if (!Array.isArray(slugs)) return false;
  const normValue = value.replace(/^\/+|\/+$/g, "");
  return slugs.some((s) => {
    if (typeof s !== "string") return false;
    return s.replace(/^\/+|\/+$/g, "") === normValue;
  });
}

/**
 * Client-side eligibility check.
 *
 * - Matches by slugs OR showOnProductHandles OR allowOnPreOrderProductPages OR showOnAllProductPages.
 * - Only enforces startAt/endAt when enableSchedule === true.
 * - Optionally prevents showing for available products (only for pre-order targeting).
 */
export function isModalEligible({
  modal,
  slug,
  productHandle,
  productAvailable,
}: {
  modal: any | null;
  slug?: string | null;
  productHandle?: string | null;
  productAvailable?: boolean;
}) {
  if (!modal) return false;

  const hasSlugs = Array.isArray(modal.slugs) && modal.slugs.length > 0;
  const hasHandles =
    Array.isArray(modal.showOnProductHandles) &&
    modal.showOnProductHandles.length > 0;

  // NEW: Global targeting for product pages
  if (modal.showOnAllProductPages === true) {
    // Must be on a product page (have a handle)
    if (!productHandle) return false;
    // Targeting satisfied, proceed to schedule checks below
  } else if (hasSlugs) {
    // slug match (covers homepage)
    const variants = buildSlugVariants(slug || "");
    const matched = variants.some((v) =>
      slugArrayIncludes(modal.slugs, String(v))
    );
    if (!matched) return false;
  } else if (hasHandles) {
    // handle match
    if (!productHandle) return false;
    if (!modal.showOnProductHandles.includes(productHandle)) return false;
  } else {
    // fallback: respect allowOnPreOrderProductPages flag
    if (modal.allowOnPreOrderProductPages === false) return false;
  }

  // schedule: only when toggle is ON
  try {
    if (modal.enableSchedule === true) {
      const now = Date.now();
      if (modal.startAt) {
        const start = new Date(modal.startAt).getTime();
        if (Number.isNaN(start) || start > now) return false;
      }
      if (modal.endAt) {
        const end = new Date(modal.endAt).getTime();
        if (Number.isNaN(end) || end < now) return false;
      }
    }
  } catch (err) {
    console.warn("isModalEligible: schedule parse error", err);
    return false;
  }

  // Only suppress available products when modal is explicitly pre-order targeted,
  // not when it's configured for all product pages.
  if (
    modal.showOnAllProductPages !== true &&
    modal.allowOnPreOrderProductPages === true &&
    typeof productAvailable === "boolean" &&
    productAvailable
  ) {
    return false;
  }

  return true;
}

/**
 * Persist dismiss expiry (localStorage) using `dismissDurationDays`.
 */
export function persistModalDismiss(modal: any) {
  if (!modal) return;
  if (!modal.enableDismissDuration) return;
  const days = Number(modal.dismissDurationDays) || 0;
  if (days <= 0) return;
  try {
    const key = `preorder_modal_dismiss_${modal._id || modal.id}`;
    const expiryTs = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(key, String(expiryTs));
  } catch (err) {
    console.warn("persistModalDismiss failed", err);
  }
}

/** Return true if modal dismiss expiry exists and is still valid. */
export function isModalDismissed(modal: any) {
  if (!modal) return false;
  if (!modal.enableDismissDuration) return false;
  const key = `preorder_modal_dismiss_${modal._id || modal.id}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isNaN(ts) ? false : Date.now() < ts;
  } catch {
    return false;
  }
}

/**
 * Session-based "show once per session" marker.
 * Uses `showOnceSessionKeySuffix` when provided, otherwise falls back to modal id.
 */
export function hasModalSessionShown(modal: any) {
  if (!modal) return false;
  if (!modal.showOncePerSession) return false;
  const suffix =
    modal.showOnceSessionKeySuffix ||
    modal._id ||
    modal.id ||
    "preorder_global";
  const key = `preorder_modal_session_shown_${suffix}`;
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Mark modal as shown for the current session. */
export function markModalSessionShown(modal: any) {
  if (!modal) return;
  if (!modal.showOncePerSession) return;
  const suffix =
    modal.showOnceSessionKeySuffix ||
    modal._id ||
    modal.id ||
    "preorder_global";
  const key = `preorder_modal_session_shown_${suffix}`;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}