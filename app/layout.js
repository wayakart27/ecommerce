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
  title: "PureLuxury - Buy New & Used Phones, Laptops Across Nigeria | Premium Electronics",
  description: "Nigeria's trusted electronics marketplace. Shop new & second-hand iPhones, Samsung, Tecno, laptops nationwide. Premium quality with warranty.",
  metadataBase: new URL('https://pureluxury.com.ng'),
  keywords: [
    "PureLuxury Nigeria",
    "Lagos phones",
    "Abuja used laptops",
    "Port Harcourt electronics",
    "Kano phones Kantin Kwari",
    "Yobe phones Damaturu",
    "Borno phones Maiduguri",
    "Kaduna used laptops",
    "Nigeria phones marketplace",
    "Premium electronics Nigeria",
    "New phones Nigeria",
    "Second-hand laptops Nigeria",
    "iPhone deals Lagos",
    "Samsung prices Abuja",
    "Tecno phones Kano",
    "MacBook Nigeria",
    "Northern Nigeria electronics",
    "Southern Nigeria phones"
  ],
  openGraph: {
    type: "website",
    url: "https://pureluxury.com.ng",
    title: "PureLuxury - Nigeria's Premium Electronics Marketplace",
    description: "Best prices on new & used phones, laptops and electronics across all Nigerian states",
    siteName: "PureLuxury Nigeria",
    images: [
      {
        url: "https://res.cloudinary.com/djr7uqara/image/upload/v1757276957/x5jwhjxsbak613duhbn3.png",
        width: 800,
        height: 600,
        alt: "PureLuxury Logo - Nigeria's Premium Electronics Marketplace"
      }
    ],
  },
  alternates: {
    canonical: "https://pureluxury.com.ng",
    languages: {
      'en': 'https://pureluxury.com.ng'
    }
  }
};

export default async function RootLayout({ children, session }) {
  return (
    <html lang="en" className={`${sora.variable} font-sans`}>
      <head>
        <link rel="icon" href="https://res.cloudinary.com/your-cloud-name/image/upload/your-favicon.png" />
        <link rel="canonical" href="https://pureluxury.com.ng" />
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
              "name": "PureLuxury",
              "url": "https://pureluxury.com.ng",
              "potentialAction": {
                "@type": "ViewAction",
                "target": "https://pureluxury.com.ng/#products",
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
              "name": "PureLuxury Electronics",
              "url": "https://pureluxury.com.ng",
              "priceRange": "₦10,000 - ₦2,500,000",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG",
                "addressLocality": "Damaturu",
                "addressRegion": "NG-YO",
                "streetAddress": "Chilla Plaza Shop No. 8, Along Gujba Road"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Electronics Products",
                "itemListElement": [
                  {
                    "@type": "OfferCatalog",
                    "name": "Smartphones",
                    "url": "https://pureluxury.com.ng/#products"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Laptops & Computers",
                    "url": "https://pureluxury.com.ng/#products"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Tablets",
                    "url": "https://pureluxury.com.ng/#products"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Accessories",
                    "url": "https://pureluxury.com.ng/#products"
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