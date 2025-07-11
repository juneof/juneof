"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSplash } from "@/context/SplashContext";
import { useLoading } from "@/context/LoadingContext";
import { AddressProvider } from "@/context/AddressContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import CustomCursor from "@/app/components/CustomCursor";
import SplashScreen from "@/app/components/SplashScreen";
import PostLoginRedirect from "@/components/PostLoginRedirect";
import CartOverlay from "@/app/components/CartOverlay";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

import { Toaster } from "@/components/ui/sonner";
import * as pixel from "@/lib/meta-pixel";
import { toast } from "sonner";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track PageView events
  useEffect(() => {
    // This check ensures fbq is available before tracking
    if (pixel.PIXEL_ID) {
      pixel.pageview();
    }
  }, [pathname, searchParams]); // Re-fire on path or query param change

  return null;
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { showSplash, setShowSplash } = useSplash();
  const { isGlobalLoading } = useLoading();
  const pathname = usePathname();
  const { isCompletionFlowOpen, hideCompletionFlow, refreshProfileStatus } =
    useProfileCompletion();

  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith("/admin");

  const handleLoadComplete = () => {
    setShowSplash(false);
  };

  // Prevent scrolling when splash screen is visible
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showSplash]);

  return (
    <AddressProvider>
      <CartProvider>
        <CustomCursor />
        <PostLoginRedirect />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {showSplash && <SplashScreen onLoadComplete={handleLoadComplete} />}

        <div
          className={`transition-opacity duration-500 ${
            !showSplash && !isGlobalLoading ? "opacity-100" : "opacity-0"
          }`}
          style={{ display: isGlobalLoading ? "none" : "block" }}
        >
          {!isAdminRoute && <Navbar />}
          <main className="min-h-screen bg-white">{children}</main>
          {!isAdminRoute && <Footer />}
        </div>
        <CartOverlay />

        {/* Global Profile Completion Flow */}
        <ProfileCompletionFlow
          isOpen={isCompletionFlowOpen}
          onClose={hideCompletionFlow}
          onComplete={() => {
            console.log("ClientLayout: Profile completion callback triggered");

            refreshProfileStatus();
            hideCompletionFlow();

            // Show completion toast (cart opening is now handled by ProfileCompletionFlow itself)
            toast.success("profile completed!", {
              description:
                "your profile has been successfully updated. you'll now get personalized recommendations and faster checkout.",
              duration: 4000,
            });
          }}
        />

        <Toaster position="bottom-left" />
      </CartProvider>
    </AddressProvider>
  );
}
