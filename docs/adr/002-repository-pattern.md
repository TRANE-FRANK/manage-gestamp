# ADR-002: Uso del Repository Pattern

## Estado

Aceptado

---

## Fecha

2026-07-12

---

## Contexto

Era necesario centralizar todas las consultas a la base de datos y evitar que estuvieran distribuidas por el proyecto.

---

## Decisión

Todo acceso a PostgreSQL se realiza mediante Repository.

Ejemplo:

```text
findEmployeeById()

findEquipmentById()

findAssignmentById()
```

Los Repository no contienen lógica del negocio.

---

## Consecuencias

### Positivas

- Consultas reutilizables.
- Fácil mantenimiento.
- Menor duplicación.

### Negativas

- Mayor cantidad de archivos.

---

## Alternativas consideradas

- Prisma directamente en Services.
- Prisma directamente en Pages.

Ambas fueron descartadas por mezclar responsabilidades.
