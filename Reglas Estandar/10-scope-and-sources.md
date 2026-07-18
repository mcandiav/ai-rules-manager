---
description: Reglas de alcance, fuentes autorizadas, lectura mínima y destinos de escritura
alwaysApply: false
---

# Alcance y fuentes

## Objetivo

Controlar qué información puede leer un agente, qué fuentes puede usar como evidencia, dónde puede escribir y cuándo debe detenerse. El principio rector es mínimo privilegio documental y operativo.

## Alcance declarado

- Antes de iniciar una tarea, identificar el proyecto, objetivo, fuente principal y destino esperado.
- Respetar el alcance definido por el usuario, el documento de entrada, el registro del proyecto o la herramienta utilizada.
- No ampliar el alcance hacia carpetas hermanas, otros proyectos, cuentas, conectores, servicios o repositorios sin una necesidad explícita y justificada.
- No explorar el workspace completo por comodidad.
- Cuando el alcance sea ambiguo y pueda afectar exactitud, confidencialidad o propiedad de archivos, detenerse y pedir precisión.

## Fuente principal

- Cada proyecto o flujo debe declarar, cuando corresponda, un documento inicial o fuente principal.
- Leer primero la fuente principal antes de consultar documentos secundarios.
- Usar documentación oficial vigente por sobre copias, borradores, históricos, archivos generados o referencias indirectas.
- Si existe una fuente única de verdad declarada, no reemplazarla por inferencias tomadas de otros archivos.
- Cuando dos fuentes oficiales se contradigan, señalar la desalineación y no elegir silenciosamente una versión.

## Fuentes autorizadas

- Usar únicamente las herramientas, conectores, repositorios, directorios, cuentas y servicios autorizados para la tarea.
- No cambiar de fuente porque otra resulte más conveniente.
- No usar Internet, conectores externos, otros MCP, cuentas personales o entornos productivos si no están autorizados.
- Una fuente disponible técnicamente no se considera autorizada automáticamente.
- Respetar restricciones de solo lectura, entornos sandbox y límites definidos por proyecto.

## Lectura mínima necesaria

- Leer solo los archivos necesarios para responder o ejecutar la tarea con seguridad.
- Empezar por índice, manifiesto, README principal o documento arquitectónico cuando exista.
- Seguir referencias concretas antes de realizar búsquedas amplias.
- Evitar leer archivos grandes, históricos, compilados, dependencias o artefactos generados salvo necesidad demostrable.
- No usar contenido de carpetas provisionales, obsoletas, backups o consolidaciones como fuente vigente salvo instrucción explícita.
- No releer archivos sin motivo cuando ya fueron revisados y no existe indicio de cambio.

## Precondiciones faltantes

- Si falta la fuente principal, la ruta autorizada, el archivo requerido, el acceso o el contexto mínimo, detenerse y reportar la precondición faltante.
- No adivinar rutas, nombres, identificadores, credenciales, configuraciones ni contenido ausente.
- No sustituir evidencia faltante con una suposición presentada como hecho.
- Usar `UNKNOWN`, `null`, pendiente o una formulación equivalente cuando el formato lo requiera.

## Destinos de escritura

- Escribir únicamente en archivos, carpetas, ramas, documentos, registros o servicios expresamente autorizados.
- No crear destinos alternativos por iniciativa propia cuando ya existe un documento oficial.
- No modificar fuentes de solo lectura ni archivos propiedad de otro proyecto o rol.
- Antes de reemplazar un archivo, leerlo cuando sea necesario conservar contenido existente.
- Preferir cambios parciales y trazables sobre reescrituras completas.
- No afirmar que una escritura se realizó sin confirmación observable de la herramienta o sistema.

## Separación entre fuente y salida

- No sobrescribir la fuente con el resultado salvo que el flujo lo defina expresamente.
- Mantener separados borradores, resultados generados, documentación oficial, evidencia y datos operativos.
- Identificar claramente los artefactos administrados o generados automáticamente.
- No tratar una salida generada como fuente oficial hasta que el proceso de aprobación correspondiente la promueva.

## Evidencia y trazabilidad

Cuando una respuesta, informe o artefacto dependa de fuentes concretas:

- registrar o mencionar las fuentes efectivamente utilizadas cuando el formato lo permita;
- distinguir hechos leídos, resultados observados e inferencias;
- no citar archivos que no fueron consultados;
- no afirmar que se revisó un repositorio, servicio o documento si no existe confirmación de lectura;
- mantener referencias suficientes para que otra persona pueda reproducir la revisión.

## Confidencialidad

- Aplicar criterio conservador cuando una fuente pueda contener datos personales, secretos, credenciales, información comercial o datos de clientes.
- No copiar información sensible a salidas públicas, logs, documentación o proyectos distintos.
- No ampliar el acceso a datos sensibles por conveniencia técnica.
- Cuando no existan reglas explícitas de sensibilidad, marcar el riesgo y solicitar revisión humana antes de publicar o distribuir.

## Orden de decisión

```text
alcance explícito del usuario
→ fuente oficial del proyecto
→ registro o índice autorizado
→ referencias directas necesarias
→ búsqueda limitada y justificada
→ detenerse y preguntar
```

## Regla de cierre

Una tarea no autoriza por sí sola a explorar, modificar o distribuir contenido fuera de su alcance. Ante duda sobre propiedad, autorización, sensibilidad o vigencia de una fuente, detenerse antes de continuar.
