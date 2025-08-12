"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import * as gtm from "@/lib/gtm";

interface PurchaseTrackerProps {
  // Optional: Pass order data directly
  orderData?: {
    orderId: string;
    total: number;
    currency?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items: Array<{
      id: string;
      name: string;
      category?: string;
      brand?: string;
      variant?: string;
      price: number;
      quantity: number;
    }>;
  };
}

export default function PurchaseTracker({ orderData }: PurchaseTrackerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Method 1: Use passed order data
    if (orderData) {
      const gtmItems: gtm.GTMProduct[] = orderData.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category || "clothing",
        item_brand: item.brand || "juneof",
        item_variant: item.variant,
        price: item.price,
        currency: orderData.currency || "INR",
        quantity: item.quantity,
      }));

      const purchaseData: gtm.GTMPurchaseData = {
        transaction_id: orderData.orderId,
        value: orderData.total,
        currency: orderData.currency || "INR",
        tax: orderData.tax,
        shipping: orderData.shipping,
        coupon: orderData.coupon,
        items: gtmItems,
      };

      gtm.trackPurchase(purchaseData);
      console.log("Purchase tracked via orderData:", purchaseData);
      return;
    }

    // Method 2: Extract from URL parameters (Shopify checkout return)
    const orderId =
      searchParams.get("order_id") || searchParams.get("order_number");
    const total = searchParams.get("total_price");
    const currency = searchParams.get("currency") || "INR";

    if (orderId && total) {
      // Basic purchase tracking with minimal data
      const purchaseData: gtm.GTMPurchaseData = {
        transaction_id: orderId,
        value: parseFloat(total),
        currency: currency,
        items: [], // Will be empty unless we fetch order details
      };

      gtm.trackPurchase(purchaseData);
      console.log("Purchase tracked via URL params:", purchaseData);
      return;
    }

    // Method 3: Check for stored purchase data (from webhook or previous storage)
    const storedPurchaseData = sessionStorage.getItem(
      "pending_purchase_tracking"
    );
    if (storedPurchaseData) {
      try {
        const purchaseData = JSON.parse(storedPurchaseData);
        gtm.trackPurchase(purchaseData);
        console.log("Purchase tracked via stored data:", purchaseData);

        // Clean up stored data
        sessionStorage.removeItem("pending_purchase_tracking");
      } catch (error) {
        console.error("Error parsing stored purchase data:", error);
      }
    }
  }, [orderData, searchParams]);

  // This component doesn't render anything visible
  return null;
}

// Utility function to store purchase data for later tracking
export const storePurchaseDataForTracking = (
  purchaseData: gtm.GTMPurchaseData
) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      "pending_purchase_tracking",
      JSON.stringify(purchaseData)
    );
  }
};

// Hook for manual purchase tracking
export const usePurchaseTracking = () => {
  const trackPurchase = (purchaseData: gtm.GTMPurchaseData) => {
    gtm.trackPurchase(purchaseData);
  };

  const trackRefund = (
    transactionId: string,
    value?: number,
    currency = "INR",
    items?: gtm.GTMProduct[]
  ) => {
    gtm.trackRefund(transactionId, value, currency, items);
  };

  return { trackPurchase, trackRefund };
};
