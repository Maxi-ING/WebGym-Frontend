# FitAnalytics AI — frontend

Interfaz del proyecto WebGym para cuentas, perfil, entrenamiento, progreso y análisis solicitado por el usuario. Está construida con **Vite, JavaScript y Chart.js**, sin framework de componentes. Consume el backend FastAPI de [WebGym-Backend](https://github.com/Maxi-ING/WebGym-Backend).

## Requisitos y desarrollo

Instala Node.js compatible con Vite 8 y usa la terminal en la raíz del repositorio:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

En PowerShell, sustituye la copia por `Copy-Item .env.example .env.local`. Abre la dirección que muestre Vite. El servidor local envía solicitudes `/api` a `VITE_API_ORIGIN` (por defecto `http://127.0.0.1:8000`), donde debe estar ejecutándose FastAPI.

### Revisión visual sin backend

Si aún no tienes Python o PostgreSQL, cambia `VITE_DEMO_MODE=true` en `.env.local` y reinicia Vite. En la pantalla de acceso pulsa **Ver ejemplo con 8 semanas ficticias**. También puedes crear una cuenta nueva en la vista previa para revisar el modal obligatorio y las pantallas vacías. Los datos se guardan solo en el navegador y el análisis de esta vista es una simulación etiquetada; **no conecta a una base ni ejecuta el modelo real**. Nunca actives esta opción en producción.

## Flujo conectado

1. Al abrir, se obtiene un token CSRF y se verifica la cookie de sesión.
2. Registro o inicio de sesión; una cuenta nueva debe completar edad, talla, peso y objetivo en un modal obligatorio.
3. Perfil editable y nuevas mediciones; sesiones, ejercicios y metas de carga.
4. Progreso descriptivo con gráficos de peso y carga; esta sección no ejecuta aprendizaje automático.
5. Al pulsar **Analizar mi progreso**, una petición `POST /api/analisis/{ejercicio_id}` devuelve la regresión y la recomendación del backend. El gráfico distingue cargas observadas y estimadas.

La API utiliza cookies `HttpOnly` con token CSRF. El navegador llama a rutas relativas `/api`, por lo que frontend y backend deben presentarse bajo el mismo origen o detrás de un proxy. No almacena contraseñas ni tokens de sesión en `localStorage`; este solo se usa para la vista previa sintética.

## Construir y verificar

```bash
npm test
npm run build
npm run preview
```

GitHub Actions repite las pruebas y la compilación en cada push a `dev` y en las solicitudes a `main`. La salida compilada queda en `dist/`.

## Despliegue previsto

El backend se desplegará en Render y se conectará a PostgreSQL de InsForge. Para un frontend alojado en Vercel, configura una regla de *rewrite* a nivel del proyecto que envíe `/api/:path*` al backend `https://TU-BACKEND-RENDER/api/:path*`, manteniendo `/api` en el origen visible del navegador. Vercel documenta los rewrites a orígenes externos. Comprueba en un despliegue de prueba que `Set-Cookie` y `X-CSRF-Token` llegan correctamente antes de publicar. No coloques `DATABASE_URL`, `SESSION_SECRET` ni credenciales de InsForge en este repositorio ni en variables `VITE_`.

Esta rama no publica la página todavía; la integración con una instancia real de Render/InsForge depende de sus URL y secretos, que se configurarán fuera de GitHub.
