# Música de LectoAprende y actualización en Render

## Qué trae esta versión

- 8 melodías principales para los mundos, 4 para los cuentos. Cada escena tiene **dos arreglos** que se alternan en visitas sucesivas (24 archivos MP3).
- Música de ambiente instrumental y tranquila, sintetizada originalmente sin incorporar canciones o grabaciones de terceros.
- Lectura de Lito con prioridad: el volumen musical baja automáticamente cuando empieza a hablar y vuelve al nivel anterior cuando termina.
- Botón **🎵 Activar música / 🔇 Silenciar música** en los mundos y durante los cuentos. Se recuerda la preferencia de cada navegador.
- La música cambia al pasar de un mundo a otro o de un cuento a otro, y se detiene al salir de esas pantallas o cambiar de pestaña. No afecta la actividad, el progreso ni los premios.

## Publicar si ya estás usando Render

1. **No crees un servicio nuevo** si ya tienes LectoAprende publicado en Render.
2. Descomprime el ZIP completo. Entra a tu mismo repositorio GitHub del proyecto y sube/reemplaza los archivos con el contenido actualizado, incluida toda la carpeta `public/audio/music/`. No incluyas `node_modules` ni archivos `.env`.
3. Confirma los cambios (commit) en la rama conectada a Render. Si el auto-deploy está habilitado, Render actualizará el mismo servicio. Si no lo está, en Render elige **Manual Deploy → Deploy latest commit**.
4. Abre tu **mismo enlace HTTPS** de Render y prueba Mundo 1 y un cuento. Si el navegador no permite reproducir música automáticamente, pulsa **🎵 Activar música**.
5. Al hablar Lito, la música debe quedar muy suave. Al salir de la página de actividad, debe detenerse.

Si aún NO has publicado: sigue la guía `GUIA-PUBLICAR-AULA-VIRTUAL.md` con esta versión del ZIP. No necesitas Spotify, YouTube ni licencias externas de música.

## Nota sobre sonido automático

Por privacidad y accesibilidad, algunos navegadores bloquean el sonido que se intenta reproducir antes de cualquier interacción del usuario. La app intenta arrancar la música al entrar, pero no puede anular esa política. Por eso el botón de música es necesario como respaldo. Se puede silenciar sin cambiar el volumen de la narración.
