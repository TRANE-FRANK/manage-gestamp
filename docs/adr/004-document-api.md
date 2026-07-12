# ADR-004: API para Visualización de Documentos

## Estado

Aceptado

---

## Fecha

2026-07-12

---

## Contexto

Los documentos almacenados no debían exponerse directamente desde el sistema de archivos.

---

## Decisión

Exponer los documentos mediante Route Handlers.

Ejemplos:

```text
GET /api/documents/assignment/{id}/generated

GET /api/documents/assignment/{id}/signed
```

---

## Consecuencias

### Positivas

- Mayor seguridad.
- URLs REST.
- Posibilidad de agregar validaciones y permisos.

### Negativas

- Se añade una capa adicional para servir los archivos.

---

## Alternativas consideradas

- Servir los PDFs directamente desde `storage/`.

Se descartó por motivos de seguridad y flexibilidad.
