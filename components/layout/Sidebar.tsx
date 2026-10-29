"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Laptop,
  ClipboardCheck,
  FileCheck,
  Wrench,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import type { UserRole } from "@/generated/prisma/client";

export default function Sidebar({ role }: { role: UserRole | null }) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  function navClass(path: string) {
    const active = pathname === path;

    return `
      flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
      ${
        active
          ? "bg-blue-700 text-white shadow-lg"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }
      ${collapsed ? "justify-center" : ""}
    `;
  }

  return (
    <aside
      className={`flex h-dvh flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-6">
        {!collapsed ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight">
              Administración TI
            </h1>

            <p className="mt-1 text-sm text-slate-400">Gestamp México</p>
          </>
        ) : (
          <div className="text-center text-2xl font-bold">IT</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 transition hover:bg-slate-800"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {/* Dashboard */}
        <div className="mb-8">
          <Link href="/" className={navClass("/")}>
            <LayoutDashboard size={20} />

            {!collapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Gestión */}
        <div className="mb-8">
          {!collapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gestión
            </p>
          )}

          <div className="space-y-1">
            <Link href="/employees" className={navClass("/employees")}>
              <Users size={20} />

              {!collapsed && <span>Empleados</span>}
            </Link>

            <Link href="/equipment" className={navClass("/equipment")}>
              <Laptop size={20} />

              {!collapsed && <span>Equipos</span>}
            </Link>

            <Link href="/assignments" className={navClass("/assignments")}>
              <ClipboardCheck size={20} />

              {!collapsed && <span>Asignaciones</span>}
            </Link>
          </div>
        </div>

        {/* Operación */}
        <div className="mb-8">
          {!collapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Operación
            </p>
          )}

          <div className="space-y-1">
            <Link href="/permits" className={navClass("/permits")}>
              <FileCheck size={20} />

              {!collapsed && <span>Permisos</span>}
            </Link>

            <Link href="/maintenance" className={navClass("/maintenance")}>
              <Wrench size={20} />

              {!collapsed && <span>Mantenimientos</span>}
            </Link>
            {role === "ADMIN" ? (
              <Link href="/users" className={navClass("/users")}>
                <Users size={20} />
                {!collapsed && <span>Usuarios</span>}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Seguridad */}
        <div>
          {!collapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Seguridad
            </p>
          )}

          <div className="space-y-1">
            <Link href="/security" className={navClass("/security")}>
              <Shield size={20} />

              {!collapsed && <span>Vigilancia</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </form>
        {!collapsed && (
          <div className="mt-3 px-2">
            <p className="text-xs font-medium text-slate-400">
              Administración TI Gestamp
            </p>
            <p className="mt-1 text-xs text-slate-500">Versión 1.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
