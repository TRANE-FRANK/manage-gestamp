import { beforeEach, describe, expect, it, vi } from "vitest";

const { clientState, ClientMock } = vi.hoisted(() => {
  const state = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  const ClientMock = vi.fn(function (this: Record<string, unknown>) {
    this.connect = state.connect;
    this.query = state.query;
    this.end = state.end;
  });
  return { clientState: state, ClientMock };
});

vi.mock("pg", () => ({ Client: ClientMock }));

import { createInitialAdmin } from "../scripts/create-initial-admin.mjs";

function setSuccessfulQueries() {
  clientState.query.mockImplementation(async (sql: string) => {
    if (sql.includes('"role" =')) return { rowCount: 0, rows: [] };
    if (sql.includes('"username" =')) return { rowCount: 0, rows: [] };
    if (sql.includes("to_regclass")) {
      return { rows: [{ audit_table: "AuditEvent" }] };
    }
    if (sql.includes('RETURNING "id"')) {
      return { rows: [{ id: 42 }] };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  clientState.connect.mockResolvedValue(undefined);
  clientState.end.mockResolvedValue(undefined);
  setSuccessfulQueries();
});

describe("auditoría del aprovisionamiento inicial", () => {
  it("registra la creación del ADMIN sin actor ni credenciales en la misma transacción", async () => {
    await createInitialAdmin(
      "first.admin",
      "$argon2id$test-hash",
      "postgresql://example.invalid/manage",
    );

    const auditInsert = clientState.query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO "AuditEvent"'),
    );
    expect(auditInsert).toBeDefined();
    expect(auditInsert?.[1]).toEqual([
      "42",
      JSON.stringify({ username: "first.admin", role: "ADMIN", isActive: true }),
    ]);
    expect(JSON.stringify(auditInsert)).not.toContain("argon2id");
    expect(clientState.query.mock.calls[0][0]).toBe("BEGIN");
    expect(clientState.query.mock.calls.at(-1)?.[0]).toBe("COMMIT");
    expect(clientState.query.mock.calls.some(([sql]) => sql === "ROLLBACK")).toBe(
      false,
    );
  });

  it("se detiene y revierte si la tabla de auditoría aún no existe", async () => {
    clientState.query.mockImplementation(async (sql: string) => {
      if (sql.includes('"role" =') || sql.includes('"username" =')) {
        return { rowCount: 0, rows: [] };
      }
      if (sql.includes("to_regclass")) return { rows: [{ audit_table: null }] };
      return { rows: [] };
    });

    await expect(
      createInitialAdmin(
        "first.admin",
        "$argon2id$test-hash",
        "postgresql://example.invalid/manage",
      ),
    ).rejects.toThrow("Aplica primero las migraciones");

    expect(
      clientState.query.mock.calls.some(([sql]) =>
        sql.includes('INSERT INTO "User"'),
      ),
    ).toBe(false);
    expect(clientState.query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
  });

  it("revierte la creación si falla el evento de auditoría", async () => {
    clientState.query.mockImplementation(async (sql: string) => {
      if (sql.includes('"role" =') || sql.includes('"username" =')) {
        return { rowCount: 0, rows: [] };
      }
      if (sql.includes("to_regclass")) {
        return { rows: [{ audit_table: "AuditEvent" }] };
      }
      if (sql.includes('RETURNING "id"')) return { rows: [{ id: 42 }] };
      if (sql.includes('INSERT INTO "AuditEvent"')) {
        throw new Error("audit insert failed");
      }
      return { rows: [] };
    });

    await expect(
      createInitialAdmin(
        "first.admin",
        "$argon2id$test-hash",
        "postgresql://example.invalid/manage",
      ),
    ).rejects.toThrow("No fue posible crear la cuenta");
    expect(clientState.query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
  });
});
