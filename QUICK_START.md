# Quick Start Guide - PLOP Sorteos Backend

## 1. Environment Setup (5 min)

### Prerequisites:
- Node.js v16+ instalado
- MongoDB corriendo localmente o con MongoDB Atlas
- reCAPTCHA secret key

### Steps:

1. **Configurar variables de entorno:**
   ```bash
   # Copy from example
   cp .env.example .env
   
   # Edit .env with your values:
   # - MONGODB_URI: tu URL de MongoDB
   # - RECAPTCHA_SECRET_KEY: tu secret key de Google reCAPTCHA
   # - FRONTEND_URL: http://localhost:5173
   ```

2. **Dependencias ya instaladas** (npm install completado)

## 2. Start MongoDB (2 min)

### Opción A: Docker (Recomendado)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Opción B: MongoDB Local
Instalar desde https://www.mongodb.com/try/download/community

### Opción C: MongoDB Atlas (Cloud)
```
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear cluster
4. Copiar connection string
5. Pegar en .env como MONGODB_URI
```

## 3. Seed Database con Códigos de Prueba (1 min)

```bash
# Esto insertará 8 códigos de ejemplo en MongoDB
node scripts/seedDatabase.js
```

**Códigos disponibles:**
- `6X85Y72D` — TV Samsung 55"
- `VIAJE2024` — Viaje a Cancún (máx 2 usos)
- `SONIDO999` — Equipo de sonido Sony
- `PLAYSTATION5` — PS5 con 2 controles
- `IPHONE15PRO` — iPhone 15 Pro
- `LAPTOP2024` — MacBook Pro 16"
- `EXPIRED2024` — Código expirado (para testing)
- `MAXUSED2024` — Código con usos agotados

## 4. Iniciar el Servidor (1 min)

### Development (con auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

**Output esperado:**
```
✓ MongoDB connected successfully
✓ Server running on port 3000
```

## 5. Verificar que Funciona (2 min)

### Health Check
```bash
curl http://localhost:3000/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-05-10T15:30:20.123Z"
}
```

### Validar un Código
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
    "recaptchaToken": "HFYWpzchNVNT00TnxGT0BXTgk..."
  }'
```

Deberías ver:
```json
{
  "success": true,
  "message": "¡Código válido! Has ganado un premio",
  "prize": {
    "type": "TV",
    "description": "Samsung 55 pulgadas 4K"
  }
}
```

## 6. Testing Automatizado

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

### macOS/Linux (Bash)
```bash
bash test-api.sh
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| `MongoDB connection error` | Verificar que MongoDB esté corriendo en puerto 27017 |
| `EADDRINUSE: address already in use` | Puerto 3000 ocupado: cambiar `PORT` en `.env` |
| `RECAPTCHA_SECRET_KEY not configured` | Configurar en `.env` |
| `CORS error in browser` | Verificar que `FRONTEND_URL=http://localhost:5173` en `.env` |

## Próximos Pasos

1. **Frontend:** Conectar tu app React/Vue al endpoint `POST /api/validate-code`
2. **Admin Panel:** Crear endpoints para agregar/editar/eliminar códigos (requiere autenticación)
3. **Email Notifications:** Enviar email cuando el usuario gana un premio
4. **Database GUI:** Usar MongoDB Compass para visualizar datos

## File Locations

| Archivo | Propósito |
|---------|-----------|
| `server.js` | Entrada principal |
| `controllers/validateCode.js` | Lógica de negocio |
| `routes/validate.js` | Definición de rutas |
| `models/PromotionalCode.js` | Schema de códigos |
| `models/ValidationLog.js` | Schema de auditoría |
| `.env` | Variables de entorno |
| `logs/app.log` | Archivo de logs |

## API Reference

### POST /api/validate-code

**Request:**
```json
{
  "code": "6X85Y72D",
  "fullName": "Diego Norel Vega",
  "documentId": "71382231",
  "email": "diego@gmail.com",
  "phone": "990228575",
  "product": "MAX-FL MEDIANO",
  "recaptchaToken": "token_de_google"
}
```

**Response (Success - HTTP 200):**
```json
{
  "success": true,
  "message": "¡Código válido! Has ganado un premio",
  "prize": {
    "type": "TV",
    "description": "Samsung 55 pulgadas 4K"
  }
}
```

**Response (Invalid Code - HTTP 404):**
```json
{
  "success": false,
  "message": "Promotional code not found",
  "reason": "invalid_code"
}
```

**Response (Expired - HTTP 400):**
```json
{
  "success": false,
  "message": "Promotional code has expired",
  "reason": "code_expired"
}
```

**Response (Max Uses Exceeded - HTTP 400):**
```json
{
  "success": false,
  "message": "Promotional code has reached maximum uses",
  "reason": "max_uses_exceeded"
}
```

**Response (reCAPTCHA Failed - HTTP 400):**
```json
{
  "success": false,
  "message": "reCAPTCHA validation failed",
  "reason": "recaptcha_validation_failed"
}
```

## Documentación Completa

Ver [README.md](README.md) para documentación detallada de:
- Instalación
- Configuración
- API endpoints
- Database schema
- Troubleshooting
- Future improvements
