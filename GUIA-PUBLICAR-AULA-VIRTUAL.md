# Publicar LectoAprende en el aula virtual

## Objetivo

`http://localhost:3000` solo funciona en tu propia computadora. Para que los demás entren desde sus dispositivos, debes publicar el proyecto en un alojamiento web. **Render** ofrece alojamiento para Node.js/Express y genera una URL HTTPS del tipo `https://nombre-que-asigne-render.onrender.com`.

> No confundas una dirección de ejemplo con una web publicada. El enlace real aparece al completar el despliegue en Render.

## Pasos sencillos: GitHub + Render

1. **Descomprime** el ZIP `lectoaprende_listo_para_publicar.zip`. Trabaja con el contenido de la carpeta, donde están `package.json`, `render.yaml`, `public/` y `src/`.
2. En https://github.com crea una cuenta o entra a tu cuenta; haz clic en **New repository** y ponle `lectoaprende`. Puedes crearlo **Private** (Render podrá acceder si autorizas la conexión de GitHub). Debe estar vacío o contener solo un README inicial.
3. En el repositorio, **Add file → Upload files**. Arrastra todos los archivos y carpetas del proyecto **como contenido raíz**: `package.json` y `render.yaml` deben verse en la primera página del repositorio, no dentro de otra carpeta. **No subas `.env` ni claves privadas.** Confirma con **Commit changes**. Si la interfaz del navegador no conserva la estructura de carpetas, usa GitHub Desktop o Git para subir el proyecto; no subas solamente el ZIP.
4. Ve a https://dashboard.render.com y conecta GitHub. Selecciona **New → Web Service** y el repositorio `lectoaprende`.
5. Indica **Language: Node**, **Build Command: `npm ci`**, **Start Command: `npm start`**, y selecciona **Free**, si aparece disponible. Deja **Root Directory** en blanco (el proyecto está en la raíz). El archivo `render.yaml` también incluye esos ajustes como alternativa para crear un Blueprint.
6. Crea el servicio. Cuando termine, Render mostrará una URL HTTPS como `https://lectoaprende-xxxxx.onrender.com`. **Esa es la dirección que debes copiar**; el nombre puede variar.
7. Ábrela en una ventana privada o desde otro dispositivo y prueba `https://TU-URL/`, `https://TU-URL/menu`, `https://TU-URL/stories`, `https://TU-URL/api/health` (este último debe devolver `"ok":true`).
8. En el aula virtual (Moodle u otra plataforma), agrega un **recurso URL/enlace** y pega **la URL HTTPS principal** que te dio Render. Si hay opción de visualizar en una nueva ventana, úsala para evitar problemas con audio y almacenamiento del navegador. También puedes enlazar los cuentos con `/stories`, si la plataforma lo permite.

## Conservar la misma voz de Lito (Microsoft Azure)

El ZIP no incluye credenciales privadas. Si usabas la voz de Microsoft Azure, en Render abre tu servicio → **Environment** → agrega estas variables:

- `AZURE_SPEECH_KEY` = tu clave propia de Azure Speech.
- `AZURE_SPEECH_REGION` = la región de ese recurso, por ejemplo `eastus` **solo si esa es realmente tu región**.

Guarda las variables y deja que Render despliegue nuevamente. Puedes comprobar `https://TU-URL/api/voice/status`, que debe mostrar `"configured":true` si están bien configuradas. Sin credenciales Azure, se intentará usar la voz del navegador y puede sonar distinta. No publiques tu clave ni la envíes en el aula virtual. Para el audio automático, algunos navegadores exigen una primera interacción.

## Limitaciones y comprobaciones

- **Servicio gratuito:** Render puede suspender la aplicación tras 15 minutos de inactividad; el siguiente acceso puede demorarse mientras vuelve a iniciar.
- **Progreso:** el avance se guarda en cada navegador. No es un registro central de calificaciones; un estudiante no verá su progreso en otro dispositivo y el aula virtual no recibirá notas automáticamente.
- **Sesiones de servidor:** se conservan en memoria y pueden reiniciarse al dormir o reiniciar el servicio. Los logros locales del navegador permanecen mientras el alumno no borre sus datos.
- **Audio:** verifica que Lito se escuche en un celular y en el navegador usado en el aula; Azure requiere sus credenciales y acceso a internet.
- **Enlaces:** si el aula virtual bloquea contenido incrustado, usa un enlace externo que abra en una nueva pestaña.
- **Cambios futuros:** al actualizar los archivos del repositorio conectado en GitHub, Render puede desplegar las modificaciones automáticamente.

## Enlaces oficiales

- Render: https://render.com/docs/deploy-node-express-app
- Limitaciones gratuitas: https://render.com/docs/free
- GitHub: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
