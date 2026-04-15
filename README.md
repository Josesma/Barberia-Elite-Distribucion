# 💈 Barbería Elite - Sistema de Gestión Integral

![Barbería Elite Banner](./banner.png)

¡Bienvenido al sistema **Barbería Elite**! Una solución moderna, rápida y automatizada para gestionar tu barbería. Este sistema combina un panel de administración web con un potente bot de Telegram para reservas automáticas y sincronización con Google Calendar.

---

## ✨ Características Principales

- **📅 Reservas vía Telegram**: Tus clientes pueden agendar citas directamente desde un bot de Telegram.
- **🖥️ Panel de Administración**: Gestión completa de citas, clientes, servicios y finanzas desde una interfaz web moderna.
- **📆 Sincronización con Google Calendar**: Todas las reservas se reflejan automáticamente en tu calendario de Google.
- **💰 Control Financiero**: Registra ingresos, gastos y obtén reportes de ganancias.
- **📱 App Móvil (PWA)**: Instala el panel web en tu celular como si fuera una aplicación nativa.
- **🔔 Notificaciones Inteligentes**: Recordatorios automáticos para que tus clientes no falten a su cita.

---

## 🚀 Tecnologías Utilizadas

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript, Tailwind CSS)
- **Backend**: [Node.js](https://nodejs.org/) con Express
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) con [Prisma ORM](https://www.prisma.io/)
- **Integraciones**: 
  - Telegram Bot API
  - Google Calendar API

---

## 🛠️ Guía de Instalación Rápida

Para empezar a usar el sistema, sigue estos pasos:

### 1. Requisitos
- Node.js (v18+)
- PostgreSQL
- Cuenta de Google Cloud (para Calendar)

### 2. Configuración
Copia el archivo `.env.example` a `.env` y completa tus credenciales:
```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/barberia"
TELEGRAM_BOT_TOKEN="tu_token"
GOOGLE_CALENDAR_ID="tu_calendario_id"
```

### 3. Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Preparar base de datos
npx prisma db push --schema=packages/shared/prisma/schema.prisma
npx prisma generate --schema=packages/shared/prisma/schema.prisma

# Iniciar sistema
npm run dev
```

> [!TIP]
> Si estás en Windows, puedes simplemente hacer doble clic en el archivo `iniciar.bat` para arrancar todo automáticamente.

Para instrucciones más detalladas, consulta la [Guía de Instalación Completa](./GUIDE.md).

---

## 🤝 Contribuciones

Si deseas mejorar este sistema, ¡eres bienvenido! Siéntete libre de abrir un *Issue* o enviar un *Pull Request*.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

## 📱 Contacto y Redes Sociales

Si quieres ver más contenido sobre este sistema o tienes dudas, puedes seguirme en mis redes sociales:

[![TikTok Badge](https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white)](https://www.tiktok.com/@josesoy__)
[![YouTube Badge](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@Josesoy1)
[![Instagram Badge](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/josesoy__/)
[![Facebook Badge](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/JoseSoyy/)

---
*Desarrollado con ❤️ por **JoseSoy** para Barberos Elite.*
