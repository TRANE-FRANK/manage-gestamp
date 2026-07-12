"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
    >
      Imprimir
    </button>
  );
}
