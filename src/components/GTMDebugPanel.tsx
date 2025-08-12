"use client";

import { useState, useEffect } from "react";
import * as gtm from "@/lib/gtm";

export default function GTMDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [dataLayerEvents, setDataLayerEvents] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Check for debug mode in localStorage
    const debugMode = localStorage.getItem("gtm-debug") === "true";
    setIsVisible(debugMode);

    if (debugMode) {
      // Monitor dataLayer changes
      const originalPush = (window as any).dataLayer?.push; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (originalPush) {
        (window as any).dataLayer.push = function (...args: any[]) {
          // eslint-disable-line @typescript-eslint/no-explicit-any
          setDataLayerEvents((prev) => [...prev.slice(-9), ...args]); // Keep last 10 events
          return originalPush.apply(this, args);
        };
      }
    }
  }, []);

  const testEvents = () => {
    // Test various GTM events
    gtm.trackPageView("/test-page", "Test Page");

    // Test sendGTMEvent function for e-commerce events
    gtm.sendGTMEvent({
      event: "view_item",
      ecommerce: {
        currency: "INR",
        value: 100,
        items: [
          {
            item_id: "test-123",
            item_name: "Test Product",
            item_brand: "June Of",
            item_category: "test",
            price: 100,
            quantity: 1,
          },
        ],
      },
    });

    gtm.sendGTMEvent({
      event: "add_to_cart",
      ecommerce: {
        currency: "INR",
        value: 100,
        items: [
          {
            item_id: "test-123",
            item_name: "Test Product",
            item_brand: "June Of",
            item_variant: "Test Size",
            price: 100,
            quantity: 1,
          },
        ],
      },
    });

    gtm.trackSearch("test search", 5);
    gtm.trackGenerateLead("INR", 0, "test_lead");
  };

  const clearEvents = () => {
    setDataLayerEvents([]);
  };

  const toggleDebug = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("gtm-debug", newState.toString());
    if (newState) {
      window.location.reload(); // Reload to activate monitoring
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleDebug}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-full text-xs hover:bg-blue-700 transition-colors"
        title="Toggle GTM Debug Panel"
      >
        GTM
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">GTM Debug Panel</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <strong>GTM Status:</strong>{" "}
              {gtm.isGTMLoaded() ? "✅ Loaded" : "❌ Not Loaded"}
            </div>

            <div>
              <strong>GTM ID:</strong>{" "}
              {process.env.NEXT_PUBLIC_GTM_ID || "Not Set"}
            </div>

            <div className="flex gap-2">
              <button
                onClick={testEvents}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                Test Events
              </button>
              <button
                onClick={clearEvents}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                Clear
              </button>
            </div>

            <div>
              <strong>Recent Events ({dataLayerEvents.length}):</strong>
              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                {dataLayerEvents.length === 0 ? (
                  <div className="text-gray-500 italic">No events captured</div>
                ) : (
                  dataLayerEvents.map((event, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-2 rounded border text-xs"
                    >
                      <div className="font-mono">
                        <strong>Event:</strong> {String(event.event) || "N/A"}
                      </div>
                      {event.ecommerce && (
                        <div className="font-mono text-green-700">
                          <strong>Ecommerce:</strong>{" "}
                          {JSON.stringify(event.ecommerce, null, 1)}
                        </div>
                      )}
                      <div className="font-mono text-gray-600 text-xs">
                        {JSON.stringify(event, null, 1).substring(0, 100)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper to enable debug mode
export const enableGTMDebug = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("gtm-debug", "true");
    window.location.reload();
  }
};

// Helper to disable debug mode
export const disableGTMDebug = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("gtm-debug", "false");
    window.location.reload();
  }
};
