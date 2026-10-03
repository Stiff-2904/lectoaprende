# LectoAprende Backend

API REST para el prototipo académico de LectoAprende.

## Alcance

- Sin usuarios, login ni cuentas personales.
- Sin base de datos en esta etapa.
- Sesiones anónimas almacenadas temporalmente en memoria.
- El estado se reinicia cuando se apaga el servidor.
- Cuatro módulos de práctica.
- Validación de respuestas.
- Progreso por estrellas.
- Resumen breve para la persona adulta.

## Requisitos

- Node.js 20 o superior.
- npm.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

En Windows puede copiar `.env.example` a `.env` manualmente.

Servidor por defecto:

```text
http://localhost:3000
```

## Pruebas automáticas

```bash
npm test
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba que la API está activa |
| GET | `/api/modules` | Lista los cuatro módulos |
| GET | `/api/modules/:moduleId` | Devuelve un módulo |
| GET | `/api/modules/:moduleId/exercises` | Lista ejercicios de un módulo |
| GET | `/api/modules/:moduleId/exercises/:exerciseId` | Devuelve un ejercicio |
| POST | `/api/sessions` | Crea una sesión anónima |
| POST | `/api/sessions/:sessionId/attempts` | Registra y valida un intento |
| GET | `/api/sessions/:sessionId/progress` | Devuelve el progreso |
| GET | `/api/sessions/:sessionId/adult-summary` | Devuelve resumen para adulto |
| DELETE | `/api/sessions/:sessionId` | Elimina la sesión temporal |

## Ejemplo de flujo

### 1. Crear sesión

```http
POST /api/sessions
```

Respuesta:

```json
{
  "data": {
    "sessionId": "uuid",
    "createdAt": "2026-10-03T00:00:00.000Z",
    "message": "Sesión anónima creada. No se solicitaron datos personales."
  }
}
```

### 2. Enviar respuesta

```http
POST /api/sessions/:sessionId/attempts
Content-Type: application/json

{
  "moduleId": 1,
  "exerciseId": "m1-e1",
  "answer": "M"
}
```

Para el módulo 4, la respuesta es un arreglo:

```json
{
  "moduleId": 4,
  "exerciseId": "m4-e1",
  "answer": ["ME", "SA"]
}
```

## Probar manualmente

El archivo `requests.http` contiene ejemplos listos para usar con la extensión REST Client de VS Code. También puede usar Postman o Insomnia.
