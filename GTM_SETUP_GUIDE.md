# Google Tag Manager (GTM) Integration Guide

This guide walks you through setting up comprehensive e-commerce tracking using Google Tag Manager in your Next.js application.

## Prerequisites

1. **Google Tag Manager Account**: Create a GTM container at [tagmanager.google.com](https://tagmanager.google.com)
2. **Google Analytics 4 Property**: Set up GA4 for receiving e-commerce data
3. **Shopify Store**: For webhook integration (optional but recommended)

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Optional: Shopify Webhook Verification (for server-side purchase tracking)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

## GTM Container Setup

### 1. Create Google Analytics 4 Configuration Tag

1. In GTM, create a new tag
2. Choose "Google Analytics: GA4 Configuration"
3. Enter your GA4 Measurement ID
4. Set trigger to "All Pages"

### 2. Create Enhanced Ecommerce Tags

Create the following custom HTML tags or use built-in GA4 Event tags:

#### A. Purchase Tag

- **Tag Type**: GA4 Event
- **Event Name**: `purchase`
- **Trigger**: Custom Event `purchase`
- **Parameters**:
  - `transaction_id`: `{{DLV - transaction_id}}`
  - `value`: `{{DLV - value}}`
  - `currency`: `{{DLV - currency}}`
  - `items`: `{{DLV - items}}`

#### B. Add to Cart Tag

- **Tag Type**: GA4 Event
- **Event Name**: `add_to_cart`
- **Trigger**: Custom Event `add_to_cart`

#### C. Begin Checkout Tag

- **Tag Type**: GA4 Event
- **Event Name**: `begin_checkout`
- **Trigger**: Custom Event `begin_checkout`

#### D. View Item Tag

- **Tag Type**: GA4 Event
- **Event Name**: `view_item`
- **Trigger**: Custom Event `view_item`

### 3. Create Data Layer Variables

Create these Data Layer Variables in GTM:

- `DLV - transaction_id` → `ecommerce.transaction_id`
- `DLV - value` → `ecommerce.value`
- `DLV - currency` → `ecommerce.currency`
- `DLV - items` → `ecommerce.items`
- `DLV - item_list_name` → `ecommerce.item_list_name`

### 4. Create Custom Event Triggers

Create triggers for each e-commerce event:

- **Trigger Name**: `Purchase`
  - **Type**: Custom Event
  - **Event Name**: `purchase`

- **Trigger Name**: `Add to Cart`
  - **Type**: Custom Event
  - **Event Name**: `add_to_cart`

- **Trigger Name**: `Begin Checkout`
  - **Type**: Custom Event
  - **Event Name**: `begin_checkout`

- **Trigger Name**: `View Item`
  - **Type**: Custom Event
  - **Event Name**: `view_item`

## Implementation Details

### Automatic Event Tracking

The following events are automatically tracked:

1. **Page Views**: Tracked on route changes in SPA
2. **Product Views**: When product pages load
3. **Add to Cart**: When items are added to cart
4. **Remove from Cart**: When items are removed
5. **View Cart**: When cart overlay opens
6. **Begin Checkout**: When checkout process starts
7. **User Login**: When users authenticate
8. **Express Interest**: For out-of-stock products

### Manual Event Tracking

You can manually track events using the GTM utilities:

```typescript
import * as gtm from "@/lib/gtm";

// Track a custom purchase
gtm.trackPurchase({
  transaction_id: "ORDER-123",
  value: 2999.0,
  currency: "INR",
  tax: 299.9,
  shipping: 199.0,
  items: [
    {
      item_id: "PROD-123",
      item_name: "Cotton Kurta",
      category: "clothing",
      item_brand: "juneof",
      price: 2500.0,
      currency: "INR",
      quantity: 1,
    },
  ],
});

// Track newsletter signup
gtm.trackNewsletterSignup("user@example.com", "footer");

// Track search
gtm.trackSearch("cotton kurta", 15);
```

### Using Hooks

```typescript
import { useFormTracking, useAuthTracking } from "@/hooks/useGTM";

function MyComponent() {
  const { trackContactForm } = useFormTracking();
  const { trackLogin } = useAuthTracking();

  const handleFormSubmit = () => {
    trackContactForm("contact_us", "user@example.com");
  };

  const handleLogin = () => {
    trackLogin("shopify", "user123");
  };
}
```

## Shopify Integration

### 1. Set Up Webhooks

In your Shopify admin, create webhooks for:

- **orders/paid**: `https://yoursite.com/api/webhooks/shopify/orders`
- **orders/cancelled**: `https://yoursite.com/api/webhooks/shopify/orders`
- **orders/refunded**: `https://yoursite.com/api/webhooks/shopify/orders`

### 2. Purchase Tracking on Order Confirmation

Add the `PurchaseTracker` component to your order confirmation page:

```typescript
import PurchaseTracker from '@/components/PurchaseTracker';

export default function OrderConfirmation() {
  return (
    <div>
      <h1>Order Confirmed!</h1>
      <PurchaseTracker />
    </div>
  );
}
```

### 3. Advanced Purchase Tracking

For detailed tracking with product information:

```typescript
<PurchaseTracker
  orderData={{
    orderId: 'ORDER-123',
    total: 2999.00,
    currency: 'INR',
    tax: 299.90,
    shipping: 199.00,
    items: [{
      id: 'PROD-123',
      name: 'Cotton Kurta',
      category: 'clothing',
      brand: 'juneof',
      variant: 'Large',
      price: 2500.00,
      quantity: 1
    }]
  }}
/>
```

## Testing and Debugging

### 1. GTM Preview Mode

1. Enable Preview mode in GTM
2. Navigate your site and verify events are firing
3. Check that data layer variables are populated correctly

### 2. Browser Console Debugging

The GTM library includes debug logging:

```javascript
// Check if GTM is loaded
console.log("GTM Loaded:", window.dataLayer ? "Yes" : "No");

// View current data layer state
console.log("Data Layer:", window.dataLayer);
```

### 3. GA4 Real-Time Reports

Monitor events in GA4 Real-Time reports to verify data is flowing correctly.

### 4. Debug Hook

Use the debug hook to check GTM status:

```typescript
import { useGTMDebug } from '@/hooks/useGTM';

function DebugComponent() {
  const { isLoaded, dataLayerState } = useGTMDebug();

  return (
    <div>
      <p>GTM Loaded: {isLoaded ? 'Yes' : 'No'}</p>
      <pre>{JSON.stringify(dataLayerState, null, 2)}</pre>
    </div>
  );
}
```

## Common Issues and Solutions

### 1. Events Not Firing

- Check that `NEXT_PUBLIC_GTM_ID` is set correctly
- Verify GTM container is published
- Check browser console for errors

### 2. Missing E-commerce Data

- Ensure data layer variables are created in GTM
- Verify trigger conditions match event names
- Check that GA4 Enhanced Ecommerce is enabled

### 3. Duplicate Events

- Events may fire twice in development due to React StrictMode
- This won't happen in production builds

### 4. Server-Side Events

- Server-side events (webhooks) require additional setup
- Consider using GA4 Measurement Protocol for server-side tracking

## Performance Considerations

1. **Lazy Loading**: GTM is loaded after interactive using Next.js third-parties
2. **Event Batching**: Multiple events are automatically batched by GTM
3. **Data Layer Size**: Keep data layer payloads reasonable (<50KB)

## Privacy and Compliance

1. **GDPR/CCPA**: Implement consent management if required
2. **Data Retention**: Configure GA4 data retention settings
3. **PII**: Avoid sending personally identifiable information

## Next Steps

1. Set up conversion goals in GA4
2. Create custom audiences based on e-commerce behavior
3. Set up Google Ads conversion tracking
4. Implement server-side tracking for enhanced accuracy
5. Add consent management for privacy compliance

## Support

For issues with this implementation:

1. Check the browser console for errors
2. Use GTM Preview mode to debug
3. Verify environment variables are set
4. Check that all required GTM tags and triggers are configured
