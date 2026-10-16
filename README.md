# Pródigo — sitio del museo

El sitio público es estático y puede ejecutarse en GitHub Pages o migrar a cualquier hosting que sirva archivos HTML, CSS, JavaScript y JSON.

## Portada administrable

- Sitio público: `index.html`
- Contenidos de portada: `data/home.json`
- Renderizador: `js/home-content.js`
- Administrador experimental: `admin/index.html`

Abrir `/admin/`, editar campos, imágenes, tarjetas y orden de secciones; observar la vista previa. **Guardar borrador** utiliza el almacenamiento local de ese navegador: no cambia la web pública.

**Exportar JSON** genera `home.json`; para publicar en la fase GitHub Pages, sustituir el archivo `data/home.json` del repositorio por el exportado y confirmar el commit. El sitio se actualizará cuando termine el despliegue de Pages. Importar JSON permite retomar contenidos desde un archivo.

La función **Subir imagen** comprime la imagen en el navegador y la guarda codificada dentro del JSON. Es útil como prototipo o para pocas fotografías, pero no es la solución definitiva para un gran archivo: en el hosting futuro se sustituirá por una biblioteca de archivos independientes con sus rutas en el JSON o base de datos. Evitar incluir material sensible.

## Migración

La estructura separa presentación de contenido. Un futuro backend en PHP/MySQL puede ofrecer el mismo documento JSON a la interfaz y guardar los recursos en un directorio de medios. No se requiere adoptar GitHub como almacenamiento definitivo.

## Seguridad

`admin/` es una interfaz **sin autenticación**, que solo edita borradores locales y exporta archivos. **No tiene acceso de escritura a GitHub ni a un servidor**. Antes de permitir publicación directa se necesitará autenticación, permisos, validaciones y un backend seguro. No incrustar tokens de acceso a GitHub en JavaScript público.
