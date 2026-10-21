# LectoAprende · Aventuras con Lito

Aplicación web de lectoescritura para primer grado. **Los ocho mundos educativos y las secciones complementarias están implementados.** La presentación visual se mantiene para modificarla en una etapa posterior.

## Funciones incluidas

- **Mundo 1 · Letras y sonidos:** cinco ejercicios para identificar letras iniciales de palabras.
- **Mundo 2 · Letras que se parecen:** cinco ejercicios de reconocimiento de `b/d`, `p/q` y `m/n`.
- **Mundo 3 · Construyo sílabas:** cinco ejercicios que combinan consonantes y vocales, mostrando la sílaba formada.
- **Mundo 4 · Armo y leo palabras:** cinco ejercicios para ordenar las sílabas de palabras sencillas, con corrección y nuevo intento.
- **Cuentos:** cuatro relatos cortos de cuatro o cinco páginas, lectura por voz y preguntas de comprensión.
- **Logros:** 24 estrellas posibles, álbum con 12 pegatinas, mapa con avances por mundo.
- **Personas adultas:** avance en los ocho mundos, conteo local de intentos, sugerencia para continuar y reinicio del progreso.
- **Mundos desbloqueables:** al iniciar sólo está abierto el Mundo 1. Cada mundo siguiente se desbloquea al superar los cinco ejercicios de todos los anteriores. El mapa y el álbum muestran candados; tampoco se puede saltar un mundo escribiendo directamente su dirección. Al completarlo aparece un botón para continuar al siguiente.
- **Continuidad:** se guarda el progreso en el navegador; al abrir un mundo se reanuda en el primer ejercicio pendiente. Los mundos completos permiten volver a practicarse sin perder las estrellas.
- **Voz automática:** Lito intenta leer por sí solo cada instrucción una vez al llegar a un reto, cada página de cuento y su pregunta, además de la bienvenida. El botón de audio queda para repetirla. Se evita solapar voces al cambiar de actividad. Audio mediante voz del dispositivo o Azure Speech / Marina opcional. La voz del dispositivo permanece fija entre mundos; si Azure está configurado pero falla, no se cambia de voz sin avisar.

## Ejecutar

Se necesita **Node.js 20 o superior**. En una terminal, dentro de la carpeta del proyecto:

```bash
npm ci
npm start
```

Abre **http://localhost:3000**. En desarrollo, `npm run dev` reinicia el servidor después de los cambios.

### Rutas

| Página | Dirección |
|---|---|
| Inicio | `/` |
| Mapa de aventuras | `/menu` |
| Letras y sonidos | `/module1` |
| Letras parecidas | `/module2` |
| Construyo sílabas | `/module3` |
| Armo palabras | `/module4` |
| Detectives de vocales | `/module5` |
| Isla de las rimas | `/module6` |
| Montaña de palmadas | `/module7` |
| Ciudad de las oraciones | `/module8` |
| Cuentos | `/stories` |
| Logros | `/progress` |
| Familias y docentes | `/adults` |

Se puede añadir `?repetir=1` al enlace de un **mundo desbloqueado** para practicarlo desde el primer ejercicio. Los mundos bloqueados no se pueden abrir con una URL directa.

## Pruebas

Con las dependencias instaladas:

```bash
npm test
```

También es posible ejecutar las pruebas del motor educativo y los flujos simulados del navegador **sin instalar dependencias**:

```bash
node --test tests/core.test.js tests/frontend.test.js
```

Incluye pruebas de los 40 retos, reintentos, validación de opciones, ocho mundos completados, continuidad, repetición, estrellas, cuentos, pegatinas, reinicio y endpoints de la API. Consulta [PRUEBAS-Y-ENTREGA.md](PRUEBAS-Y-ENTREGA.md) para ver el alcance de verificación.

## Almacenamiento y privacidad

La app no solicita datos personales del niño. El navegador conserva solo IDs de retos/cuentos completados y contadores de intentos mediante `localStorage`; los intentos de la API y las sesiones anónimas se conservan **solo temporalmente en la memoria del servidor** y se pierden al reiniciarlo. Repetir un reto no suma estrellas adicionales. El botón de reinicio del apartado para adultos borra los logros locales y la sesión anónima actual.

**Importante:** los datos guardados en el navegador no se sincronizan entre dispositivos y se pueden perder al borrar sus datos. No es un sistema de cuentas ni de evaluación formal. El servicio de voz Azure exige credenciales propias y conexión externa. Sin Azure, se intenta utilizar la voz del navegador. **Importante:** algunos navegadores bloquean la reproducción automática de audio antes de la primera interacción del usuario. Si no se oye al entrar, el botón «Escuchar a Lito» permite iniciar/repetir la lectura. No se puede garantizar la reproducción automática en todos los navegadores.

Para activar la voz infantil recomendada sin exponer contraseñas, consulta [GUIA-VOZ-LITO.md](GUIA-VOZ-LITO.md) y copia `.env.example` a `.env` en tu computadora. **No compartas el archivo `.env` ni subas claves privadas a repositorios.**

## Estructura

- `src/`: servidor Express, rutas de API, servicios y banco de ejercicios.
- `public/views/`: páginas HTML.
- `public/js/kids.js`: navegación, actividades, cuentos, voz y progreso del navegador.
- `public/css/` y `public/images/`: apariencia actual, reservada para la siguiente etapa.
- `tests/`: pruebas del motor, navegador simulado y API.

## Ampliación de contenido (8 mundos y 4 cuentos)

Además de los cuatro mundos originales, ahora están:

- **Mundo 5 — Detectives de vocales:** completar vocales perdidas en palabras con apoyo visual.
- **Mundo 6 — La isla de las rimas:** identificar palabras que tienen sonidos finales parecidos.
- **Mundo 7 — La montaña de palmadas:** contar sílabas y elegir sílabas faltantes.
- **Mundo 8 — La ciudad de las oraciones:** ordenar palabras para formar frases sencillas.

Cada mundo tiene cinco retos y se abre al terminar los anteriores. La narración de instrucciones continúa siendo automática (si el navegador permite audio sin interacción); el botón sirve para repetirla. Hay cuatro cuentos, con lectura por páginas, preguntas y pegatinas: *Lito y la luna*, *Sapo y la sopa*, *La semilla viajera* y *La cometa de colores*.

Los logros existentes de los mundos 1–4 se conservan al actualizar en el mismo navegador. Los datos permanecen locales; borrar el almacenamiento del navegador también borra los logros.
