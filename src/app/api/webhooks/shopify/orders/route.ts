import { NextRequest, NextResponse } from "next/server";
import * as gtm from "@/lib/gtm";

// Shopify webhook verification
async function verifyShopifyWebhook(
  body: string,
  signature: string
): Promise<boolean> {
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("SHOPIFY_WEBHOOK_SECRET not configured");
    return false;
  }

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(body, "utf8");
  const computedSignature = hmac.digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "base64"),
    Buffer.from(computedSignature, "base64")
  );
}

// Shopify order type
interface ShopifyOrder {
  order_number?: string;
  id: string;
  total_price: string;
  currency?: string;
  total_tax?: string;
  shipping_lines?: Array<{ price?: string }>;
  discount_codes?: Array<{ code: string }>;
  line_items: Array<{
    variant_id?: string;
    product_id?: string;
    name: string;
    product_type?: string;
    vendor?: string;
    variant_title?: string;
    price: string;
    quantity: number;
  }>;
  cancel_reason?: string;
  refunds?: Array<{ amount?: string }>;
}

// Convert Shopify order to GTM format
function shopifyOrderToGTM(order: ShopifyOrder): gtm.GTMPurchaseData {
  const items: gtm.GTMProduct[] = order.line_items.map(
    (item, index: number) => ({
      item_id:
        item.variant_id?.toString() ||
        item.product_id?.toString() ||
        `unknown-${index}`,
      item_name: item.name,
      category: item.product_type || "clothing",
      item_brand: item.vendor || "juneof",
      item_variant: item.variant_title,
      price: parseFloat(item.price),
      currency: order.currency || "INR",
      quantity: item.quantity,
      index: index + 1,
    })
  );

  return {
    transaction_id: order.order_number?.toString() || order.id?.toString(),
    value: parseFloat(order.total_price),
    currency: order.currency || "INR",
    tax: parseFloat(order.total_tax || "0"),
    shipping: parseFloat(order.shipping_lines?.[0]?.price || "0"),
    coupon: order.discount_codes?.[0]?.code,
    items,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-shopify-hmac-sha256");

    if (!signature) {
      console.error("Missing Shopify webhook signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook authenticity
    if (!(await verifyShopifyWebhook(body, signature))) {
      console.error("Invalid Shopify webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const order = JSON.parse(body) as ShopifyOrder;
    const topic = request.headers.get("x-shopify-topic");

    console.log(
      `Received Shopify webhook: ${topic} for order ${order.order_number}`
    );

    switch (topic) {
      case "orders/paid":
        // Track purchase when order is paid
        const purchaseData = shopifyOrderToGTM(order);

        // Push to data layer for GTM to capture
        // Note: This runs server-side, so we need to store this data
        // and trigger client-side when the user returns to the site

        // Store purchase data in a way that can be retrieved client-side
        // This could be a database, Redis, or other storage mechanism
        console.log("Purchase tracked via webhook:", purchaseData);

        // You might want to store this in a database for client-side retrieval
        // or send to a queue for processing

        break;

      case "orders/cancelled":
        // Track refund when order is cancelled
        if (order.cancel_reason) {
          const refundData = {
            transaction_id:
              order.order_number?.toString() || order.id?.toString(),
            value: parseFloat(order.total_price),
            currency: order.currency || "INR",
          };

          console.log("Refund tracked via webhook:", refundData);
        }
        break;

      case "orders/refunded":
        // Track partial or full refund
        const refundAmount =
          order.refunds?.reduce(
            (sum: number, refund: { amount?: string }) =>
              sum + parseFloat(refund.amount || "0"),
            0
          ) || 0;

        if (refundAmount > 0) {
          const refundData = {
            transaction_id:
              order.order_number?.toString() || order.id?.toString(),
            value: refundAmount,
            currency: order.currency || "INR",
          };

          console.log("Refund tracked via webhook:", refundData);
        }
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Shopify webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
