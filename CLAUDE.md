# Tierras Partidas — guía para asistentes de IA

Prototipo de juego: roguelike por turnos en cuadrícula (estilo Mystery Dungeon) + mundo navegado por menús (estilo SMT IV). Fantasía oscura, humanos contra monstruos. El usuario escribe en español; todo el texto del juego, los comentarios y los documentos van en español.

La historia de referencia está en `Tierras Partidas — Propuesta de historia.md`. La jugabilidad y la estructura están en `README.md`.

## Reglas de diseño (decididas por el usuario)

- No se recluta monstruos. El gremio tiene 9 miembros fijos que se unen por la historia; entran máximo 4 por mazmorra.
- La exploración del mundo es por menús, no caminando libremente.
- Puntos de mazmorra fijos por dificultad; interior de cada mazmorra aleatorio.
- Las rutas entre localidades son mazmorras.
- Las capitales dan las misiones principales y cada pueblo tiene secundarias.
- Se guarda siempre antes de entrar a una mazmorra; si caes, la incursión empieza de 0.
- Hay hambre y hay que llevar comida.
- El protagonista cambia de clase/elemento antes de cada mazmorra; las clases se desbloquean con la historia.
- Arte 8-bit y sonido básico; se aceptan assets libres.

## Arquitectura

- `src/data/*` es contenido puro. Añade contenido aquí antes de tocar la lógica.
- `src/dungeon/run.ts` contiene toda la lógica por turnos y no debe importar Phaser ni el DOM, porque `scripts/sim.ts` la ejecuta en Node. Comunica cambios con `events` (`GameEvent` en `dungeon/types.ts`) que `scene.ts` anima.
- `src/ui/*` es DOM puro (no Phaser). `ui/dom.ts` tiene una pila de manejadores de teclado (`pushKeys`): solo recibe teclas el de arriba. Los menús y diálogos devuelven promesas.
- `src/main.ts` orquesta el flujo con `async/await`.
- El canvas de Phaser se oculta con `visibility`, no con `display:none` (WebGL falla con tamaño 0).

## Comprobaciones

- `npm run check` (tipos) y `npm run sim` (balance y errores de lógica) después de cambios de lógica o de balance.
- `npm run locks-test` tras tocar candados, trampas o el generador; `npm run tactics-test` tras tocar la IA de aliados; `npm run reaper-test` tras tocar a la Parca o el balance; `npm run walls-test` tras tocar grietas, murallas o salas secretas; `npm run terrain-test` tras tocar terrenos (sobre todo el hielo) o las escaleras tapiadas; `npm run auto-test` tras tocar el piloto automático (`autoAction`) o cualquier mecánica que cambie cómo se recorre un piso (formas de piso, condiciones de las escaleras, tramos); `npm run story-test` tras tocar misiones, rutas, localidades o escenas (recorre la historia entera); `npm run throne-test` tras tocar la batalla final, los jefes grandes o su escolta.
- La Torre de Babel (`TOWER_ID`) es el sitio para probar mecánicas nuevas sin tocar la historia.
- Dentro de `run.ts`, usa `this.passable()` (no `isFloor`) para movimiento y caminos: las puertas cerradas no son transitables.
- En desarrollo, `window.__run` expone la incursión actual y `window.__enter('id')` entra directamente en una mazmorra, para depurar desde la consola.
- Los jefes grandes ocupan varias casillas (`w`, `h`): para distancias y casillas ocupadas usa `cheb`, `covers` y `actorAt`, no comparaciones de `x, y`.
