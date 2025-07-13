"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Providers } from "~/components/providers";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {/* Fondo fijo, fuera del área animada */}
      <div className="fixed inset-0 z-0 scale-110 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat blur-sm"></div>
      {/* Contenido principal animado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={typeof window !== "undefined" ? window.location.pathname : ""}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="relative z-10 flex w-full flex-col items-center justify-center"
        >
          <Providers>
            {/* Aquí podrías renderizar el sidebar si lo necesitas, usando sidebarOpen y handleCloseSidebar */}
            {children}
          </Providers>
        </motion.div>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 8000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
