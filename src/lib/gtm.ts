// Google Tag Manager utility functions for e-commerce tracking
// This follows Google Analytics 4 Enhanced Ecommerce specification

// Local helper type for accessing the GTM dataLayer without polluting the global Window type
interface DataLayerWindow {
  dataLayer: Array<Record<string, unknown>>;
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== "undefined") {
  const w = window as unknown as Partial<DataLayerWindow>;
  if (!w.dataLayer) {
    (window as unknown as DataLayerWindow).dataLayer = [];
  }
}

// GTM Event Types
export interface GTMProduct {
  item_id: string;
  item_name: string;
  category?: string;
  category2?: string;
  category3?: string;
  category4?: string;
  category5?: string;
  item_brand?: string;
  item_variant?: string;
  price: number;
  currency: string;
  quantity: number;
  index?: number;
  item_list_name?: string;
  item_list_id?: string;
  discount?: number;
}

export interface GTMPurchaseData {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GTMProduct[];
}

export interface GTMUser {
  user_id?: string;
  customer_id?: string;
  user_properties?: {
    customer_lifetime_value?: number;
    customer_loyalty_tier?: string;
    preferred_language?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

// Core GTM function to push events to dataLayer
export const pushToDataLayer = (event: GTMEvent | Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    const w = window as unknown as DataLayerWindow;
    if (Array.isArray(w.dataLayer)) {
      console.log("GTM Event:", event); // Debug logging
      w.dataLayer.push(event);
    }
  }
};

// GTM Event type for e-commerce tracking
export type GTMEvent = {
  event: string;
  ecommerce: {
    [key: string]: unknown;
  };
};

// Helper function to send GTM events with ecommerce data
export const sendGTMEvent = (data: GTMEvent) => {
  if (typeof window !== "undefined") {
    const w = window as unknown as DataLayerWindow;
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
      w.dataLayer.push(data);
      console.log("GTM E-commerce Event:", data); // Debug logging
    }
  }
};

// Enhanced Ecommerce Events

// 1. View Item List (Product Listing Page)
export const trackViewItemList = (
  items: GTMProduct[],
  itemListName: string,
  itemListId?: string
) => {
  pushToDataLayer({
    event: "view_item_list",
    ecommerce: {
      item_list_name: itemListName,
      item_list_id: itemListId,
      items: items.map((item, index) => ({
        ...item,
        index: index + 1,
        item_list_name: itemListName,
        item_list_id: itemListId,
      })),
    },
  });
};

// 2. View Item (Product Detail Page)
export const trackViewItem = (item: GTMProduct, value?: number) => {
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency: item.currency,
      value: value || item.price * item.quantity,
      items: [item],
    },
  });
};

// 3. Add to Cart
export const trackAddToCart = (items: GTMProduct[], value?: number) => {
  const totalValue =
    value || items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: items[0]?.currency || "INR",
      value: totalValue,
      items,
    },
  });
};

// 4. Remove from Cart
export const trackRemoveFromCart = (items: GTMProduct[], value?: number) => {
  const totalValue =
    value || items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency: items[0]?.currency || "INR",
      value: totalValue,
      items,
    },
  });
};

// 5. View Cart
export const trackViewCart = (
  items: GTMProduct[],
  value: number,
  currency = "INR"
) => {
  pushToDataLayer({
    event: "view_cart",
    ecommerce: {
      currency,
      value,
      items,
    },
  });
};

// 6. Begin Checkout
export const trackBeginCheckout = (
  items: GTMProduct[],
  value: number,
  currency = "INR",
  coupon?: string
) => {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency,
      value,
      coupon,
      items,
    },
  });
};

// 7. Add Shipping Info
export const trackAddShippingInfo = (
  items: GTMProduct[],
  value: number,
  currency = "INR",
  shippingTier?: string,
  coupon?: string
) => {
  pushToDataLayer({
    event: "add_shipping_info",
    ecommerce: {
      currency,
      value,
      coupon,
      shipping_tier: shippingTier,
      items,
    },
  });
};

// 8. Add Payment Info
export const trackAddPaymentInfo = (
  items: GTMProduct[],
  value: number,
  currency = "INR",
  paymentType?: string,
  coupon?: string
) => {
  pushToDataLayer({
    event: "add_payment_info",
    ecommerce: {
      currency,
      value,
      coupon,
      payment_type: paymentType,
      items,
    },
  });
};

// 9. Purchase (Most Important for Shopify Integration)
export const trackPurchase = (purchaseData: GTMPurchaseData) => {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.value,
      currency: purchaseData.currency,
      tax: purchaseData.tax,
      shipping: purchaseData.shipping,
      coupon: purchaseData.coupon,
      items: purchaseData.items,
    },
  });
};

// 10. Refund
export const trackRefund = (
  transactionId: string,
  value?: number,
  currency = "INR",
  items?: GTMProduct[]
) => {
  pushToDataLayer({
    event: "refund",
    ecommerce: {
      transaction_id: transactionId,
      value,
      currency,
      items,
    },
  });
};

// Custom Events for Better Tracking

// 11. Select Item (when user clicks on product)
export const trackSelectItem = (
  item: GTMProduct,
  itemListName?: string,
  itemListId?: string
) => {
  pushToDataLayer({
    event: "select_item",
    ecommerce: {
      item_list_name: itemListName,
      item_list_id: itemListId,
      items: [
        {
          ...item,
          item_list_name: itemListName,
          item_list_id: itemListId,
        },
      ],
    },
  });
};

// 12. Search
export const trackSearch = (searchTerm: string, searchResults?: number) => {
  pushToDataLayer({
    event: "search",
    search_term: searchTerm,
    search_results: searchResults,
  });
};

// 13. Login
export const trackLogin = (method?: string, userId?: string) => {
  pushToDataLayer({
    event: "login",
    method,
    user_id: userId,
  });
};

// 14. Sign Up
export const trackSignUp = (method?: string, userId?: string) => {
  pushToDataLayer({
    event: "sign_up",
    method,
    user_id: userId,
  });
};

// 15. Share
export const trackShare = (
  contentType?: string,
  itemId?: string,
  method?: string
) => {
  pushToDataLayer({
    event: "share",
    content_type: contentType,
    item_id: itemId,
    method,
  });
};

// 16. Generate Lead (for express interest, newsletter signup)
export const trackGenerateLead = (
  currency = "INR",
  value?: number,
  leadType?: string
) => {
  pushToDataLayer({
    event: "generate_lead",
    currency,
    value,
    lead_type: leadType,
  });
};

// User Management
export const setUserId = (userId: string) => {
  pushToDataLayer({
    event: "set_user_id",
    user_id: userId,
  });
};

export const setUserProperties = (
  userProperties: GTMUser["user_properties"]
) => {
  pushToDataLayer({
    event: "set_user_properties",
    user_properties: userProperties,
  });
};

// Page View (for SPA navigation)
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  pushToDataLayer({
    event: "page_view",
    page_path: pagePath,
    page_title: pageTitle,
  });
};

// Custom Events for Juneof-specific actions
export const trackExpressInterest = (
  productId: string,
  productName: string,
  email?: string
) => {
  pushToDataLayer({
    event: "express_interest",
    product_id: productId,
    product_name: productName,
    email,
  });

  // Also track as generate_lead
  trackGenerateLead("INR", undefined, "express_interest");
};

export const trackNewsletterSignup = (email?: string, source?: string) => {
  pushToDataLayer({
    event: "newsletter_signup",
    email,
    source,
  });

  // Also track as generate_lead
  trackGenerateLead("INR", undefined, "newsletter");
};

export const trackContactForm = (formType: string, email?: string) => {
  pushToDataLayer({
    event: "contact_form_submit",
    form_type: formType,
    email,
  });

  // Also track as generate_lead
  trackGenerateLead("INR", undefined, "contact_form");
};

// Utility Functions

// Convert Shopify product to GTM format
export const shopifyProductToGTM = (
  shopifyProduct: {
    id: string;
    title: string;
    productType?: string;
    vendor?: string;
    variants?: Array<{
      id: string;
      title: string;
      price: { amount: string; currencyCode: string };
    }>;
    priceRange?: {
      minVariantPrice: { amount: string; currencyCode?: string };
    };
  },
  selectedVariant?: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
  },
  quantity = 1
): GTMProduct => {
  const variant = selectedVariant || shopifyProduct.variants?.[0];

  return {
    item_id: variant?.id || shopifyProduct.id,
    item_name: shopifyProduct.title,
    category: shopifyProduct.productType,
    item_brand: shopifyProduct.vendor || "juneof",
    item_variant: variant?.title,
    price: parseFloat(
      variant?.price?.amount ||
        shopifyProduct.priceRange?.minVariantPrice?.amount ||
        "0"
    ),
    currency: variant?.price?.currencyCode || "INR",
    quantity,
  };
};

// Convert Shopify cart to GTM format
export const shopifyCartToGTM = (shopifyCart: {
  lines?: {
    nodes?: Array<{
      merchandise: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        product: {
          title: string;
          productType?: string;
          vendor?: string;
        };
      };
      quantity: number;
    }>;
  };
}): GTMProduct[] => {
  return (
    shopifyCart.lines?.nodes?.map((line) => ({
      item_id: line.merchandise.id,
      item_name: line.merchandise.product.title,
      category: line.merchandise.product.productType,
      item_brand: line.merchandise.product.vendor || "juneof",
      item_variant: line.merchandise.title,
      price: parseFloat(line.merchandise.price.amount),
      currency: line.merchandise.price.currencyCode,
      quantity: line.quantity,
    })) || []
  );
};

// Debug function to check if GTM is loaded
export const isGTMLoaded = (): boolean => {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Partial<DataLayerWindow>;
  return Array.isArray(w.dataLayer);
};

// Get current dataLayer state (for debugging)
export const getDataLayerState = (): Array<Record<string, unknown>> => {
  if (typeof window === "undefined") return [];
  const w = window as unknown as Partial<DataLayerWindow>;
  return (w.dataLayer as Array<Record<string, unknown>>) || [];
};
