# Principios

## Objetivo

Establecer los principios que guían el diseño, desarrollo y evolución de Manage Gestamp.

Estos principios deben considerarse antes de implementar cualquier funcionalidad nueva.

---

# 1. Separación de Responsabilidades

Cada capa del sistema debe tener una única responsabilidad.

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

Una capa nunca debe asumir responsabilidades de otra.

---

# 2. Reutilización

Antes de crear código nuevo se debe verificar si ya existe una solución reutilizable.

Esto aplica para:

- Componentes.
- Services.
- Repository.
- Helpers.
- Tipos.

Evitar la duplicación de código.

---

# 3. Simplicidad

La solución más simple que cumpla correctamente con los requisitos será siempre la opción preferida.

Evitar complejidad innecesaria.

---

# 4. Escalabilidad

Toda nueva funcionalidad debe diseñarse pensando en el crecimiento del sistema.

Las soluciones temporales deben evitarse cuando comprometan la arquitectura.

---

# 5. Consistencia

Todos los módulos deben seguir la misma estructura, convenciones y estilo de desarrollo.

La consistencia facilita el mantenimiento y reduce la curva de aprendizaje.

---

# 6. Legibilidad

El código debe ser fácil de leer y comprender.

Se priorizan nombres descriptivos, funciones pequeñas y una estructura clara.

El código se escribe para personas.

---

# 7. Responsabilidad Única

Cada archivo, función y componente debe tener una única responsabilidad.

Si un archivo comienza a cumplir múltiples funciones, debe dividirse.

---

# 8. Bajo Acoplamiento

Los módulos deben depender lo menos posible entre sí.

Las dependencias deben mantenerse claras y bien definidas.

---

# 9. Alta Cohesión

Todo el código relacionado con una funcionalidad debe permanecer agrupado dentro del mismo módulo.

Cada módulo debe ser responsable únicamente de su propio dominio.

---

# 10. Arquitectura Primero

Antes de escribir código se debe definir:

- El flujo del negocio.
- La arquitectura.
- Los Services necesarios.
- Los Repository necesarios.
- Los componentes reutilizables.

La implementación es el último paso.

---

# 11. Calidad sobre Velocidad

Es preferible invertir más tiempo en una solución bien diseñada que implementar una solución rápida que genere deuda técnica.

---

# 12. Documentación Continua

La documentación forma parte del desarrollo.

Cada módulo terminado debe reflejarse en la documentación correspondiente.

La documentación debe mantenerse actualizada junto con el código.

---

# Principio General

Cada decisión dentro del proyecto debe responder afirmativamente a las siguientes preguntas:

- ¿Respeta la arquitectura?
- ¿Es reutilizable?
- ¿Es fácil de mantener?
- ¿Es consistente con el resto del proyecto?
- ¿Facilita el crecimiento futuro del sistema?

Si la respuesta es "no" para alguna de ellas, la solución debe replantearse.
