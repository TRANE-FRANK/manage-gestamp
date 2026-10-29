import Link from "next/link";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import { requirePageRole } from "@/lib/auth/page-guard";
import { listUsers } from "@/services/user";

import UsersManagement from "./users-management";

type SearchParams = {
  page?: string | string[];
  search?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePageRole("ADMIN");
  const params = await searchParams;
  const search = firstValue(params.search)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const result = await listUsers({ page, search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración de usuarios"
        actions={
          <Link
            href="#crear-usuario"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Crear usuario
          </Link>
        }
      />

      <Card>
        <form
          action="/users"
          method="get"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row"
        >
          <label htmlFor="users-search" className="sr-only">
            Buscar por usuario, nombre o apellido
          </label>
          <input
            id="users-search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Buscar por usuario, nombre o apellido"
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800"
            >
              Buscar
            </button>
            <Link
              href="/users"
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Limpiar
            </Link>
          </div>
        </form>

        <p className="mb-3 text-sm text-slate-500">
          {result.total} usuario{result.total !== 1 ? "s" : ""} encontrado
          {result.total !== 1 ? "s" : ""}
        </p>

        <UsersManagement users={result.data} />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          search={search}
        />
      </Card>
    </div>
  );
}
