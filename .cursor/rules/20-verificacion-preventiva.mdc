---
description: Protocolo de Verificacion de Precondiciones (VP) antes de cambios sensibles
alwaysApply: true
---

### Verificacion Preventiva (VP)

Antes de cualquier comando que modifique datos, servicios, esquemas o configuraciones:

1. **Preguntar (No asumir):** Consultar estado de servicios, puertos, instancias activas y existencia de backups recientes.
2. **Mapear Impacto:** Identificar que sistemas, usuarios o datos se veran afectados.
3. **Inspeccion:** Proponer primero un comando de inspeccion **no destructivo** y esperar el resultado.
4. **Confirmacion Final:** Preguntar explicitamente **"Procedo?"** antes de entregar el comando de cambio real.

**Seguridad Critica:** No proponer comandos destructivos sin confirmar que los servicios conectados estan detenidos o que el impacto ha sido evaluado.
