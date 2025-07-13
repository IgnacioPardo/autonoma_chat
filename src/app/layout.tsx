import "~/styles/globals.css";
import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Autonoma Chat",
  description: "Autonoma LLM Chat Interface - Take Home",
  icons: [{ rel: "icon", url: "/favicon.png" }],
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`min-h-screen w-full flex flex-col items-center justify-center relative ${geist.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
