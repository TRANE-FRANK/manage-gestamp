import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  userFindUniqueMock,
  permitFindUniqueMock,
  permitFindFirstMock,
  permitFindManyMock,
  permitCountMock,
  permitCreateMock,
  permitUpdateMock,
  transactionMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  permitFindUniqueMock: vi.fn(),
  permitFindFirstMock: vi.fn(),
  permitFindManyMock: vi.fn(),
  permitCountMock: vi.fn(),
  permitCreateMock: vi.fn(),
  permitUpdateMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    permit: {
      findUnique: permitFindUniqueMock,
      findFirst: permitFindFirstMock,
      findMany: permitFindManyMock,
      count: permitCountMock,
      create: permitCreateMock,
      update: permitUpdateMock,
    },
    $transaction: transactionMock,
  },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}));

import {
  authorizeExceptionalDepartureAction,
  authorizePermitDepartureAction,
  cancelPermitAction,
  createPermit as createPermitAction,
  renewPermitAction,
  setPermitDepartureAuthorizationAction,
  uploadSignedPermitPdfAction,
} from "@/actions/permit-actions";
import { generatePermitDocumentAction } from "@/actions/permit-document-actions";
import {
  GET as downloadGeneratedPermit,
} from "../app/api/permits/[id]/document/route";
import {
  GET as downloadSignedPermit,
} from "../app/api/permits/[id]/signed-document/route";
import {
  authorizeExceptionalDeparture,
  authorizePermitDeparture,
  cancelPermit,
  createPermit,
  getPermitDetails,
  getPermitByFolio,
  listPermits,
  listPermitsPaginated,
  renewPermit,
  setPermitDepartureAuthorization,
  uploadSignedPermitPdf as uploadSignedPermitPdfService,
} from "@/services/permit/service";
import { generatePermitDocument } from "@/services/permit/document";
import { uploadSignedPermitPdf } from "@/services/permit/upload";

function setSecuritySession() {
  authMock.mockResolvedValue({ user: { id: "64", role: "ADMIN" } });
  userFindUniqueMock.mockResolvedValue({
    id: 64,
    username: "security-reviewer",
    role: "SECURITY",
    isActive: true,
  });
}

function assertNoPermitWrites() {
  expect(permitCreateMock).not.toHaveBeenCalled();
  expect(permitUpdateMock).not.toHaveBeenCalled();
  expect(transactionMock).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null);
  userFindUniqueMock.mockResolvedValue(null);
});

describe("servicios de permisos", () => {
  it("rechaza SECURITY en todas las operaciones administrativas antes de acceder a permisos", async () => {
    setSecuritySession();
    const validDate = new Date("2026-10-01T00:00:00Z");
    const pdf = new File(["pdf"], "signed.pdf", {
      type: "application/pdf",
    });
    const operations = [
      () =>
        createPermit({
          folio: "PERM-1",
          employeeId: 1,
          equipmentId: 2,
          startDate: validDate,
          expirationDate: new Date("2027-10-01T00:00:00Z"),
        }),
      () => renewPermit({ permitId: 1, startDate: validDate, expirationDate: new Date("2027-10-01T00:00:00Z") }),
      () => cancelPermit(1, "captura errónea"),
      () => authorizeExceptionalDeparture(1, "autorización urgente"),
      () => uploadSignedPermitPdfService(1, pdf),
      () => setPermitDepartureAuthorization(1, true),
      () => authorizePermitDeparture(1),
      () => generatePermitDocument(1),
      () => uploadSignedPermitPdf(1, pdf),
    ];

    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }

    assertNoPermitWrites();
    expect(permitFindUniqueMock).not.toHaveBeenCalled();
    expect(permitFindFirstMock).not.toHaveBeenCalled();
  });

  it("restringe también las consultas administrativas a ADMIN e IT", async () => {
    setSecuritySession();
    const reads = [
      () => listPermits(),
      () => getPermitDetails(1),
      () => getPermitByFolio("PERM-1"),
      () => listPermitsPaginated(),
    ];

    for (const read of reads) {
      await expect(read()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }

    expect(permitFindUniqueMock).not.toHaveBeenCalled();
    expect(permitFindManyMock).not.toHaveBeenCalled();
    expect(permitCountMock).not.toHaveBeenCalled();
  });
});

describe("Server Actions administrativas", () => {
  it("devuelven una denegación explícita para SECURITY, nunca éxito", async () => {
    setSecuritySession();

    const permitForm = new FormData();
    permitForm.set("folio", "PERM-1");
    permitForm.set("employeeId", "1");
    permitForm.set("equipmentId", "2");
    permitForm.set("startDate", "2026-10-01");
    permitForm.set("expirationDate", "2027-10-01");

    const renewalForm = new FormData();
    renewalForm.set("startDate", "2026-10-01");
    renewalForm.set("expirationDate", "2027-10-01");

    const exceptionalForm = new FormData();
    exceptionalForm.set("reason", "salida urgente autorizada");

    const uploadForm = new FormData();
    uploadForm.set(
      "file",
      new File(["pdf"], "signed.pdf", { type: "application/pdf" }),
    );

    const results = await Promise.all([
      createPermitAction(permitForm),
      renewPermitAction(1, renewalForm),
      cancelPermitAction(1, "cancelación solicitada"),
      authorizeExceptionalDepartureAction(1, exceptionalForm),
      setPermitDepartureAuthorizationAction(1, true),
      authorizePermitDepartureAction(1),
      uploadSignedPermitPdfAction(1, uploadForm),
      generatePermitDocumentAction(1),
    ]);

    for (const result of results) {
      expect(result).toMatchObject({
        success: false,
        message: "No tienes permisos para administrar permisos de salida.",
      });
    }
    assertNoPermitWrites();
  });
});

describe("descarga de documentos", () => {
  it("responde 403 y no entrega PDFs a SECURITY", async () => {
    setSecuritySession();
    const routeContext = { params: Promise.resolve({ id: "1" }) };

    const generatedResponse = await downloadGeneratedPermit(
      new Request("http://localhost/api/permits/1/document"),
      routeContext,
    );
    const signedResponse = await downloadSignedPermit(
      new Request("http://localhost/api/permits/1/signed-document"),
      routeContext,
    );

    expect(generatedResponse.status).toBe(403);
    expect(signedResponse.status).toBe(403);
    expect(permitFindUniqueMock).not.toHaveBeenCalled();
  });
});
