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

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

function generateDocId(email: string, productIdentifier?: string | null) {
  const key = `${normalizeEmail(email)}|${(productIdentifier || "").trim()}`;
  return "preorder-" + crypto.createHash("sha1").update(key).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body: Payload = await req.json();
    const emailRaw = body?.email ?? "";
    const email = normalizeEmail(emailRaw);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Invalid or missing email" },
        { status: 400 }
      );
    }

    const productIdentifierForId = body.url ?? "";
    const docId = generateDocId(email, productIdentifierForId);

    // Check existing by _id (fast)
    const existing = await sanityClient.fetch(
      `*[_type == "preorder" && _id == $id][0]`,
      {
        id: docId,
      }
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

    const doc = {
      _id: docId,
      _type: "preorder",
      email,
      url: body.url ?? null,
      createdAt: new Date().toISOString(),
    };

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
