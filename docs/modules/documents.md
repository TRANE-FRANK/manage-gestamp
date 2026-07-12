# Módulo: Documents

## Objetivo

El módulo **Documents** administra todos los documentos generados y almacenados por el sistema.

Actualmente se enfoca en las responsivas de asignación, permitiendo su generación, almacenamiento, consulta y conservación.

---

# Tipos de Documentos

Actualmente el sistema soporta:

- Responsiva generada.
- Responsiva firmada.

En el futuro podrá incluir:

- Permisos.
- Actas.
- Mantenimientos.
- Garantías.
- Otros documentos relacionados.

---

# Flujo General

```text
Asignación
      │
      ▼
Generar Excel
      │
      ▼
Convertir a PDF
      │
      ▼
Guardar PDF
      │
      ▼
Visualizar
      │
      ▼
Firma Física
      │
      ▼
Subir PDF Firmado
      │
      ▼
Consulta
```

---

# Generación de Documentos

La responsiva se genera a partir de una plantilla de Excel.

Proceso:

1. Cargar plantilla.
2. Completar información.
3. Guardar archivo Excel.
4. Convertir a PDF.
5. Almacenar documento.

---

# Almacenamiento

Los documentos se almacenan en el sistema de archivos.

```text
storage/
└── assignments/
    ├── generated/
    ├── signed/
    └── templates/
```

---

# API REST

Los documentos se consultan mediante Route Handlers.

## Responsiva generada

```http
GET /api/documents/assignment/{id}/generated
```

## Responsiva firmada

```http
GET /api/documents/assignment/{id}/signed
```

Esta estructura sigue principios REST y facilita la incorporación de nuevos tipos de documentos.

---

# Convención de Nombres

## PDF generado

```text
RESP-{SAP}-{YYYY-MM-DD_HH-mm-ss}.pdf
```

## PDF firmado

```text
RESP-{SAP}-{YYYY-MM-DD_HH-mm-ss}-FIRMADA.pdf
```

---

# Servicios

Principales servicios:

```text
generateAssignmentDocument()

uploadSignedPdf()

getAssignmentDocument()
```

---

# Seguridad

Los documentos solo pueden consultarse mediante la aplicación.

No deben exponerse directamente desde el directorio de almacenamiento.

Todo acceso debe realizarse mediante los Route Handlers correspondientes.

---

# Reglas de Negocio

- Una asignación puede tener un único PDF generado.
- Una asignación puede tener un único PDF firmado.
- El PDF firmado no debe sobrescribirse.
- Los documentos históricos nunca deben eliminarse.
- Todo documento debe conservar su relación con la asignación correspondiente.

---

# Mejoras Futuras

- Firma digital.
- Versionado de documentos.
- Historial de cambios.
- Compresión automática.
- Almacenamiento en la nube.
- Generación de documentos adicionales.

---

# Estado del Módulo

| Funcionalidad | Estado |
|--------------|--------|
| Generar Excel | ✅ |
| Convertir a PDF | ✅ |
| Visualizar PDF | ✅ |
| Subir PDF firmado | ✅ |
| Visualizar PDF firmado | ✅ |
| API REST | ✅ |
| Firma digital | ⏳ |
| Versionado | ⏳ |
| Almacenamiento en la nube | ⏳ |
