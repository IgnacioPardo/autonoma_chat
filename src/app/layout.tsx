import "~/styles/globals.css";
import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Autonoma Chat",
  description: "Conversaciones inteligentes con IA avanzada. Chatea, genera imágenes y sube archivos con nuestro asistente AI.",
  keywords: ["AI", "Chat", "GPT", "Inteligencia Artificial", "Asistente Virtual", "Generación de Imágenes"],
  authors: [{ name: "Autonoma" }],
  creator: "Autonoma",
  publisher: "Autonoma",
  icons: [
    { rel: "icon", url: "/favicon.png" },
    { rel: "apple-touch-icon", url: "/favicon_128.png" },
  ],
  openGraph: {
    title: "Autonoma Chat - Asistente AI Inteligente",
    description: "Conversaciones inteligentes con IA avanzada. Chatea, genera imágenes con DALL-E, sube archivos (PDF, CSV, Markdown) y obtén respuestas precisas.",
    url: "https://autonoma-chat.vercel.app",
    siteName: "Autonoma Chat",
    images: [
      {
        url: "https://autonoma-chat.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Autonoma Chat - AI Assistant",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autonoma Chat - Asistente AI Inteligente",
    description: "Conversaciones inteligentes con IA avanzada. Chatea, genera imágenes y sube archivos con nuestro asistente AI.",
    images: ["https://autonoma-chat.vercel.app/og-image.png"],
    creator: "@autonoma",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification-code-here", // Reemplazar con código real si es necesario
  },
  metadataBase: new URL("https://autonoma-chat.vercel.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Autonoma Chat",
    "description": "Conversaciones inteligentes con IA avanzada. Chatea, genera imágenes con DALL-E, sube archivos y obtén respuestas precisas.",
    "url": "https://autonoma-chat.vercel.app",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Autonoma"
    },
    "featureList": [
      "Chat con IA GPT-4",
      "Generación de imágenes con DALL-E",
      "Subida de archivos PDF, CSV, Markdown",
      "Conversaciones por voz",
      "Interfaz multiidioma"
    ]
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`relative flex min-h-screen w-full flex-col items-center justify-center ${geist.variable}`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
