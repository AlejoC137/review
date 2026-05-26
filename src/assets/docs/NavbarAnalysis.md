# Análisis del comportamiento de la Navbar en Docs

## Problema
Al hacer clic en **Docs**, la **Navbar** (barra de navegación superior) se reduce en tamaño. En otras secciones como **About Us**, **Source**, **Lab**, **Fase**, **Blablabla**, no pasa esto.

## Posible causa
El cambio estaba relacionado con la estructura del layout en `Documents.jsx`. Específicamente:
1.  **Herencia de Flexbox rota**: Al envolver la `Sidebar` y el `Header` en `div.no-print`, estos dejaron de ser hijos directos del contenedor flex en `Documents.jsx`. Esto rompió el comportamiento de "estiramiento" vertical (`align-self: stretch`) de la Sidebar, haciendo que cambiara de forma dependiendo de su contenido.
2.  **Falta de título**: El componente `Header` no recibía la propiedad `title`, lo que dejaba el área superior izquierda vacía.

## Recomendaciones aplicadas
- Se habilitó el soporte para la propiedad `className` en los componentes `Sidebar` y `Header`.
- Se eliminaron las envolturas `div.no-print` en `Documents.jsx`, pasando la clase directamente a los componentes. Esto restaura la jerarquía flexbox correcta.
- Se pasó el título `"ADMIN_DOCUMENTS"` al componente `Header`.
- Se estandarizó el padding (`md:p-8`) y las propiedades de contenedor (`h-full`, `overflow-hidden`) para que la "forma" del panel principal sea idéntica a la de otras secciones.

## Visualización en tamaño carta
Las dimensiones de este documento están pensadas para un ajuste de:
- Ancho: 21 cm (8.27 in)
- Alto: 29.7 cm (11.69 in)

## Tamaño de letra recomendado
Para una lectura óptima en pantalla dentro de este formato, se recomienda un tamaño de fuente de **16px a 20px**.

---
*Nota: Este análisis se realizó sobre la rama de desarrollo actual para asegurar la consistencia visual del sistema REVIEW.*
