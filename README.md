
# 🧠 Chatbot UFPS — Backend

Este proyecto corresponde al backend del **Chatbot UFPS**, desarrollado con **Node.js**, **Express**, **Prisma** y **PostgreSQL**, e integrado con **Firebase Admin SDK**.

---

## 🚀 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado o configurado lo siguiente:

- **Node.js** (versión 18 o superior)
- **PostgreSQL** (local o remoto)
- **NPM** o **Yarn** (según preferencia)
- Acceso al **Firebase Service Account** del proyecto

---

## ⚙️ Configuración inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/JuanKmilo03/Chatbot-back.git
cd Chatbot-back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo llamado **`.env`** en la raíz del proyecto y define las siguientes variables:

```bash
DATABASE_URL="postgresql://<usuario>:<contraseña>@<host>:<puerto>/<nombre_base>?schema=public"
JWT_SECRET="<clave_secreta>"
```

### 4. Configurar credenciales de Firebase

Crea el archivo `fbservice-account.json` en la raíz del proyecto con las credenciales del **Service Account** generadas desde Firebase Console.

⚠️ **Importante:**  
- No compartas este archivo.  
- Agrégalo al `.gitignore`.  
- Debe corresponder al mismo proyecto Firebase usado en el frontend.

---

## 🧩 Configuración de la base de datos

### 🆕 Primera vez (inicialización completa)

Si es la primera vez que vas a levantar el proyecto o estás creando la base de datos desde cero:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

> Esto aplicará las migraciones, generará el cliente Prisma y ejecutará el *seed* inicial con los datos de ejemplo y relaciones.

---

### 🔁 Reiniciar la base de datos

Si ya tienes datos creados pero realizaste cambios en los esquemas o en el archivo `seed.ts`, puedes **reiniciar completamente la base de datos** con:

```bash
npx prisma migrate reset
```

> Este comando:
> - Elimina toda la información actual.
> - Aplica nuevamente todas las migraciones.
> - Ejecuta automáticamente el *seed* actualizado.

---

## 🧪 Ejecutar el servidor en modo desarrollo

```bash
npm run dev
```

El servidor se iniciará en el puerto definido (por defecto **http://localhost:3000**).

---

## 📂 Estructura principal del proyecto

```
├── prisma/
│   ├── schema.prisma          # Definición del modelo de base de datos
│   ├── seed.ts                # Script de seed inicial
├── src/
│   ├── controllers/           # Controladores de cada entidad
│   ├── middlewares/           # Middlewares de autenticación y seguridad
│   ├── routes/                # Definición de endpoints
│   ├── utils/                 # Utilidades y helpers
│   └── app.ts              # Archivo principal del servidor
├── fbservice-account.json     # Credenciales Firebase (NO subir al repositorio)
├── .env                       # Variables de entorno
├── package.json
└── README.md
```

---

## 🧰 Comandos útiles

| Comando | Descripción |
|----------|--------------|
| `npx prisma migrate dev` | Aplica migraciones nuevas |
| `npx prisma generate` | Genera el cliente Prisma |
| `npx prisma db seed` | Ejecuta la semilla de datos |
| `npx prisma migrate reset` | Reinicia toda la base de datos |
| `npm run dev` | Inicia el servidor en modo desarrollo |

---

## 🛑 Notas importantes

- El archivo `fbservice-account.json` **no debe subirse al repositorio**.  
- Las credenciales de Firebase deben generarse desde el **mismo proyecto** donde está configurado el OAuth del frontend para evitar errores de autenticación.  
- Asegúrate de que la conexión de PostgreSQL esté activa antes de ejecutar Prisma.
