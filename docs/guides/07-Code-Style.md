# Estilo de Código

## Objetivo

Mantener un código consistente, legible y fácil de mantener en todo el proyecto.

Todos los desarrolladores deben seguir las mismas convenciones.

---

# Principios

- Escribir código legible antes que código complejo.
- Mantener funciones pequeñas y con una única responsabilidad.
- Evitar duplicación de código.
- Priorizar la reutilización.
- Mantener consistencia en nombres y estructura.

---

# Archivos

- Un archivo debe tener una única responsabilidad.
- Evitar archivos excesivamente grandes.
- Agrupar funcionalidades relacionadas.

---

# Nombres

## Componentes

Utilizar PascalCase.

```tsx
EmployeeTable.tsx
AssignmentRow.tsx
PageHeader.tsx
```

---

## Funciones

Utilizar camelCase.

```ts
createAssignment()
returnAssignment()
listEmployees()
```

---

## Variables

Utilizar nombres descriptivos.

Correcto:

```ts
currentAssignment
generatedPdfPath
employeeName
```

Incorrecto:

```ts
a
tmp
data
```

---

## Constantes

Utilizar UPPER_SNAKE_CASE.

```ts
MAX_FILE_SIZE
DEFAULT_PAGE_SIZE
```

---

# Imports

Orden recomendado:

1. Librerías externas.
2. Imports mediante alias (`@/`).
3. Imports relativos.
4. Types.

Ejemplo:

```ts
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";

import type { EmployeeDetails } from "@/services/employee";
```

---

# TypeScript

- Evitar `any`.
- Preferir `interface` para Props.
- Utilizar tipos derivados de Prisma cuando sea posible.
- Mantener el tipado estricto.

---

# Componentes React

Utilizar funciones nombradas.

Correcto:

```tsx
export default function EmployeeTable() {}
```

Incorrecto:

```tsx
const EmployeeTable = () => {}
```

---

# Props

Siempre definir una interfaz.

```tsx
interface Props {
  employee: EmployeeDetails;
}
```

---

# Funciones

Una función debe realizar una sola tarea.

Si comienza a crecer demasiado, dividirla en funciones más pequeñas.

---

# Comentarios

Comentar únicamente cuando aporte contexto.

Evitar comentarios que expliquen código evidente.

Correcto:

```ts
// Actualiza el estado del equipo dentro de la misma transacción.
```

Incorrecto:

```ts
// Incrementa i en uno.
```

---

# Manejo de errores

- Utilizar errores personalizados cuando aplique.
- Mostrar mensajes claros al usuario.
- Registrar errores internos para facilitar el diagnóstico.

---

# Formato

- Indentación de 2 espacios.
- Utilizar comillas dobles.
- Finalizar archivos con salto de línea.
- Mantener una línea en blanco entre bloques lógicos.

---

# Refactorización

Antes de finalizar un cambio revisar:

- ¿Existe código duplicado?
- ¿Puede reutilizarse un componente?
- ¿El nombre refleja su responsabilidad?
- ¿Respeta la arquitectura del proyecto?

---

# Objetivo final

El código debe ser fácil de leer, mantener y extender por cualquier desarrollador del proyecto.

