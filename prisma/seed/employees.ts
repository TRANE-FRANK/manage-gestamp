import type { PrismaClient } from "../../generated/prisma/client";
import { Company } from "../../generated/prisma/client";

const testEmployees = [
  { sapNumber: "TEST-GP2-001", firstName: "Empleado", lastName: "Prueba 001", department: "Calidad", position: "Inspector de Calidad" },
  { sapNumber: "TEST-GP2-002", firstName: "Empleado", lastName: "Prueba 002", department: "Calidad", position: "Analista de Calidad" },

  { sapNumber: "TEST-GP2-003", firstName: "Empleado", lastName: "Prueba 003", department: "Compras", position: "Analista de Compras" },

  { sapNumber: "TEST-GP2-004", firstName: "Empleado", lastName: "Prueba 004", department: "Dirección", position: "Auxiliar Administrativo" },

  { sapNumber: "TEST-GP2-005", firstName: "Empleado", lastName: "Prueba 005", department: "Finanzas", position: "Analista Financiero" },

  { sapNumber: "TEST-GP2-006", firstName: "Empleado", lastName: "Prueba 006", department: "Ingeniería", position: "Ingeniero de Procesos" },
  { sapNumber: "TEST-GP2-007", firstName: "Empleado", lastName: "Prueba 007", department: "Ingeniería", position: "Ingeniero Industrial" },

  { sapNumber: "TEST-GP2-008", firstName: "Empleado", lastName: "Prueba 008", department: "Logística", position: "Coordinador de Logística" },
  { sapNumber: "TEST-GP2-009", firstName: "Empleado", lastName: "Prueba 009", department: "Logística", position: "Auxiliar de Almacén" },

  { sapNumber: "TEST-GP2-010", firstName: "Empleado", lastName: "Prueba 010", department: "Mantenimiento", position: "Técnico de Mantenimiento" },
  { sapNumber: "TEST-GP2-011", firstName: "Empleado", lastName: "Prueba 011", department: "Mantenimiento", position: "Supervisor de Mantenimiento" },

  { sapNumber: "TEST-GP2-012", firstName: "Empleado", lastName: "Prueba 012", department: "Matricería", position: "Técnico Matricero" },

  { sapNumber: "TEST-GP2-013", firstName: "Empleado", lastName: "Prueba 013", department: "Producción", position: "Operador de Producción" },
  { sapNumber: "TEST-GP2-014", firstName: "Empleado", lastName: "Prueba 014", department: "Producción", position: "Operador de Producción" },
  { sapNumber: "TEST-GP2-015", firstName: "Empleado", lastName: "Prueba 015", department: "Producción", position: "Líder de Línea" },
  { sapNumber: "TEST-GP2-016", firstName: "Empleado", lastName: "Prueba 016", department: "Producción", position: "Supervisor de Producción" },
  { sapNumber: "TEST-GP2-017", firstName: "Empleado", lastName: "Prueba 017", department: "Producción", position: "Operador de Producción" },

  { sapNumber: "TEST-GP2-018", firstName: "Empleado", lastName: "Prueba 018", department: "Recursos Humanos", position: "Analista de Recursos Humanos" },

  { sapNumber: "TEST-GP2-019", firstName: "Empleado", lastName: "Prueba 019", department: "Sistemas", position: "Soporte TI" },
  { sapNumber: "TEST-GP2-020", firstName: "Empleado", lastName: "Prueba 020", department: "Sistemas", position: "Administrador de Sistemas" },
];

export async function seedEmployees(prisma: PrismaClient): Promise<void> {
  console.log("\nIniciando seed de empleados de prueba...");

  const departments = await prisma.department.findMany({
    where: {
      company: Company.GP2,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const departmentMap = new Map(
    departments.map((department) => [department.name, department.id]),
  );

  for (const employee of testEmployees) {
    const departmentId = departmentMap.get(employee.department);

    if (!departmentId) {
      throw new Error(
        `No se encontró el departamento "${employee.department}" para ${employee.sapNumber}`,
      );
    }

    await prisma.employee.upsert({
      where: {
        sapNumber: employee.sapNumber,
      },
      update: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        departmentId,
        position: employee.position,
        company: Company.GP2,
      },
      create: {
        ...employee,
        departmentId,
        company: Company.GP2,
      },
    });

    console.log(`Empleado procesado: ${employee.sapNumber}`);
  }

  const total = await prisma.employee.count({
    where: {
      company: Company.GP2,
    },
  });

  console.log(`\nEmpleados GP2 registrados: ${total}`);
}