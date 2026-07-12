# Manage Gestamp

Sistema de gestión de activos de TI desarrollado para Gestamp.

## Objetivo

Centralizar la administración de:

- Empleados
- Equipos
- Asignaciones
- Responsivas
- Documentos
- Mantenimientos
- Garantías

## Tecnologías

- Next.js (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- ExcelJS
- LibreOffice

## Arquitectura

El proyecto sigue una arquitectura por capas:

```text
Page
↓
Service
↓
Repository
↓
Prisma
↓
PostgreSQL
```

## Documentación

- `getting-started/` → Introducción y arquitectura.
- `guides/` → Convenciones y componentes.
- `modules/` → Documentación de cada módulo.
- `adr/` → Decisiones de arquitectura.

## Estado del proyecto

### Finalizado

- Gestión de asignaciones
- Generación de responsivas
- PDF generado
- PDF firmado
- Historial de asignaciones

### En desarrollo

- Módulo Employee
- Historial del empleado

### Pendiente

- Equipment
- Maintenance
- Warranty
- Dashboard
