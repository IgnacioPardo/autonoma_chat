# Autonoma Chat Take Home

Una aplicación de chat inteligente moderna construida con Next.js, que integra OpenAI GPT-4, generación de imágenes con DALL-E 3, conversación por voz con ElevenLabs, y un sistema de autenticación robusto.

![Autonoma Chat](./public/autonoma_logo.png)

## 🚀 Características Principales

- **💬 Chat Inteligente** - GPT-4 con streaming, historial persistente y edición de mensajes
- **🎨 Generación de Imágenes** - DALL-E 3 con Cloudinary CDN y acciones de compartir
- **🎙️ Conversación por Voz** - Text-to-Speech con ElevenLabs y modo de chat dedicado
- **📎 Gestión de Archivos** - Upload y preview de múltiples tipos (PDF, CSV, imágenes, código)
- **🔐 Autenticación** - OAuth2 con GitHub/Google y NextAuth.js
- **🎨 Diseño Moderno** - Glassmorphism, responsive, animaciones fluidas

## 🛠️ Stack Tecnológico

**Frontend**
- Next.js 15.3.5 + React 19 + TypeScript
- Tailwind CSS 4.0 + Framer Motion
- Vercel AI SDK + React Markdown

**Backend & APIs**
- OpenAI SDK (GPT-4 + DALL-E 3)
- ElevenLabs SDK (Text-to-Speech)
- Cloudinary (gestión de imágenes)

**Base de Datos & Auth**
- PostgreSQL + Prisma ORM
- NextAuth.js + OAuth2
- SWR (data fetching)

## 📁 Estructura del Proyecto

```
autonoma_chat/
├── prisma/                    # Base de datos
│   ├── schema.prisma         # Esquema y modelos
│   └── migrations/           # Historial de cambios
├── public/                   # Assets estáticos
├── src/
│   ├── app/                  # App Router
│   │   ├── api/             # API Routes
│   │   ├── auth/            # Páginas de autenticación
│   │   └── voice-chat/      # Modo de voz
│   ├── components/          # Componentes React
│   ├── lib/                 # Servicios y utilidades
│   ├── hooks/               # Custom hooks
│   └── types/               # Definiciones TypeScript
└── *.config.js              # Configuraciones
```

## 🔧 Configuración e Instalación

### Prerrequisitos
- Node.js 18+, PostgreSQL
- APIs: OpenAI, ElevenLabs, Cloudinary
- OAuth: GitHub/Google Apps

### Setup
```bash
# 1. Instalar
git clone <repo>
cd autonoma_chat
pnpm install

# 2. Variables de entorno (.env.local)
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
ELEVENLABS_API_KEY="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# 3. Base de datos
npx prisma migrate dev
pnpm run db:seed

# 4. Desarrollo
pnpm dev
```

## 🎯 Funcionalidades Técnicas

### Streaming de Chat
```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  onError: (error) => toast.error(error.message),
});
```

### Generación de Imágenes
```typescript
const imageGeneration = Promise.race([
  openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    size: "1024x1024",
  }),
  timeoutPromise(45000)
]);
```

### Text-to-Speech
```typescript
const { speak, stop, isSpeaking } = useSpeech({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: "default"
});
```

## 📋 Scripts

- `pnpm dev` - Desarrollo con Turbo
- `pnpm build` - Build de producción  
- `pnpm lint:fix` - Fix automático
- `pnpm typecheck` - Verificación de tipos
- `pnpm db:seed` - Seed de DB

## 📜 Licencia

MIT License - ver `LICENSE` para detalles.
