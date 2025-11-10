/* eslint-disable @typescript-eslint/no-explicit-any */
import { client } from "@/sanity/lib/client";

/**
 * Fetches the most relevant pre-order modal for a product handle or slug.
 * - Matches by slug, handle, allowOnPreOrderProductPages, or showOnAllProductPages.
 * - Applies schedule only if enableSchedule is true.
 * - Returns the top-priority active modal.
 */
export async function fetchModalForProductHandle(
  handleOrSlug: string
): Promise<any | null> {
  if (!handleOrSlug) return null;

  // Normalize slug and generate matching variants
  const raw = String(handleOrSlug);
  const normalized = raw.replace(/^\/+|\/+$/g, "");
  const variants = Array.from(
    new Set([
      raw,
      normalized,
      normalized ? `/${normalized}` : "/",
      normalized ? `product/${normalized}` : "/",
    ])
  ).filter(Boolean);

  const query = `*[
    _type == "preOrderModal"
    && enabled == true
    && (
      count(slugs[ @ in $variants ]) > 0
      || ($handle != null && $handle in showOnProductHandles[])
      || allowOnPreOrderProductPages == true
      || showOnAllProductPages == true
    )
    && (
      !defined(enableSchedule) || enableSchedule == false
      || (
        enableSchedule == true
        && (!defined(startAt) || startAt <= now())
        && (!defined(endAt) || endAt >= now())
      )
    )
  ] | order(priority desc, _createdAt desc)[0]`;

  try {
    const handle = normalized || null;
    const modal = await client.fetch(query, { variants, handle });
    return modal || null;
  } catch (err) {
    console.error("fetchModalForProductHandle error:", err);
    return null;
  }
}
