# Estructura del Proyecto

## Objetivo

El proyecto está organizado por responsabilidad.

Cada carpeta tiene un propósito específico y nunca debe contener código que
pertenezca a otra capa.

Esta organización permite mantener una arquitectura consistente conforme el
sistema crece.

---

# Estructura General

```text
app/
components/
services/
lib/
generated/
prisma/
storage/
public/
docs/
```

---

# app/

Contiene todas las rutas del sistema utilizando el App Router de Next.js.

Cada carpeta representa una ruta.

Ejemplo:

```text
app/

employees/
assignments/
equipments/
permissions/
```

Cada módulo puede contener:

```text
page.tsx

loading.tsx

error.tsx

layout.tsx

[id]/

new/
```

Las Pages únicamente renderizan la interfaz y consumen Services.

Nunca realizan consultas con Prisma.

---

# components/

Contiene todos los componentes reutilizables del sistema.

Se divide en dos categorías.

## UI

Componentes completamente reutilizables.

```text
components/ui/

Badge

Button

Card

DetailGrid

DetailItem

PageHeader

Table
```

Estos componentes nunca conocen reglas del negocio.

---

## Business Components

Componentes específicos de un módulo.

Ejemplo:

```text
components/

assignment/

employee/

equipment/
```

Un componente de Employee no debe utilizar lógica de Assignment.

---

# services/

Aquí vive toda la lógica del negocio.

Cada módulo mantiene su propia carpeta.

```text
services/

assignment/

employee/

equipment/
```

Cada módulo sigue la misma estructura.

```text
repository.ts

queries.ts

types.ts

list.ts

details.ts

create.ts

update.ts

delete.ts

index.ts
```

---

## repository.ts

Contiene únicamente consultas a la base de datos.

---

## queries.ts

Define los include de Prisma reutilizables.

Ejemplo

assignmentInclude

employeeInclude

---

## types.ts

Define los tipos derivados de Prisma.

Nunca crear interfaces manuales cuando Prisma puede inferirlas.

Ejemplo

AssignmentDetails

EmployeeDetails

---

## list.ts

Obtiene colecciones.

Ejemplo

listEmployees()

listAssignments()

---

## details.ts

Obtiene un único recurso.

Ejemplo

getEmployeeDetails()

---

## create.ts

Creación de entidades.

---

## update.ts

Actualización de entidades.

---

## delete.ts

Eliminación lógica o física.

---

## lib/

Configuraciones compartidas.

Ejemplo

Prisma

Autenticación

Clientes externos

Helpers

---

# prisma/

Contiene el esquema y migraciones.

Nunca almacenar lógica del negocio aquí.

---

# storage/

Archivos generados por el sistema.

Ejemplo

assignments/

generated/

signed/

templates/

---

# public/

Archivos públicos.

Logotipos

Imágenes

Iconos

---

# docs/

Documentación oficial del proyecto.

La documentación debe mantenerse sincronizada con el código.

Cada decisión importante debe quedar registrada aquí.
