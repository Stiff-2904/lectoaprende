# LectoAprende · Aventuras con Lito

¡Proyecto de lectoescritura para primer grado! Incluye a Lito, el loro de la versión original, 20 retos en cuatro mundos, dos cuentos, un álbum de pegatinas y soporte opcional para la voz infantil Marina de Azure.

**Abra primero [ETAPAS-DE-RENOVACION.md](ETAPAS-DE-RENOVACION.md)** para actualizar el proyecto sin perder el `.env` que ya configuró.

## Inicio rápido

Requiere Node.js 20 o superior. Abra una terminal dentro de la carpeta del proyecto:

```bash
npm install
npm start
```

Visite `http://localhost:3000`. Para probar la voz, abra `http://localhost:3000/adults`.

**Privacidad:** no se piden nombres ni cuentas infantiles. Retos y pegatinas se guardan en este navegador (`localStorage`); los intentos del servidor son temporales. No se incluye ninguna clave de Azure.

**Pruebas:** `npm test` (tras instalar dependencias) o `node --test tests/core.test.js` para comprobar el núcleo sin dependencias externas.

**Voz:** siga [GUIA-VOZ-LITO.md](GUIA-VOZ-LITO.md) para configurar Azure con su propio archivo privado `.env`.
