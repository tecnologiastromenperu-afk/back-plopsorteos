# PLOP Sorteos - Backend API

Backend Node.js + Express para validación de códigos promocionales. Los usuarios obtienen códigos comprando productos y los ingresan en el frontend para validar si tienen un premio asociado.

## Features

- ✅ Validación de códigos promocionales en tiempo real
- ✅ Validación de reCAPTCHA v3 (protección contra bots)
- ✅ Soporte para múltiples intentos por código (máximo de usos)
- ✅ Códigos con fecha de expiración
- ✅ Auditoría completa de intentos (logs de validación)
- ✅ CORS habilitado para frontend en localhost:5173
- ✅ Rate limiting para prevenir abuso
- ✅ MongoDB para persistencia de datos
- ✅ Error handling robusto

## Tech Stack

- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Base de Datos:** MongoDB (mongoose ODM)
- **Seguridad:** Helmet, CORS, reCAPTCHA v3, Rate Limiting
- **Validación:** express-validator
- **HTTP Client:** axios (para reCAPTCHA API)
- **Logging:** Console + File

## Installation

1. **Clonar/descargar el proyecto:**

   ```bash
   cd back-plopsorteos
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus valores:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/plop-sorteos
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   RECAPTCHA_MIN_SCORE=0.5
   FRONTEND_URL=http://localhost:5173
   ```

   **Obtener RECAPTCHA_SECRET_KEY:**
   - Ir a https://www.google.com/recaptcha/admin
   - Crear un nuevo sitio con reCAPTCHA v3
   - Copiar la "Secret Key"

4. **Asegurar que MongoDB esté corriendo:**

   **Opción A: MongoDB local (recomendado para desarrollo)**

   ```bash
   # Con Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # O instalar MongoDB en tu sistema
   # https://docs.mongodb.com/manual/installation/
   ```

   **Opción B: MongoDB Atlas (cloud)**

   - Crear cuenta en https://www.mongodb.com/cloud/atlas
   - Crear un cluster
   - Obtener connection string
   - Reemplazar `MONGODB_URI` en `.env`

## Running the Server

### Development (con auto-reload)

```bash
npm run dev
```

Output esperado:

```
✓ MongoDB connected successfully
✓ Server running on port 3000
```

### Production

```bash
npm start
```

## Deploy on Render

Este proyecto ya incluye blueprint para Render en `render.yaml`.

### Opcion 1: Blueprint (recomendada)

1. Push del repositorio a GitHub.
2. En Render: `New +` -> `Blueprint`.
3. Seleccionar el repo y confirmar creacion.
4. Configurar variables `sync: false` en Render.

### Opcion 2: Web Service manual

Configurar estos valores en Render:

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

### Variables de entorno requeridas en Render

- `MONGODB_URI`
- `JWT_SECRET`
- `RECAPTCHA_SECRET_KEY`
- `FRONTEND_URL`
- `ADMIN_FRONTEND_URL`

### Variables recomendadas

- `NODE_ENV=production`
- `JWT_EXPIRES_IN=8h`
- `RECAPTCHA_MIN_SCORE=0.5`
- `RECAPTCHA_SKIP_VALIDATION=false`
- `CORS_ALLOWED_ORIGINS=https://tu-frontend.com,https://admin.tu-dominio.com`

## Admin Bootstrap

### Generar hash de password

```bash
npm run admin:hash -- MyStrongPassword123
```

### Crear o actualizar administrador (upsert)

```bash
npm run admin:create -- admin@plopsorteos.com "Admin Principal" "MyStrongPassword123"
```

El comando crea el admin si no existe y actualiza su password si ya existe.

## API Endpoints

### 1. POST `/api/validate-code`

Valida un código promocional y retorna el premio si es válido.

**Request:**

```json
{
  "code": "6X85Y72D",
  "fullName": "Diego Norel Vega",
  "documentId": "71382231",
  "email": "diego@gmail.com",
  "phone": "990228575",
  "product": "MAX-FL MEDIANO",
  "recaptchaToken": "HFYWpzchNVNT00TnxGT0BXTgkMOjYzSSE1HgcPDxQiIyp0M2USG24MKShTZC5Qdz4lVQYyEFlXY2pleEBCUiQ7IExTQlARNy0nZ0xvFxBcT2RzIS4ECDxEIS18fkRRQUdaSFRuPStZLioMBwAXYCs0InskGwsJFGU8R3xpA2J_WkI3QVZ4dVJFFGh7XUdYfDUwGxoOdB0yJlgpcT9bDB9qKSomJmwaN1glJBMwEA4AY0VAQG8vIUIsIhBQT1BdYX52MFApSkZRHiIxIS8GCDwwZVdoIkh2T11-FV9sQSpeaHp8DV9BYmE3XQp1IgsJFBU7Uio2ZWt4amZqRHgXEm0HDhwbOiMpXXlsTVBLRAglJFUTIWEHGB0HKz8lVHkNNUx_ehU0BRhwBRkFVDU-OiQ7IGNWXlBRUnpgHmY-ABByDiM0Ki5zCDwyLFRyRmZ-BRlxAhUqdHFzfj4JBGJARWVpOXskaG1TVF9kdCo2ERcjKCE2BikcEA4AEH9fbnJzYzUwbwoPAAMkIj51NnYCbQ"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "¡Código válido! Has ganado un premio",
  "prize": {
    "type": "TV",
    "description": "Samsung 55 pulgadas"
  }
}
```

**Response (Error - Invalid Code):**

```json
{
  "success": false,
  "message": "Promotional code not found",
  "reason": "invalid_code"
}
```

**Response (Error - Code Expired):**

```json
{
  "success": false,
  "message": "Promotional code has expired",
  "reason": "code_expired"
}
```

**Response (Error - Max Uses Exceeded):**

```json
{
  "success": false,
  "message": "Promotional code has reached maximum uses",
  "reason": "max_uses_exceeded"
}
```

**Response (Error - reCAPTCHA Failed):**

```json
{
  "success": false,
  "message": "reCAPTCHA validation failed",
  "reason": "recaptcha_validation_failed"
}
```

**Status Codes:**

- `200 OK` - Código válido
- `400 Bad Request` - Validación fallida, código expirado, o usos agotados
- `404 Not Found` - Código no existe
- `500 Internal Server Error` - Error del servidor

### 2. GET `/api/health`

Health check para verificar que el servidor esté corriendo.

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-05-10T15:30:20.123Z"
}
```

### 3. GET `/`

Información del API.

**Response:**

```json
{
  "success": true,
  "message": "PLOP Sorteos Backend API",
  "version": "1.0.0",
  "timestamp": "2024-05-10T15:30:20.123Z"
}
```

### 4. Backoffice Admin API

Auth:
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`

Codes:
- `POST /api/admin/codes`
- `GET /api/admin/codes`
- `GET /api/admin/codes/:id`
- `PATCH /api/admin/codes/:id`
- `DELETE /api/admin/codes/:id` (soft delete)
- `POST /api/admin/codes/import/csv?upsert=true|false`
- `POST /api/admin/codes/import/excel?upsert=true|false`

Reports:
- `GET /api/admin/reports/redemptions`
- `GET /api/admin/reports/winners`
- `GET /api/admin/reports/dashboard/summary`

Todos los endpoints admin requieren header:

```text
Authorization: Bearer <token>
```

### 5. Postman Collection

Colección lista para importar:
- `postman/PLOP-Sorteos-Backend.postman_collection.json`

Variables incluidas:
- `baseUrl`
- `adminToken` (se llena automáticamente al hacer login)
- `codeId` (se llena automáticamente al crear un código)

## Database Schema

### PromotionalCode Collection

```javascript
{
  _id: ObjectId,
  code: String,              // Unique, primary key
  prize: {
    type: String,           // e.g., "TV", "VIAJE"
    description: String     // e.g., "Samsung 55 pulgadas"
  },
  maxUses: Number,          // Total de usos permitidos
  usedCount: Number,        // Usos realizados
  expirationDate: Date,     // Fecha de expiración
  isActive: Boolean,        // Activar/desactivar código
  product: String,          // e.g., "MAX-FL MEDIANO"
  createdAt: Date,
  updatedAt: Date
}
```

### ValidationLog Collection

```javascript
{
  _id: ObjectId,
  code: String,
  email: String,
  documentId: String,
  fullName: String,
  phone: String,
  product: String,
  status: String,           // "valid", "invalid", "expired", "max_uses_exceeded", "recaptcha_failed", "not_found"
  prize: Object,            // null si no fue válido
  recaptchaScore: Number,   // Score de reCAPTCHA (0-1)
  userAgent: String,
  ipAddress: String,
  timestamp: Date,
  reason: String            // Razón del fallo
}
```

## File Structure

```
back-plopsorteos/
├── config/
│   ├── database.js         # MongoDB connection
│   └── recaptcha.js        # reCAPTCHA configuration
├── models/
│   ├── PromotionalCode.js  # Schema de códigos
│   └── ValidationLog.js    # Schema de auditoría
├── controllers/
│   └── validateCode.js     # Lógica de negocio
├── routes/
│   └── validate.js         # Definición de rutas
├── middleware/
│   ├── logger.js           # Logging
│   ├── errorHandler.js     # Error handling global
│   └── validation.js       # Validación de entrada
├── utils/
│   └── recaptchaValidator.js # Validación reCAPTCHA
├── logs/                   # Archivos de logs (generados)
├── server.js               # Entry point
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Logging

Los logs se guardan en dos lugares:

1. **Console** - Output en tiempo real
2. **Archivo** - `logs/app.log`

Los logs incluyen:

- Intentos de validación exitosos
- Intentos fallidos (con razón)
- Errores del servidor
- Conexión a MongoDB
- Solicitudes HTTP

## Testing

### Test manual con curl

```bash
curl -X POST http://localhost:3000/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "6X85Y72D",
    "fullName": "Diego Norel Vega",
    "documentId": "71382231",
    "email": "diego@gmail.com",
    "phone": "990228575",
    "product": "MAX-FL MEDIANO",
    "recaptchaToken": "your_valid_recaptcha_token"
  }'
```

### Health check

```bash
curl http://localhost:3000/api/health
```

## Insertar códigos de prueba en MongoDB

```javascript
// En MongoDB shell o Compass
db.promotionalcodes.insertOne({
  code: "6X85Y72D",
  prize: {
    type: "TV",
    description: "Samsung 55 pulgadas"
  },
  maxUses: 1,
  usedCount: 0,
  expirationDate: new Date("2025-12-31"),
  isActive: true,
  product: "MAX-FL MEDIANO",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `MongoDB connection error` | Verificar que MongoDB esté corriendo en localhost:27017 o revisar MONGODB_URI |
| `RECAPTCHA_SECRET_KEY not configured` | Configurar la variable en .env |
| `CORS error in browser` | Verificar que FRONTEND_URL es localhost:5173 |
| `Port 3000 already in use` | Cambiar PORT en .env o matar proceso en puerto 3000 |
| `Rate limit exceeded` | Esperar 15 minutos o reiniciar el servidor |

## Future Improvements

- [ ] Agregár autenticación para admin panel
- [ ] Dashboard para gestionar códigos
- [ ] Email notifications cuando se valida un código
- [ ] Webhook para notificar al frontend
- [ ] Tests unitarios
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Soporte para múltiples tipos de premios
- [ ] Integración con sistema de email (Nodemailer)
- [ ] Metrics y analytics

## License

ISC

## Contact

Para preguntas o problemas, contactar al equipo de desarrollo.
