import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";

import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Administración TI Gestamp",
  description: "Sistema de Gestión de Equipos y Permisos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full", "font-sans", geist.variable)}>
      <body className={`${poppins.className} min-h-screen bg-slate-100`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-auto bg-slate-100 p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
        <Toaster
          position="bottom-center"
          closeButton={true}
          richColors={true}
        />
      </body>
    </html>
  );
}
