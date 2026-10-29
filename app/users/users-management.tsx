"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  changeUserPasswordAction,
  createUserAction,
  setUserActiveAction,
  updateUserProfileAction,
  type UserManagementActionState,
} from "@/actions/user-actions";
import type { ManagedUser } from "@/services/user";

const initialState: UserManagementActionState = {};
const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const labelClass = "block text-sm font-medium text-slate-700";
const buttonClass =
  "rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";

function ActionMessage({ state }: { state: UserManagementActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.success ? "status" : "alert"}
      className={
        state.success
          ? "mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          : "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      }
    >
      {state.message}
    </p>
  );
}

function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <details id="crear-usuario" open className="mb-6 rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-blue-800 marker:hidden">
        Crear cuenta de usuario
      </summary>
      <form
        ref={formRef}
        action={formAction}
        className="grid grid-cols-1 gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <label className={labelClass}>
          Nombre de usuario
          <input
            className={inputClass}
            name="username"
            autoComplete="off"
            minLength={3}
            maxLength={64}
            pattern="[A-Za-z0-9._-]+"
            required
          />
        </label>
        <label className={labelClass}>
          Nombre
          <input className={inputClass} name="firstName" maxLength={100} required />
        </label>
        <label className={labelClass}>
          Apellido
          <input className={inputClass} name="lastName" maxLength={100} />
        </label>
        <label className={labelClass}>
          Contraseña
          <input
            className={inputClass}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <label className={labelClass}>
          Rol
          <select className={inputClass} name="role" defaultValue="IT" required>
            <option value="ADMIN">ADMIN</option>
            <option value="IT">IT</option>
            <option value="SECURITY">SECURITY</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className={buttonClass} type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-3">
          La contraseña debe tener entre 12 y 128 caracteres. No se puede consultar después de guardarla.
        </p>
        <div className="sm:col-span-2 xl:col-span-3">
          <ActionMessage state={state} />
        </div>
      </form>
    </details>
  );
}

function UserRowActions({ user }: { user: ManagedUser }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateUserProfileAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changeUserPasswordAction,
    initialState,
  );
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (profileState.success) router.refresh();
  }, [profileState, router]);

  useEffect(() => {
    if (passwordState.success) {
      passwordFormRef.current?.reset();
      router.refresh();
    }
  }, [passwordState, router]);

  function toggleActive() {
    const nextActive = !user.isActive;
    if (
      !nextActive &&
      !window.confirm(
        '¿Desactivar la cuenta "' +
          user.username +
          '"? El usuario conservará sus datos e historial, pero ya no podrá iniciar sesión.',
      )
    ) {
      return;
    }

    setStatusMessage("");
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, nextActive);
      setStatusMessage(result.message ?? "");
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="flex min-w-40 flex-col gap-2">
      <button
        type="button"
        onClick={toggleActive}
        disabled={pending}
        className={
          user.isActive
            ? "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
            : "rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
        }
      >
        {pending ? "Guardando…" : user.isActive ? "Desactivar" : "Activar"}
      </button>

      <details className="rounded-lg border border-slate-200">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
          Editar cuenta
        </summary>
        <div className="space-y-4 border-t border-slate-200 p-3">
          <form action={profileAction} className="space-y-3">
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-xs font-semibold text-slate-600">@{user.username}</p>
            <label className={labelClass}>
              Nombre
              <input
                className={inputClass}
                name="firstName"
                defaultValue={user.firstName ?? ""}
                maxLength={100}
                required
              />
            </label>
            <label className={labelClass}>
              Apellido
              <input
                className={inputClass}
                name="lastName"
                defaultValue={user.lastName ?? ""}
                maxLength={100}
              />
            </label>
            <label className={labelClass}>
              Rol
              <select className={inputClass} name="role" defaultValue={user.role}>
                <option value="ADMIN">ADMIN</option>
                <option value="IT">IT</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </label>
            <button className={buttonClass} type="submit" disabled={profilePending}>
              {profilePending ? "Guardando…" : "Guardar cambios"}
            </button>
            <ActionMessage state={profileState} />
          </form>

          <form
            ref={passwordFormRef}
            action={passwordAction}
            className="space-y-3 border-t border-slate-200 pt-4"
          >
            <input type="hidden" name="userId" value={user.id} />
            <p className="text-sm font-semibold text-slate-800">Cambiar contraseña</p>
            <label className={labelClass}>
              Nueva contraseña
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <label className={labelClass}>
              Confirmar contraseña
              <input
                className={inputClass}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <button className={buttonClass} type="submit" disabled={passwordPending}>
              {passwordPending ? "Cambiando…" : "Cambiar contraseña"}
            </button>
            <ActionMessage state={passwordState} />
          </form>
        </div>
      </details>
      {statusMessage ? (
        <p
          role={statusMessage.includes("correctamente") ? "status" : "alert"}
          className="text-xs text-slate-600"
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

function formatCreatedAt(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(date));
}

export default function UsersManagement({ users }: { users: ManagedUser[] }) {
  return (
    <div>
      <CreateUserForm />
      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <p className="font-medium text-slate-700">No hay usuarios para mostrar.</p>
          <p className="mt-1 text-sm text-slate-500">
            Ajusta la búsqueda o crea una cuenta nueva.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[850px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre completo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
                    @{user.username}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={
                        user.isActive
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                          : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {formatCreatedAt(user.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <UserRowActions user={user} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
