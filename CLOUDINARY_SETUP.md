# Configuración de Cloudinary para Imágenes Generadas

## Descripción del Problema

El error "Request Entity Too Large" (FUNCTION_PAYLOAD_TOO_LARGE) en producción ocurre porque las imágenes generadas por DALL-E se envían como base64 en el payload de las solicitudes HTTP, excediendo los límites de tamaño de Vercel/Next.js.

## Solución Implementada

### 1. Cloudinary Integration

Se ha implementado Cloudinary para subir imágenes generadas y usar URLs en lugar de base64, reduciendo significativamente el tamaño del payload.

### 2. Archivos Modificados

- `src/lib/cloudinary.ts` - Nuevo servicio para manejar uploads a Cloudinary
- `src/lib/image-generation.ts` - Actualizado para subir a Cloudinary en lugar de devolver base64
- `src/types/chat.ts` - Agregado `cloudinaryPublicId` al tipo `Attachment`
- `src/lib/chat-history.ts` - Actualizado para guardar `cloudinaryPublicId` en la base de datos
- `src/app/page.tsx` - Actualizada la interfaz para incluir `cloudinaryPublicId`
- `src/components/chat-messages.tsx` - Actualizado para manejar URLs de Cloudinary con optimización de Next.js
- `next.config.js` - Agregada configuración para permitir imágenes de Cloudinary
- `prisma/schema.prisma` - Agregado campo `cloudinaryPublicId` al modelo `Attachment`
- `src/env.js` - Agregadas variables de entorno para Cloudinary

**Errores de TypeScript corregidos:**

- ✅ Tipos seguros para acceso a `cloudinaryPublicId` usando interfaces extendidas
- ✅ Interfaces tipadas para respuestas de Cloudinary API
- ✅ Eliminación de variables no utilizadas
- ✅ Uso de nullish coalescing (`??`) en lugar de logical OR (`||`)

**Optimización de Imágenes:**

- ✅ URLs de Cloudinary ahora usan optimización de Next.js Image
- ✅ Base64 legacy sigue funcionando con `unoptimized={true}`
- ✅ Configuración de `remotePatterns` para `res.cloudinary.com`

### 3. Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```bash
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 4. Cómo obtener las credenciales de Cloudinary

1. Ve a [Cloudinary](https://cloudinary.com/) y crea una cuenta gratuita
2. En el dashboard, encontrarás:
   - **Cloud Name** - Visible en la parte superior del dashboard
   - **API Key** - En la sección "API Keys"
   - **API Secret** - En la sección "API Keys" (haz clic en "Reveal")

### 5. Configuración en Producción

Para Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Ir a "Settings" → "Environment Variables"
3. Agrega las tres variables de Cloudinary

Para otras plataformas, agrega las variables de entorno según su documentación.

## Beneficios

### Reducción de Tamaño de Payload

- **Antes**: Imagen base64 de ~1MB se convierte en ~1.3MB en el payload JSON
- **Después**: URL de Cloudinary (~100 bytes) + referencia en base de datos

### Mejor Performance

- Imágenes servidas desde CDN de Cloudinary
- Carga más rápida de mensajes
- Menos uso de ancho de banda

### Gestión de Imágenes

- Las imágenes generadas se almacenan en Cloudinary organizadas en carpetas
- Se puede configurar optimización automática
- Fácil limpieza de imágenes antiguas usando el `cloudinaryPublicId`

## Solución a Error de Next.js Image

### Problema Original
```
GET https://autonoma-chat.vercel.app/_next/image?url=https%3A%2F%2Fres.cloudinary.com/...&w=2048&q=75 400 (Bad Request)
```

### Causa
Next.js no tenía configurado el dominio `res.cloudinary.com` como fuente válida para imágenes externas.

### Solución Implementada

1. **Configuración en `next.config.js`:**
```javascript
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

2. **Detección automática en componentes:**
```typescript
// Solo usar unoptimized para base64, dejar que Next.js optimice Cloudinary
unoptimized={attachment.url.startsWith('data:')}
```

3. **Compatibilidad hacia atrás:**
- URLs de Cloudinary → Optimización de Next.js habilitada
- Base64 existentes → `unoptimized={true}` para compatibilidad

## Mejora de UX: Transiciones Suaves de Loading

### Problema
Aparecía momentáneamente una burbuja vacía y luego una burbuja de carga antes de mostrar la tarjeta de procesamiento de imagen.

### Solución Implementada

1. **Simplificación de lógica de loading:**
```typescript
function hasActiveStreamingOrGeneration(messages: Message[]): boolean {
  if (messages.length === 0) return false;
  const lastMessage = messages[messages.length - 1];
  
  // Si el último mensaje es del assistant, asumir que el streaming ha comenzado
  if (lastMessage?.role === 'assistant') {
    return true;
  }
  
  return false;
}
```

2. **Animaciones suaves agregadas:**
- `LoadingIndicator`: `animate-in fade-in duration-200`
- Tarjeta de "Generando imagen...": `animate-in fade-in duration-300`
- Imagen completada: `animate-in fade-in duration-500`

3. **Resultado:**
- ✅ Eliminación del parpadeo entre estados
- ✅ Transición directa a tarjeta de procesamiento
- ✅ Experiencia más fluida para el usuario

## Mejora de UX: Sidebar de Historial Mejorado

### Problemas Originales
1. El sidebar del historial de chat no era scrollable correctamente
2. Faltaba indicador de carga al cargar el historial
3. No había feedback visual al seleccionar un chat individual

### Soluciones Implementadas

1. **Scrolling Mejorado:**
```typescript
// Estructura de flexbox corregida
<div className="flex h-full w-80 flex-col">
  {/* Header fijo */}
  <div className="border-b">...</div>
  
  {/* Lista scrollable */}
  <div className="flex-1 min-h-0 overflow-y-auto p-4 scroll-smooth">
    {/* Contenido del historial */}
  </div>
</div>
```

2. **Loading Indicator Mejorado:**
```typescript
{isLoading ? (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="animate-spin rounded-full border-b-2 border-r-2"></div>
      <div className="absolute animate-ping rounded-full border-2 opacity-20"></div>
    </div>
    <p className="mt-4 text-sm animate-pulse">Cargando historial...</p>
  </div>
) : /* contenido normal */}
```

3. **Loading Individual de Chats:**
```typescript
const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

// Overlay de carga por chat
{loadingChatId === chat.id && (
  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
    <div className="animate-spin rounded-full border-b-2"></div>
  </div>
)}
```

4. **Beneficios:**
- ✅ **Scroll fluido** con `scroll-smooth` y estructura flexbox correcta
- ✅ **Loading mejorado** con animaciones duales (spin + ping)
- ✅ **Feedback individual** cuando se selecciona un chat específico
- ✅ **UX más responsive** con estados de carga claros

## Migración de Datos Existentes

Si ya tienes imágenes generadas como base64 en tu base de datos, puedes crear un script de migración:

```typescript
// scripts/migrate-images-to-cloudinary.ts
import { prisma } from '~/lib/prisma';
import { uploadImageToCloudinary } from '~/lib/cloudinary';

async function migrateImagesToCloudinary() {
  const attachments = await prisma.attachment.findMany({
    where: {
      url: { startsWith: 'data:image' }, // Find base64 images
      cloudinaryPublicId: null // Not already migrated
    }
  });

  for (const attachment of attachments) {
    try {
      const result = await uploadImageToCloudinary(attachment.url);
      if (result.success) {
        await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            url: result.url!,
            cloudinaryPublicId: result.public_id
          }
        });
        console.log(`Migrated attachment ${attachment.id}`);
      }
    } catch (error) {
      console.error(`Failed to migrate attachment ${attachment.id}:`, error);
    }
  }
}
```

## Monitoreo

Las imágenes se suben a la carpeta `autonoma-chat/generated-images` en Cloudinary. Puedes monitorear el uso y configurar límites según tu plan de Cloudinary.

## Limpieza Automática (Opcional)

Puedes implementar una función para limpiar imágenes antiguas:

```typescript
// lib/cloudinary-cleanup.ts
import { deleteImageFromCloudinary } from '~/lib/cloudinary';
import { prisma } from '~/lib/prisma';

export async function cleanupOldImages(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const oldAttachments = await prisma.attachment.findMany({
    where: {
      createdAt: { lt: cutoffDate },
      cloudinaryPublicId: { not: null }
    }
  });

  for (const attachment of oldAttachments) {
    if (attachment.cloudinaryPublicId) {
      await deleteImageFromCloudinary(attachment.cloudinaryPublicId);
      // Optionally delete from database or mark as deleted
    }
  }
}
```
