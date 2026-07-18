# AI Rules Manager

**Versión documental:** V3.0  
**Versión de producto:** ver archivo `VERSION` (badge UI = `VERSION@GIT_HASH`)  
**Estado:** operativo en Windows con Docker Compose  
**Repositorio:** https://github.com/mcandiav/ai-rules-manager  
**Rama única:** `master`  
**Responsable arquitectónico:** Rol Arquitecto

---

## Bitácora de cambios

| Fecha | Versión | Cambio realizado | Motivo | Impacto | Rol |
|---|---|---|---|---|---|
| 2026-07-18 | V3.0 | README definitivo: instalación Windows estándar, mounts C:/D:, home `%USERPROFILE%`, sin workspace, rama única `master`, fuente canónica portable, deriva y superficies gobernadas alineadas al producto real. | Consolidar todas las decisiones de instalación y operación acordadas. | Este documento queda como fuente de verdad vigente. | Arquitecto |
| 2026-07-18 | V2.3 | Instalación Windows: clone + compose; mounts C:/D:; home USERPROFILE; sin workspace. | Volver al estándar Docker. | Rama `master`. | Arquitecto |
| 2026-07-17 | V2.2 | Alcance a cualquier IA/app/agente con artefactos gobernables. | Extensibilidad real. | Modelo de superficies + adaptadores. | Arquitecto |
| 2026-07-17 | V2.1 | Gobernanza de aplicaciones dev (artefactos globales/locales). | Cubrir Codex, Claude, Cursor, Antigravity. | Superficie “Apps Dev”. | Arquitecto |
| 2026-07-17 | V2.0 | Redefinición como plataforma local de gobernanza de reglas. | Alinear visión de producto. | Arquitectura base documentada. | Arquitecto |
| 2026-07-17 | V1.3 | Estado inicial del repo y Spec Kit. | Arranque documental. | Base. | Arquitecto |

---

## 1. Problema

Las IAs, apps y agentes consumen reglas en ubicaciones y formatos distintos (proyecto y globales). Eso rompe consistencia, dificulta cambios transversales y oculta el estado real de sincronización.

El problema no es solo guardar archivos: es gobernar una política común y materializarla sin perder trazabilidad, precedencia ni control.

---

## 2. Objetivo del producto

Aplicación web local en Docker que:

1. usa `Reglas Estandar/` como fuente canónica;
2. versiona cada cambio del conjunto completo;
3. administra reglas particulares por superficie;
4. materializa vía adaptadores (Cursor, Codex, Claude Code, Antigravity, extensible);
5. publica con plan/diff/estado (no ciego);
6. detecta deriva entre lo publicado y lo observado en disco;
7. opera monousuario en la máquina del operador.

---

## 3. Principios

1. La unidad de sentido es la **regla**, no el archivo.
2. `Reglas Estandar/` es la fuente canónica del estándar.
3. Cada cambio en esa carpeta genera una **nueva versión canónica** del snapshot completo.
4. Proyectos, apps dev y agentes son **superficies administradas**, no la fuente de verdad.
5. Las reglas particulares viven en la app (SQLite), no en `Reglas Estandar/`.
6. Los adaptadores solo traducen y materializan.
7. Extensible por adaptador + registro explícito de artefactos.
8. Ninguna publicación ciega.
9. Operación 100% local; la app **permanece en Docker** (no se saca del contenedor).

---

## 4. Alcance V1 (vigente)

### Incluye

- Dashboard (proyectos, apps dev, deriva, versión).
- Registro de proyectos **uno a uno** (ruta completa del host).
- Apps / agentes IA y aplicaciones dev gobernadas (opt-in para globales).
- Versionado canónico + escaneo de `Reglas Estandar`.
- Reglas particulares (extender / reemplazar / deshabilitar).
- Publicación por adaptador.
- Detección de deriva (hash esperado vs observado).
- UI multilengua `es` / `pt` / `en`.
- Badge de versión `VERSION@GIT_HASH`.

### Fuera de V1

- Multiusuario remoto / auth externa / SaaS.
- Mac/Linux como plataforma de instalación soportada (pendiente).
- Unidades distintas de **C:** y **D:** para proyectos (V1 base).
- Workspace global único (no existe: no hay `HOST_WORKSPACE_ROOT` obligatorio).
- Edición de reglas estándar embebida en la UI (se editan en la carpeta del install / IDE).

---

## 5. Fuente canónica: `Reglas Estandar/`

- Vive **en el mismo repo/combo de instalación** que el código (junto a `compose.yaml`).
- Se monta en el contenedor como `/Reglas Estandar` (solo lectura).
- La ruta en el **host** se descubre desde el bind mount de Docker (`/proc/self/mountinfo`). No hay override configurable: es la carpeta del lugar donde se instaló el Docker.
- Desde la UI (Versiones) se puede abrir/copiar esa ruta en el host.
- Cambios en la carpeta → nueva versión canónica (polling). La publicación a superficies **no** es automática: el operador publica/sincroniza.

---

## 6. Superficies gobernadas

1. **Proyectos** — se registran proyecto a proyecto con su path (`D:\...\mi-app`, etc.).
2. **Aplicaciones dev** — globales opt-in (gobernar / dejar de gobernar).
3. **Apps / agentes IA** — artefactos explícitos por adaptador.

### Adaptadores V1

| Plataforma | Proyecto (ej.) | Global (ej.) |
|---|---|---|
| Cursor | `.cursor/rules/*.mdc` (1 regla → 1 archivo) | según del adaptador |
| Codex | `AGENTS.md` en raíz del proyecto | `%USERPROFILE%\.codex\AGENTS.md` |
| Claude Code | `CLAUDE.md` | `%USERPROFILE%\.claude\...` |
| Antigravity | `GEMINI.md` en raíz del proyecto | `%USERPROFILE%\.gemini\GEMINI.md` |

Reglas:

- solo artefactos registrados y soportados;
- ruta efectiva editable desde la app;
- no inventar paths.

---

## 7. Stack técnico

| Capa | Tecnología |
|---|---|
| Monorepo | npm workspaces (`apps/web`, `apps/api`) |
| Frontend | Vue 3 + Vite + Vue Router + Pinia + vue-i18n |
| Backend | Node.js + TypeScript + Fastify |
| Persistencia | SQLite (`better-sqlite3`) en volumen `./data` |
| Canónico | polling sobre `Reglas Estandar` |
| Runtime | Docker Compose |
| Identidad | At-Once (tokens CSS) |

---

## 8. Instalación operativa (Windows) — definitiva

Plataforma soportada: **Windows + Docker Desktop**.

```powershell
git clone https://github.com/mcandiav/ai-rules-manager.git
cd ai-rules-manager
docker compose up -d --build
```

El nombre de la carpeta de instalación es libre (ej. `D:\Dockers\reglas-totales`). Ahí quedan código + `Reglas Estandar` + `data`.

| Recurso | Valor |
|---|---|
| UI | http://localhost:3002 |
| API / health | http://localhost:8002 |
| Rama Git | `master` (única) |

### Paths del host (V1)

| Concepto | Valor |
|---|---|
| Home del usuario | `%USERPROFILE%` → Compose: `HOST_HOME_ROOT=${USERPROFILE}` |
| Discos de proyecto | **C:** y **D:** montados en el container como `/host/c` y `/host/d` |
| Mapping app | `HOST_DRIVE_MAPPINGS=C:/:/host/c;D:/:/host/d` |
| Workspace global | **No existe**. Los proyectos se registran uno a uno. |

Nomenclatura Docker del mount: `D:/:/host/d` = `ruta-host:ruta-container`.

`.env` es **opcional**. Los defaults viven en `compose.yaml` / `.env.example`. Solo copiá `.env` si necesitás cambiar puertos u overrides.

### Qué queda operativo tras el `up`

- Web + API healthy.
- SQLite en `./data`.
- `Reglas Estandar` montada desde la carpeta de instalación.
- Acceso a proyectos bajo C: y D:.
- Globales bajo el perfil de Windows.
- Healthchecks.

### Actualizar una instalación existente

```powershell
git pull origin master
docker compose up -d --build
```

---

## 9. Operación cotidiana

1. Editar reglas estándar en `Reglas Estandar/` del install (botón en **Versiones** o IDE).
2. **Escanear** en Versiones → nueva versión canónica si hubo cambios.
3. Ajustar reglas particulares / superficies en la UI.
4. **Publicar** hacia proyectos o apps gobernadas.
5. Revisar **Deriva**: hash esperado (última publicación) vs hash observado (disco).
   - Republicar para alinear al canónico gobernado.
   - O reconocer/resolver si el cambio en disco fue intencional.

---

## 10. Identidad visual

Identidad Visual At-Once desde V1: base oscura, superficies pizarra, acento cian/azul, badge de versión, selector de idioma con bandera + `ES / PT / EN`, tokens CSS (sin hardcodes dispersos).

---

## 11. Multilengua

Idiomas: `es`, `pt`, `en`. Ningún texto de UI fuera del catálogo i18n.

---

## 12. Git y releases

- **Una sola rama de verdad:** `master`.
- Todo el producto (API, web, compose, docs) vive ahí.
- La versión de producto está en `VERSION`; el hash se hornea en la imagen API en build (`GIT_HASH`).
- La UI muestra `VERSION@GIT_HASH` vía `GET /health`.

---

## 13. Spec Kit

Spec Kit es herramienta de especificación/planificación en el repo. **No** forma parte del producto runtime, **no** es fuente de reglas y **no** gobierna proyectos.

---

## 14. Documentación de construcción

Detalle de implementación histórica/técnica:

- [docs/construccion-app.md](docs/construccion-app.md)

Si hay conflicto entre ese documento y este README, **prevalece este README (V3.0)**.
