import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";

import "./globals.css";

import AppShell from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { isUserRole } from "@/lib/auth/page-policy";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = isUserRole(session?.user?.role) ? session.user.role : null;

  return (
    <html lang="es" className={cn("h-full", "font-sans", geist.variable)}>
      <body className={`${poppins.className} h-dvh overflow-hidden bg-slate-100`}>
        <AppShell role={role}>{children}</AppShell>
        <Toaster
          position="bottom-center"
          closeButton={true}
          richColors={true}
        />
      </body>
    </html>
  );
}
