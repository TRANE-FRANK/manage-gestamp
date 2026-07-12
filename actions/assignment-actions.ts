"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAssignment } from "@/services/assignment";

export async function createAssignmentAction(formData: FormData) {
  const employeeId = Number(formData.get("employeeId"));
  const equipmentId = Number(formData.get("equipmentId"));

  await createAssignment({
    employeeId,
    equipmentId,
  });

  revalidatePath("/assignments");

  redirect("/assignments");
}
