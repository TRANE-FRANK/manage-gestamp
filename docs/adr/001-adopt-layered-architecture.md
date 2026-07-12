# ADR-001: Arquitectura por Capas

## Estado

Aceptado

---

## Fecha

2026-07-12

---

## Contexto

El proyecto comenzó creciendo rápidamente y era necesario separar claramente la interfaz, la lógica del negocio y el acceso a los datos para facilitar el mantenimiento.

---

## Decisión

Adoptar una arquitectura por capas.

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

Cada capa tiene una única responsabilidad.

---

## Consecuencias

### Positivas

- Bajo acoplamiento.
- Alta reutilización.
- Fácil mantenimiento.
- Escalable.

### Negativas

- Mayor cantidad de archivos.
- Curva de aprendizaje inicial.

---

## Alternativas consideradas

- Acceder a Prisma directamente desde las Pages.
- Arquitectura MVC tradicional.

Se descartaron por aumentar el acoplamiento.