# ADR-003: Uso de Server Actions

## Estado

Aceptado

---

## Fecha

2026-07-12

---

## Contexto

Las operaciones de creación, actualización y eliminación debían ejecutarse en el servidor sin exponer lógica de negocio al cliente.

---

## Decisión

Utilizar Server Actions para todas las operaciones de escritura.

Ejemplos:

- Crear asignación.
- Devolver equipo.
- Subir PDF firmado.

---

## Consecuencias

### Positivas

- Mayor seguridad.
- Menos endpoints.
- Integración con Next.js.

### Negativas

- Requiere comprender el ciclo de ejecución del App Router.

---

## Alternativas consideradas

- API REST para todas las operaciones.

Se descartó por añadir complejidad innecesaria para operaciones internas.