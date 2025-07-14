import Head from "next/head";

interface SEOMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export default function SEOMeta({
  title = "Autonoma Chat - Asistente AI Inteligente",
  description = "Conversaciones inteligentes con IA avanzada. Chatea, genera imágenes con DALL-E, sube archivos y obtén respuestas precisas.",
  image = "/og-image.png",
  url = "https://autonoma-chat.vercel.app",
  type = "website",
}: SEOMetaProps) {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="AI,Chat,GPT,Inteligencia Artificial,Asistente Virtual,Generación de Imágenes,DALL-E" />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Autonoma Chat" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#6366f1" />
      <meta name="msapplication-TileColor" content="#6366f1" />
      <meta name="robots" content="index,follow" />
      <meta name="author" content="Autonoma" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </Head>
  );
}
