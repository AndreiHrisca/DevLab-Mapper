DevLab Mapper - Test Plan
=========================

Manual smoke tests
------------------
- **Cargar JSON inicial**: abrir la app, asegurarse de que el ejemplo se carga sin error y el diagrama se pinta.
- **Arrastre de máquinas**: mover una máquina y comprobar que se mantiene en la nueva posición al soltar y que el resto del layout permanece.
- **Sin solapamiento de máquinas**: intentar arrastrar una máquina encima de otra y validar que vuelve a su posición previa (no se superponen).
- **Ajuste de tamaño**: seleccionar una máquina, usar los handlers de redimensionado y confirmar que el tamaño se persiste mientras se mueve.
- **Servicios/Librerías fijos**: al mover o redimensionar la máquina, los servicios y librerías siguen dentro de su contenedor y no se pueden arrastrar de forma independiente.
- **Seleccionar nodos y edges**: clic en un nodo/edge debe seleccionarlo; clic en el fondo debe limpiar la selección.
- **Modo ajustar edges**: activar “Adjust edges”, arrastrar la curva/texto de un edge y comprobar que se guarda el offset; desactivar el modo y verificar que los clics sobre nodos siguen funcionando.
- **MiniMap y controles**: usar minimapa y controles de zoom/fit view para asegurar que el lienzo responde.
- **Leyenda y paneles**: verificar que la leyenda es visible y que los toggles de panel (JSON, details) muestran/ocultan sin romper el diagrama.
- **Persistencia local**: mover nodos o ajustar edges, recargar la página y confirmar que la disposición se mantiene (localStorage).

Validaciones adicionales
-----------------------
- **Reset layout**: usar “Reset layout” y confirmar que posiciones/tamaños vuelven al layout inicial.
- **Reset edges**: usar “Reset edges” y comprobar que curvas/offsets de edges vuelven a sus valores por defecto.
- **Guardar layout en JSON**: pulsar “Save layout” y revisar que se inyectan posiciones/tamaños/ajustes de edges en el JSON actual.
- **Temas y fuente**: alternar light/dark y ajustar tamaño de fuente para asegurar que no rompe la UI.

Automatizado (Vitest)
---------------------
- `npm test`: ejecuta tests de parser (`src/core/parser.test.ts`) y de lógica de solape de máquinas (`src/components/diagram/DiagramCanvas.test.ts`).
