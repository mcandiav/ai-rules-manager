# Construcción de la App

## 1. Propósito de este documento

Este documento define lo necesario para que un programador construya `AI Rules Manager` sin reinterpretar el objetivo del producto.

La app es una plataforma local de gobernanza de reglas para proyectos, aplicaciones dev y apps o agentes de IA con artefactos gobernables.

No es un simple sincronizador de archivos.

Gobierna:

- fuente canónica;
- reglas particulares;
- versión canónica;
- precedencia;
- proyección por IA;
- sincronización;
- deriva;
- publicación;
- estado visible en dashboard.

---

## 2. Requisitos de producto

La app debe:

1. correr localmente como web;
2. instalarse y levantarse con un solo comando usando Docker Compose;
3. persistir estado entre reinicios;
4. permitir registrar proyectos a gobernar;
5. usar el repositorio como fuente canónica de reglas estándar;
6. administrar reglas particulares por proyecto o por superficie gobernada cuando corresponda;
7. versionar el snapshot completo de `Reglas Estandar`;
8. componer la política efectiva por superficie gobernada;
9. traducir esa política a formatos de cualquier IA, app o agente soportado;
10. propagar materializaciones a proyectos elegidos, aplicaciones dev registradas y agentes registrados;
11. mostrar estado de sincronía por proyecto, por aplicación, por agente y por IA;
12. permitir editar desde la app la ruta gobernada de cada artefacto soportado;
13. detectar conflicto y deriva;
14. ser multilengua en `es`, `pt`, `en`;
15. aplicar la Identidad Visual At-Once.

## 2.1 Superficies gobernadas

La app debe trabajar con tres tipos de superficie:

- `GovernedProject`
- `GovernedDevApplication`
- `GovernedAiSurface`

`GovernedDevApplication` representa una instalación o contexto de una herramienta dev cuyo comportamiento también debe gobernarse.

`GovernedAiSurface` representa una app, agente o contexto de IA adicional cuyos artefactos también deben gobernarse.

Ejemplos explícitos que deben entrar al alcance del producto:

- Codex global del usuario, incluyendo `C:\Users\<usuario>\.codex\AGENTS.md`
- Claude Code, incluyendo `CLAUDE.md` en ubicaciones soportadas
- Cursor, incluyendo `.cursor/rules/`
- Antigravity, en los artefactos que su adaptador soporte formalmente
- ChatGPT, Perplexity, Claude Chat, Gemini, Qwen, DeepSeek y otros, siempre que exista un adaptador y una superficie gobernable formalmente soportada

Regla:

- la app no gobierna "la IA en abstracto";
- gobierna los artefactos concretos que cada IA consume, tanto a nivel proyecto como a nivel instalación dev.
- ninguna IA entra al alcance operativo si no existe un artefacto gobernable explícito y soportado.
- la ruta efectiva del artefacto no es constante rígida del sistema; debe poder configurarse y corregirse desde la app.

---

## 3. Arquitectura lógica

Separar el sistema en cuatro módulos internos:

### 3.1 Rule Versioning

Responsabilidad:

- observar `Reglas Estandar`;
- calcular snapshot actual;
- detectar altas, bajas y cambios;
- crear una nueva versión canónica.

### 3.2 Policy Composition

Responsabilidad:

- mezclar reglas estándar con reglas particulares del proyecto;
- aplicar precedencia;
- producir la política efectiva del proyecto.

### 3.3 Adapter Projection

Responsabilidad:

- tomar la política efectiva;
- generar la salida específica de cada IA;
- definir rutas y archivos destino;
- preparar contenido listo para publicación.

### 3.4 Governance Tracking

Responsabilidad:

- registrar publicación;
- guardar hashes esperados y aplicados;
- detectar deriva;
- calcular estado del dashboard;
- conservar historial operativo.

También debe distinguir:

- sincronía de proyecto;
- sincronía de aplicación dev;
- sincronía de app o agente;
- sincronía por artefacto materializado.

---

## 4. Arquitectura técnica recomendada

### 4.0 Decisiones cerradas del arquitecto

Estas decisiones quedan definidas para V1 y no deben delegarse al programador:

- monorepo con `npm workspaces`
- backend HTTP con `Fastify`
- acceso SQLite con `better-sqlite3`
- detección de cambios por `polling`

Razón:

- minimizan complejidad operativa;
- encajan con una app local en Docker;
- evitan introducir infraestructura o abstracciones prematuras;
- dejan margen para evolucionar sin reescribir el modelo del dominio.

### 4.1 Frontend

Usar:

- `Vue 3`
- `Vite`
- `Vue Router`
- `Pinia`
- `vue-i18n`

Responsabilidad del frontend:

- dashboard;
- páginas de proyectos;
- vista de versiones;
- vista de reglas particulares;
- preview de publicación;
- historial y errores;
- configuración básica.

### 4.2 Backend

Usar:

- `Node.js`
- `TypeScript`
- `Fastify`
- API HTTP JSON

Responsabilidad del backend:

- exploración de archivos estándar;
- registro de proyectos;
- composición de políticas;
- generación de versiones;
- publicación;
- verificación de sincronía;
- persistencia;
- cola simple de operaciones locales si hace falta.

### 4.3 Base de datos

Usar inicialmente:

- `SQLite`
- `better-sqlite3`

Razón:

- app local;
- operación por usuario en su propio ambiente Docker;
- costo bajo de instalación y mantenimiento;
- sin necesidad de ORM pesado en V1;
- suficiente para V1.

Regla:

- no usar ORM en V1;
- el acceso a datos debe implementarse con una capa pequeña de repositorios sobre `better-sqlite3`;
- las migraciones deben ser explícitas y controladas por la propia app.

### 4.4 Contenedores

Servicios esperados en `compose.yaml`:

- `web`
- `api`
- opcionalmente un servicio de reverse proxy solo si realmente agrega valor

No agregar servicios innecesarios en V1.

SQLite debe vivir en volumen persistente.

### 4.5 Detección de cambios

La estrategia inicial para detectar cambios en `Reglas Estandar` será:

- `polling`

Razón:

- es más simple de implementar y operar dentro de Docker;
- evita depender en V1 de watchers más frágiles o dependientes del host;
- es suficiente para una herramienta local de gobernanza.

Reglas:

- el polling debe poder ejecutarse manualmente y también periódicamente;
- debe recalcular snapshot solo cuando detecte cambios relevantes en archivos;
- la frecuencia debe quedar configurable;
- la arquitectura debe permitir reemplazar esta estrategia por watcher en una versión futura.

---

## 5. Estructura de carpetas objetivo

```text
AI Rules Manager/
├── README.md
├── docs/
│   └── construccion-app.md
├── Reglas Estandar/
├── apps/
│   ├── web/
│   └── api/
├── data/
│   ├── sqlite/
│   ├── registry/
│   └── exports/
├── docker/
│   ├── web/
│   └── api/
├── identidad visual at-once/
└── compose.yaml
```

Notas:

- `Reglas Estandar/` es fuente canónica y debe poder ser observada por la app.
- `data/` concentra persistencia local y artefactos generados por la propia app.
- `apps/web` y `apps/api` separan frontend y backend.
- el monorepo debe gestionarse con `npm workspaces`.

### 5.1 Scaffold físico obligatorio de Fase 1

El programador no debe decidir libremente la estructura base. Debe crear exactamente este scaffold inicial:

```text
AI Rules Manager/
├── README.md
├── compose.yaml
├── package.json
├── .gitignore
├── .env.example
├── docs/
│   └── construccion-app.md
├── Reglas Estandar/
│   ├── README.md
│   └── global/
│       └── README.md
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── app.ts
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrate.ts
│   │   │   │   └── migrations/
│   │   │   │       └── 001_initial.sql
│   │   │   ├── modules/
│   │   │   │   ├── health/
│   │   │   │   │   └── routes.ts
│   │   │   │   ├── canonical-rules/
│   │   │   │   ├── projects/
│   │   │   │   ├── policies/
│   │   │   │   ├── adapters/
│   │   │   │   └── sync/
│   │   │   ├── lib/
│   │   │   │   ├── hashing.ts
│   │   │   │   ├── paths.ts
│   │   │   │   └── clock.ts
│   │   │   └── types/
│   │   │       └── domain.ts
│   │   └── tests/
│   │       └── health.test.ts
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── public/
│       │   └── flags/
│       │       ├── es.svg
│       │       ├── br.svg
│       │       └── us.svg
│       └── src/
│           ├── main.ts
│           ├── App.vue
│           ├── router/
│           │   └── index.ts
│           ├── stores/
│           │   ├── app.ts
│           │   └── dashboard.ts
│           ├── i18n/
│           │   ├── index.ts
│           │   └── locales/
│           │       ├── es.json
│           │       ├── pt.json
│           │       └── en.json
│           ├── styles/
│           │   ├── tokens.css
│           │   ├── base.css
│           │   └── components-lang.css
│           ├── components/
│           │   ├── layout/
│           │   ├── dashboard/
│           │   └── lang/
│           ├── views/
│           │   ├── DashboardView.vue
│           │   ├── ProjectsView.vue
│           │   ├── VersionsView.vue
│           │   └── SettingsView.vue
│           └── api/
│               └── client.ts
├── data/
│   ├── sqlite/
│   │   └── .gitkeep
│   ├── registry/
│   │   └── .gitkeep
│   └── exports/
│       └── .gitkeep
├── docker/
│   ├── api/
│   │   └── Dockerfile
│   └── web/
│       └── Dockerfile
└── identidad visual at-once/
```

### 5.2 Archivos raíz obligatorios

Estos archivos deben existir desde Fase 1:

- `compose.yaml`
- `package.json`
- `.gitignore`
- `.env.example`
- `README.md`

Reglas:

- `compose.yaml` debe levantar `api` y `web`;
- `package.json` raíz debe declarar `npm workspaces`;
- `.env.example` debe enumerar solo variables necesarias para operación local;
- `.gitignore` debe excluir `node_modules`, archivos de build, base SQLite real y temporales;
- no se debe introducir configuración secreta en el repo.

### 5.3 Contenido mínimo obligatorio por archivo raíz

#### `package.json` raíz

Debe incluir:

- `private: true`
- `workspaces: ["apps/*"]`
- scripts raíz para:
  - instalar dependencias
  - levantar desarrollo
  - ejecutar tests
  - lint si se incorpora

#### `compose.yaml`

Debe definir:

- servicio `api`
- servicio `web`
- volúmenes persistentes para `data/sqlite`
- puertos locales documentados
- health check mínimo para `api`
- dependencias entre servicios solo si son realmente necesarias

No debe incluir:

- PostgreSQL
- Redis
- Nginx
- colas externas

#### `.env.example`

Debe incluir al menos:

- puerto API
- puerto web
- ruta del archivo SQLite
- intervalo de polling
- modo de entorno

#### `.gitignore`

Debe excluir al menos:

- `node_modules/`
- `dist/`
- `.env`
- `data/sqlite/*.db`
- `coverage/`
- archivos temporales del sistema

### 5.4 Backend: archivos obligatorios y responsabilidad

#### `apps/api/src/server.ts`

Responsabilidad:

- iniciar el proceso HTTP;
- leer configuración;
- levantar Fastify;
- escuchar en el puerto local configurado.

#### `apps/api/src/app.ts`

Responsabilidad:

- construir la instancia de Fastify;
- registrar plugins internos;
- registrar rutas base;
- exponer la app para tests.

#### `apps/api/src/config/env.ts`

Responsabilidad:

- validar variables de entorno;
- devolver configuración tipada;
- definir defaults razonables para ambiente local.

#### `apps/api/src/db/client.ts`

Responsabilidad:

- inicializar `better-sqlite3`;
- abrir conexión contra la ruta configurada;
- exponer cliente reutilizable.

#### `apps/api/src/db/migrate.ts`

Responsabilidad:

- ejecutar migraciones SQL pendientes al arrancar;
- registrar versión de esquema actual.

#### `apps/api/src/db/migrations/001_initial.sql`

Debe crear la base inicial mínima para:

- versiones canónicas;
- archivos canónicos;
- proyectos;
- reglas particulares;
- políticas efectivas;
- proyecciones;
- targets;
- registros de sincronía;
- drift;
- operaciones de publicación.

#### `apps/api/src/modules/health/routes.ts`

Debe exponer:

- `GET /health`

Respuesta mínima:

- estado general;
- timestamp;
- versión de aplicación si ya existe;
- confirmación de acceso a SQLite.

#### `apps/api/src/modules/canonical-rules/`

Debe contener desde Fase 1:

- servicio de escaneo de `Reglas Estandar`
- cálculo de hash
- detección de cambios
- creación de `CanonicalVersion`

#### `apps/api/src/modules/projects/`

Debe contener desde Fase 1:

- alta de proyecto;
- listado de proyectos;
- validación de ruta;
- detección inicial de targets conocidos.

#### `apps/api/src/modules/policies/`

Debe contener desde Fase 1:

- composición de política efectiva;
- resolución de precedencia base.

#### `apps/api/src/modules/adapters/`

Debe contener desde Fase 1:

- contrato común de adaptador;
- stubs de Claude Code, Cursor, Antigravity y Codex;
- al menos un adaptador real end-to-end antes de cerrar V1.

#### `apps/api/src/modules/sync/`

Debe contener desde Fase 1:

- planificación de publicación;
- verificación posterior a escritura;
- actualización de estados de sincronía.

### 5.5 Frontend: archivos obligatorios y responsabilidad

#### `apps/web/src/main.ts`

Responsabilidad:

- bootstrap de Vue;
- montaje de router, Pinia e i18n;
- carga de estilos base.

#### `apps/web/src/App.vue`

Responsabilidad:

- layout raíz;
- navegación principal;
- shell de la app.

#### `apps/web/src/router/index.ts`

Debe declarar desde Fase 1:

- dashboard
- proyectos
- versiones
- configuración

#### `apps/web/src/stores/app.ts`

Responsabilidad:

- idioma activo;
- estado global de app;
- versión visible si existe.

#### `apps/web/src/stores/dashboard.ts`

Responsabilidad:

- resumen global;
- proyectos;
- estados por IA;
- refresh manual.

#### `apps/web/src/i18n/locales/*.json`

Deben existir desde Fase 1:

- `es.json`
- `pt.json`
- `en.json`

Regla:

- no dejar textos de interfaz fuera de estos catálogos salvo contenido técnico dinámico.

#### `apps/web/src/styles/tokens.css`

Debe centralizar la adaptación local de tokens At-Once consumidos por la app.

#### `apps/web/src/styles/components-lang.css`

Debe implementar el selector canónico de idioma según `identidad visual at-once`.

#### `apps/web/src/views/DashboardView.vue`

Debe existir desde Fase 1 con:

- resumen de estado global;
- tabla inicial de proyectos;
- indicadores de pendientes, conflictos y deriva.

#### `apps/web/src/views/ProjectsView.vue`

Debe existir desde Fase 1 con:

- listado de proyectos;
- acción de registrar proyecto;
- estado general por fila.

#### `apps/web/src/views/VersionsView.vue`

Debe existir desde Fase 1 con:

- listado de versiones canónicas;
- diff resumido por versión.

#### `apps/web/src/views/SettingsView.vue`

Debe existir desde Fase 1 con:

- idioma;
- configuración operativa mínima visible;
- estado de entorno local.

### 5.6 Recursos visuales obligatorios

El frontend debe incluir desde Fase 1:

- assets de banderas `es.svg`, `br.svg`, `us.svg`
- tokens visuales At-Once integrados localmente
- soporte para badge de versión

Regla:

- no enlazar banderas por CDN externo;
- no reemplazar el selector canónico por texto simple o emoji.

### 5.7 Carpetas que deben existir aunque estén vacías

Deben crearse desde el inicio:

- `data/sqlite/`
- `data/registry/`
- `data/exports/`
- `apps/api/src/modules/canonical-rules/`
- `apps/api/src/modules/projects/`
- `apps/api/src/modules/policies/`
- `apps/api/src/modules/adapters/`
- `apps/api/src/modules/sync/`
- `apps/web/src/components/layout/`
- `apps/web/src/components/dashboard/`
- `apps/web/src/components/lang/`

Si no tienen contenido aún, deben quedar con `.gitkeep` o archivo equivalente.

### 5.8 Decisiones prohibidas al programador en Fase 1

El programador no debe cambiar por cuenta propia:

- `Fastify` por otro framework backend
- `SQLite` por otra base
- `better-sqlite3` por ORM
- `polling` por watcher complejo
- `Vue` por otro framework frontend
- `npm workspaces` por otra estrategia de monorepo
- estructura `apps/api` y `apps/web`
- selector de idioma canónico At-Once
- base visual oscura At-Once

---

## 6. Modelo del dominio

### 6.1 StandardRuleSet

Representa la fuente canónica estándar.

Campos mínimos:

- `id`
- `name`
- `rootPath`
- `currentVersionId`

Restricción:

- debe existir una sola fuente canónica activa.

### 6.2 CanonicalVersion

Representa un snapshot completo de `Reglas Estandar`.

Campos mínimos:

- `id`
- `versionNumber`
- `createdAt`
- `globalHash`
- `status`
- `changeSummary`

Regla:

- cualquier alta, baja o edición crea una nueva versión.

### 6.3 CanonicalRuleFile

Representa un archivo individual dentro de una versión.

Campos mínimos:

- `id`
- `canonicalVersionId`
- `relativePath`
- `contentHash`
- `content`

### 6.4 GovernedProject

Representa un proyecto registrado en la app.

Campos mínimos:

- `id`
- `name`
- `rootPath`
- `governanceStatus`
- `createdAt`
- `lastSeenAt`

Restricción:

- `rootPath` debe ser único.

### 6.4.b GovernedDevApplication

Representa una instalación, perfil o contexto gobernable de una aplicación dev.

Campos mínimos:

- `id`
- `name`
- `platform`
- `scope`
- `rootPath`
- `status`
- `createdAt`

Ejemplos de `scope`:

- `global_user`
- `workspace_local`
- `project_local`

### 6.4.c GovernedArtifact

Representa un artefacto concreto consumido por una IA o app dev.

Campos mínimos:

- `id`
- `ownerType`
- `ownerId`
- `platform`
- `artifactType`
- `targetPath`
- `managed`
- `lastObservedHash`
- `configuredPath`
- `pathSource`
- `pathUpdatedAt`

Ejemplos de `artifactType`:

- `codex_agents`
- `claude_md`
- `cursor_rules_dir`
- `cursor_rule_file`
- `antigravity_rules`
- `chatgpt_rules`
- `perplexity_rules`
- `claude_chat_rules`
- `gemini_rules`
- `qwen_rules`
- `deepseek_rules`

### 6.4.d GovernedAiSurface

Representa una app, agente o contexto adicional de IA con artefactos gobernables.

Campos mínimos:

- `id`
- `name`
- `platform`
- `scope`
- `rootPath`
- `status`
- `createdAt`
- `adapterKey`

### 6.5 ProjectRule

Representa una regla particular de una superficie gobernada.

Campos mínimos:

- `id`
- `ownerType`
- `ownerId`
- `ruleKey`
- `title`
- `content`
- `precedenceMode`
- `updatedAt`
- `isActive`

### 6.6 EffectivePolicy

Resultado de combinar estándar y particulares para una superficie gobernada.

Campos mínimos:

- `id`
- `ownerType`
- `ownerId`
- `canonicalVersionId`
- `policyHash`
- `generatedAt`

### 6.7 Adapter

Traductor por IA.

Campos mínimos:

- `id`
- `platform`
- `outputFormat`
- `targetKind`
- `enabled`

Plataformas base:

- `claude_code`
- `cursor`
- `antigravity`
- `codex`

### 6.8 Projection

Salida concreta generada para una IA.

Campos mínimos:

- `id`
- `effectivePolicyId`
- `adapterId`
- `outputHash`
- `renderedContent`
- `generatedAt`

### 6.9 ProjectTarget

Destino concreto dentro de una superficie gobernada para una IA.

Campos mínimos:

- `id`
- `ownerType`
- `ownerId`
- `platform`
- `targetPath`
- `managed`

### 6.10 SynchronizationRecord

Estado de sincronía de una materialización.

Campos mínimos:

- `id`
- `projectTargetId`
- `canonicalVersionId`
- `expectedHash`
- `appliedHash`
- `syncStatus`
- `syncedAt`

### 6.11 DriftEvent

Desviación detectada entre lo esperado y lo observado.

Campos mínimos:

- `id`
- `projectTargetId`
- `expectedHash`
- `observedHash`
- `detectedAt`
- `status`

### 6.12 PublishOperation

Registro auditable de una publicación.

Campos mínimos:

- `id`
- `scopeType`
- `scopeId`
- `startedAt`
- `finishedAt`
- `result`
- `triggeredBy`

## 6.13 Artefactos gobernables iniciales

La V1 debe contemplar explícitamente estos artefactos como parte del modelo:

- proyecto: `AGENTS.md`
- proyecto: `CLAUDE.md` si existe en el alcance soportado
- proyecto: `.cursor/rules/*`
- aplicación dev global: `C:\Users\<usuario>\.codex\AGENTS.md`
- aplicación dev global: artefactos Codex adicionales solo si el adaptador los soporta formalmente
- aplicación dev local/global de Claude Code: `CLAUDE.md` en rutas soportadas
- aplicación dev local/global de Cursor: `.cursor/rules/*`
- aplicación dev de Antigravity: archivos o carpetas que su adaptador declare compatibles
- cualquier artefacto de ChatGPT, Perplexity, Claude Chat, Gemini, Qwen, DeepSeek u otra IA, solo cuando el adaptador declare formalmente su ruta, formato y semántica

Reglas:

- no modelar un artefacto sin conocer su ruta y semántica;
- cada artefacto debe quedar registrado con `scope`, `platform`, `artifactType` y `targetPath`;
- proyecto y aplicación dev pueden compartir reglas canónicas, pero no necesariamente comparten el mismo artefacto de salida.
- una IA nueva debe entrar por configuración de adaptador, no por parches ad hoc al modelo.
- el `targetPath` inicial puede venir sugerido por adaptador, pero la ruta final debe ser editable desde la app.

---

## 7. Precedencia de reglas

La política efectiva por proyecto se calcula así:

1. tomar la versión canónica activa;
2. agregar reglas particulares del proyecto;
3. resolver precedencia;
4. generar política efectiva;
5. proyectar por IA.

`precedenceMode` debe soportar al menos:

- `extend`
- `replace`
- `disable`

Reglas:

- `replace` reemplaza el comportamiento estándar equivalente;
- `extend` agrega comportamiento sobre la base estándar;
- `disable` excluye una regla estándar para ese proyecto;
- si la composición no puede resolverse de forma determinista, el estado debe ser `conflict`.

---

## 8. Estados del sistema

### 8.1 Estado del proyecto

- `adopting`
- `active`
- `paused`
- `error`

### 8.2 Estado del destino por IA

- `up_to_date`
- `pending_publish`
- `outdated`
- `drifted`
- `conflict`
- `publish_error`
- `disabled`

### 8.3 Estado de la versión canónica

- `detected`
- `ready`
- `published_partial`
- `published_complete`

### 8.4 Estado del drift

- `open`
- `acknowledged`
- `resolved`

---

## 9. Flujos funcionales

### 9.1 Alta de proyecto nuevo

1. registrar nombre y ruta local;
2. detectar si ya existen archivos de reglas en el proyecto;
3. registrar targets posibles por IA;
4. marcar estado inicial.

Si no existen materializaciones previas:

- estado inicial recomendado: `active` + destinos `pending_publish`.

### 9.2 Adopción de proyecto existente

1. registrar ruta;
2. leer archivos existentes ligados a cada IA;
3. comparar con la política efectiva esperada;
4. clasificar.

Resultados posibles:

- `up_to_date`
- `outdated`
- `drifted`
- `conflict`

La app no debe sobrescribir automáticamente un proyecto adoptado con deriva.

### 9.2.b Registro de aplicación dev

1. registrar plataforma y alcance;
2. registrar artefactos concretos gobernables;
3. validar existencia y permisos de lectura/escritura;
4. comparar estado observado contra política efectiva esperada;
5. clasificar sincronía por artefacto.

Resultados posibles:

- `up_to_date`
- `outdated`
- `drifted`
- `conflict`
- `unsupported`

### 9.2.c Registro de app o agente de IA

1. registrar plataforma y adaptador;
2. registrar artefactos concretos gobernables;
3. validar existencia y permisos de lectura/escritura cuando aplique;
4. comparar estado observado contra política efectiva esperada;
5. clasificar sincronía por artefacto.

Resultados posibles:

- `up_to_date`
- `outdated`
- `drifted`
- `conflict`
- `unsupported`

### 9.2.d Reconfiguración de ruta de artefacto

La app debe permitir editar la ruta gobernada de un artefacto cuando:

- una actualización del producto cambie el directorio por defecto;
- el usuario use una instalación no estándar;
- existan múltiples perfiles o ubicaciones posibles;
- la ruta sugerida por adaptador quede obsoleta.

Flujo mínimo:

1. mostrar ruta actual configurada;
2. mostrar si la ruta es sugerida por adaptador o personalizada;
3. permitir editarla desde UI;
4. validar existencia y permisos;
5. guardar nueva ruta;
6. relanzar verificación de sincronía sobre el artefacto.

### 9.3 Cambio en `Reglas Estandar`

1. detectar cambio;
2. calcular nuevo snapshot;
3. crear nueva `CanonicalVersion`;
4. recalcular proyectos afectados;
5. marcar destinos `pending_publish`.

### 9.4 Cambio en reglas particulares

1. editar regla desde UI;
2. regenerar `EffectivePolicy` del proyecto;
3. reproyectar sus destinos;
4. marcar pendientes solo para ese proyecto.

### 9.5 Publicación

1. seleccionar proyectos o destinos;
2. mostrar plan;
3. confirmar;
4. generar proyecciones;
5. escribir archivos;
6. verificar hash escrito;
7. registrar sincronización;
8. registrar operación.

### 9.6 Verificación de deriva

1. releer archivos gobernados;
2. recalcular hash observado;
3. comparar con `expectedHash`;
4. crear `DriftEvent` si difiere.

---

## 10. Dashboard

El dashboard inicial debe mostrar:

- versión canónica actual;
- cantidad de proyectos gobernados;
- cantidad de aplicaciones dev gobernadas;
- cantidad de apps o agentes gobernados;
- cantidad de proyectos pendientes;
- cantidad de aplicaciones pendientes;
- cantidad de agentes pendientes;
- cantidad de conflictos;
- cantidad de destinos con deriva;
- últimas publicaciones;
- tabla de proyectos.

Tabla mínima de proyectos:

- nombre;
- ruta local;
- versión esperada;
- estado general;
- estado por Claude Code;
- estado por Cursor;
- estado por Antigravity;
- estado por Codex;
- última publicación.

Debe permitir:

- entrar al detalle del proyecto;
- entrar al detalle de la aplicación dev;
- entrar al detalle del agente o app de IA;
- registrar proyecto nuevo;
- registrar aplicación dev;
- registrar app o agente;
- editar la ruta de un artefacto gobernado;
- filtrar por estado;
- lanzar publicación;
- inspeccionar conflictos.

---

## 11. Pantallas mínimas

### 11.1 Dashboard

Resumen ejecutivo de estado global.

### 11.2 Proyectos

Listado y alta de proyectos gobernados.

### 11.2.b Aplicaciones dev

Listado y alta de aplicaciones dev gobernadas.

### 11.2.c Apps y agentes

Listado y alta de apps y agentes gobernados.

### 11.3 Detalle de proyecto

Debe mostrar:

- ruta;
- reglas particulares;
- versión canónica esperada;
- estado por IA;
- historial;
- acciones de publicación.

### 11.4 Versiones

Listado de versiones canónicas con diff resumido.

### 11.5 Publicación

Vista previa del plan antes de escribir.

### 11.6 Configuración

Rutas, preferencias operativas e idioma.

### 11.7 Configuración de artefactos

Pantalla o sección obligatoria para:

- listar artefactos gobernados;
- ver ruta configurada actual;
- distinguir ruta sugerida vs personalizada;
- editar ruta;
- revalidar artefacto;
- ver último error de acceso si existe.

---

## 12. Adaptadores

Cada adaptador debe definir:

- plataforma;
- formato de salida;
- archivos objetivo;
- reglas de composición final;
- validación básica;
- estrategia de escritura.

Interfaz lógica esperada:

1. `resolveTargets(project)`
2. `render(policy)`
3. `validate(output)`
4. `write(targets, output)`
5. `verify(targets, expectedHash)`

Regla:

- ningún adaptador decide precedencia normativa;
- ningún adaptador escribe fuera de sus targets registrados;
- ninguna publicación debe omitir verificación posterior.
- cada adaptador debe distinguir entre targets de proyecto y targets de aplicación dev.
- cada adaptador debe poder declarar targets de app o agente cuando existan.

### 12.1 Targets explícitos mínimos por plataforma

La arquitectura debe prever, al menos, estos targets:

- `codex_project_agents`
- `codex_global_agents`
- `claude_project_md`
- `claude_global_md`
- `cursor_project_rules`
- `cursor_global_rules` si existe un alcance soportado
- `antigravity_project_rules`
- `antigravity_global_rules` si existe un alcance soportado
- `chatgpt_rules`
- `perplexity_rules`
- `claude_chat_rules`
- `gemini_rules`
- `qwen_rules`
- `deepseek_rules`

Cada target debe poder declarar:

- ruta sugerida por adaptador;
- ruta configurada efectiva;
- capacidad de edición desde la UI.

---

## 13. Persistencia

Persistir como mínimo:

- proyectos;
- aplicaciones dev gobernadas;
- apps y agentes gobernados;
- artefactos gobernados;
- rutas configuradas por artefacto;
- reglas particulares;
- versiones canónicas detectadas;
- archivos canónicos indexados;
- políticas efectivas generadas;
- proyecciones;
- estados de sincronía;
- deriva;
- operaciones de publicación;
- preferencias locales.

No persistir secretos innecesarios.

Si un target requiere credenciales en el futuro, documentar el mecanismo aparte.

---

## 14. Docker y operación local

Objetivo de comando único:

```text
docker compose up -d
```

Requisitos de diseño:

- compose en raíz;
- volúmenes persistentes;
- health check para API;
- dependencia ordenada entre servicios si aplica;
- puerto local documentado;
- ruta de datos persistida fuera del contenedor.

La app debe quedar accesible como web local tras levantar la pila.

El backend debe exponer un health endpoint simple, por ejemplo:

- `GET /health`

---

## 15. Multilengua

Idiomas base:

- `es`
- `pt`
- `en`

Requisitos:

- usar `vue-i18n`;
- no hardcodear textos de interfaz;
- selector visual canónico At-Once;
- recordar idioma elegido localmente;
- accesibilidad mínima en el selector.

---

## 16. Identidad Visual At-Once

La app debe implementar desde V1:

- paleta At-Once;
- tipografía At-Once;
- badge de versión visible;
- selector de idioma canónico;
- fondo oscuro y superficies azul pizarra;
- acento cian/azul.

Fuentes canónicas:

- `identidad visual at-once/README.md`
- `identidad visual at-once/tokens/colors.css`
- `identidad visual at-once/tokens/typography.css`
- `identidad visual at-once/tokens/components-lang.css`

Aplicar tokens visuales centralizados. No duplicar colores corporativos como literales dispersos.

---

## 17. Invariantes

Estas reglas no deben romperse:

1. solo existe una fuente canónica estándar activa;
2. cada versión canónica representa un snapshot completo;
3. un proyecto gobernado tiene una ruta única;
4. una proyección siempre deriva de una política efectiva concreta;
5. `up_to_date` exige igualdad entre hash esperado y aplicado;
6. un drift no se cierra sin resolución o republicación;
7. un adaptador traduce, no gobierna;
8. ninguna publicación ocurre sin plan visible;
9. ninguna IA debe quedar con un set normativo arbitrario si el proyecto está gobernado.

---

## 18. Orden recomendado de implementación

### Fase 1

- estructura base del monorepo;
- backend mínimo;
- lectura de `Reglas Estandar`;
- generación de `CanonicalVersion`;
- SQLite;
- Docker Compose operativo.

### Fase 2

- registro de proyectos;
- reglas particulares;
- política efectiva;
- dashboard básico.

### Fase 3

- adaptadores;
- publicación;
- verificación;
- estados de sincronía.

### Fase 4

- deriva;
- historial;
- filtros avanzados;
- refinamiento visual completo.

---

## 19. Criterios mínimos de aceptación de V1

La V1 cumple si:

1. levanta con Docker Compose en un solo comando;
2. expone una web local operativa;
3. detecta cambios en `Reglas Estandar`;
4. crea nuevas versiones canónicas;
5. permite registrar proyectos;
6. permite registrar aplicaciones dev gobernadas;
7. permite registrar apps y agentes gobernados;
8. permite crear y editar reglas particulares;
9. calcula política efectiva por superficie;
10. muestra estado por proyecto, aplicación, agente y por IA;
11. permite editar desde la UI la ruta de un artefacto gobernado;
12. publica al menos a un adaptador real end-to-end;
13. registra sincronización y detecta deriva básica;
14. soporta `es`, `pt`, `en`;
15. aplica la Identidad Visual At-Once.

---

## 20. Preguntas todavía abiertas

Estas preguntas deben responderse antes de cerrar la implementación completa:

1. rutas finales exactas de cada IA en Windows y otros entornos;
2. formato preciso de salida para cada adaptador;
3. política exacta de edición de reglas estándar desde la UI o fuera de ella;
4. si Antigravity tendrá paridad total en V1 o un adaptador inicial limitado;
5. formato y granularidad del diff mostrado antes de publicar;
6. qué targets globales adicionales de Codex, Claude, Cursor y Antigravity se considerarán oficialmente soportados en V1;
7. qué superficies soportadas reales existirán en V1 para ChatGPT, Perplexity, Claude Chat, Gemini, Qwen, DeepSeek y otras IAs.

---

## 21. Resumen ejecutivo para el programador

Construir una app local en Docker con frontend Vue y backend Node que:

- lea `Reglas Estandar` como fuente canónica;
- cree versiones del snapshot completo;
- registre proyectos gobernados y aplicaciones dev gobernadas;
- registre apps y agentes gobernados;
- administre reglas particulares;
- componga política efectiva por superficie;
- traduzca a Claude Code, Cursor, Antigravity, Codex y cualquier otra IA soportada por adaptador;
- publique esos resultados sobre proyecto, aplicaciones dev y agentes;
- muestre sincronía y deriva en un dashboard multilengua;
- use `Fastify` como framework backend;
- use `better-sqlite3` sobre `SQLite` sin ORM en V1;
- use `polling` para detectar cambios en la fuente canónica;
- se organice como monorepo con `npm workspaces`;
- aplique la Identidad Visual At-Once.
