import { siteConfig } from "./site-config";
import type { PublicProductDetail, StoreProfile } from "@/types/api";

/**
 * Builds Schema.org ClothingStore (LocalBusiness subtype) structured data.
 * Adheres strictly to the Zero Fake Data policy: only verified facts are published.
 */
export function buildClothingStoreSchema(profile?: StoreProfile | null) {
  const storeName = profile?.name || siteConfig.name;
  const streetAddress = profile?.address_line1 || siteConfig.location.streetAddress;
  const locality = profile?.locality || siteConfig.location.locality;
  const district = profile?.district || siteConfig.location.district;
  const state = profile?.state || siteConfig.location.state;
  const postalCode = profile?.pincode || siteConfig.location.postalCode;
  const phone = profile?.phone_primary || profile?.primary_phone || siteConfig.contact.phone;
  const mapsUrl = profile?.google_maps_url || siteConfig.location.googleMapsUrl;

  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${siteConfig.url}/#clothingstore`,
    name: storeName,
    legalName: siteConfig.legalName,
    alternateName: siteConfig.alternateNames,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    image: `${siteConfig.url}/brand/logo.png`,
    telephone: phone,
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI",
    address: {
      "@type": "PostalAddress",
      streetAddress: streetAddress,
      addressLocality: locality,
      addressRegion: state,
      postalCode: postalCode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.location.latitude,
      longitude: siteConfig.location.longitude,
    },
    hasMap: mapsUrl,
    openingHoursSpecification: siteConfig.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: locality,
      },
      {
        "@type": "AdministrativeArea",
        name: district,
      },
      {
        "@type": "State",
        name: "Kerala",
      },
    ],
  };
}

/**
 * Builds Schema.org Product structured data adhering strictly to the Zero-Price Guarantee.
 */
export function buildProductSchema(product: PublicProductDetail) {
  const productImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : [`${siteConfig.url}/brand/logo.png`];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteConfig.url}/products/${product.slug}#product`,
    name: product.name,
    description: product.description || `${product.name} at Kangayath digital showroom`,
    image: productImages,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    url: `${siteConfig.url}/products/${product.slug}`,
  };

  if (product.style_code) {
    schema.sku = product.style_code;
  }
  if (product.material) {
    schema.material = product.material;
  }
  if (product.category_name) {
    schema.category = product.category_name;
  }

  // Only include offer if a valid non-zero public price exists
  if (product.price !== null && product.price !== undefined && Number(product.price) > 0) {
    schema.offers = {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "INR",
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "ClothingStore",
        name: siteConfig.name,
      },
    };
  }

  return schema;
}

/**
 * Builds Schema.org BreadcrumbList structured data with canonical absolute URLs.
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
