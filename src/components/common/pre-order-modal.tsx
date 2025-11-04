/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import imageUrlBuilder from "@sanity/image-url";
import { client as sanityClient } from "@/sanity/lib/client";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import {
  hasModalSessionShown,
  markModalSessionShown,
  persistModalDismiss,
} from "@/lib/modal.client";

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    title?: string;
    handle?: string;
    availableForSale?: boolean;
  };
  modalDetails?: any;
}

// Sanity image builder helper
const builder = imageUrlBuilder(sanityClient);
function urlFor(source: any): string | null {
  if (!source) return null;
  try {
    if (source?.asset?._ref || source?.asset?._id || source?._ref) {
      return builder.image(source).url();
    }
    if (
      typeof source === "string" &&
      (source.startsWith("http") || source.startsWith("/"))
    ) {
      return source;
    }
    if (source?.asset?.url) {
      return source.asset.url;
    }
    return builder.image(source).url();
  } catch (err) {
    console.warn("urlFor: could not build image url for source:", source, err);
    return null;
  }
}

export default function PreOrderModal({
  isOpen,
  onClose,
  product,
  modalDetails,
}: PreOrderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  // responsive detection
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } else {
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, [mounted]);

  // body scroll lock
  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, mounted]);

  // close on ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen]
  );

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  // Defensive: no modal data
  if (!modalDetails) return null;

  // Prevent re-showing in same session
  if (typeof window !== "undefined" && modalDetails?.showOncePerSession) {
    try {
      if (hasModalSessionShown(modalDetails)) return null;
    } catch {
      // ignore
    }
  }

  // 🧠 Removed redundant eligibility check
  // The provider already ensures modal eligibility,
  // so we don’t run isModalEligible() again here.

  // Extract modal fields
  const heading =
    modalDetails?.heading ||
    modalDetails?.title ||
    modalDetails?.modalName ||
    "on pre-orders only!";
  const subHeading = modalDetails?.subHeading || "";
  const introText =
    modalDetails?.introText ||
    "Need time? We're more than happy to spill all the tea";
  const inputPlaceholder = modalDetails?.inputPlaceholder || "drop your email";
  const consentText =
    modalDetails?.consentText ||
    "By completing this form, you are signing up to receive our emails and can unsubscribe anytime.";
  const consentSubText =
    modalDetails?.consentSubText || "(But it won't spam you)";
  const ctaText = modalDetails?.ctaText || "keep me posted";
  const discountPercent =
    typeof modalDetails?.discountPercent === "number"
      ? modalDetails.discountPercent
      : undefined;
  const backgroundColor =
    modalDetails?.appearance?.background?.color || "#F2EDD8";
  const textColorTitle =
    modalDetails?.appearance?.textColors?.title || "#111827";
  const textColorBody = modalDetails?.appearance?.textColors?.body || "#111827";
  const ctaBackground =
    modalDetails?.appearance?.textColors?.ctaBackground || "#000";
  const ctaTextColor = modalDetails?.appearance?.textColors?.ctaText || "#fff";
  const productSpecificMessage = modalDetails?.productSpecificMessage || "";

  // Build image URLs
  const desktopImageSrc = urlFor(
    modalDetails?.appearance?.background?.desktopImage
  );
  const mobileImageSrc = urlFor(
    modalDetails?.appearance?.background?.mobileImage
  );
  const bgImageUrl = isMobile
    ? mobileImageSrc || desktopImageSrc
    : desktopImageSrc || mobileImageSrc;

  const discountBlock =
    discountPercent && discountPercent > 0 ? (
      <span className="px-3 mr-3 -ml-3 text-4xl md:text-7xl font-bold tracking-widest">
        {discountPercent}% off
      </span>
    ) : null;

  const markSessionShown = () => {
    try {
      markModalSessionShown(modalDetails);
    } catch {}
  };

  const handleClose = () => {
    markSessionShown();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/customer/express-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Something went wrong. Try again.");
        return;
      }

      toast.success(
        data?.message || "Thanks — we'll notify you when it's back!"
      );
      setEmail("");

      try {
        persistModalDismiss(modalDetails);
      } catch {}

      markSessionShown();
      onClose();
    } catch (err) {
      console.error("PreOrder submit error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={() => handleClose()}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[876px] min-h-[490px] shadow-2xl overflow-hidden flex flex-col justify-between p-8 md:p-14"
        style={{
          backgroundColor: !bgImageUrl ? backgroundColor : undefined,
          color: textColorBody,
        }}
      >
        {/* Background */}
        {bgImageUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover pointer-events-none"
            style={{ backgroundImage: `url("${bgImageUrl}")`, zIndex: 0 }}
            aria-hidden
          />
        )}

        {bgImageUrl && (
          <div
            className="absolute inset-0"
            style={{
              background:
                typeof modalDetails?.appearance?.background?.overlayOpacity ===
                "number"
                  ? `rgba(0,0,0,${modalDetails.appearance.background.overlayOpacity})`
                  : "transparent",
              zIndex: 1,
            }}
            aria-hidden
          />
        )}

        {/* Close button */}
        <button
          aria-label="Close"
          onClick={() => handleClose()}
          className="!absolute !top-4 !right-4 z-30 w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition"
        >
          <span className="relative block w-5 h-[2px] bg-black rotate-45" />
          <span className="absolute block w-5 h-[2px] bg-black -rotate-45" />
        </button>

        {/* Content */}
        <div className="relative z-40 w-full flex flex-col items-center md:items-start space-y-4 mt-5">
          {!bgImageUrl && (
            <h2
              className="text-3xl md:text-4xl leading-tight font-bold flex items-center"
              style={{ color: textColorTitle }}
            >
              {discountBlock}
              <span className="text-3xl md:text-4xl font-bold">{heading}</span>
            </h2>
          )}

          {!bgImageUrl && subHeading && (
            <p
              className="text-lg md:text-xl leading-tight font-bold"
              style={{ color: textColorBody }}
              dangerouslySetInnerHTML={
                typeof subHeading === "string"
                  ? { __html: subHeading }
                  : undefined
              }
            />
          )}

          {!bgImageUrl && productSpecificMessage && (
            <p className="text-sm italic mt-2" style={{ color: textColorBody }}>
              {productSpecificMessage}
            </p>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="relative z-40 mt-8 w-full flex flex-col items-end"
        >
          <div className="max-w-lg space-y-2">
            {introText && (
              <p
                className="text-base"
                style={{ color: textColorBody }}
                dangerouslySetInnerHTML={
                  typeof introText === "string"
                    ? { __html: introText }
                    : undefined
                }
              />
            )}

            <InputGroup className="h-14 border border-black rounded-none">
              <InputGroupInput
                id="preorder-email"
                name="email"
                placeholder={inputPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full !text-lg placeholder-gray-400"
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 flex items-center justify-center px-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: ctaBackground,
                    color: ctaTextColor,
                  }}
                  aria-label="Submit"
                >
                  {loading ? "submitting..." : ctaText}
                </button>
              </InputGroupAddon>
            </InputGroup>

            <p className="text-xs text-black w-full flex flex-col items-end">
              {consentText && (
                <span
                  dangerouslySetInnerHTML={
                    typeof consentText === "string"
                      ? { __html: consentText }
                      : undefined
                  }
                />
              )}
              {consentSubText && <span>{consentSubText}</span>}
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
