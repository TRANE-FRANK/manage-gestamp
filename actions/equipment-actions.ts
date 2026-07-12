"use server";

import { prisma } from "@/lib/prisma";
import {
  Company,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createEquipment(formData: FormData) {
  const assetTag = formData.get("assetTag") as string;
  const barcode = formData.get("assetTag") as string;
  const type = formData.get("type") as EquipmentType;
  const inventoryNumber = formData.get("inventoryNumber") as string;
  const serialNumber = formData.get("serialNumber") as string;
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;

  const company = formData.get("company") as Company;
  const status = formData.get("status") as EquipmentStatus;

  await prisma.equipment.create({
    data: {
      assetTag,
      barcode,
      type,
      inventoryNumber: inventoryNumber || null,
      serialNumber: serialNumber || null,
      brand: brand || null,
      model: model || null,
      company,
      status,
    },
  });

  revalidatePath("/equipment");
  redirect("/equipment?created=true");
}
