/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineField, defineType } from "sanity";
import { ComponentIcon } from "@sanity/icons";

export const preOrderModal = defineType({
  name: "preOrderModal",
  title: "Pre-order / Promo Modal",
  type: "document",
  icon: ComponentIcon,

  initialValue: {
    enabled: true,
    allowOnPreOrderProductPages: false,
    showOnAllProductPages: false,
    showOncePerSession: false,
    enableDisplayDelay: false,
    displayDelayUnit: "seconds",
    displayDelayValue: 0,
    enableSchedule: false,
    priority: 0,
    ctaText: "keep me posted",
    appearance: {
      background: { type: "color", color: "#F2EDD8" },
      textColors: {
        title: "#111827",
        subHeading: "#111827",
        body: "#111827",
        ctaText: "#ffffff",
        ctaBackground: "#000000",
      },
    },
  },

  fields: [
    // Identification & Targeting
    defineField({
      name: "modalName",
      title: "Modal name (Studio only)",
      type: "string",
      description:
        "Internal label used to identify this modal inside Sanity Studio. Not visible to users.",
      validation: (Rule) => Rule.required().max(80),
    }),

    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      description:
        "Toggle to show or hide this modal on the website. When off, it will never appear.",
      initialValue: true,
    }),

    defineField({
      name: "slugs",
      title: "Specific page slugs / paths",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Enter exact URL paths where this modal should appear. Example: '/', 'product/juneof-jacket'. Required unless you enable global options below.",
      validation: (Rule) =>
        Rule.custom((slugs: any, context: any) => {
          const allowOnPreOrderProductPages =
            context.document?.allowOnPreOrderProductPages;
          const showOnAllProductPages = context.document?.showOnAllProductPages;
          const hasSlugs = Array.isArray(slugs) && slugs.length > 0;
          if (
            !allowOnPreOrderProductPages &&
            !showOnAllProductPages &&
            !hasSlugs
          ) {
            return 'Provide slugs OR enable "Allow on pre-order product pages" OR "Show on all product pages".';
          }
          return true;
        }),
    }),

    defineField({
      name: "allowOnPreOrderProductPages",
      title: "Show on pre-order product pages",
      type: "boolean",
      description:
        "When enabled, this modal appears automatically on pre-order or unavailable product pages.",
      initialValue: false,
    }),

    defineField({
      name: "showOnAllProductPages",
      title: "Show on all product pages",
      type: "boolean",
      description:
        "When enabled, this modal appears on every product page, regardless of availability or slug.",
      initialValue: false,
    }),

    // Session behavior
    defineField({
      name: "showOncePerSession",
      title: "Show only once per session",
      type: "boolean",
      description:
        "If enabled, this modal shows only once per browser session (sessionStorage). Turn off to allow it to reappear multiple times.",
      initialValue: true,
    }),

    defineField({
      name: "showOnceSessionKeySuffix",
      title: "Session key suffix (auto-generated)",
      type: "string",
      readOnly: true,
      description:
        "Automatically generated unique ID used to track whether this modal has already shown in the current session.",
      initialValue: () => {
        try {
          if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
          ) {
            return `modal_${crypto.randomUUID()}`;
          }
        } catch {
          /* ignore */
        }
        return `modal_${Math.random().toString(36).substring(2, 10)}`;
      },
      hidden: ({ document }: any) => !document?.showOncePerSession,
    }),

    // Display delay
    defineField({
      name: "enableDisplayDelay",
      title: "Enable popup delay",
      type: "boolean",
      description:
        "When enabled, the modal will appear after a short delay (seconds or minutes) instead of instantly.",
      initialValue: false,
    }),
    defineField({
      name: "displayDelayUnit",
      title: "Delay unit",
      type: "string",
      options: {
        list: [
          { title: "Seconds", value: "seconds" },
          { title: "Minutes", value: "minutes" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      hidden: ({ document }: any) => !document?.enableDisplayDelay,
      initialValue: "seconds",
      description: "Select whether to measure delay in seconds or minutes.",
    }),
    defineField({
      name: "displayDelayValue",
      title: "Delay amount",
      type: "number",
      description:
        "Number of seconds or minutes to wait before showing the modal. Must be greater than 0 when delay is enabled.",
      hidden: ({ document }: any) => !document?.enableDisplayDelay,
      initialValue: 0,
      validation: (Rule) =>
        Rule.min(0)
          .max(3600)
          .custom((v: number | undefined, context: any) => {
            const enabled = context?.document?.enableDisplayDelay;
            if (
              enabled &&
              (typeof v !== "number" || !Number.isFinite(v) || v <= 0)
            ) {
              return "Delay must be greater than 0 when enabled.";
            }
            return true;
          }),
    }),

    // Scheduling
    defineField({
      name: "enableSchedule",
      title: "Enable start/end scheduling",
      type: "boolean",
      description:
        "Turn on to schedule this modal to appear only between specific start and end dates.",
      initialValue: false,
    }),
    defineField({
      name: "startAt",
      title: "Show start (date & time)",
      type: "datetime",
      description:
        "Date and time when the modal should start appearing. Active only if scheduling is enabled.",
      hidden: ({ document }: any) => !document?.enableSchedule,
    }),
    defineField({
      name: "endAt",
      title: "Show end (date & time)",
      type: "datetime",
      description:
        "Date and time when the modal should stop appearing. Must be after the start time.",
      hidden: ({ document }: any) => !document?.enableSchedule,
      validation: (Rule) =>
        Rule.custom((endAt: string | undefined, context: any) => {
          if (!endAt) return true;
          const { document } = context;
          const start = document?.startAt ? new Date(document.startAt) : null;
          const end = new Date(endAt);
          if (!start) return true;
          return end > start
            ? true
            : "End date/time must be after start date/time";
        }),
    }),

    // Priority
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description:
        "Used when multiple modals are eligible for the same page. Higher values take precedence.",
      initialValue: 0,
    }),

    // Content
    defineField({
      name: "discountPercent",
      title: "Discount percent",
      type: "number",
      description:
        "Optional numeric value to show a discount percentage (e.g. 15 = '15% off').",
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "Main title or headline shown on the modal.",
    }),
    defineField({
      name: "subHeading",
      title: "Sub-heading",
      type: "text",
      description:
        "Supporting line or tagline that appears below the main heading.",
    }),

    defineField({
      name: "introText",
      title: "Intro text (above input)",
      type: "text",
      description:
        "Short introductory line above the email input. Example: 'Need time? We're more than happy to spill all the tea'.",
      initialValue: "Need time? We're more than happy to spill all the tea",
    }),

    defineField({
      name: "inputPlaceholder",
      title: "Input placeholder",
      type: "string",
      description:
        "Placeholder text shown inside the email input. Example: 'drop your email'.",
      initialValue: "drop your email",
    }),

    defineField({
      name: "consentText",
      title: "Consent text (main)",
      type: "text",
      description:
        "Main consent text shown below the input. You can include simple HTML (like links). Example: 'By completing this form, you agree to receive our emails.'",
      initialValue:
        "By completing this form, you are signing up to receive our emails and can unsubscribe anytime.",
    }),

    defineField({
      name: "consentSubText",
      title: "Consent subtext (secondary)",
      type: "string",
      description:
        "Optional secondary line shown below the consent text. Example: '(But it won't spam you)'.",
      initialValue: "(But it won't spam you)",
    }),

    defineField({
      name: "ctaText",
      title: "CTA button text",
      type: "string",
      description:
        "Text for the main call-to-action button. Example: 'Keep me posted'.",
      initialValue: "keep me posted",
    }),

    defineField({
      name: "productSpecificMessage",
      title: "Product-specific message",
      type: "text",
      description:
        "Optional message displayed only on product pages, e.g. 'This product will be available soon!'.",
    }),

    // Appearance
    defineField({
      name: "appearance",
      title: "Appearance",
      type: "object",
      description:
        "Customize how the modal looks — choose background color/image and set text and button colors.",
      fields: [
        defineField({
          name: "background",
          title: "Background",
          type: "object",
          description:
            "Set the modal’s background — solid color, image, or transparent.",
          fields: [
            defineField({
              name: "type",
              title: "Type",
              type: "string",
              options: {
                list: [
                  { title: "Color", value: "color" },
                  { title: "Image", value: "image" },
                  { title: "Transparent", value: "transparent" },
                ],
              },
              initialValue: "color",
            }),

            defineField({
              name: "color",
              title: "Background color (CSS)",
              type: "string",
              description: "Pick a background color (e.g. '#F2EDD8').",
              hidden: ({ parent }: any) => parent?.type !== "color",
            }),

            defineField({
              name: "desktopImage",
              title: "Desktop background image",
              type: "image",
              options: { hotspot: true },
              description:
                "Upload an image background for desktop screens. Only used if background type = 'image'.",
              hidden: ({ parent }: any) => parent?.type !== "image",
            }),
            defineField({
              name: "mobileImage",
              title: "Mobile background image",
              type: "image",
              options: { hotspot: true },
              description:
                "Upload a mobile-optimized version of the background image. Only used if background type = 'image'.",
              hidden: ({ parent }: any) => parent?.type !== "image",
            }),

            defineField({
              name: "overlayOpacity",
              title: "Overlay opacity (0-1)",
              type: "number",
              description:
                "Adjust overlay transparency (0 = none, 1 = fully dark). Improves text readability over images.",
              hidden: ({ parent }: any) => parent?.type !== "image",
              validation: (Rule) => Rule.min(0).max(1),
            }),
          ],
        }),

        defineField({
          name: "textColors",
          title: "Text colors",
          type: "object",
          description:
            "Set colors for text, headings, and button elements inside the modal.",
          fields: [
            defineField({
              name: "title",
              type: "string",
              title: "Title color",
            }),
            defineField({
              name: "subHeading",
              type: "string",
              title: "Sub-heading color",
            }),
            defineField({
              name: "body",
              type: "string",
              title: "Body text color",
            }),
            defineField({
              name: "ctaText",
              type: "string",
              title: "CTA text color",
            }),
            defineField({
              name: "ctaBackground",
              type: "string",
              title: "CTA background color",
            }),
          ],
        }),
      ],
    }),
  ],

  preview: {
    select: { title: "modalName", enabled: "enabled" },
    prepare(selection: any) {
      const { title, enabled } = selection;
      return {
        title: title || "Untitled Modal",
        subtitle: enabled ? "Enabled" : "Disabled",
      };
    },
  },
});

export default preOrderModal;
