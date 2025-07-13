# Optimización de Payload - Solución "Request Entity Too Large"

## Problema
Error `FUNCTION_PAYLOAD_TOO_LARGE` en Vercel cuando se envían archivos adjuntos grandes, especialmente cuando se acumulan múltiples attachments.

## Soluciones Implementadas

### 1. Compresión y Redimensionamiento de Imágenes (`chat-utils.ts`)
- **Compresión automática**: Las imágenes se comprimen a 80% de calidad JPEG
- **Redimensionamiento**: Máximo 1920px en cualquier dimensión
- **Formato optimizado**: Conversión automática a JPEG para mejor compresión
- **Validación de tamaño**: Límite de 2MB por imagen antes de compresión

### 2. Límites de Archivo (`chat-input.tsx`)
- **Tamaño individual**: Máximo 5MB por archivo
- **Tamaño total**: Máximo 10MB de archivos acumulados
- **Indicador visual**: Barra de progreso con colores (verde/amarillo/rojo)
- **Notificaciones**: Toast notifications en lugar de alerts básicos

### 3. Validación del Lado del Servidor (`api/chat/route.ts`)
- **Límite de payload**: 25MB máximo para la función completa
- **Límite de attachments**: 20MB máximo para archivos adjuntos
- **Validación temprana**: Verificación antes de procesar
- **Respuestas específicas**: Códigos 413 con mensajes informativos

### 4. Mejor Manejo de Errores (`page.tsx`)
- **Detección específica**: Reconoce errores 413 y de tamaño
- **Mensajes contextuales**: Explica qué hacer para resolver el problema
- **Logging mejorado**: Información detallada para debugging

### 5. Mejoras en la UI
- **Indicador de progreso**: Muestra el uso actual vs límite
- **Códigos de color**: Verde (seguro), amarillo (precaución), rojo (límite)
- **Información de archivos**: Tamaño y tipo visible en tooltips
- **Feedback inmediato**: Validación en tiempo real al agregar archivos

## Configuración de Límites

```typescript
// Límites del cliente
const MAX_FILE_SIZE = 5 * 1024 * 1024;      // 5MB por archivo
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;    // 10MB total cliente
const IMAGE_QUALITY = 0.8;                  // 80% calidad JPEG
const MAX_IMAGE_DIMENSION = 1920;           // 1920px máximo

// Límites del servidor
const MAX_PAYLOAD_SIZE = 25 * 1024 * 1024;  // 25MB función Vercel
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB attachments
```

## Beneficios
1. **Prevención proactiva**: Evita errores antes de enviar
2. **Mejor experiencia**: Feedback visual e informativo
3. **Optimización automática**: Compresión transparente para el usuario
4. **Compatibilidad**: Funciona dentro de los límites de Vercel
5. **Escalabilidad**: Permite múltiples archivos sin exceder límites

## Próximos Pasos Opcionales
- Implementar upload progresivo por chunks
- Almacenamiento en cloud (S3, Cloudinary) para archivos grandes
- Compresión adicional para archivos CSV/Markdown grandes
- Cache de archivos procesados para evitar re-compresión
