# LectoAprende · Estado funcional y comprobaciones

## Módulos

| Sección | Entregado | Comportamiento |
|---|---|---|
| Mundo 1: letras y sonidos | Sí | Cinco retos, corrección y reintentos |
| Mundo 2: letras parecidas | Sí | Cinco retos, reconocimiento de grafemas, corrección |
| Mundo 3: sílabas | Sí | Cinco retos, consonante + vocal y sílaba visible |
| Mundo 4: palabras | Sí | Cinco retos, selección secuencial de sílabas, error y reordenación |
| Continuidad del juego | Sí | Retoma pendiente, completa y permite repetir |
| Bloqueo de mundos | Sí | Los mundos 2 a 8 se desbloquean de forma secuencial al completar los cinco retos del anterior; bloqueo también en URL directa |
| Mapa principal | Sí | Muestra retos completados, mundos bloqueados y acceso al siguiente mundo completado |
| Mundo 5: vocales | Sí | Cinco retos para completar palabras con vocales |
| Mundo 6: rimas | Sí | Cinco retos de sonidos finales y rimas |
| Mundo 7: palmadas | Sí | Tres ejercicios de conteo y dos de completar sílabas |
| Mundo 8: oraciones | Sí | Cinco retos de ordenar palabras para formar oraciones |
| Cuentos | Sí | Cuatro cuentos, navegación, lectura, preguntas y pegatinas |
| Logros | Sí | 24 estrellas por 40 retos y 12 pegatinas |
| Área para adultos | Sí | Resumen por mundo, intentos locales y reinicio |
| Narración | Sí / opcional | La instrucción se intenta reproducir una vez por reto al entrar, igual que los cuentos y su pregunta; botón para repetir y voz del navegador / Azure |

## Verificaciones realizadas sobre esta entrega

- `node --test tests/core.test.js`: comprobaciones del contenido de los 40 ejercicios, respuestas válidas, validaciones, reintentos, cálculo de estrellas y finalización de los ocho mundos.
- `node --test tests/frontend.test.js`: pruebas simuladas del navegador para continuidad, repetición, error y reordenamiento de sílabas, mapa, álbum, cuentos y reinicio. También comprueba bloqueo de mundos y direcciones directas, desbloqueo en cadena, botón para continuar, voz automática por reto y cuento, y repetición manual de audio.
- `node --check public/js/kids.js`: verificación de sintaxis JavaScript.
- **Resultado:** 48 de 48 pruebas automatizadas superadas con `npm test` el 21 de octubre de 2026, incluyendo API y voz simulada.
- Los archivos HTML de `/module1` a `/module8` comparten un motor que identifica el módulo mediante la URL.

**Limitación del audio:** la política de reproducción automática del navegador puede impedir que se escuche la primera instrucción sin una interacción previa (sobre todo en Safari y móviles). La aplicación hace un intento automático por ejercicio/página; en esos casos la opción manual «Escuchar a Lito» sigue disponible.

**Limitación de la verificación:** las pruebas de API y voz se ejecutaron con las dependencias originales del proyecto; la prueba de Azure usa un servidor simulado, sin credenciales reales. Tampoco se verificó el funcionamiento en un navegador gráfico en el equipo de destino. Las pruebas de interfaz utilizan un DOM simulado, no Chrome/Firefox completo.

## Para comprobarlo en el equipo de entrega

1. Ejecuta `npm ci`, `npm test` y `npm start`.
2. Visita `/menu`: al inicio sólo Mundo 1 debe tener enlace; los otros deben indicar candado. Verifica que `/module2` escrito directamente muestre el bloqueo. Termina los 5 retos del Mundo 1 y comprueba que se habilita el Mundo 2, y así sucesivamente.
3. Al abrir un reto, Lito debe intentar leer la instrucción una sola vez, sin pulsar «Escuchar». Repite con el botón manual si lo deseas. Recarga un módulo durante la práctica: debe retomar el primer reto pendiente. En uno terminado, pulsa «Repetir mundo».
4. Completa los cuatro cuentos y revisa `/progress`: 24 estrellas y 12 pegatinas una vez terminado todo.
5. En `/adults`, comprueba el resumen y prueba «Reiniciar progreso» cuando ya no necesites conservar los logros.
6. Si tienes Azure, configura `.env` localmente y verifica `/api/voice/status` y la prueba de voz; si no, utiliza el navegador como respaldo.

## Pendiente expresamente para la siguiente etapa

**Solo los ajustes gráficos que indique el usuario.** No se han rediseñado paleta, mascota, ilustraciones, estructura visual ni animaciones. Se añadieron estilos funcionales para mostrar los cuatro nuevos mundos y los candados.

## Contenido agregado (2026-10-21)

- Mundos 5–8: vocales ausentes, rimas, palmadas/sílabas y ordenación de oraciones.
- Cuentos adicionales: *La semilla viajera* y *La cometa de colores*, con cinco páginas y una pregunta cada uno.
- Contadores en el mapa, álbum y panel de adultos ampliados a 40 retos, 24 estrellas y 12 pegatinas.
- Se preservan los progresos previos del navegador para mundos 1–4.
- Voz de Lito: la lista segura de frases aceptadas por la API incluye el nuevo contenido.
- Se mantienen limitaciones conocidas: las voces automáticas pueden requerir interacción del usuario; las credenciales Azure son externas, y las sesiones temporales de servidor no persisten al reiniciar.


## Corrección de consistencia de la voz (octubre 2026)
- Los ocho mundos usan la misma configuración de audio de Lito: Azure Marina si está habilitada, o una voz española del dispositivo cuando no hay configuración Azure.
- El anterior límite de 20 textos nuevos por minuto podía forzar cambios de voz tras encadenar ejercicios. Se amplió a 90, manteniendo textos permitidos y caché acotada.
- Con Marina activada, si falla una solicitud, ya no se reproduce de improviso otra voz: aparece un mensaje y se puede reintentar con el botón de escuchar.
- Se recuerda la voz del dispositivo entre mundos para minimizar cambios de timbre.
- El Mundo 4 utiliza ahora sílabas en minúsculas en las instrucciones narradas para mejorar su pronunciación.
- Las pruebas automatizadas simulan los fallos del servicio y verifican la coherencia del audio. Es necesario escuchar el resultado real en el navegador y, si se usa, con las credenciales de Azure configuradas.


## Incorporación posterior: música por mundos y cuentos

- 24 pistas MP3 originales: dos versiones por cada uno de los ocho mundos y cuatro cuentos.
- Alternancia de pistas comprobada, control de silencio persistente, volumen atenuado durante la narración, pausa al cambiar de pestaña y manejo del bloqueo de reproducción automática.
- **58 pruebas automatizadas superadas** al ejecutar `npm test` con las dependencias instaladas (incluye siete pruebas nuevas de música).
- La revisión automática se hizo mediante pruebas del código y simulaciones. La ejecución visual con un navegador real quedó restringida por las políticas de red del entorno de prueba; se recomienda comprobar audio real en Chrome, Edge y en el navegador del aula virtual.
