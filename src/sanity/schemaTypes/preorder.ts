import { defineType, defineField } from "sanity";
import { EnvelopeIcon } from "@sanity/icons";

export const preorder = defineType({
  name: "preorder",
  title: "Pre-order Signup",
  type: "document",
  icon: EnvelopeIcon,

  fields: [
    // 1️⃣ Basic Info
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
      name: "productId",
      title: "Product ID",
      type: "string",
    }),

    defineField({
      name: "productTitle",
      title: "Product Title",
      type: "string",
    }),

    defineField({
      name: "productHandle",
      title: "Product Handle",
      type: "string",
    }),

    // 2️⃣ Modal and Context
    defineField({
      name: "url",
      title: "Opened On URL",
      type: "url",
      description: "The page URL where the modal was opened.",
    }),

    defineField({
      name: "modalDetails",
      title: "Modal Details Snapshot",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "heading",
          title: "Heading",
          type: "string",
        }),
        defineField({
          name: "ctaText",
          title: "CTA Text",
          type: "string",
        }),
        defineField({
          name: "discountPercent",
          title: "Discount (%)",
          type: "number",
        }),
        defineField({
          name: "appearance",
          title: "Appearance",
          type: "object",
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({
              name: "background",
              title: "Background",
              type: "object",
              fields: [
                defineField({
                  name: "color",
                  title: "Background Color",
                  type: "string",
                }),
                defineField({
                  name: "desktopImage",
                  title: "Desktop Image",
                  type: "image",
                }),
                defineField({
                  name: "mobileImage",
                  title: "Mobile Image",
                  type: "image",
                }),
                defineField({
                  name: "overlayOpacity",
                  title: "Overlay Opacity",
                  type: "number",
                  description: "Value between 0 and 1",
                }),
              ],
            }),
            defineField({
              name: "textColors",
              title: "Text Colors",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title Color",
                  type: "string",
                }),
                defineField({
                  name: "body",
                  title: "Body Color",
                  type: "string",
                }),
                defineField({
                  name: "ctaBackground",
                  title: "CTA Background",
                  type: "string",
                }),
                defineField({
                  name: "ctaText",
                  title: "CTA Text",
                  type: "string",
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // 3️⃣ Meta
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: "email",
      subtitle: "productTitle",
      url: "url",
    },
    prepare({ title, subtitle, url }) {
      return {
        title: title || "No Email",
        subtitle: subtitle
          ? `${subtitle} • ${url ? new URL(url).hostname : "No URL"}`
          : url || "No product info",
      };
    },
  },
});
