"use server";

import { prisma } from "@/lib/prisma";
import { Company } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth/authorization";
import { writeAuditEvent } from "@/services/audit/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEmployee(formData: FormData) {
  const actor = await requireRole("ADMIN", "IT");

  const sapNumber = formData.get("sapNumber") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const company = formData.get("company") as Company;

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        sapNumber,
        firstName,
        lastName,
        department,
        position,
        company,
      },
      select: {
        id: true,
        sapNumber: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        company: true,
      },
    });

    await writeAuditEvent(tx, {
      actor,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: String(employee.id),
      outcome: "SUCCESS",
      source: "employees.create",
      after: {
        sapNumber: employee.sapNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        position: employee.position,
        company: employee.company,
      },
    });
  });

  revalidatePath("/employees");

  redirect("/employees");
}
