# AI Rules Manager

**Versión documental:** V2.3  
**Estado:** definición funcional y arquitectónica inicial lista para implementación  
**Responsable arquitectónico:** Rol Arquitecto

---

## Bitácora de cambios

| Fecha | Versión | Cambio realizado | Motivo | Impacto |
|---|---|---|---|---|
| 2026-07-18 | V2.3 | Instalación Windows: `git clone` + `docker compose up`; `.env` base con `HOST_DRIVE_MAPPINGS=C:/+D:/` y `HOST_HOME_ROOT=${USERPROFILE}`; sin workspace. | Estándar Docker; discos base C/D. | Rama `master`. |
| 2026-07-17 | V2.2 | Se amplía el alcance para gobernar cualquier IA, app o agente que tenga artefactos de reglas gobernables. | Corregir la limitación implícita a un subconjunto de herramientas cuando el producto debe gobernar toda la superficie de IA usada por el operador. | La app pasa a ser un manager de reglas extensible para proyectos, aplicaciones dev, apps de IA y agentes con artefactos soportados. |
| 2026-07-17 | V2.1 | Se amplía el alcance para gobernar no solo proyectos sino también los artefactos de configuración de las aplicaciones dev instaladas. | Corregir la omisión de los archivos globales y locales que realmente consumen las IAs. | La app pasa a gobernar proyectos y aplicaciones dev, incluyendo AGENTS, CLAUDE, Cursor, Codex y Antigravity. |
| 2026-07-17 | V2.0 | Se redefine el proyecto como plataforma local de gobernanza de reglas para Claude Code, Cursor, Antigravity y Codex. | Alinear la documentación con la visión real del producto. | Queda documentado el objetivo, la arquitectura, el dashboard, el versionado y la instalación local en Docker. |
| 2026-07-17 | V1.3 | Se documenta el estado inicial del repositorio y la instalación de Spec Kit. | Preparar el proyecto. | Base documental inicial. |

---

## 1. Problema

Las IAs, apps y agentes consumen reglas en ubicaciones y formatos distintos, tanto dentro de los proyectos como en artefactos globales o locales de cada herramienta. Eso rompe la consistencia entre proyectos, dificulta propagar cambios transversales y vuelve opaco el estado real de sincronización.

El problema no es solo almacenar archivos. El problema es gobernar una política común de comportamiento y materializarla en formatos diferentes sin perder trazabilidad, precedencia ni control.

---

## 2. Objetivo del producto

Construir una aplicación web local, ejecutable en Docker, que permita gobernar reglas estándar y reglas particulares, versionarlas, traducirlas a los formatos consumidos por múltiples IAs y propagar esos resultados hacia tres clases de superficie administrada: proyectos gobernados, aplicaciones dev instaladas y cualquier app o agente de IA con artefactos gobernables soportados.

La aplicación debe permitir:

1. usar el repositorio como fuente canónica de reglas estándar;
2. registrar proyectos que serán gobernados por la app;
3. registrar aplicaciones dev instaladas y sus artefactos gobernables;
4. registrar apps y agentes de IA adicionales con artefactos gobernables;
5. administrar reglas particulares asociadas a cada proyecto;
6. administrar reglas o proyecciones específicas por superficie cuando corresponda;
7. detectar cambios en la fuente canónica;
8. crear nuevas versiones canónicas de reglas;
9. mostrar el estado de sincronización por proyecto, por aplicación, por agente y por IA;
10. publicar materializaciones por adaptador hacia cualquier IA o agente soportado;
11. permitir editar desde la app la ruta del archivo o directorio gobernado de cada agente o aplicación soportada;
12. detectar deriva, conflictos y errores antes de sobrescribir;
13. operar localmente como web autohospedada con instalación de un solo comando;
14. aplicar desde el inicio la Identidad Visual At-Once.

---

## 3. Principios del sistema

1. La unidad de sentido es la regla, no el archivo.
2. La carpeta `Reglas Estandar` es la fuente canónica del comportamiento estándar.
3. Cada cambio en `Reglas Estandar` genera una nueva versión canónica del conjunto completo.
4. Los proyectos gobernados, las aplicaciones dev instaladas y las apps o agentes de IA registrados no son la fuente de verdad; son superficies administradas.
5. Las reglas particulares pertenecen al proyecto o a la superficie administrada correspondiente y se administran desde la app.
6. Los adaptadores no gobiernan contenido; solo traducen y materializan.
7. La plataforma debe ser extensible a nuevas IAs y agentes sin rediseñar el modelo canónico de reglas.
8. Ninguna publicación debe ser ciega: toda propagación requiere plan, diff y estado.
9. La app debe operar completamente en ambiente local y persistir entre reinicios.

---

## 4. Alcance funcional de V1

La primera versión debe cubrir:

- dashboard de proyectos gobernados;
- dashboard de aplicaciones dev gobernadas;
- dashboard de apps y agentes gobernados;
- registro de nuevos directorios a gobernar;
- registro de instalaciones dev y sus artefactos gobernables;
- registro de apps y agentes de IA con artefactos gobernables;
- visualización de la versión canónica actual;
- listado de cambios pendientes por proyecto, aplicación y agente;
- edición de la ruta gobernada por artefacto cuando la ubicación cambie;
- administración de reglas particulares;
- composición de política efectiva por superficie;
- proyección por IA mediante adaptadores;
- publicación local hacia destinos configurados;
- registro de sincronización, deriva y errores;
- interfaz multilengua `es`, `pt`, `en`.

Queda fuera de V1:

- multiusuario remoto;
- autenticación externa;
- sincronización colaborativa entre varias máquinas sobre una misma base activa;
- despliegue SaaS;
- edición directa de reglas estándar desde la UI si eso compromete la fuente Git.

---

## 5. Fuente canónica

La fuente canónica del sistema es la carpeta:

```text
Reglas Estandar/
```

Características:

- contiene múltiples archivos de reglas estilo Cursor;
- puede crecer con nuevos archivos;
- cualquier alta, baja o edición crea una nueva versión canónica;
- el versionado aplica al snapshot completo, no a un archivo aislado;
- el repositorio es la autoridad de origen.

Las reglas particulares no viven en esta carpeta. Se administran por superficie desde la aplicación, ya sea proyecto gobernado, aplicación dev gobernada o app/agente gobernado.

## 5.1 Superficies gobernadas

La app debe gobernar tres clases de superficie:

1. `proyectos gobernados`
2. `aplicaciones dev gobernadas`
3. `apps y agentes gobernados`

Ejemplos de artefactos de aplicaciones dev que deben entrar al modelo:

- `C:\Users\<usuario>\.codex\AGENTS.md`
- `C:\Users\<usuario>\.codex\...` otros artefactos gobernables de Codex si se validan
- `CLAUDE.md` global o local consumido por Claude Code
- reglas de Cursor, incluyendo `.cursor/rules/`
- artefactos de Antigravity gobernables por adaptador
- artefactos de ChatGPT si existe una superficie gobernable soportada
- artefactos de Perplexity si existe una superficie gobernable soportada
- artefactos de Claude Chat si existe una superficie gobernable soportada
- artefactos de Gemini si existe una superficie gobernable soportada
- artefactos de Qwen si existe una superficie gobernable soportada
- artefactos de DeepSeek si existe una superficie gobernable soportada

Regla:

- gobernar solo los artefactos explícitamente registrados y soportados por cada adaptador;
- no asumir rutas inventadas;
- registrar alcance global vs local por cada artefacto.
- cualquier nueva IA o agente debe entrar al producto mediante un adaptador y un registro explícito de artefactos gobernables.
- la ruta efectiva de cada artefacto gobernado debe poder editarse desde la app.

---

## 6. Resultado esperado

El resultado esperado es que cualquier proyecto gobernado, aplicación dev gobernada o app/agente gobernado puedan operar bajo el mismo conjunto de comportamiento estándar, variando solo el motor, el formato final consumido por cada IA y el tipo de superficie materializada.

---

## 7. Stack técnico objetivo

Decisión arquitectónica inicial:

- monorepo: `npm workspaces`
- frontend: `Vue 3 + Vite + Vue Router + Pinia + vue-i18n`
- backend: `Node.js + TypeScript + Fastify`
- API local: HTTP JSON
- acceso a base local: `better-sqlite3`
- base de datos local: `SQLite`
- detección de cambios en `Reglas Estandar`: `polling`
- ejecución local: `Docker Compose`
- persistencia: volúmenes Docker

Motivos:

- `npm workspaces` simplifica el monorepo `apps/web` + `apps/api` sin agregar complejidad innecesaria.
- Vue es suficiente y económico para dashboard, tablas de estado y administración local.
- Fastify ofrece una capa HTTP JSON simple, rápida y amigable con TypeScript para una API local.
- `better-sqlite3` es suficiente para SQLite local y evita introducir un ORM pesado antes de tener complejidad real de dominio.
- SQLite es apropiado para una app local monousuario o de baja concurrencia operada dentro del entorno del usuario.
- `polling` es la estrategia inicial más simple y predecible para detectar cambios en la fuente canónica; se podrá reemplazar después por un watcher más sofisticado si hace falta.
- Docker Compose permite instalación reproducible y operación con un solo comando.

---

## 8. Instalación operativa (Windows)

```powershell
git clone https://github.com/mcandiav/ai-rules-manager.git
cd ai-rules-manager
docker compose up -d --build
```

- UI: `http://localhost:3002`
- API: `http://localhost:8002`

Home: `%USERPROFILE%`. Unidades de proyecto: **C:** y **D:**. Sin workspace global: proyectos uno a uno en la UI.

Mac/Linux: pendiente.

La instalación deja operativo:

- frontend web;
- backend API;
- base SQLite persistida;
- `Reglas Estandar` montada desde la carpeta de instalación;
- unidades **C:** y **D:** montadas para paths de proyecto;
- health checks mínimos.

---

## 9. Identidad visual

La app debe aplicar la `Identidad Visual At-Once` desde V1.

Referencias:

- `identidad visual at-once/README.md`
- `identidad visual at-once/tokens/colors.css`
- `identidad visual at-once/tokens/typography.css`
- `identidad visual at-once/tokens/components-lang.css`

Lineamientos mínimos:

- base visual oscura;
- superficies azul pizarra;
- acento cian/azul;
- badge de versión visible;
- selector de idioma obligatorio con bandera SVG + código `ES / PT / EN`;
- uso de tokens, no valores visuales hardcodeados dispersos.

---

## 10. Multilengua

Idiomas base del producto:

- español (`es`)
- portugués (`pt`)
- inglés (`en`)

La multilengua debe existir desde el inicio. Ningún texto de UI debe quedar incrustado sin pasar por el sistema de traducción.

---

## 11. Spec Kit

Spec Kit está instalado en este repositorio como herramienta de apoyo para especificación, planificación y tareas.

No forma parte del producto.

No es fuente de reglas.

No gobierna proyectos.

No define la arquitectura funcional del sistema por sí solo.

---

## 12. Documentación de construcción

La definición técnica para construir la app se encuentra en:

- [docs/construccion-app.md](/D:/MCP/workspace/AI%20Rules%20Manager/docs/construccion-app.md)

Ese documento es la referencia principal para implementación.
