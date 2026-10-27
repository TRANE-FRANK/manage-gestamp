"use server";

import { prisma } from "@/lib/prisma";
import { Company } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth/authorization";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEmployee(formData: FormData) {
  await requireRole("ADMIN", "IT");

  const sapNumber = formData.get("sapNumber") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const company = formData.get("company") as Company;

  await prisma.employee.create({
    data: {
      sapNumber,
      firstName,
      lastName,
      department,
      position,
      company,
    },
  });

  revalidatePath("/employees");

  redirect("/employees");
}
