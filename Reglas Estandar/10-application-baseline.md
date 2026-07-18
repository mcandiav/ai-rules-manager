---
description: Estándar base de arquitectura, plataforma y despliegue para aplicaciones
alwaysApply: false
---

# Estándar base de aplicaciones

## Objetivo

Definir la arquitectura tecnológica predeterminada para nuevas aplicaciones y para evoluciones relevantes de aplicaciones existentes. El estándar busca uniformidad, portabilidad, despliegue reproducible, seguridad y operación simple.

## Niveles de aplicación

- **Obligatorio:** debe cumplirse salvo excepción arquitectónica aprobada.
- **Predeterminado:** debe utilizarse cuando el componente sea necesario.
- **Condicional:** solo se incorpora cuando existe una necesidad funcional u operativa demostrable.
- **Excepción:** cualquier alternativa debe documentar motivo, impacto, riesgos, responsable y aprobación.

## Arquitectura obligatoria

- Diseñar toda aplicación para ejecución en contenedores Docker.
- Mantener imágenes reproducibles, configuración externa y dependencias declaradas.
- Separar frontend y backend cuando exista interfaz web y lógica de negocio independiente.
- Exponer la comunicación del backend mediante una API HTTP con contrato explícito.
- Evitar acceso directo del frontend a bases de datos, Redis, secretos o servicios internos.
- Diseñar el despliegue principal para Easypanel, sin acoplar la lógica de aplicación a Easypanel.
- Mantener la aplicación portable a otro entorno Docker compatible.
- Separar código, configuración, secretos, datos persistentes y artefactos generados.
- Proveer verificaciones de salud para los servicios que deban ser supervisados.
- Registrar decisiones y excepciones en la documentación oficial del proyecto.
- Siempre utilizar las ultimas versiones estables.

## Plataforma predeterminada

### Frontend

- Usar Vue para interfaces web nuevas.
- Mantener el frontend como servicio independiente cuando exista backend.
- Consumir exclusivamente contratos públicos de la API HTTP.
- No incorporar Vue cuando el proyecto no requiera interfaz web.
- Diseñar toda interfaz de usuario como multilenguaje desde la primera versión, aunque inicialmente solo se publique un idioma.
- No escribir textos visibles para el usuario directamente en componentes, vistas o lógica de negocio; usar claves y catálogos de traducción centralizados.
- Definir un idioma predeterminado y un idioma de respaldo explícitos.
- Permitir selección persistente de idioma cuando la aplicación tenga usuarios identificados o preferencias locales.
- Formatear fechas, horas, números, monedas, porcentajes y zonas horarias mediante capacidades de internacionalización, no mediante concatenación manual.
- Mantener los códigos de error y estados de API independientes del idioma; la presentación localizada corresponde al frontend o a la capa de salida apropiada.
- Incluir en las pruebas al menos el idioma predeterminado, el mecanismo de respaldo y la ausencia de claves de traducción visibles al usuario.

### Backend

- Implementar la lógica de negocio y las integraciones en un servicio backend independiente.
- Mantener una frontera clara entre transporte HTTP, casos de uso, dominio e infraestructura.
- No mezclar responsabilidades del frontend con procesos de backend.
- Publicar contratos, errores y estados HTTP de forma consistente.

### Persistencia relacional

- PostgreSQL y MariaDB son los motores relacionales aprobados por el estándar base.
- Para aplicaciones nuevas sin una dependencia previa, preferir PostgreSQL como primera alternativa de evaluación.
- Usar MariaDB cuando exista compatibilidad requerida, continuidad con una solución existente, experiencia operativa comprobada o una ventaja concreta documentada.
- Seleccionar un solo motor relacional principal por aplicación, salvo necesidad excepcional aprobada.
- No introducir PostgreSQL y MariaDB simultáneamente sin justificar separación de responsabilidades, operación, respaldo y consistencia.
- Definir migraciones versionadas y reversibles cuando sea técnicamente posible.
- No usar una base relacional para datos que no requieran persistencia estructurada o relaciones transaccionales.
- Mantener credenciales y cadenas de conexión fuera del código y del repositorio.
- No publicar puertos de base de datos a Internet; preferir conectividad interna entre servicios.
- Antes de reutilizar una instancia compartida, validar aislamiento por base y usuario, permisos mínimos, capacidad, respaldo, recuperación, mantenimiento e impacto sobre otros proyectos.
- Preferir una base o servicio dedicado cuando el aislamiento, la criticidad o el cumplimiento lo requieran.

### Redis

- Usar Redis solo cuando exista una necesidad concreta de caché, sesiones distribuidas, colas, coordinación temporal o datos efímeros.
- No incorporar Redis por defecto si el backend puede operar correctamente sin él.
- Redis no debe ser la única fuente de verdad para información que requiera persistencia durable.

### Capacidades de infraestructura disponibles

Los documentos `infra.md` e `infra-prod.md` registran capacidades existentes que pueden evaluarse antes de crear servicios nuevos:

- Docker, Docker Compose, Easypanel y Traefik para ejecución, administración y publicación de servicios.
- PostgreSQL y MariaDB como motores relacionales ya utilizados.
- Redis para caché, locks, coordinación temporal y estado efímero.
- Qdrant y PostgreSQL con `pgvector` para necesidades vectoriales.
- n8n para automatizaciones y orquestación de integraciones.
- Gotenberg para conversión documental y generación de PDF.
- Evolution API para integraciones de WhatsApp.
- Cloudflare para DNS, TLS, proxy, túneles y controles perimetrales.
- Tailscale y WireGuard para acceso administrativo o conectividad privada, cuando corresponda.

La existencia de una capacidad no implica autorización automática para reutilizarla.

Antes de consumir un servicio existente se debe:

1. verificar su estado y versión actuales en la documentación de infraestructura;
2. confirmar red, resolución DNS, puertos y mecanismo de autenticación;
3. evaluar aislamiento, permisos, capacidad, criticidad y dependencia con otros proyectos;
4. confirmar respaldo, recuperación, mantenimiento y responsable operativo;
5. evitar bases, colas o servicios compartidos cuando exista riesgo de mezcla de datos o impacto cruzado;
6. documentar la decisión en la arquitectura del proyecto.

No usar `n8n_pgvector` ni otra base compartida como almacenamiento principal de un nuevo producto sin evaluación y aprobación explícitas. Para comunicación entre servicios desplegados en Easypanel, preferir nombres y redes internas antes que dominios públicos, siempre que el servicio y la segmentación lo permitan.

### Red, publicación y seguridad perimetral

- Usar Cloudflare como capa predeterminada para DNS, proxy, TLS y controles perimetrales cuando el servicio sea publicado en Internet.
- Mantener los servicios internos sin exposición pública innecesaria.
- No almacenar secretos de Cloudflare en el código ni en imágenes Docker.
- Documentar dominios, subdominios, rutas públicas y dependencias de Cloudflare.

### Despliegue

- Usar Easypanel como plataforma predeterminada de despliegue.
- Definir por servicio: imagen, puertos, variables, secretos, volúmenes, redes, health checks y política de reinicio.
- Separar ambientes de desarrollo, sandbox/pruebas y producción cuando el riesgo o el alcance lo justifiquen.
- No realizar cambios de producción sin evaluar impacto, respaldo, rollback y servicios dependientes.

## Convención base de servicios

Cuando la solución incluya todos los componentes, usar una separación conceptual equivalente a:

```text
frontend
backend-api
relational-db (postgres o mariadb)
redis
```

Los nombres físicos pueden adaptarse al proyecto, pero deben ser claros, consistentes y documentados.

## Criterios de incorporación

Antes de agregar un componente, confirmar:

1. qué problema resuelve;
2. por qué la solución existente no es suficiente;
3. qué datos o estado manejará;
4. cómo se respalda y recupera;
5. cómo se supervisa;
6. qué costo operativo agrega;
7. cómo se elimina o reemplaza si deja de ser necesario.

## Herramientas y prácticas

- Versionar Dockerfiles, manifiestos, migraciones y configuración no secreta.
- Fijar versiones de imágenes y dependencias; evitar etiquetas ambiguas como `latest` en producción.
- Mantener archivos de bloqueo del gestor de paquetes.
- Incorporar pruebas automatizadas acordes al riesgo.
- Validar frontend, backend, migraciones y construcción de imágenes antes del despliegue.
- Mantener logs legibles y sin secretos.
- No introducir frameworks, servicios o bases de datos adicionales sin necesidad demostrada.

## Excepciones

Una excepción debe registrar como mínimo:

- regla afectada;
- tecnología alternativa;
- motivo;
- ventajas y riesgos;
- impacto en seguridad, operación, datos y portabilidad;
- alcance y duración;
- responsable de aprobación.

La existencia de código legado no convierte automáticamente una desviación en estándar. Las aplicaciones existentes pueden conservar su arquitectura mientras se evalúa el costo y riesgo de migración.

## Prioridad de decisión

```text
estándar aprobado
→ capacidad nativa de la plataforma
→ solución simple y mantenible
→ componente condicional justificado
→ excepción documentada
```
