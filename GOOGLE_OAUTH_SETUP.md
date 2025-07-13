# Configuración de Google OAuth

Para habilitar la autenticación con Google en tu aplicación, sigue estos pasos:

## 1. Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google+ API y/o Google OAuth2 API

## 2. Configurar OAuth2

1. En el panel de navegación, ve a **APIs y servicios** > **Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente de OAuth 2.0**
3. Selecciona **Aplicación web** como tipo de aplicación
4. Configura las URLs autorizadas:

### URLs de redireccionamiento autorizadas:
- Para desarrollo: `http://localhost:3000/api/auth/callback/google`
- Para producción: `https://tudominio.com/api/auth/callback/google`

### Orígenes de JavaScript autorizados:
- Para desarrollo: `http://localhost:3000`
- Para producción: `https://tudominio.com`

## 3. Configurar variables de entorno

Copia las credenciales generadas y agrégalas a tu archivo `.env`:

```bash
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

## 4. Configurar pantalla de consentimiento OAuth

1. Ve a **APIs y servicios** > **Pantalla de consentimiento OAuth**
2. Configura la información de tu aplicación:
   - Nombre de la aplicación
   - Correo electrónico de soporte técnico
   - Logotipo (opcional)
   - Dominios autorizados

## 5. Verificar la configuración

Una vez configurado todo, podrás ver el botón "Continuar con Google" en la página de inicio de sesión.

## Notas importantes

- En desarrollo, Google puede mostrar una advertencia de "App no verificada"
- Para producción, considera verificar tu aplicación con Google
- Las credenciales de OAuth deben mantenerse seguras y nunca exponerse en el código cliente

## Solución de problemas

Si tienes problemas:

1. Verifica que las URLs de redireccionamiento coincidan exactamente
2. Asegúrate de que las APIs necesarias estén habilitadas
3. Revisa que las variables de entorno estén configuradas correctamente
4. Comprueba los logs de la consola para errores específicos
