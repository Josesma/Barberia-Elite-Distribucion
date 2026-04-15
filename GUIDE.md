# 💈 Guía de Instalación — Barbería Elite***

¡Bienvenido! Sigue este paso a paso para instalar y ejecutar el Sistema de Gestión de Barbería en tu computadora o en un servidor.

---

## 🛠️ 1. Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas:
- [Node.js](https://nodejs.org/) (versión 18 o superior).
- [PostgreSQL](https://www.postgresql.org/download/) (base de datos relacional).
- [Git](https://git-scm.com/) (opcional, para clonar el proyecto).

---

## 📦 2. Preparar el Proyecto

Abre tu terminal (Símbolo del sistema, PowerShell o Terminal en Mac) y ejecuta las siguientes instrucciones:

**Paso 2.1: Instalar las dependencias**
En la carpeta raíz del proyecto (`Barberia`), ejecuta:
```bash
npm install
```

---

## 🔑 3. Configurar las Variables de Entorno

El sistema necesita credenciales para conectarse a la Base de Datos, Telegram y Google Calendar.

1. En la carpeta raíz, busca el archivo `.env.example`.
2. Cópialo y renómbralo a `.env`.
3. Abre el archivo `.env` y rellena los siguientes datos:

```env
# Database
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/barberia"

# Telegram Bot (creado con @BotFather en Telegram)
TELEGRAM_BOT_TOKEN="tu_token_de_telegram"

# Google Calendar API
GOOGLE_CALENDAR_ID="tu_correo_de_calendario@gmail.com"
GOOGLE_SERVICE_ACCOUNT_EMAIL="correo-servicio@proyecto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API del panel
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📅 4. Configuración Detallada de Google Calendar

Para que el sistema pueda leer y escribir en tu agenda, debes seguir estos pasos para obtener tus credenciales:

### Paso 4.1: Crear el proyecto en Google Cloud
1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Arriba a la izquierda, haz clic en **"Seleccionar proyecto"** y luego en **"Proyecto nuevo"**. Ponle nombre (ej: *Barberia-Elite*).

### Paso 4.2: Habilitar la API
1. En el buscador superior, escribe **"Google Calendar API"** y selecciónala.
2. Haz clic en el botón azul **"Habilitar"**.

### Paso 4.3: Crear la Cuenta de Servicio
1. Ve al menú lateral (las 3 rayitas) > **APIs y servicios** > **Credenciales**.
2. Haz clic en **"+ Crear credenciales"** y selecciona **"Cuenta de servicio"**.
3. Sigue los pasos (nombre y descripción) y dale a **"Listo"**.
4. Copia el **Correo electrónico** que se generó (ej: `barberia@proyecto.iam.gserviceaccount.com`). Lo pondrás en `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### Paso 4.4: Generar la Clave Privada (JSON)
1. Haz clic sobre el nombre de la cuenta de servicio que acabas de crear.
2. Ve a la pestaña **"Claves"** (Keys).
3. Haz clic en **"Agregar clave"** > **"Crear clave nueva"** > **JSON** > **Crear**.
4. Se descargará un archivo `.json` en tu computadora. Ábrelo con un editor de texto (Notepad, VS Code):
   - Busca `private_key` y copia todo su contenido (las miles de letras incluyendo los guiones del inicio y el final).
   - **IMPORTANTE:** En tu archivo `.env`, asegúrate de que esté en una sola línea y que los saltos de línea se representen como `\n`.

### Paso 4.5: Compartir tu Calendario
1. Ve a tu [Google Calendar](https://calendar.google.com/) personal.
2. En el menú de la izquierda, busca tu calendario principal, haz clic en los 3 puntos › **Configuración y uso compartido**.
3. Baja hasta **"Compartir con personas o grupos específicos"**.
4. Haz clic en **"+ Agregar personas y grupos"** y pega el correo de la cuenta de servicio del Paso 4.3.
5. En "Permisos", elige **"Realizar cambios en eventos"** (muy importante).
6. Copia el **ID del calendario** (suele ser tu correo personal) y ponlo en `GOOGLE_CALENDAR_ID`.

---

## 🗄️ 5. Configurar la Base de Datos

Una vez que hayas puesto la `DATABASE_URL` correcta en tu archivo `.env`, vamos a crear las tablas. En la terminal ejecuta:

```bash
# 1. Empujar la estructura a la base de datos
npx prisma db push --schema=packages/shared/prisma/schema.prisma

# 2. Generar el cliente de Prisma para que el código lo reconozca
npx prisma generate --schema=packages/shared/prisma/schema.prisma
```

---

## 🚀 5. Ejecutar el Sistema

¡Ya casi terminas! El sistema se compone de dos partes funcionales: El Backend (que incluye el Bot de Telegram) y el Panel Web (Frontend).

Hemos creado un archivo mágico para que no tengas que abrir múltiples consolas.

Simplemente haz **doble clic** en el archivo:
```text
iniciar.bat
```
*(Ubicado en la carpeta del proyecto)*

Este archivo abrirá **una sola ventana negra** que ejecutará el Backend y el Panel Web al mismo tiempo y te mostrará todo ahí mismo.

*(Opcional) Si prefieres usar comandos desde tu propia consola, ejecuta:*
```bash
npm run dev
```

---


## ✅ 6. ¡Listo para usar!

1. Ve a tu navegador y entra a: **[http://localhost:3000](http://localhost:3000)** para ver tu Panel de Administración.
2. Abre **Telegram** en tu celular, busca el nombre del bot que creaste, envíale el comando `/start` y prueba hacer una reserva de prueba.
3. Desde el celular, si entras en Chrome a `localhost:3000` (conectado a tu misma red), puedes darle a "Añadir a la pantalla de inicio" para instalar la **PWA**.

¡Felicidades, el sistema Barbería Elite ya está funcionando! 🎉
