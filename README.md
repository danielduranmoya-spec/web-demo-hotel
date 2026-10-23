# Casa Lucerna · hotel boutique en Mérida (concepto 3D)

Web de un hotel boutique **ficticio** de 16 habitaciones junto al Teatro Romano de Mérida. Es una demo de la tarifa *Web interactiva 3D (desde 1.690 €)* del portfolio: al hacer scroll la cámara viaja entre nubes de atardecer, cruza un arco del acueducto de los Milagros y llega a una lucerna romana encendida, que se puede girar con el dedo y apagar.

Web publicada: https://danielduranmoya-spec.github.io/web-demo-hotel/

```
web-demo-hotel/
├── index.html        ← estructura, textos, SEO (meta, Open Graph, JSON-LD Hotel y FAQ)
├── style.css         ← estilos: colores y tipografías al principio, en :root
├── script.js         ← menú, habitaciones, vídeo interactivo, reserva por WhatsApp, cookies
├── escena.js         ← escena 3D con three.js: cielo, nubes, acueducto, Teatro y lucerna
├── vendor/           ← three.js r180 (licencia MIT), servido desde la propia web
├── media/            ← vídeo del recorrido (mp4 + webm) y su póster
├── img/og.jpg        ← imagen para compartir en redes
├── aviso-legal.html, privacidad.html, cookies.html  ← plantillas: completa los [PENDIENTE]
├── robots.txt, sitemap.xml
└── favicon.svg
```

## Identidad

- Tipografías: **Italiana** (titulares) y **Outfit** (texto y cifras).
- Paleta: azul noche `#141B33`, terracota rosada `#D98E73`, oro de lucerna `#E9B44C`, cal `#F7F1E8`.
- Animación de entrada inspirada en *Aetheris Voyage* de motionsites.ai: viaje de cámara en profundidad a través de capas de nubes con parallax.

## Qué hace la escena 3D

1. **Inicio**: atardecer rosado sobre Mérida. Al bajar, la cámara atraviesa las nubes (que se desvanecen al tocarlas) y anochece poco a poco: salen las estrellas.
2. **Los arcos**: la cámara pasa por el arco central de un acueducto de dos pisos de granito y ladrillo, con nido de cigüeña.
3. **La lucerna**: llega a una lucerna de barro torneada delante de las columnas del Teatro. La llama es un shader, ilumina las columnas y suelta chispas. Se gira arrastrando y el botón la apaga o la enciende.

Todo está hecho con código, sin modelos externos. La calidad se ajusta sola (más nubes y antialiasing en ordenador, menos en móvil, y baja la resolución si el dispositivo va lento). No se dibuja cuando está fuera de pantalla. Sin WebGL se ve una ilustración de la lucerna; con *movimiento reducido* la cámara sigue el scroll sin inercia y la llama no parpadea.

## Vídeo interactivo

`media/recorrido.mp4` (40 s, 4 capítulos: patio, habitación, termas y terraza). En `script.js`, `CAPITULOS` define dónde empieza cada capítulo y `HOTSPOTS` los puntos dorados que aparecen en el vídeo (segundo de inicio y fin, posición en % y texto). Para un cliente real, cambia el vídeo por uno grabado en el hotel con la misma duración o ajusta esos tiempos.

## Qué cambiar para un cliente real

- **Teléfono, WhatsApp, habitaciones y precios**: `CONFIG` y `HABITACIONES` al principio de `script.js`. Cambia también el JSON-LD del `<head>` de `index.html`.
- **Indexación**: es una demo con datos ficticios y lleva `noindex` en `index.html` y `Disallow` en `robots.txt`. Para un cliente real, borra la línea `robots` del `<head>` y cambia `robots.txt` a `Allow: /`.
- **Textos legales**: completa los campos `[PENDIENTE]` (razón social, NIF, registro turístico de Extremadura).
- **Barra superior «Concepto»**: bórrala (`.concept-bar`).
- **Fuentes**: se cargan de Google Fonts. Para cumplir mejor con el RGPD, descárgalas y sírvelas desde la propia web.

## Abrirla en VS Code

```bash
git clone https://github.com/danielduranmoya-spec/web-demo-hotel.git
code web-demo-hotel
```

Usa la extensión **Live Server** (clic derecho en `index.html` → *Open with Live Server*). La escena 3D es un módulo de JavaScript y no carga con doble clic (`file://`).

## Publicar

GitHub Pages desde la rama `main`, carpeta raíz. Cada `git push` actualiza la web en uno o dos minutos.
