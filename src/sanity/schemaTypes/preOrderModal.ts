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
    allowOnProductPages: false,
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
    // sensible defaults
    showOncePerSession: true,
  },

  fields: [
    // Identification & targeting
    defineField({
      name: "modalName",
      title: "Modal name (Studio only)",
      type: "string",
      description:
        "Internal name for identifying the modal inside Sanity Studio.",
      validation: (Rule) => Rule.required().max(80),
    }),

    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      description: "Toggle modal visibility on/off.",
      initialValue: true,
    }),

    // Slugs: require at least one targeting method (slugs OR allowOnProductPages)
    defineField({
      name: "slugs",
      title: "Specific page slugs / paths",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Exact paths where this modal should appear (e.g. '/', 'product-listing', 'product/juneof-jacket').",
      validation: (Rule) =>
        Rule.custom((slugs: any, context: any) => {
          const allowOnProductPages = context.document?.allowOnProductPages;
          const hasSlugs = Array.isArray(slugs) && slugs.length > 0;
          if (!allowOnProductPages && !hasSlugs) {
            return 'Either add at least one slug or enable "Allow on product detail pages".';
          }
          return true;
        }),
    }),

    defineField({
      name: "allowOnProductPages",
      title: "Allow on product detail pages",
      type: "boolean",
      description:
        "When ON, the modal will show on product detail pages (e.g., /product/:handle). When OFF, use the 'slugs' field to target pages.",
      initialValue: false,
    }),

    // Content / Copy
    defineField({
      name: "discountPercent",
      title: "Discount percent",
      type: "number",
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "subHeading", title: "Sub-heading", type: "text" }),

    defineField({
      name: "introText",
      title: "Intro text (above input)",
      type: "text",
      description:
        "Small lead-in line above the email input (e.g. 'Need time? We're more than happy to spill all the tea').",
      initialValue: "Need time? We're more than happy to spill all the tea",
    }),

    defineField({
      name: "inputPlaceholder",
      title: "Input placeholder",
      type: "string",
      description:
        "Placeholder text displayed inside the email input (e.g. 'drop your email').",
      initialValue: "drop your email",
    }),

    defineField({
      name: "consentText",
      title: "Consent text (main)",
      type: "text",
      description:
        "Main consent text shown below the input (first line). Use plain text or small HTML if you allow links.",
      initialValue:
        "By completing this form, you are signing up to receive our emails and can unsubscribe anytime.",
    }),

    defineField({
      name: "consentSubText",
      title: "Consent subtext (secondary)",
      type: "string",
      description: "Secondary consent line (e.g. '(But it won't spam you)')",
      initialValue: "(But it won't spam you)",
    }),

    defineField({
      name: "ctaText",
      title: "CTA button text",
      type: "string",
      initialValue: "keep me posted",
    }),

    defineField({
      name: "productSpecificMessage",
      title: "Product-specific message",
      type: "text",
    }),

    // Session behavior controls
    defineField({
      name: "showOncePerSession",
      title: "Show only once per session",
      type: "boolean",
      description:
        "When ON, this modal will only be displayed once per browser session (sessionStorage). Editors can disable this to allow repeated displays.",
      initialValue: true,
    }),

    // Auto-generated session suffix (readOnly)
    defineField({
      name: "showOnceSessionKeySuffix",
      title: "Session key suffix (auto-generated)",
      type: "string",
      readOnly: true,
      description:
        "Unique suffix appended to the sessionStorage key. Automatically generated once on document creation.",
      initialValue: () => {
        // use crypto.randomUUID if available for stable uniqueness
        try {
          if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
          ) {
            // crypto.randomUUID returns like '...'
            return `modal_${crypto.randomUUID()}`;
          }
        } catch {
          /* ignore */
        }
        // fallback short id
        return `modal_${Math.random().toString(36).substring(2, 10)}`;
      },
    }),

    // Appearance
    defineField({
      name: "appearance",
      title: "Appearance",
      type: "object",
      fields: [
        // Background
        defineField({
          name: "background",
          title: "Background",
          type: "object",
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
              hidden: ({ parent }: any) => parent?.type !== "color",
            }),

            defineField({
              name: "desktopImage",
              title: "Desktop background image",
              type: "image",
              options: { hotspot: true },
              hidden: ({ parent }: any) => parent?.type !== "image",
            }),
            defineField({
              name: "mobileImage",
              title: "Mobile background image",
              type: "image",
              options: { hotspot: true },
              hidden: ({ parent }: any) => parent?.type !== "image",
            }),

            defineField({
              name: "overlayOpacity",
              title: "Overlay opacity (0-1)",
              type: "number",
              hidden: ({ parent }: any) => parent?.type !== "image",
              validation: (Rule) => Rule.min(0).max(1),
            }),
          ],
        }),

        defineField({
          name: "textColors",
          title: "Text colors",
          type: "object",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({ name: "subHeading", type: "string" }),
            defineField({ name: "body", type: "string" }),
            defineField({ name: "ctaText", type: "string" }),
            defineField({ name: "ctaBackground", type: "string" }),
          ],
        }),
      ],
    }),

    // Scheduling
    defineField({
      name: "enableSchedule",
      title: "Enable start/end scheduling",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "startAt",
      title: "Show start (date & time)",
      type: "datetime",
      hidden: ({ document }: any) => !document?.enableSchedule,
    }),
    defineField({
      name: "endAt",
      title: "Show end (date & time)",
      type: "datetime",
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

    // Meta
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      initialValue: 0,
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
