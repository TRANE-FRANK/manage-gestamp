# Módulo: Database

## Objetivo

El módulo **Database** define la estructura de datos de Manage Gestamp y las relaciones entre las entidades del sistema.

La base de datos está diseñada para mantener la integridad de la información, facilitar la trazabilidad y permitir el crecimiento del sistema.

---

# Motor de Base de Datos

- PostgreSQL

---

# ORM

- Prisma ORM

---

# Principios

La base de datos sigue las siguientes reglas:

- Normalización de datos.
- Integridad referencial.
- Uso de claves foráneas.
- Historial en lugar de eliminación de información.
- Escalabilidad.

---

# Entidades Principales

Actualmente el sistema contempla las siguientes entidades:

```text
Employee

Equipment

Assignment

Permission

Maintenance

Warranty
```

---

# Relaciones

## Employee

Un empleado puede tener muchas asignaciones.

```text
Employee
    │
    └──────< Assignment
```

---

## Equipment

Un equipo puede tener muchas asignaciones durante su vida útil.

```text
Equipment
    │
    └──────< Assignment
```

---

## Assignment

Relaciona un empleado con un equipo.

Cada asignación puede tener:

- Responsiva generada.
- Responsiva firmada.

---

# Historial

El sistema conserva el historial completo.

Los registros históricos no se eliminan.

Ejemplo:

```text
Assignment

returnedAt != null

↓

Historial
```

---

# Integridad

Toda relación utiliza claves foráneas.

Ejemplo:

```text
Assignment

employeeId

equipmentId
```

---

# Migraciones

Todas las modificaciones del esquema deben realizarse mediante migraciones de Prisma.

Nunca modificar directamente la base de datos en producción.

---

# Convenciones

## Claves Primarias

```text
id
```

Tipo:

- Integer
- Autoincrement

---

## Claves Foráneas

Formato:

```text
employeeId

equipmentId

assignmentId
```

---

## Fechas

Formato:

```text
createdAt

updatedAt

assignedAt

returnedAt
```

Todas utilizan el tipo `DateTime`.

---

# Estados

Los estados se representan mediante enums siempre que sea posible.

Ejemplo:

```text
AVAILABLE

ASSIGNED

MAINTENANCE

RETIRED
```

---

# Índices

Se recomienda crear índices sobre los campos utilizados con mayor frecuencia en búsquedas.

Ejemplos:

- sapNumber
- assetTag
- serialNumber
- employeeId
- equipmentId
- returnedAt

---

# Respaldo

Se recomienda realizar respaldos periódicos de la base de datos.

Los documentos almacenados en `storage/` deben respaldarse junto con la base de datos para mantener la consistencia del sistema.

---

# Buenas Prácticas

- No eliminar registros históricos.
- Utilizar transacciones para operaciones relacionadas.
- Mantener integridad referencial.
- Evitar duplicidad de información.
- Utilizar Prisma como único acceso a la base de datos.

---

# Mejoras Futuras

- Auditoría de cambios.
- Soft Delete para entidades seleccionadas.
- Particionado de tablas históricas.
- Optimización de índices.
- Monitoreo de rendimiento.

---

# Estado del Módulo

| Elemento | Estado |
|----------|--------|
| PostgreSQL | ✅ |
| Prisma ORM | ✅ |
| Relaciones | ✅ |
| Migraciones | ✅ |
| Historial | ✅ |
| Auditoría | ⏳ |
| Soft Delete | ⏳ |
| Optimización | ⏳ |
