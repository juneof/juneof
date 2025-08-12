# Simple GTM Testing Guide

## Quick Test Setup

1. **Set your GTM ID in environment:**

   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Enable debug mode:**
   - Look for "GTM" button in bottom right corner
   - Click it to enable debug panel
   - Or manually: `localStorage.setItem('gtm-debug', 'true')` then refresh

## Core Events to Test

### 1. View Item Event

- **Trigger**: Navigate to any product page
- **Expected Data Layer Event**:

```javascript
{
  event: "view_item",
  ecommerce: {
    currency: "INR",
    value: 2500,
    items: [{
      item_id: "gid://shopify/Product/123",
      item_name: "Cotton Kurta",
      item_brand: "June Of",
      item_category: "Kurtas",
      price: 2500,
      quantity: 1
    }]
  }
}
```

### 2. Add to Cart Event

- **Trigger**: Select size and click "Add to Cart" on product page
- **Expected Data Layer Event**:

```javascript
{
  event: "add_to_cart",
  ecommerce: {
    currency: "INR",
    value: 2500,
    items: [{
      item_id: "gid://shopify/ProductVariant/456",
      item_name: "cotton kurta",
      item_brand: "June Of",
      item_variant: "L",
      price: 2500,
      quantity: 1
    }]
  }
}
```

### 3. Begin Checkout Event

- **Trigger**: Open cart overlay and click checkout button
- **Expected Data Layer Event**:

```javascript
{
  event: "begin_checkout",
  ecommerce: {
    currency: "INR",
    value: 2500,
    items: [{
      item_id: "gid://shopify/ProductVariant/456",
      item_name: "cotton kurta",
      item_brand: "June Of",
      item_variant: "L",
      price: 2500,
      quantity: 1
    }]
  }
}
```

## Verification Steps

### In Browser Console:

1. Check GTM is loaded: `console.log(window.dataLayer)`
2. Monitor events: Watch debug panel or console logs
3. Verify data structure matches expected format

### In GTM Preview Mode:

1. Enable Preview mode in GTM container
2. Navigate to your site
3. Verify events are firing in GTM debugger
4. Check that data layer variables are populated

### In GA4 Real-time Reports:

1. Go to GA4 > Reports > Real-time
2. Perform test actions on site
3. Verify events appear in real-time data

## Expected Results

✅ **All three core events should fire with proper e-commerce data**
✅ **Events should appear in GTM Preview mode**
✅ **Data should flow to GA4 (if configured)**
✅ **Debug panel should show event details**

## Troubleshooting

- **No events firing**: Check GTM_ID is set and container is published
- **Events firing but no data**: Verify GTM tags are configured for GA4
- **Duplicate events**: Normal in development, won't happen in production

This covers the essential e-commerce tracking you requested!
