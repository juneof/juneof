/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  // optional route-scoped key passed from ModalContext
  modalScope?: string | undefined;
}

const builder = imageUrlBuilder(sanityClient);

// utility: build URL from various shapes
function urlFor(source: any): string | null {
  if (!source) return null;
  try {
    // Sanity asset references or objects
    if (source?.asset?._ref || source?.asset?._id || source?._ref) {
      return builder.image(source).url();
    }
    // If string url or path
    if (typeof source === "string") {
      if (source.startsWith("http") || source.startsWith("/")) return source;
    }
    if (source?.asset?.url) return source.asset.url;
    // Fallback try
    return builder.image(source).url();
  } catch (err) {
    // avoid noisy logs in production
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "urlFor: could not build image url for source:",
        source,
        err
      );
    }
    return null;
  }
}

// Slightly stricter practical regex for most emails
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function PreOrderModal({
  isOpen,
  onClose,
  product,
  modalDetails,
  modalScope,
}: PreOrderModalProps) {
  // --- basic state/hooks (always declared, never conditionally)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // state to decide whether to actually render modal content (keeps hooks stable)
  const [shouldShow, setShouldShow] = useState(true);

  // mount guard
  useEffect(() => setMounted(true), []);

  // responsive detection
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (ev: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile("matches" in ev ? ev.matches : mq.matches);
    };
    handler(mq);
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, [mounted]);

  // body scroll lock while open
  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow || "";
    document.body.style.overflow = isOpen ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, mounted]);

  // determine shouldShow based on modalDetails and session flags (route-scoped)
  useEffect(() => {
    // default: if no modalDetails, don't show
    if (!modalDetails) {
      setShouldShow(false);
      return;
    }

    // If modalDetails exists, check showOncePerSession flag using route scope
    if (modalDetails?.showOncePerSession) {
      try {
        if (hasModalSessionShown(modalDetails, modalScope ?? null)) {
          setShouldShow(false);
          return;
        }
      } catch {
        // fail safe -> allow showing
      }
    }

    // otherwise allow show
    setShouldShow(true);
  }, [modalDetails, modalScope]);

  // derive modal fields once (safe to run even if modalDetails is null)
  const {
    heading,
    subHeading,
    introText,
    inputPlaceholder,
    consentText,
    consentSubText,
    ctaText,
    discountPercent,
    backgroundColor,
    textColorTitle,
    textColorBody,
    ctaBackground,
    ctaTextColor,
    productSpecificMessage,
    bgImageUrl,
    overlayOpacity,
  } = useMemo(() => {
    const h =
      modalDetails?.heading ||
      modalDetails?.title ||
      modalDetails?.modalName ||
      "on pre-orders only!";
    const sh = modalDetails?.subHeading || "";
    const intro =
      modalDetails?.introText ||
      "Need time? We're more than happy to spill all the tea";
    const placeholder = modalDetails?.inputPlaceholder || "drop your email";
    const consent =
      modalDetails?.consentText ||
      "By completing this form, you are signing up to receive our emails and can unsubscribe anytime.";
    const consentSub =
      modalDetails?.consentSubText || "(But we won't spam you)";
    const cta = modalDetails?.ctaText || "keep me posted";
    const discount =
      typeof modalDetails?.discountPercent === "number"
        ? modalDetails.discountPercent
        : undefined;
    const bg = modalDetails?.appearance?.background?.color || "#F2EDD8";
    const titleColor = modalDetails?.appearance?.textColors?.title || "#111827";
    const bodyColor = modalDetails?.appearance?.textColors?.body || "#111827";
    const ctaBg = modalDetails?.appearance?.textColors?.ctaBackground || "#000";
    const ctaTxt = modalDetails?.appearance?.textColors?.ctaText || "#fff";
    const pMsg = modalDetails?.productSpecificMessage || "";

    const desktopImage = urlFor(
      modalDetails?.appearance?.background?.desktopImage
    );
    const mobileImage = urlFor(
      modalDetails?.appearance?.background?.mobileImage
    );
    const bgImg = isMobile
      ? mobileImage || desktopImage
      : desktopImage || mobileImage;
    const overlay =
      typeof modalDetails?.appearance?.background?.overlayOpacity === "number"
        ? modalDetails.appearance.background.overlayOpacity
        : 0;

    return {
      heading: h,
      subHeading: sh,
      introText: intro,
      inputPlaceholder: placeholder,
      consentText: consent,
      consentSubText: consentSub,
      ctaText: cta,
      discountPercent: discount,
      backgroundColor: bg,
      textColorTitle: titleColor,
      textColorBody: bodyColor,
      ctaBackground: ctaBg,
      ctaTextColor: ctaTxt,
      productSpecificMessage: pMsg,
      bgImageUrl: bgImg,
      overlayOpacity: overlay,
    };
  }, [modalDetails, isMobile]);

  const discountBlock =
    discountPercent && discountPercent > 0 ? (
      <span className="px-3 mr-3 -ml-3 text-4xl md:text-7xl font-bold tracking-widest">
        {discountPercent}% off
      </span>
    ) : null;

  const markSessionShownSafe = () => {
    try {
      if (modalDetails) markModalSessionShown(modalDetails, modalScope ?? null);
    } catch {}
  };

  const handleClose = () => {
    markSessionShownSafe();
    onClose();
  };

  // close on ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    },
    [isOpen] // include isOpen so closure sees latest
  );

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  // Email change + realtime validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    if (!val) {
      setEmailError("Email is required");
    } else if (!EMAIL_RE.test(val.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !!emailError) {
      toast.error(emailError || "Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        url: typeof window !== "undefined" ? window.location.href : null,
      };

      const res = await fetch("/api/customer/pre-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.message || data?.error || "Something went wrong. Try again."
        );
        return;
      }

      if (data?.alreadySignedUp) {
        toast.success(
          "Oops — you're already signed up for this (we see how excited you are!)."
        );
      } else {
        toast.success(
          data?.message || "Thanks — we'll notify you when it's back!"
        );
      }

      setEmail("");
      setEmailError(null);
      try {
        if (modalDetails) persistModalDismiss(modalDetails);
      } catch {}
      markSessionShownSafe();
      onClose();
    } catch (err) {
      console.error("PreOrder submit error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Final render gating:
  // Keep these returns AFTER all hooks to maintain hook order stability.
  if (!mounted) return null;
  if (!isOpen) return null;
  if (!shouldShow) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      aria-hidden={false}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={handleClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-[876px] min-h-[490px] shadow-2xl overflow-hidden flex flex-col justify-between p-8 md:p-14"
        style={{
          backgroundColor: !bgImageUrl ? backgroundColor : undefined,
          color: textColorBody,
        }}
        role="document"
      >
        {/* Background image + overlay */}
        {bgImageUrl && (
          <>
            <div
              className="absolute inset-0 bg-center bg-cover pointer-events-none"
              style={{ backgroundImage: `url("${bgImageUrl}")`, zIndex: 0 }}
              aria-hidden
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  overlayOpacity && overlayOpacity > 0
                    ? `rgba(0,0,0,${overlayOpacity})`
                    : "transparent",
                zIndex: 1,
              }}
              aria-hidden
            />
          </>
        )}

        {/* Close button */}
        <button
          aria-label="Close"
          onClick={handleClose}
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

            {/* Input group: border turns red when there's an email error */}
            <InputGroup
              className={`h-14 rounded-none border ${
                emailError ? "border-red-500" : "border-black"
              }`}
            >
              <InputGroupInput
                id="preorder-email"
                name="email"
                placeholder={inputPlaceholder}
                value={email}
                onChange={handleEmailChange}
                className={`w-full !text-lg placeholder-gray-400 focus:outline-none`}
                aria-label="Email"
                autoComplete="email"
                required
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="submit"
                  disabled={loading || !!emailError}
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

            {/* Inline error message */}
            {emailError && (
              <p className="text-red-600 text-xs mt-1">{emailError}</p>
            )}

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
