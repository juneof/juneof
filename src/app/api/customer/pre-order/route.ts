/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/customer/pre-order/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { client as sanityClient } from "@/sanity/lib/client";

type Payload = {
  email?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productHandle?: string | null;
  url?: string | null;
  modalDetails?: any;
};

function generateDocId(email: string, productIdentifier?: string | null) {
  const key = `${(email || "").toLowerCase().trim()}|${(productIdentifier || "").trim()}`;
  return "preorder-" + crypto.createHash("sha1").update(key).digest("hex");
}

/** Try to resolve a product in Sanity using common fields */
async function resolveProductInSanity(handle: string | null) {
  if (!handle) return null;

  // Adjust the _type and fields in this query to match your product schema.
  // This query searches for documents of type "product" that match slug.current or handle or storeHandle or nested shopify.handle.
  const query = `*[_type == "product" && (slug.current == $h || handle == $h || storeHandle == $h || shopify.handle == $h)][0]{
    _id,
    title,
    "slug": slug.current,
    handle,
    storeHandle,
    shopify,
  }`;

  try {
    const product = await sanityClient.fetch(query, { h: handle });
    return product || null;
  } catch (err) {
    console.error("Sanity product lookup error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Payload = await req.json();

    const email = (body?.email || "").trim().toLowerCase();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Invalid or missing email" },
        { status: 400 }
      );
    }

    // prefer productId from payload; if missing, we'll try to resolve by handle
    const productHandle = body.productHandle ?? null;
    let productId = body.productId ?? null;
    let productTitle = body.productTitle ?? null;

    // If productId missing but handle present, attempt to resolve in Sanity
    if (!productId && productHandle) {
      const found = await resolveProductInSanity(productHandle);
      if (found) {
        // Use Sanity document _id as productId (or map to your product id field if different)
        productId = found._id || productId;
        productTitle = productTitle || found.title || found.slug || null;
        console.log("Resolved product in Sanity:", {
          productId,
          productTitle,
          handle: productHandle,
        });
      } else {
        console.log(
          "No product match found in Sanity for handle:",
          productHandle
        );
      }
    }

    // If productId still missing and you have external product source (Shopify), you can query it here.
    // Example (pseudocode) to add Shopify fallback (uncomment and implement if needed):
    // if (!productId && productHandle && process.env.SHOPIFY_STOREFRONT_TOKEN) {
    //   // fetch product by handle from Shopify Storefront or Admin API, then set productId/productTitle
    // }

    const productIdentifierForId = productId || productHandle || body.url || "";
    const docId = generateDocId(email, productIdentifierForId);

    // sanitize modalDetails (remove runtime _createdAt/_id from studio objects)
    const safeModalDetails = body.modalDetails
      ? JSON.parse(JSON.stringify(body.modalDetails))
      : null;

    const doc = {
      _id: docId,
      _type: "preorder",
      email,
      productId: productId ?? null,
      productTitle: productTitle ?? null,
      productHandle: productHandle ?? null,
      url: body.url ?? null,
      modalDetails: safeModalDetails ?? null,
      createdAt: new Date().toISOString(),
    };

    // check duplicate
    const existing = await sanityClient.fetch(
      `*[_type == "preorder" && _id == $id][0]`,
      { id: docId }
    );
    if (existing) {
      return NextResponse.json(
        {
          message: "You're already signed up for this product.",
          alreadySignedUp: true,
        },
        { status: 200 }
      );
    }

    const created = await sanityClient.createIfNotExists(doc);

    return NextResponse.json(
      {
        message: "Thanks — your pre-order interest has been saved.",
        alreadySignedUp: false,
        created,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("PreOrder API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
