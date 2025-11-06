/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollIndicator from "./ScrollIndicator";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import "../landing-page.css";

// Sanity helpers
import { client } from "@/sanity/lib/client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import HomePageSection1 from "./HomePageSection1";
import HomePageSection2 from "./HomePageSection2";
import HomePageSection3 from "./HomePageSection3";
import HomePageSection4 from "./HomePageSection4";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface LandingPageData {
  _id: string;
  title: string;
  section1_image1: SanityImageSource;
  section1_image2: SanityImageSource;
  section1_image3: SanityImageSource;
  section1_image4: SanityImageSource;
  sticky_image: SanityImageSource;
  text_section_image: SanityImageSource;
  galleryImages: SanityImageSource[];
}

const LANDING_PAGE_QUERY = `*[_type == "landingPage" && !(_id in path("drafts.**"))][0] {
  _id,
  title,
  section1_image1,
  section1_image2,
  section1_image3,
  section1_image4,
  sticky_image,
  text_section_image,
  galleryImages
}`;

export default function LandingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    dimensions,
    isMobile,
    isInitialized: isViewportInitialized,
  } = useViewportHeight();

  const [isMobileOverlayVisible, setIsMobileOverlayVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const loadedImagesRef = useRef(new Set<string>());
  const animationsInitializedRef = useRef(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: LandingPageData = await client.fetch(LANDING_PAGE_QUERY);
        if (data) setPageData(data);
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // image load tracker
  const handleImageLoad = useCallback((src: string) => {
    loadedImagesRef.current.add(src);
    if (loadedImagesRef.current.size >= 6) {
      setImagesLoaded(true);
    }
  }, []);

  const ensureDOMReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }, []);

  const validateDimensions = useCallback((): boolean => {
    if (!section1Ref.current) return false;
    const firstPanel = section1Ref.current.querySelector(
      ".panel.first"
    ) as HTMLElement | null;
    const lastPanel = section1Ref.current.querySelector(
      ".panel.last"
    ) as HTMLElement | null;
    const images = section1Ref.current.querySelectorAll(".panel img");

    if (!firstPanel?.offsetWidth || !lastPanel?.offsetWidth) return false;

    for (const img of images) {
      const imgElement = img as HTMLImageElement;
      if (!imgElement.offsetHeight || !imgElement.offsetWidth) return false;
    }
    return true;
  }, []);

  const initializeAnimations = useCallback(async () => {
    if (!containerRef.current || animationsInitializedRef.current || !pageData)
      return;

    try {
      await ensureDOMReady();

      if (!validateDimensions()) {
        setTimeout(() => initializeAnimations(), 100);
        return;
      }

      const width = dimensions.width;
      const height = dimensions.height;

      gsap.defaults({ ease: "none", duration: 2 });
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Section 1 animations
      const section1panel = gsap.utils.toArray(".section1 .panel");
      const section1length = section1panel.length * height * 2;

      const firstPanelElement = document.querySelector(
        ".section1 .panel.first"
      ) as HTMLElement | null;
      if (!firstPanelElement?.offsetWidth) {
        throw new Error("First panel has no width");
      }

      const firstpanelpos = (width - firstPanelElement.offsetWidth) / 2;
      const section1gap = 40 * (width / 100);

      if (section1Ref.current) {
        section1Ref.current.style.height = `${section1length}px`;

        const container = section1Ref.current.querySelector(
          ".container"
        ) as HTMLElement | null;
        if (container) {
          container.style.columnGap = `${section1gap}px`;
        }

        const firstPanel = section1Ref.current.querySelector(
          ".panel.first"
        ) as HTMLElement | null;
        if (firstPanel) {
          firstPanel.style.marginLeft = `${firstpanelpos}px`;
          firstPanel.style.marginRight = `${firstpanelpos - section1gap / 4}px`;
        }

        const images = section1Ref.current.querySelectorAll(".panel img");
        images.forEach((img) => {
          const imgElement = img as HTMLImageElement;
          if (isMobile && imgElement.classList.contains("pic1")) return;

          if (imgElement.offsetHeight > 0) {
            imgElement.style.marginTop = `${(height - imgElement.offsetHeight) / 2}px`;
          }
        });
      }

      // Position sections
      if (section2Ref.current) {
        section2Ref.current.style.top = `${section1length - height}px`;
      }
      if (section3Ref.current) {
        section3Ref.current.style.top = `${section1length}px`;
      }

      // GSAP pin for section1
      gsap.to(".section1 .container", {
        scrollTrigger: {
          trigger: ".section1",
          start: "top top",
          end: "bottom bottom",
          pin: ".section1 .container",
          pinSpacing: false,
          scrub: true,
          markers: false,
        },
      });

      const lastpanel = document.querySelector(
        ".section1 .panel.last"
      ) as HTMLElement | null;
      if (lastpanel?.offsetWidth) {
        const lastpanelmove =
          lastpanel.offsetLeft + lastpanel.offsetWidth - width;
        gsap.to(section1panel, {
          scrollTrigger: {
            trigger: ".section1",
            start: "top top",
            end: () => `+=${section1length - 2 * height}`,
            scrub: true,
            markers: false,
            id: "section1-move",
          },
          ease: "power1.out",
          x: () => `+=${-lastpanelmove}`,
        });
      }

      // Section 3 parallax
      const section3Image = document.querySelector(
        ".section3 .container img"
      ) as HTMLImageElement | null;
      if (section3Image?.offsetHeight) {
        gsap.to(".section3 .container img", {
          scrollTrigger: {
            trigger: ".section3 .container",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: false,
          },
          y: () => `+=${0.3 * section3Image.offsetHeight}`,
        });
      }

      // Position Section 4
      const section3length = section3Ref.current?.offsetHeight || 0;
      if (section4Ref.current) {
        section4Ref.current.style.top = `${section1length + section3length}px`;
      }

      // Section 4 parallax animations - keep selectors (they live in Section4)
      const section4Animations = [
        { selector: ".section4 .pic1", scrub: 2, yPercent: -150 },
        { selector: ".section4 .pic2", scrub: 0.8, yPercent: -120 },
        { selector: ".section4 .pic3", scrub: 1, yPercent: -130 },
        { selector: ".section4 .pic4", scrub: 0.5, yPercent: -140 },
        { selector: ".section4 .pic5", scrub: 0.5, yPercent: -160 },
        { selector: ".section4 .pic6", scrub: 1.2, yPercent: -125 },
        { selector: ".section4 .pic7", scrub: 0.7, yPercent: -145 },
      ];

      section4Animations.forEach(({ selector, scrub, yPercent }) => {
        const element = document.querySelector(selector);
        if (element) {
          gsap.to(selector, {
            scrollTrigger: {
              trigger: selector,
              start: "top bottom",
              endTrigger: ".section4",
              end: "bottom top",
              scrub,
              markers: false,
            },
            yPercent,
          });
        }
      });

      ScrollTrigger.refresh();

      const section4length = section4Ref.current?.offsetHeight || 0;
      if (spacerRef.current) {
        spacerRef.current.style.height = `${section1length + section3length + section4length + height * 0.0001}px`;
      }

      animationsInitializedRef.current = true;
    } catch (error) {
      console.error("Error initializing animations:", error);
      setTimeout(() => {
        animationsInitializedRef.current = false;
        initializeAnimations();
      }, 500);
    }
  }, [ensureDOMReady, validateDimensions, dimensions, isMobile, pageData]);

  // hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Mobile overlay observer
  useEffect(() => {
    if (!isMobile || !section4Ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            setIsMobileOverlayVisible(true);
          } else {
            setIsMobileOverlayVisible(false);
          }
        });
      },
      { threshold: [0, 0.5, 1], rootMargin: "0px" }
    );

    observer.observe(section4Ref.current);

    return () => observer.disconnect();
  }, [isMobile, isHydrated]);

  // Initialize animations when ready
  useEffect(() => {
    if (!isHydrated || !imagesLoaded || !isViewportInitialized || !pageData)
      return;

    initializeAnimations();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      animationsInitializedRef.current = false;
    };
  }, [
    isHydrated,
    imagesLoaded,
    isViewportInitialized,
    isMobile,
    dimensions,
    initializeAnimations,
    pageData,
  ]);

  // Re-init on dimension change
  useEffect(() => {
    if (isViewportInitialized && isHydrated && imagesLoaded && pageData) {
      animationsInitializedRef.current = false;
      ScrollTrigger.refresh();

      const timeoutId = setTimeout(() => {
        initializeAnimations();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [
    dimensions,
    isViewportInitialized,
    isHydrated,
    imagesLoaded,
    initializeAnimations,
    pageData,
  ]);

  if (isLoading || !pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF3E1]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full z-[2]">
      <ScrollIndicator />
      <HomePageSection1
        ref={section1Ref}
        pageData={pageData}
        handleImageLoad={handleImageLoad}
      />
      <HomePageSection2
        ref={section2Ref}
        pageData={pageData}
        handleImageLoad={handleImageLoad}
      />
      <HomePageSection3
        ref={section3Ref}
        pageData={pageData}
        handleImageLoad={handleImageLoad}
      />
      <HomePageSection4
        ref={section4Ref}
        pageData={pageData}
        isMobileOverlayVisible={isMobileOverlayVisible}
        isMobile={false}
      />
      <div ref={spacerRef} id="spacer"></div>
    </div>
  );
}
