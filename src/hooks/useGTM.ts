import { useEffect } from "react";
import * as gtm from "@/lib/gtm";

// Hook to track page views for SPA navigation
export const usePageView = (pagePath: string, pageTitle?: string) => {
  useEffect(() => {
    gtm.trackPageView(pagePath, pageTitle);
  }, [pagePath, pageTitle]);
};

// Hook to set user data when authentication changes
export const useGTMUser = (
  userId?: string,
  userProperties?: gtm.GTMUser["user_properties"]
) => {
  useEffect(() => {
    if (userId) {
      gtm.setUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (userProperties) {
      gtm.setUserProperties(userProperties);
    }
  }, [userProperties]);
};

// Hook for tracking search events
export const useSearchTracking = () => {
  const trackSearch = (searchTerm: string, searchResults?: number) => {
    gtm.trackSearch(searchTerm, searchResults);
  };

  return { trackSearch };
};

// Hook for tracking authentication events
export const useAuthTracking = () => {
  const trackLogin = (method?: string, userId?: string) => {
    gtm.trackLogin(method, userId);
  };

  const trackSignUp = (method?: string, userId?: string) => {
    gtm.trackSignUp(method, userId);
  };

  return { trackLogin, trackSignUp };
};

// Hook for tracking form submissions
export const useFormTracking = () => {
  const trackContactForm = (formType: string, email?: string) => {
    gtm.trackContactForm(formType, email);
  };

  const trackNewsletterSignup = (email?: string, source?: string) => {
    gtm.trackNewsletterSignup(email, source);
  };

  const trackExpressInterest = (
    productId: string,
    productName: string,
    email?: string
  ) => {
    gtm.trackExpressInterest(productId, productName, email);
  };

  return { trackContactForm, trackNewsletterSignup, trackExpressInterest };
};

// Hook for debugging GTM
export const useGTMDebug = () => {
  const isLoaded = gtm.isGTMLoaded();
  const dataLayerState = gtm.getDataLayerState();

  return { isLoaded, dataLayerState };
};
