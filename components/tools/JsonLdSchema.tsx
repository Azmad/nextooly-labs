import React from "react";

type JsonLdProps = {
  name: string;
  description: string;
  url: string;
  image?: string;
};

export default function JsonLdSchema({ name, description, url, image }: JsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    ...(image && { "image": image }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}