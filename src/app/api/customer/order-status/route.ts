import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface OrderStatus {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  isCancelled: boolean;
  trackingNumbers: string[];
  fulfillmentLineItems: Array<{
    lineItemId: string;
    trackingNumbers: string[];
  }>;
}

interface Node {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  customer?: {
    id: string;
  };
  fulfillments: Array<{
    trackingInfo: {
      number: string;
    }[];
    fulfillmentLineItems: {
      nodes: Array<{
        lineItem: {
          id: string;
        };
      }>;
    };
  }>;
}

interface NodesResponse {
  nodes: (Node | null)[];
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: authResult.statusCode || 401 }
      );
    }

    const { customerId } = authResult.user;
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ orderStatuses: {} });
    }

    // Get environment variables for Admin API
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    if (!adminApiToken || !shopDomain) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create a GraphQL client for the Admin API
    const adminApiUrl = `https://${shopDomain}/admin/api/2025-07/graphql.json`;
    const adminClient = new GraphQLClient(adminApiUrl, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // Use a 'nodes' query for efficient fetching of multiple orders
    const query = `
      query GetOrdersByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Order {
            id
            cancelledAt
            cancelReason
            displayFulfillmentStatus
            displayFinancialStatus
            customer {
              id
            }
            fulfillments(first: 50) {
              trackingInfo(first: 50) {
                number
              }
              fulfillmentLineItems(first: 50) {
                nodes {
                  lineItem {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    const nodesResponse = await adminClient.request<NodesResponse>(query, {
      ids: orderIds,
    });

    const orderStatuses = (nodesResponse.nodes || []).reduce(
      (acc: Record<string, OrderStatus>, node: Node | null) => {
        // Only include orders that belong to the authenticated customer
        if (node && node.customer?.id === customerId) {
          const trackingNumbers = node.fulfillments
            .flatMap((fulfillment) => fulfillment.trackingInfo)
            .map((info) => info.number)
            .filter(Boolean);

          // Create a map of line item IDs to their tracking numbers
          const fulfillmentLineItems: Array<{
            lineItemId: string;
            trackingNumbers: string[];
          }> = [];

          node.fulfillments.forEach((fulfillment) => {
            const fulfillmentTrackingNumbers = fulfillment.trackingInfo
              .map((info) => info.number)
              .filter(Boolean);

            // Map each line item in this fulfillment to the tracking numbers
            fulfillment.fulfillmentLineItems.nodes.forEach((lineItemNode) => {
              if (lineItemNode.lineItem.id) {
                fulfillmentLineItems.push({
                  lineItemId: lineItemNode.lineItem.id,
                  trackingNumbers: fulfillmentTrackingNumbers,
                });
              }
            });
          });

          acc[node.id] = {
            id: node.id,
            cancelledAt: node.cancelledAt,
            cancelReason: node.cancelReason,
            displayFulfillmentStatus: node.displayFulfillmentStatus,
            displayFinancialStatus: node.displayFinancialStatus,
            isCancelled: node.cancelledAt !== null,
            trackingNumbers,
            fulfillmentLineItems,
          };
        }
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      orderStatuses,
    });
  } catch (error) {
    console.error("Order Status API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
