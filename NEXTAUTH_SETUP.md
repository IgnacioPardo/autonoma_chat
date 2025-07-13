# Configuración de Autenticación NextAuth con GitHub

## Implementación Completada

Se ha añadido autenticación con NextAuth usando GitHub OAuth:

### 🚀 Características Implementadas

- ✅ **Autenticación condicional**: Sin login en desarrollo, obligatorio en producción
- ✅ **Esquema de base de datos actualizado**: Tablas de NextAuth y relación usuario-chats
- ✅ **APIs protegidas**: Todos los endpoints de chat requieren autenticación
- ✅ **UI de autenticación**: Página de login personalizada con diseño coherente
- ✅ **Navegación con usuario**: Navbar con menú de usuario y logout

### 🔧 Configuración Requerida

#### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=tu-clave-secreta-aqui
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth App
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret

# Existentes
OPENAI_API_KEY=tu-api-key-openai
DATABASE_URL="tu-url-base-datos"
```

#### 2. Configurar GitHub OAuth App

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Crea una nueva OAuth App:
   
   **Para Desarrollo:**
   - **Application name**: `Autonoma Chat Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   
   **Para Producción:**
   - **Application name**: `Autonoma Chat`
   - **Homepage URL**: `https://autonoma-chat.vercel.app`
   - **Authorization callback URL**: `https://autonoma-chat.vercel.app/api/auth/callback/github`

3. Copia el Client ID y Client Secret a tu `.env.local` (desarrollo) y variables de Vercel (producción)

#### 3. Base de Datos

La base de datos ya fue reseteada con el nuevo esquema que incluye:
- Tablas de NextAuth (`users`, `accounts`, `sessions`, `verification_tokens`)
- Campo `userId` en la tabla `chats` para asociar chats con usuarios

### 🎯 Comportamiento

#### Desarrollo (`npm run dev`)
- **Sin autenticación requerida**
- Los chats se asocian a un usuario ficticio (`dev-user-id`)
- Acceso libre a toda la aplicación

#### Producción (`npm run build && npm start`)
- **Autenticación obligatoria**
- Redirección automática a `/auth/signin` si no hay sesión
- Solo usuarios autenticados con GitHub pueden crear/ver chats
- Cada usuario solo ve sus propios chats

### 📁 Archivos Modificados/Creados

#### Nuevos Archivos
- `src/auth.ts` - Configuración de NextAuth
- `src/components/auth-guard.tsx` - Componente de protección de rutas
- `src/components/providers.tsx` - Provider de sesión
- `src/app/auth/signin/page.tsx` - Página de login
- `src/lib/auth-helpers.ts` - Helpers de autenticación
- `src/app/api/auth/[...nextauth]/route.ts` - API de NextAuth

#### Archivos Modificados
- `src/app/layout.tsx` - Añadido SessionProvider
- `src/app/page.tsx` - Envuelto en AuthGuard
- `src/components/navbar.tsx` - Añadido menú de usuario
- `src/app/api/chats/route.ts` - Protegido con autenticación
- `src/app/api/chats/[id]/route.ts` - Protegido con autenticación
- `prisma/schema.prisma` - Añadidas tablas de NextAuth
- `src/env.js` - Añadidas variables de NextAuth
- `.env.example` - Documentadas las nuevas variables

### 🧪 Testing

1. **Desarrollo**: Inicia `npm run dev` - debería funcionar sin login
2. **Producción**: 
   - Configura las variables de GitHub OAuth
   - Inicia `npm run build && npm start`
   - Debería redirigir a login en producción

### 🔒 Seguridad

- Los chats están aislados por usuario
- Las APIs verifican que el usuario sea dueño del chat
- Tokens de sesión manejados por NextAuth
- Variables sensibles solo en servidor

### 🐛 Troubleshooting

#### Error: "Callback" en producción

Si obtienes un error de callback al hacer login en producción:

1. **Verifica la URL de callback en GitHub:**
   - Debe ser exactamente: `https://autonoma-chat.vercel.app/api/auth/callback/github`
   - Sin espacios ni caracteres extra

2. **Verifica las variables de entorno en Vercel:**
   ```bash
   NEXTAUTH_SECRET=<generate-a-strong-random-secret>
   NEXTAUTH_URL=https://autonoma-chat.vercel.app
   GITHUB_CLIENT_ID=tu-client-id-de-produccion
   GITHUB_CLIENT_SECRET=tu-client-secret-de-produccion
   ```

3. **Asegúrate de tener dos OAuth Apps separadas:**
   - Una para desarrollo (`localhost:3000`)
   - Una para producción (`autonoma-chat.vercel.app`)

4. **Verifica que las tablas de NextAuth existan:**
   - La migración debe haber creado: `users`, `accounts`, `sessions`, `verification_tokens`

5. **Revisa los logs de Vercel:**
   - Ve a tu dashboard de Vercel → Functions → View Function Logs
   - Busca errores en `/api/auth/callback/github`

#### Comandos útiles:

```bash
# Verificar estado de la base de datos
npx prisma db pull

# Ver el esquema actual
npx prisma db seed

# En desarrollo, verificar variables de entorno
curl http://localhost:3000/api/debug/env
```
