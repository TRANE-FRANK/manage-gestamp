# Módulo: Employee

## Objetivo

El módulo **Employee** administra la información de los colaboradores dentro de Manage Gestamp.

Cada empleado actúa como el punto central para consultar los equipos asignados, documentos relacionados e historial de asignaciones.

---

# Funcionalidades

Actualmente el módulo permite:

- Registrar empleados.
- Consultar empleados.
- Visualizar información del empleado.
- Consultar asignaciones activas.
- Consultar historial de asignaciones.

---

# Información del Empleado

Cada empleado almacena información como:

- Número SAP.
- Nombre.
- Apellidos.
- Empresa.
- Departamento.
- Puesto.
- Correo electrónico.

---

# Flujo General

```text
Registrar Empleado
        │
        ▼
Consultar Empleados
        │
        ▼
Detalle del Empleado
        │
        ├────────► Equipo Actual
        │
        ├────────► Documentos
        │
        └────────► Historial
```

---

# Pantallas

## Lista de empleados

Ruta

```text
/employees
```

Permite:

- Buscar empleados.
- Consultar información.
- Acceder al detalle.

---

## Detalle del empleado

Ruta

```text
/employees/{id}
```

La pantalla está compuesta por tarjetas independientes.

```text
Información

Equipo Actual

Documentos

Historial
```

Cada tarjeta representa una responsabilidad específica.

---

# Componentes

```text
EmployeeTable

EmployeeRow

EmployeeInformationCard

EmployeeCurrentEquipmentCard

EmployeeDocumentsCard

EmployeeAssignmentHistoryCard
```

---

# Servicios

Principales servicios:

```text
listEmployees()

getEmployeeDetails()

createEmployee()

updateEmployee()

deleteEmployee()
```

---

# Repository

Consultas principales:

```text
findEmployees()

findEmployeeById()

findEmployeeBySap()

findEmployeeWithAssignments()
```

---

# Relaciones

Un empleado puede tener:

- Muchas asignaciones.
- Muchos documentos (a través de las asignaciones).
- Un único equipo activo.
- Múltiples equipos históricos.

---

# Flujo Técnico

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
Prisma
    │
    ▼
PostgreSQL
```

---

# Reglas de Negocio

- El número SAP debe ser único.
- Un empleado puede tener múltiples asignaciones históricas.
- Solo puede tener una asignación activa por equipo.
- El historial nunca debe eliminarse.

---

# Mejoras Futuras

- Fotografía del empleado.
- Búsqueda avanzada.
- Importación masiva desde Excel.
- Exportación de información.
- Directorio organizacional.
- Historial de cambios.

---

# Estado del Módulo

| Funcionalidad | Estado |
|--------------|--------|
| Registrar empleado | ✅ |
| Listar empleados | ✅ |
| Editar empleado | ⏳ |
| Eliminar empleado | ⏳ |
| Detalle del empleado | 🚧 |
| Equipo actual | 🚧 |
| Documentos | 🚧 |
| Historial | 🚧 |
| Importación masiva | ⏳ |
