"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    router.push(`/permits?search=${encodeURIComponent(search)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar folio, usuario o equipo..."
        className="rounded border px-3 py-2"
      />

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Buscar
      </button>
    </form>
  );
}
