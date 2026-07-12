# Módulo: Equipment

## Objetivo

El módulo **Equipment** administra el inventario de activos de TI dentro de la organización.

Cada equipo cuenta con un historial completo de asignaciones, documentos y estado durante todo su ciclo de vida.

---

# Funcionalidades

Actualmente el módulo contempla:

- Registrar equipos.
- Consultar inventario.
- Editar información.
- Consultar historial.
- Administrar disponibilidad.
- Consultar documentación relacionada.

---

# Información del Equipo

Cada equipo almacena información como:

- Activo fijo.
- Empresa.
- Categoría.
- Marca.
- Modelo.
- Número de serie.
- Estado.
- Fecha de adquisición.
- Observaciones.

---

# Flujo General

```text
Registrar Equipo
        │
        ▼
Disponible
        │
        ▼
Asignación
        │
        ▼
En Uso
        │
        ▼
Mantenimiento
        │
        ▼
Disponible
        │
        ▼
Baja
```

---

# Estados

Los equipos pueden encontrarse en alguno de los siguientes estados:

- Disponible.
- En uso.
- Mantenimiento.
- Baja.

Cada cambio de estado queda registrado en el historial.

---

# Pantallas

## Inventario

Ruta

```text
/equipment
```

Permite:

- Buscar equipos.
- Filtrar por empresa.
- Filtrar por estado.
- Consultar información.

---

## Detalle del Equipo

Ruta

```text
/equipment/{id}
```

La pantalla estará compuesta por tarjetas independientes.

```text
Información

Asignación Actual

Documentos

Historial

Mantenimientos

Garantías
```

---

# Componentes

```text
EquipmentTable

EquipmentRow

EquipmentInformationCard

EquipmentCurrentAssignmentCard

EquipmentDocumentsCard

EquipmentHistoryCard

EquipmentMaintenanceCard

EquipmentWarrantyCard
```

---

# Servicios

Principales servicios:

```text
listEquipment()

getEquipmentDetails()

createEquipment()

updateEquipment()

deleteEquipment()
```

---

# Repository

Consultas principales:

```text
findEquipment()

findEquipmentById()

findEquipmentByAssetTag()

findAvailableEquipment()
```

---

# Relaciones

Cada equipo puede tener:

- Una asignación activa.
- Muchas asignaciones históricas.
- Muchos documentos.
- Muchos mantenimientos.
- Muchas garantías.

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

- El activo fijo debe ser único.
- Un equipo solo puede tener una asignación activa.
- Todo cambio de estado debe registrarse.
- El historial nunca debe eliminarse.
- Un equipo en mantenimiento no puede asignarse.

---

# Mejoras Futuras

- Código QR.
- Código de barras.
- Fotografías.
- Importación masiva.
- Exportación de inventario.
- Alertas de garantía.
- Alertas de mantenimiento.

---

# Estado del Módulo

| Funcionalidad | Estado |
|--------------|--------|
| Registrar equipo | ✅ |
| Listar equipos | ✅ |
| Editar equipo | ⏳ |
| Eliminar equipo | ⏳ |
| Detalle del equipo | ⏳ |
| Historial | ⏳ |
| Mantenimientos | ⏳ |
| Garantías | ⏳ |
| Código QR | ⏳ |
