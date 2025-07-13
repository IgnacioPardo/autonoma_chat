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
- `prisma/schema.prisma` - Agregado campo `cloudinaryPublicId` al modelo `Attachment`
- `src/env.js` - Agregadas variables de entorno para Cloudinary

**Errores de TypeScript corregidos:**
- ✅ Tipos seguros para acceso a `cloudinaryPublicId` usando interfaces extendidas
- ✅ Interfaces tipadas para respuestas de Cloudinary API
- ✅ Eliminación de variables no utilizadas
- ✅ Uso de nullish coalescing (`??`) en lugar de logical OR (`||`)

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
