import "./globals.css";
import { Providers } from "./providers";
import AuthProvider from "@/components/AuthProvider";
import { Sora } from 'next/font/google';

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap'
});

export const metadata = {
  title: "WayaKart - Buy New & Used Phones in Kano, Yobe, Kaduna, Maiduguri | #1 Electronics Store",
  description: "Northern Nigeria's trusted electronics marketplace. Shop new & second-hand iPhone, Samsung, Tecno, Infinix in Kano (Kantin Kwari), Yobe (Damaturu), Kaduna with 6-month warranty. Hausa/English support.",
  metadataBase: new URL('https://wayakart.com.ng'),
  keywords: [
    "WayaKart Kano",
    "Yobe phones Damaturu",
    "Kaduna used laptops",
    "Farm Centre online",
    "Northern Nigeria phones",
    "Arewa electronics",
    "Hausa phone market",
    "Cheap iPhone Kano",
    "Tecno prices Yobe",
    "Samsung deals Kaduna"
  ],
  openGraph: {
    type: "website",
    url: "https://wayakart.com.ng/#products",
    title: "WayaKart - Northern Nigeria's Electronics Marketplace",
    description: "Best prices on phones & laptops across 19 Northern states",
    siteName: "WayaKart Nigeria",
    images: [
      {
        url: "https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png",
        width: 800,
        height: 600,
        alt: "WayaKart Logo - Your Northern Tech Marketplace"
      }
    ],
  },
  alternates: {
    canonical: "https://wayakart.com.ng/#products",
    languages: {
      'ha': 'https://wayakart.com.ng/ha/#products',
      'en': 'https://wayakart.com.ng/#products'
    }
  }
};

export default async function RootLayout({ children, session }) {
  return (
    <html lang="en-HA" className={`${sora.variable} font-sans`}>
      <head>
        <link rel="icon" href="https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png" />
        <link rel="canonical" href="https://wayakart.com.ng/#products" />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <Providers>
            {children}
          </Providers>
        </AuthProvider>

        {/* Product-focused structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "WayaKart",
              "url": "https://wayakart.com.ng",
              "potentialAction": {
                "@type": "ViewAction",
                "target": "https://wayakart.com.ng/#products",
                "query-input": "required name=product_type"
              }
            })
          }}
        />
        
        {/* Local business markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "WayaKart Electronics",
              "url": "https://wayakart.com.ng/#products",
              "priceRange": "₦10,000 - ₦1,200,000",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kano",
                "addressRegion": "NG-KN",
                "streetAddress": "Block 42, Farm Centre"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Electronics Products",
                "itemListElement": [
                  {
                    "@type": "OfferCatalog",
                    "name": "Smartphones",
                    "url": "https://wayakart.com.ng/#products"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Laptops",
                    "url": "https://wayakart.com.ng/#products"
                  }
                ]
              }
            })
          }}
        />
      </body>
    </html>
  );
}