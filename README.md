# AI Rules Manager

**Versión documental:** V3.1  
**Versión de producto:** ver archivo `VERSION` (badge UI = `VERSION@GIT_HASH`)  
**Estado:** operativo en Windows con Docker Compose  
**Repositorio:** https://github.com/mcandiav/ai-rules-manager  
**Rama única:** `master`  
**Responsable arquitectónico:** Rol Arquitecto

---

## Bitácora de cambios

| Fecha | Versión | Cambio realizado | Motivo | Impacto | Rol |
|---|---|---|---|---|---|
| 2026-07-18 | V3.1 | Se define la semántica neutral de reglas y la matriz de materialización por Cursor, Codex, Claude Code y Antigravity. | Evitar publicar todas las reglas en archivos planos y preservar `alwaysApply`, activación selectiva, reglas por ruta, skills y workflows según capacidad real de cada IA. | Programación debe rehacer los adaptadores para separar reglas permanentes de reglas selectivas y validar artefactos por plataforma. | Arquitecto |
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

## 6. Superficies gobernadas y semántica de reglas

1. **Proyectos** — se registran proyecto a proyecto con su path (`D:\...\mi-app`, etc.).
2. **Aplicaciones dev** — globales opt-in (gobernar / dejar de gobernar).
3. **Apps / agentes IA** — artefactos explícitos por adaptador.

### 6.1 Regla arquitectónica principal

La publicación no puede aplanar todas las reglas canónicas dentro de `AGENTS.md`, `CLAUDE.md` o `GEMINI.md`. Cada adaptador debe preservar la intención funcional de la regla según la capacidad real de la plataforma destino.

La metadata heredada de Cursor (`description`, `alwaysApply`, `globs`) no debe tratarse como decoración: debe convertirse a una semántica neutral interna y luego materializarse en el formato correspondiente de cada IA.

### 6.2 Modelo neutral obligatorio

Programación debe parsear el frontmatter de cada regla canónica y normalizarlo a este modelo lógico:

| Campo lógico | Origen actual | Uso |
|---|---|---|
| `id` | nombre del archivo sin extensión | Identificador estable de la regla. |
| `title` | primer H1 o nombre del archivo | Nombre humano. |
| `description` | frontmatter `description` | Descripción para selección por modelo, skill o rule registry. |
| `alwaysApply` | frontmatter `alwaysApply` | Determina si la regla debe estar siempre en contexto o pasar a mecanismo selectivo. |
| `globs` | frontmatter `globs` | Patrones de archivos/rutas cuando la plataforma soporta activación por path/glob. |
| `activation` | derivado | `always`, `glob`, `model_decision`, `manual`, `skill` o `workflow`. |
| `body` | Markdown sin frontmatter | Contenido real de la regla. |
| `sourcePath` | ruta canónica | Trazabilidad hacia `Reglas Estandar/`. |

Regla de derivación mínima:

| Condición | `activation` esperado |
|---|---|
| `alwaysApply: true` | `always` |
| `alwaysApply: false` con `globs` específicos distintos de `**/*` | `glob` |
| `alwaysApply: false` con `globs: ["**/*"]` y perfil/procedimiento invocable | `skill` o `model_decision` según plataforma |
| Flujo secuencial repetible | `workflow` cuando la plataforma lo soporte; si no, `skill` |
| Regla que solo debe aplicarse por pedido explícito | `manual` |

### 6.3 Clasificación vigente de reglas estándar

La evaluación inicial de `Reglas Estandar/` queda así:

| Regla | Estado canónico | Clasificación neutral | Motivo |
|---|---|---|---|
| `00-universal.md` | `alwaysApply: true` | `always` | Contrato base de conducta y seguridad de respuesta. |
| `01-roles.md` | `alwaysApply: true` | `always` | Define roles operativos que gobiernan la conversación. |
| `02-onboarding.md` | `alwaysApply: true` | `always` | Protocolo obligatorio al iniciar hilos. |
| `10-application-baseline.md` | `alwaysApply: true` | `always` | Estándar arquitectónico transversal para aplicaciones. |
| `10-gestion-comandos.md` | `alwaysApply: true` | `always` | Seguridad operativa para comandos; debe estar siempre disponible. |
| `10-protocolo-interaccion.md` | `alwaysApply: true` | `always` | Orden obligatorio de interacción. |
| `10-scope-and-sources.md` | `alwaysApply: true` | `always` | Control de alcance, fuentes y escritura. |
| `10-versioning.md` | `alwaysApply: true` | `always` | Fuente de versión y trazabilidad de release. |
| `20-chat-control.md` | `alwaysApply: true` | `always` | Pausa/resume y comandos de control deben ser reconocibles en todo momento. |
| `20-git-deploy.md` | `alwaysApply: true` | `always` | Reglas de Git/deploy y protección de ramas. |
| `20-verificacion-preventiva.md` | `alwaysApply: true` | `always` | VP antes de cambios sensibles. |
| `30-formatos-especificos.md` | `alwaysApply: true` | `always` | Formatos obligatorios por rol. |
| `10-agents.md` | `alwaysApply: false` | `skill` / `model_decision` | Perfil de salida para agentes/automatización; no debe contaminar todas las conversaciones humanas. |
| `10-analysis.md` | `alwaysApply: false` | `skill` / `model_decision` | Perfil de análisis/reporting; aplica cuando la tarea sea análisis, investigación o revisión. |
| `10-benchmark.md` | `alwaysApply: false` | `skill` / `manual` | Perfil minimalista de benchmark; debe activarse solo por tarea explícita o evaluación. |
| `10-coding.md` | `alwaysApply: false` | `skill` / `model_decision` | Perfil de programación/review; aplica cuando la tarea sea desarrollar, depurar, refactorizar o revisar código. |

### 6.4 Contrato de materialización por adaptador

#### Cursor

Cursor conserva la semántica más cercana al canónico actual.

| Regla neutral | Artefacto destino |
|---|---|
| `always` | `.cursor/rules/<id>.mdc` con `alwaysApply: true` |
| `glob` | `.cursor/rules/<id>.mdc` con `alwaysApply: false` y `globs` |
| `model_decision` | `.cursor/rules/<id>.mdc` con `alwaysApply: false`, `description` clara y `globs` si aplica |
| `manual` | `.cursor/rules/<id>.mdc` con `alwaysApply: false` y sin forzar carga automática |
| `skill` / `workflow` | Mantener como regla `.mdc` si Cursor no requiere otro artefacto específico; no mezclar en regla always-on |

#### Codex

Codex no debe recibir todas las reglas en `AGENTS.md`.

| Regla neutral | Artefacto destino |
|---|---|
| `always` | `AGENTS.md` del proyecto o `%USERPROFILE%\.codex\AGENTS.md` para globales |
| `skill` | `.agents/skills/<id>/SKILL.md` |
| `model_decision` | `.agents/skills/<id>/SKILL.md` con `description` precisa para activación implícita |
| `manual` | `.agents/skills/<id>/SKILL.md` invocable explícitamente por nombre |
| `glob` | Preferir `AGENTS.md` anidado en subdirectorios si el glob corresponde a una ruta estable; si no, skill con descripción de alcance |
| `workflow` | Skill con pasos secuenciales; no poner el procedimiento completo en `AGENTS.md` |

`AGENTS.md` debe contener un índice breve indicando que existen skills especializadas, pero no debe importar ni pegar el cuerpo completo de reglas selectivas.

#### Claude Code

Claude Code debe usar su ecosistema nativo en vez de un `CLAUDE.md` gigante.

| Regla neutral | Artefacto destino |
|---|---|
| `always` | `CLAUDE.md` o `.claude/CLAUDE.md` |
| `glob` | `.claude/rules/<id>.md` con frontmatter `paths` |
| `model_decision` | `.claude/rules/<id>.md` cuando sea restricción; `.claude/skills/<id>/SKILL.md` cuando sea procedimiento o perfil |
| `manual` | `.claude/skills/<id>/SKILL.md` con invocación explícita |
| `skill` | `.claude/skills/<id>/SKILL.md` |
| `workflow` | `.claude/skills/<id>/SKILL.md` o workflow/plugin si se adopta formalmente |

`CLAUDE.md` puede importar `AGENTS.md` solo si ese archivo ya está curado como núcleo always-on. No debe importar un `AGENTS.md` que contenga reglas selectivas aplanadas.

#### Antigravity

Antigravity no debe limitarse a `GEMINI.md`. Debe usar reglas y workflows nativos.

| Regla neutral | Artefacto destino |
|---|---|
| `always` | `.agents/rules/<id>.md` como Always On o `GEMINI.md` solo para núcleo global |
| `glob` | `.agents/rules/<id>.md` con activación Glob |
| `model_decision` | `.agents/rules/<id>.md` con activación Model Decision y descripción natural clara |
| `manual` | `.agents/rules/<id>.md` con activación Manual |
| `skill` | `.agents/skills/<id>/SKILL.md` si corresponde a habilidad invocable |
| `workflow` | workflow de Antigravity invocable por slash command |

`GEMINI.md` queda reservado para memoria/contexto global mínimo o compatibilidad. Las reglas con activación selectiva deben ir a `.agents/rules` o workflows.

### 6.5 Reglas de implementación para programación

1. El backend debe dejar de generar `AGENTS.md`, `CLAUDE.md` y `GEMINI.md` como concatenación completa de todas las reglas.
2. El plan de publicación debe mostrar artefactos separados por plataforma antes de escribirlos.
3. La deriva debe calcularse por artefacto generado, no solo por plataforma.
4. Cada artefacto generado debe registrar qué reglas canónicas lo componen.
5. Las reglas `always` deben mantener orden estable por nombre de archivo.
6. Las reglas selectivas deben conservar `description` porque varias plataformas la usan para decisión del modelo.
7. Si una plataforma no soporta una activación exacta, el adaptador debe degradar explícitamente al mecanismo más cercano y registrar advertencia en el plan de publicación.
8. No se permite degradar silenciosamente `alwaysApply: false` a regla always-on.
9. No se permite inventar rutas no documentadas: cada ruta debe estar en el registro del adaptador o ser configurable desde la UI.
10. La UI debe permitir ver la clasificación resultante de cada regla antes de publicar.

### 6.6 Criterios de aceptación para programación

La implementación se acepta solo si:

- `AGENTS.md`, `CLAUDE.md` y `GEMINI.md` ya no contienen reglas `alwaysApply: false` aplanadas.
- Cursor conserva archivos `.mdc` por regla con frontmatter correcto.
- Codex genera `AGENTS.md` solo con reglas `always` y genera skills para perfiles selectivos.
- Claude Code genera `CLAUDE.md` solo con reglas `always`, `.claude/rules` para reglas por path y `.claude/skills` para perfiles/procedimientos.
- Antigravity genera `.agents/rules` para reglas con activación nativa y workflows/skills cuando corresponda.
- El plan/diff de publicación muestra qué regla va a qué artefacto.
- La detección de deriva identifica cambios por archivo destino.
- Las reglas base listadas en la tabla 6.3 quedan clasificadas según esta documentación.

### 6.7 Fuentes técnicas externas usadas para esta decisión

- OpenAI Codex: `AGENTS.md` es guidance persistente; Skills complementan instrucciones reutilizables y cargan bajo demanda.
- Claude Code: `CLAUDE.md`, `.claude/rules` con `paths`, `.claude/skills`, hooks y subagents son mecanismos distintos con costos de contexto distintos.
- Gemini CLI: `GEMINI.md` soporta memoria jerárquica, imports y comandos custom, pero no reemplaza por sí solo una capa de reglas selectivas.
- Google Antigravity: reglas en `.agents/rules` soportan activación Manual, Always On, Model Decision y Glob; workflows son invocables por slash command.

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

Si hay conflicto entre ese documento y este README, **prevalece este README (V3.1)**.
