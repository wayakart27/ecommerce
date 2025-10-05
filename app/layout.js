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
  title: {
    default: "PureLuxury - Buy New & Used Phones, Laptops Across Nigeria | Premium Electronics",
    template: "%s | PureLuxury Nigeria"
  },
  description: "Nigeria's trusted electronics marketplace. Shop new & second-hand iPhones, Samsung, Tecno, laptops nationwide. Premium quality with warranty. Free delivery across all states.",
  metadataBase: new URL('https://pureluxury.com.ng'),
  keywords: [
    "buy phones Nigeria",
    "used laptops Lagos",
    "second-hand electronics Abuja",
    "iPhone deals Nigeria",
    "Samsung phones Nigeria",
    "Tecno phones prices",
    "MacBook Nigeria",
    "gaming laptops Nigeria",
    "phone accessories Lagos",
    "electronics marketplace Nigeria",
    "affordable phones Nigeria",
    "premium laptops Abuja",
    "smartphones Nigeria",
    "tablets Nigeria",
    "electronics warranty Nigeria",
    "free delivery Nigeria"
  ],
  authors: [
    {
      name: "PureLuxury Nigeria",
      url: "https://pureluxury.com.ng",
    }
  ],
  creator: "PureLuxury Nigeria",
  publisher: "PureLuxury Nigeria",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://pureluxury.com.ng",
    siteName: "PureLuxury Nigeria",
    title: "PureLuxury - Nigeria's Premium Electronics Marketplace",
    description: "Best prices on new & used phones, laptops and electronics across all Nigerian states. Free delivery nationwide.",
    images: [
      {
        url: "https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png",
        width: 1200,
        height: 630,
        alt: "PureLuxury - Nigeria's Premium Electronics Marketplace for Phones, Laptops and Gadgets",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PureLuxury - Nigeria's Premium Electronics Marketplace",
    description: "Shop new & used phones, laptops across Nigeria. Best prices, warranty & free delivery.",
    creator: "@pureluxurycommunication",
    images: ["https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png"],
  },
  alternates: {
    canonical: "https://pureluxury.com.ng",
    languages: {
      'en': 'https://pureluxury.com.ng'
    }
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "electronics",
};

export default async function RootLayout({ children, session }) {
  return (
    <html lang="en" className={`${sora.variable} font-sans`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Additional Open Graph meta for better compatibility */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        
        {/* Twitter additional meta */}
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="630" />
        
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png"
          as="image"
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <Providers>
            {children}
          </Providers>
        </AuthProvider>

        {/* Comprehensive structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://pureluxury.com.ng/#contact",
                  "url": "https://pureluxury.com.ng",
                  "name": "PureLuxury Nigeria",
                  "description": "Nigeria's trusted electronics marketplace for phones, laptops and gadgets",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://pureluxury.com.ng/#products"
                    },
                    "query-input": "required name=search_term_string"
                  },
                  "inLanguage": "en-NG"
                },
                {
                  "@type": "Organization",
                  "@id": "https://pureluxury.com.ng/",
                  "name": "PureLuxury Nigeria",
                  "url": "https://pureluxury.com.ng",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://res.cloudinary.com/djr7uqara/image/upload/w_800,h_600,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png",
                    "width": 800,
                    "height": 600
                  },
                  "image": "https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png",
                  "description": "Nigeria's premium electronics marketplace",
                  "sameAs": [
                    "https://www.facebook.com/pureluxurycommunication",
                  ],
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "NG",
                    "addressLocality": "Damaturu",
                    "addressRegion": "Yobe",
                    "streetAddress": "Chilla Plaza Shop No. 8, Along Gujba Road"
                  },
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+2348160126157",
                    "contactType": "customer service",
                    "areaServed": "NG",
                    "availableLanguage": ["en"]
                  }
                },
                {
                  "@type": "Store",
                  "@id": "https://pureluxury.com.ng/#store",
                  "name": "PureLuxury Electronics Store",
                  "url": "https://pureluxury.com.ng",
                  "description": "Premium electronics store in Nigeria offering phones, laptops, and gadgets",
                  "priceRange": "₦10,000 - ₦2,500,000",
                  "currenciesAccepted": "NGN",
                  "paymentAccepted": "Cash, Credit Card, Bank Transfer",
                  "openingHours": "Mo-Su 08:00-20:00",
                  "telephone": "+2348160126157",
                  "image": "https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Chilla Plaza Shop No. 8, Along Gujba Road",
                    "addressLocality": "Damaturu",
                    "addressRegion": "Yobe",
                    "postalCode": "620211",
                    "addressCountry": "NG"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 11.746,
                    "longitude": 11.960
                  },
                  "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Electronics Products",
                    "itemListElement": [
                      {
                        "@type": "OfferCatalog",
                        "name": "Smartphones",
                        "description": "New and used smartphones from Apple, Samsung, Tecno, Infinix and more",
                        "url": "https://pureluxury.com.ng/#products"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Laptops & Computers",
                        "description": "Laptops, desktops, and computer accessories from Apple, HP, Dell, Lenovo",
                        "url": "https://pureluxury.com.ng/#products"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Tablets",
                        "description": "iPad and Android tablets for work and entertainment",
                        "url": "https://pureluxury.com.ng/#products"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Accessories",
                        "description": "Phone cases, chargers, headphones, and other electronics accessories",
                        "url": "https://pureluxury.com.ng/#products"
                      }
                    ]
                  }
                }
              ]
            })
          }}
        />
        
        {/* Local business structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "PureLuxury Electronics",
              "image": "https://res.cloudinary.com/djr7uqara/image/upload/w_1200,h_630,c_fill/v1757276957/x5jwhjxsbak613duhbn3.png",
              "@id": "https://pureluxury.com.ng",
              "url": "https://pureluxury.com.ng",
              "telephone": "+2348160126157",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Chilla Plaza Shop No. 8, Along Gujba Road",
                "addressLocality": "Damaturu",
                "addressRegion": "Yobe",
                "postalCode": "620211",
                "addressCountry": "NG"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 11.746,
                "longitude": 11.960
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "08:00",
                "closes": "20:00"
              },
              "sameAs": [
                "https://www.facebook.com/pureluxurycommunication",
              ]
            })
          }}
        />
        
        {/* Breadcrumb structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://pureluxury.com.ng"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Products",
                  "item": "https://pureluxury.com.ng/#products"
                }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}