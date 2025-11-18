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
 * Eligibility (OR targeting) with stricter product-page checks:
 * - showOnAllProductPages: only if routeIsProductPage === true AND productHandle present
 * - allowOnPreOrderProductPages: only if routeIsProductPage === true AND productHandle AND productAvailable === false
 * - slugs: match if any slug variant matches current slug
 * - showOnProductHandles list: match if productHandle in list
 *
 * routeIsProductPage prevents the "all product pages" or "pre-order product pages"
 * toggles from leaking onto listing or non-product routes after navigation.
 */
export function isModalEligible({
  modal,
  slug,
  productHandle,
  productAvailable,
  routeIsProductPage,
}: {
  modal: any | null;
  slug?: string | null;
  productHandle?: string | null;
  productAvailable?: boolean;
  routeIsProductPage?: boolean;
}) {
  if (!modal) return false;

  const hasSlugs = Array.isArray(modal.slugs) && modal.slugs.length > 0;
  const hasHandles =
    Array.isArray(modal.showOnProductHandles) &&
    modal.showOnProductHandles.length > 0;

  let targetingMatched = false;

  // 1. All product pages (must be real product route)
  if (
    modal.showOnAllProductPages === true &&
    routeIsProductPage === true &&
    productHandle
  ) {
    targetingMatched = true;
  }

  // 2. Pre-order product pages (must be real product route & product unavailable)
  if (
    modal.allowOnPreOrderProductPages === true &&
    routeIsProductPage === true &&
    productHandle &&
    typeof productAvailable === "boolean" &&
    productAvailable === false
  ) {
    targetingMatched = true;
  }

  // 3. Slug match (applies to any route including "/")
  if (hasSlugs && slug) {
    const variants = buildSlugVariants(slug);
    const matched = variants.some((v) =>
      slugArrayIncludes(modal.slugs, String(v))
    );
    if (matched) targetingMatched = true;
  }

  // 4. Explicit product handles list (require actual product handle)
  if (hasHandles && productHandle) {
    if (modal.showOnProductHandles.includes(productHandle)) {
      targetingMatched = true;
    }
  }

  if (!targetingMatched) return false;

  // Scheduling (only when enableSchedule === true)
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
 * Derive a stable-ish suffix for a modal (try explicit, then id, name, slug).
 */
function _deriveSessionSuffix(modal: any) {
  if (!modal) return "preorder_global";
  if (
    modal.showOnceSessionKeySuffix &&
    typeof modal.showOnceSessionKeySuffix === "string"
  ) {
    return String(modal.showOnceSessionKeySuffix);
  }
  if (modal._id) return String(modal._id);
  if (modal.modalName) return String(modal.modalName);
  if (Array.isArray(modal.slugs) && modal.slugs.length > 0) {
    const s = modal.slugs.find((x: any) => typeof x === "string");
    if (s) return String(s).replace(/^\/+|\/+$/g, "");
  }
  return "preorder_global";
}

/**
 * Build storage key for "session shown" state.
 * If a scope is provided (e.g. page slug), it is appended so the key is scoped to a route.
 */
function _sessionKeyFor(modal: any, scope?: string | null) {
  const suffix = _deriveSessionSuffix(modal);
  const scopePart =
    typeof scope === "string" && scope.trim() !== ""
      ? `::${scope.replace(/^\/+|\/+$/g, "")}`
      : "::global";
  return `preorder_modal_session_shown_${suffix}${scopePart}`;
}

/**
 * Session-based "show once per session" marker (route-scoped).
 *
 * Usage: hasModalSessionShown(modal, slug)
 */
export function hasModalSessionShown(modal: any, scope?: string | null) {
  if (!modal) return false;
  if (!modal.showOncePerSession) return false;
  const key = _sessionKeyFor(modal, scope);
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Mark modal as shown for the current session (route-scoped). */
export function markModalSessionShown(modal: any, scope?: string | null) {
  if (!modal) return;
  if (!modal.showOncePerSession) return;
  const key = _sessionKeyFor(modal, scope);
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}
