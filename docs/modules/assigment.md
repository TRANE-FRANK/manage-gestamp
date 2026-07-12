# Módulo: Assignment

## Objetivo

El módulo **Assignment** administra el ciclo de vida completo de la asignación de un activo de TI a un empleado.

Permite controlar desde la entrega del equipo hasta su devolución, incluyendo la generación y administración de la documentación asociada.

---

# Flujo General

```text
Equipo Disponible
        │
        ▼
Nueva Asignación
        │
        ▼
Generar Responsiva
        │
        ▼
Visualizar PDF
        │
        ▼
Firma Física
        │
        ▼
Subir PDF Firmado
        │
        ▼
Equipo En Uso
        │
        ▼
Devolución
        │
        ▼
Historial
```

---

# Funcionalidades

Actualmente el módulo permite:

- Crear asignaciones.
- Consultar asignaciones activas.
- Consultar historial.
- Generar responsivas.
- Visualizar PDF generado.
- Subir PDF firmado.
- Visualizar PDF firmado.
- Devolver equipos.

---

# Estados de una Asignación

## Sin generar

La asignación existe pero aún no se ha generado la responsiva.

Acciones disponibles:

- Generar responsiva.

---

## Pendiente de firma

La responsiva fue generada correctamente.

Acciones disponibles:

- Ver PDF.
- Descargar PDF.
- Subir PDF firmado.

---

## Firmada

Existe una responsiva firmada.

Acciones disponibles:

- Ver PDF firmado.

---

## Devuelta

La asignación fue finalizada.

El equipo vuelve al estado **Disponible**.

---

# Reglas de Negocio

- Un equipo únicamente puede tener una asignación activa.
- Un empleado puede tener múltiples asignaciones históricas.
- Una asignación devuelta no puede reactivarse.
- La devolución actualiza automáticamente el estado del equipo.
- Una responsiva firmada nunca debe sobrescribirse.

---

# Documentos

Cada asignación puede tener dos documentos.

## Responsiva generada

Generada automáticamente por el sistema.

Ubicación:

```text
storage/assignments/generated/
```

---

## Responsiva firmada

Documento firmado por el colaborador.

Ubicación:

```text
storage/assignments/signed/
```

---

# API de Documentos

## Ver responsiva generada

```http
GET /api/documents/assignment/{id}/generated
```

---

## Ver responsiva firmada

```http
GET /api/documents/assignment/{id}/signed
```

---

# Componentes

## Páginas

```text
app/
└── assignments/
```

---

## Componentes

```text
AssignmentTable
AssignmentRow
GenerateResponsivaButton
UploadSignedPdfButton
ViewDocumentButton
```

---

# Servicios

El módulo utiliza una arquitectura basada en Services.

Principales servicios:

```text
createAssignment()
listAssignments()
getAssignmentDetails()
returnAssignment()
generateAssignmentDocument()
uploadSignedPdf()
```

---

# Repository

Consultas principales:

```text
findAssignmentById()
findAssignmentByIdOrThrow()
findActiveAssignmentByEquipment()
```

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

# Flujo de Generación de Responsiva

```text
Asignación
      │
      ▼
Plantilla Excel
      │
      ▼
ExcelJS
      │
      ▼
Archivo XLSX
      │
      ▼
LibreOffice
      │
      ▼
PDF
      │
      ▼
storage/generated
```

---

# Flujo del PDF Firmado

```text
PDF Generado
      │
      ▼
Firma Física
      │
      ▼
Subida al Sistema
      │
      ▼
storage/signed
      │
      ▼
Disponible para consulta
```

---

# Historial

Las asignaciones nunca se eliminan.

Cuando un equipo es devuelto:

- Se registra la fecha de devolución.
- El equipo cambia a estado **Disponible**.
- La asignación permanece para consultas futuras.

Esto permite mantener un historial completo por:

- Empleado.
- Equipo.
- Empresa.
- Fecha.

---

# Mejoras Futuras

- Firma digital.
- Versionado de documentos.
- Auditoría de cambios.
- Generación automática de correos.
- Exportación de historial.
- Reimpresión de responsivas.
- Notificaciones automáticas.

---

# Estado del Módulo

| Funcionalidad | Estado |
|--------------|--------|
| Crear asignación | ✅ |
| Generar responsiva | ✅ |
| Ver PDF generado | ✅ |
| Subir PDF firmado | ✅ |
| Ver PDF firmado | ✅ |
| Devolver equipo | ✅ |
| Historial | ✅ |
| Firma digital | ⏳ |
| Auditoría | ⏳ |
| Versionado | ⏳ |
