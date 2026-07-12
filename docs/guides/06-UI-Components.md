# Componentes UI

## Objetivo

Los componentes UI proporcionan una interfaz consistente, reutilizable y desacoplada de la lógica del negocio.

Todos los componentes reutilizables deben ubicarse en:

```text
components/ui/
```

Los componentes específicos de un módulo deben ubicarse en:

```text
components/
├── assignment/
├── employee/
├── equipment/
└── permission/
```

---

# Principios

Todo componente UI debe cumplir con las siguientes reglas:

- Ser reutilizable.
- No contener lógica del negocio.
- No acceder a la base de datos.
- No importar Services.
- No importar Prisma.
- Ser responsive.
- Mantener un diseño consistente.

---

# Card

## Objetivo

Agrupar información relacionada.

Ejemplos:

- Información del empleado.
- Equipo actual.
- Historial.
- Documentos.
- Estadísticas.

No utilizar un Card para un único botón o elemento aislado.

---

# PageHeader

## Objetivo

Mostrar el encabezado principal de una página.

Puede contener:

- Título.
- Descripción.
- Acciones.
- Botones principales.

Ejemplo:

```tsx
<PageHeader
  title="Empleados"
  actions={...}
/>
```

Cada página principal debe tener un único PageHeader.

---

# Table

## Objetivo

Mostrar colecciones de datos.

Características:

- Reutilizable.
- Responsive.
- Separa encabezados y filas.
- Permite mostrar mensajes cuando no existen registros.

Debe utilizar componentes Row para representar cada elemento.

---

# Badge

## Objetivo

Representar estados o categorías.

Ejemplos:

- ORM
- GP2
- Disponible
- En uso
- Firmada
- Pendiente

No utilizar Badge como botón.

---

# DetailGrid

## Objetivo

Organizar información en formato de dos columnas.

Ejemplo:

```text
SAP              123456
Empresa          ORM
Departamento     Sistemas
```

Debe utilizarse junto con DetailItem.

---

# DetailItem

## Objetivo

Mostrar un único dato compuesto por:

- Etiqueta.
- Valor.

Ejemplo:

```tsx
<DetailItem label="SAP">
  123456
</DetailItem>
```

---

# Botones

Todos los botones deben mantener un estilo consistente.

Tipos principales:

- Primary
- Secondary
- Success
- Warning
- Danger

Las acciones destructivas siempre deben solicitar confirmación.

---

# Formularios

Los formularios deben seguir la misma estructura.

```text
PageHeader

↓

Card

↓

Campos

↓

Acciones
```

Los botones principales siempre deben colocarse al final del formulario.

---

# Responsive

Todos los componentes deben funcionar correctamente en:

- Desktop.
- Tablet.
- Mobile.

No se deben crear componentes diferentes para dispositivos móviles.

---

# Accesibilidad

Todos los componentes deben considerar:

- Etiquetas descriptivas.
- Navegación mediante teclado.
- Contraste adecuado.
- Estados de enfoque visibles.

---

# Reutilización

Antes de crear un nuevo componente revisar si existe uno que pueda reutilizarse.

La reutilización tiene prioridad sobre la duplicación de código.

---

# Convención

Los componentes UI deben tener nombres descriptivos.

Ejemplos:

- Card
- Badge
- Table
- PageHeader
- DetailGrid
- DetailItem

Evitar nombres específicos del negocio como:

- EmployeeCard
- AssignmentBadge

Los componentes específicos pertenecen al módulo correspondiente, no a `components/ui`.

