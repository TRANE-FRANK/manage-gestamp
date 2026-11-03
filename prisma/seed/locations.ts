import type { PrismaClient } from "../../generated/prisma/client";
import { Company } from "../../generated/prisma/client";

type LocationNode = {
  name: string;
  children?: LocationNode[];
};

const locationTree: LocationNode = {
  name: "Gestamp Puebla II",
  children: [
    {
      name: "Producción",
      children: [
        {
          name: "Ensambles",
          children: [
            { name: "Celda 13" },
            { name: "Celda 14" },
          ],
        },
        { name: "Corte Láser" },
        { name: "Prensas" },
      ],
    },
    {
      name: "Oficinas",
      children: [
        { name: "Planta Baja" },
        { name: "Planta Alta" },
      ],
    },
    {
      name: "Almacenes",
      children: [
        { name: "Bodega de Sistemas" },
        { name: "Almacén MRO" },
      ],
    },
  ],
};

async function createLocationTree(
  prisma: PrismaClient,
  node: LocationNode,
  parentId: number | null = null,
): Promise<void> {
  const existing = await prisma.location.findFirst({
    where: {
      name: node.name,
      company: Company.GP2,
      parentId,
    },
    select: {
      id: true,
    },
  });

  const location = existing
    ? await prisma.location.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
    : await prisma.location.create({
        data: {
          name: node.name,
          company: Company.GP2,
          parentId,
          isActive: true,
        },
      });

  console.log(`Ubicación procesada: ${node.name}`);

  for (const child of node.children ?? []) {
    await createLocationTree(prisma, child, location.id);
  }
}

export async function seedLocations(
  prisma: PrismaClient,
): Promise<void> {
  console.log("\nIniciando seed de ubicaciones...");

  await createLocationTree(prisma, locationTree);

  const total = await prisma.location.count({
    where: {
      company: Company.GP2,
    },
  });

  console.log(`Ubicaciones GP2 registradas: ${total}`);
}
