"use server"
import { revalidatePath } from "next/cache"
import { returnAssignment } from "@/services/assignment"

export async function returnAssignmentAction(assignmentId: number) {
  await returnAssignment(assignmentId)

  revalidatePath("/assignments")
}
