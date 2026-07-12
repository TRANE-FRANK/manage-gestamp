# Arquitectura

## Objetivo

Manage Gestamp utiliza una arquitectura por capas para separar la interfaz de usuario, la lógica del negocio y el acceso a los datos.

Esta separación facilita:

- Mantenimiento.
- Escalabilidad.
- Reutilización.
- Pruebas.
- Legibilidad del código.

---

# Arquitectura General

```text
Page
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
```

Cada capa tiene una única responsabilidad.

---

# Capas

## Pages

Ubicación:

```text
app/
```

Responsabilidades:

- Renderizar la interfaz.
- Obtener información desde un Service.
- Manejar navegación.

No deben:

- Importar Prisma.
- Contener reglas de negocio.
- Realizar consultas a la base de datos.

---

## Services

Ubicación:

```text
services/
```

Responsabilidades:

- Implementar la lógica del negocio.
- Validar información.
- Ejecutar transacciones.
- Coordinar múltiples Repository.
- Generar documentos.

Ejemplos:

- createAssignment()
- returnAssignment()
- generateAssignmentDocument()
- uploadSignedPdf()
- listEmployees()
- getEmployeeDetails()

---

## Repository

Ubicación:

```text
services/*/repository.ts
```

Responsabilidades:

- Consultar la base de datos.
- Crear, actualizar o eliminar registros.

No deben:

- Validar reglas del negocio.
- Renderizar información.
- Conocer componentes React.

Ejemplos:

- findEmployeeById()
- findEmployees()
- findAssignmentById()
- findEquipmentById()

---

## Prisma

Prisma es el ORM encargado de acceder a PostgreSQL.

Toda consulta a la base de datos debe pasar por un Repository.

---

## PostgreSQL

Base de datos principal del sistema.

Contiene toda la información relacionada con:

- Empleados.
- Equipos.
- Asignaciones.
- Documentos.
- Historial.

---

# Flujo de una consulta

```text
Usuario
   │
   ▼
Page
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

---

# Flujo de una operación

Ejemplo: Crear una asignación.

```text
Usuario
   │
   ▼
AssignmentsPage
   │
   ▼
createAssignment()
   │
   ▼
findEmployeeById()
findEquipmentById()
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

---

# Principios

La arquitectura sigue los siguientes principios:

- Separación de responsabilidades.
- Reutilización de código.
- Bajo acoplamiento.
- Alta cohesión.
- Escalabilidad.
- Mantenibilidad.

---

# Organización de los módulos

Cada módulo sigue la misma estructura.

```text
services/
└── assignment/
    ├── repository.ts
    ├── queries.ts
    ├── types.ts
    ├── list.ts
    ├── details.ts
    ├── create.ts
    ├── update.ts
    ├── delete.ts
    └── index.ts
```

La misma estructura se utiliza para:

- Employee.
- Equipment.
- Documents.
- Maintenance.
- Warranty.

---

# Beneficios

Esta arquitectura permite:

- Agregar nuevos módulos fácilmente.
- Reutilizar componentes.
- Reutilizar servicios.
- Mantener un código organizado.
- Facilitar el mantenimiento a largo plazo.
