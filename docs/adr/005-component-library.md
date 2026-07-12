# ADR-005: Biblioteca de Componentes UI

## Estado

Aceptado

---

## Fecha

2026-07-12

---

## Contexto

Durante el desarrollo comenzaron a repetirse estructuras visuales en diferentes módulos.

---

## Decisión

Crear una biblioteca de componentes reutilizables en `components/ui`.

Ejemplos:

- Card
- Badge
- PageHeader
- Table
- DetailGrid
- DetailItem

---

## Consecuencias

### Positivas

- Interfaz consistente.
- Menor duplicación.
- Fácil mantenimiento.
- Desarrollo más rápido.

### Negativas

- Requiere diseñar componentes genéricos antes de implementar pantallas.

---

## Alternativas consideradas

- Crear componentes específicos para cada módulo.

Se descartó porque generaba duplicación y dificultaba el mantenimiento.
