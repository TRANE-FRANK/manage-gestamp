# Flujo de Desarrollo

## Objetivo

Establecer un proceso de desarrollo consistente para mantener la calidad, escalabilidad y organización del proyecto.

Todo cambio debe seguir este flujo antes de integrarse al sistema.

---

# Flujo de Desarrollo

```text
Análisis
    ↓
Diseño
    ↓
Arquitectura
    ↓
Implementación
    ↓
Pruebas
    ↓
Documentación
    ↓
Refactorización
```

---

# 1. Análisis

Antes de escribir código se debe comprender el problema.

Preguntas clave:

- ¿Qué necesidad resuelve?
- ¿Quién utilizará esta funcionalidad?
- ¿Cómo afecta a otros módulos?
- ¿Qué información necesita?

---

# 2. Diseño

Definir el flujo funcional antes de programar.

Ejemplo:

```text
Empleado
    ↓
Asignación
    ↓
Generar Responsiva
    ↓
Firmar Documento
    ↓
Subir PDF
    ↓
Historial
```

---

# 3. Arquitectura

Definir la estructura del módulo.

```text
Page
    ↓
Components
    ↓
Services
    ↓
Repository
    ↓
Prisma
```

Antes de crear un archivo nuevo revisar si ya existe uno que pueda reutilizarse.

---

# 4. Implementación

Orden recomendado de desarrollo:

1. Base de datos (si aplica).
2. Repository.
3. Services.
4. Server Actions o Route Handlers.
5. Componentes.
6. Página.
7. Estilos.

No comenzar directamente por la interfaz.

---

# 5. Pruebas

Antes de finalizar una funcionalidad verificar:

- El flujo principal funciona.
- Se manejan errores correctamente.
- No existen regresiones.
- La interfaz es responsive.
- Los datos son consistentes.

---

# 6. Documentación

Al terminar un módulo actualizar:

- Documentación del módulo.
- Roadmap (si aplica).
- ADR (si hubo una decisión arquitectónica importante).

La documentación forma parte del desarrollo.

---

# 7. Refactorización

Antes de dar por terminado un módulo revisar:

- ¿Existe código duplicado?
- ¿Se puede reutilizar un componente?
- ¿Los nombres son consistentes?
- ¿La arquitectura se mantiene limpia?

---

# Buenas prácticas

- Implementar una funcionalidad a la vez.
- Mantener commits pequeños y descriptivos.
- No mezclar refactorización con nuevas funcionalidades.
- Evitar código duplicado.
- Priorizar la claridad sobre la complejidad.

---

# Definición de "Terminado"

Una funcionalidad se considera terminada cuando:

- Cumple los requisitos funcionales.
- Sigue la arquitectura del proyecto.
- Está documentada.
- Ha sido probada.
- El código es legible y mantenible.

Solo entonces puede darse por finalizada.
