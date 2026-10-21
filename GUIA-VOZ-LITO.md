# Voz infantil de Lito · Guía de configuración

## Voz elegida

- **Marina Neural** (identificador `es-MX-MarinaNeural`), voz infantil femenina para español de México, publicada en la lista oficial de voces de Microsoft Azure.
- **Estilo de LectoAprende**: voz amable, ligeramente pausada (-6 %) y alegre (tono +4 %), adecuada como acompañamiento de actividades. Compruebe la pronunciación real antes de usarla para enseñar fonemas.
- **Sin clave de Azure**: la app sigue funcionando y utiliza una voz española del navegador/dispositivo, que no necesariamente es infantil.

La voz **no se incluye como MP3**: se genera cuando se solicita, mediante Azure Speech desde el servidor. Para escuchar la voz infantil auténtica hace falta configurar un recurso y tener acceso a Internet. No se adjunta ni comparte ninguna clave privada.

## Paso 1. Crear un recurso Azure Speech

1. Acceda a https://portal.azure.com y registre o ingrese a su cuenta.
2. Cree un recurso **Speech** (Azure AI Speech / Azure AI services, según el portal); seleccione una región disponible, por ejemplo `eastus`. Antes de confirmar, revise el nivel gratuito y la facturación según su cuenta.
3. En **Keys and Endpoint / Claves y punto de conexión**, obtenga su **clave** y **región**.
4. Si quiere probar voces primero, visite https://speech.microsoft.com/portal/voicegallery y busque **Spanish (Mexico) – Marina**.

**Seguridad:** no publique, pegue en chats, ni agregue al código fuente o frontend la clave real de Azure. No añada el archivo `.env` al repositorio.

## Paso 2. Activar en Windows

1. Descomprima el archivo del proyecto.
2. Abra una terminal en la carpeta `lectoaprende` (donde está `package.json`).
3. Ejecute `npm install` si no tiene las dependencias instaladas.
4. Copie `.env.example` a un archivo `.env` en esa carpeta.
5. Edite `.env`, sin comillas, por ejemplo:

   ```env
   PORT=3000
   NODE_ENV=development
   AZURE_SPEECH_KEY=SU_CLAVE_REAL_AQUI
   AZURE_SPEECH_REGION=eastus
   ```

6. Arranque la aplicación con `npm start`.
7. Abra `http://localhost:3000/adults`.
8. En **Elige la voz de Lito**, seleccione **Lito infantil · Marina** y pulse **Escuchar prueba**.
9. Abra `http://localhost:3000/` y pruebe **Escuchar a Lito**; en las aventuras pulse **Escuchar de nuevo**.

Si el audio no funciona, verifique la clave, región, disponibilidad del servicio, salida de sonido, conexión a Internet y permisos de reproducción del navegador. Si Azure falla durante una actividad, LectoAprende mantiene seleccionada la voz Marina y muestra un aviso para volver a intentarlo; **no cambia a otra voz a mitad de un mundo**. Si Azure no está configurado, usa la voz del dispositivo.

## Cómo funciona

- `GET /api/voice/status`: informa si Azure está configurado **sin revelar la clave**.
- `POST /api/voice/speak` con `{ "text": "..." }`: genera un MP3 mediante Azure Speech con Marina.
- Se aceptan únicamente las frases educativas predefinidas y los mensajes de retroalimentación presentes en `src/data/exercises.js`. Esto evita que la API pública se utilice para generar cualquier texto y ayuda a controlar costos.
- Se guarda en memoria una caché pequeña de las frases solicitadas para reducir llamadas y latencia. También hay un límite básico por dirección IP.
- La clave de Azure **solo se usa en el servidor**. El navegador no la recibe.
- Azure recibe únicamente el texto de la instrucción o felicitación, **no el nombre ni la respuesta del niño**.
- Cuando Azure no está habilitado se utiliza la voz del dispositivo, que queda fijada entre mundos. Si Azure está habilitado y falla temporalmente, no se cambia a otra voz sin avisar.
- La selección de voz se guarda en el navegador de la persona adulta mediante `localStorage`. Para activar Marina por defecto, no se necesita intervenir.
- Lito intenta hablar automáticamente una vez por reto o página; algunos navegadores exigen primero una interacción del usuario. Se puede pulsar el botón para repetir.

## Nota pedagógica

La síntesis de voz puede pronunciar de forma imprecisa **fonemas aislados** y separar mal sílabas como «ME-SA». Para actividades de conciencia fonológica conviene preparar grabaciones de referencia revisadas por una docente y utilizarlas en lugar de generar fonemas aislados automáticamente.

## Fuentes oficiales

- Voces disponibles en Microsoft Azure: https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts
- REST para texto a voz: https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech
- Inicio rápido: https://learn.microsoft.com/azure/ai-services/speech-service/get-started-text-to-speech
