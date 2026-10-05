/**
 * Authoritative Site & Business Information Configuration
 *
 * All public SEO, metadata, canonical URLs, and structured data derive
 * from this verified source of truth.
 *
 * Critical Rule: ZERO fabricated information. All location and contact details
 * are verified against real store records and official Google Maps listing.
 */

export const siteConfig = {
  name: "Kangayath",
  legalName: "Kangayath Clothing & Textiles",
  alternateNames: ["K G Garments", "Kangayath Textiles", "Kangayath"],
  tagline: "Clothing & Textiles Digital Showroom in Kerala",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.site",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.kangayath.site",
  description:
    "Kangayath is a physical clothing and textiles retail store and digital showroom in Kalkandi, Palakkad, Kerala. Discover authentic Kerala handlooms, festive sarees, dhotis, wedding silks, and everyday apparel before visiting our showroom.",
  location: {
    streetAddress: "Main Anaikatti Road",
    locality: "Kalkandi",
    district: "Palakkad",
    state: "Kerala",
    postalCode: "678582",
    country: "IN",
    latitude: 11.0633752,
    longitude: 76.5567138,
    googleMapsUrl:
      "https://www.google.com/maps/place/K+G+GARMENTS/@11.0633752,76.5541389,857m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3ba887c92634822f:0x95b49b8fadd6d879!8m2!3d11.0633752!4d76.5567138!16s%2Fg%2F11sd9j885v",
  },
  contact: {
    phone: "+91 9947923223",
    phoneClean: "919947923223",
    phoneFormatted: "+91 99479 23223",
    whatsapp: "919947923223",
  },
  openingHours: [
    {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:30",
      closes: "20:30",
    },
    {
      dayOfWeek: ["Saturday"],
      opens: "09:30",
      closes: "20:00",
    },
  ],
  amenities: [
    "Fitting Rooms for trying garments",
    "Customer Parking",
    "UPI, Credit/Debit Cards, and Cash Accepted",
  ],
};
