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

    //  Modal and Context
    defineField({
      name: "url",
      title: "Opened On URL",
      type: "url",
      description: "The page URL where the modal was opened.",
    }),

    // 2️⃣ Meta
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
