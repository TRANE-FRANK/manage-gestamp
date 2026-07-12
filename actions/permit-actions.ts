"use server";

import { prisma } from "@/lib/prisma";
import { PermitStatus } from "@/generated/prisma/enums";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPermit(formData: FormData) {
  const folio = formData.get("folio") as string;
  const employeeId = Number(formData.get("employeeId"));
  const equipmentId = Number(formData.get("equipmentId"));
  const startDate = formData.get("startDate") as string;
  const expirationDate = formData.get("expirationDate") as string;

  const activePermit = await prisma.permit.findFirst({
    where: {
      equipmentId,
      status: PermitStatus.ACTIVE,
    },
  });

  if (activePermit) {
    throw new Error("Este equipo ya cuenta con un permiso activo.");
  }

  await prisma.permit.create({
    data: {
      folio,
      employeeId,
      equipmentId,
      startDate: new Date(startDate),
      expirationDate: new Date(expirationDate),
      status: PermitStatus.ACTIVE,
    },
  });

  revalidatePath("/permits");
  redirect("/permits");
}
