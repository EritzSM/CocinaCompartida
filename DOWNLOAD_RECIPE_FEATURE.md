# 🎉 Función de Descarga de Recetas - Guía de Uso

## ✅ Descripción

Se ha implementado una nueva funcionalidad que permite a los usuarios logueados **descargar recetas en formato PDF o imagen**.

## 📋 Requisitos

- ✔ Usuario debe estar **autenticado** (logueado)
- ✔ La receta debe existir y ser válida

## 🖱️ Cómo Usar (Frontend)

1. **Navega a una receta** - Haz clic en cualquier receta para ver sus detalles
2. **Busca los botones de descarga** - En la parte superior de la receta, verás:
   - 📄 **Descargar PDF** (botón rojo) - Descarga la receta en formato PDF con toda la información
   - 🖼️ **Descargar Imagen** (botón verde) - Descarga la imagen principal de la receta

## 📥 Descripción de las Descargas

### PDF
- **Formato**: PDF estándar
- **Contenido**: 
  - Nombre de la receta (título)
  - Descripción
  - Lista de ingredientes numerada
  - Pasos de preparación numerados
- **Archivo**: Se descarga como `receta.pdf`

### Imagen
- **Formato**: Imagen (JPG/PNG según la receta)
- **Contenido**: Primera imagen de la receta
- **Archivo**: Se descarga como `receta.jpg`
- **Nota**: Solo disponible si la receta tiene al menos una imagen

## 🔐 Seguridad

- ✅ Solo usuarios autenticados pueden descargar
- ✅ La descarga es rápida y segura
- ✅ Usa el mismo token de autenticación que el resto de la aplicación

## 🛠️ Detalles Técnicos (Backend)

### Endpoint API
```
GET /recipes/:id/download?format=pdf|image
Headers: Authorization: Bearer <TOKEN>
```

### Respuestas
- **200 OK**: Archivo descargado exitosamente (blob)
- **401 Unauthorized**: Usuario no autenticado
- **404 Not Found**: Receta no encontrada
- **400 Bad Request**: Formato inválido

### Parámetros Query
- `format` (optional, default: `pdf`)
  - `pdf` - Genera PDF con toda la información
  - `image` - Descarga la primera imagen de la receta

## 📝 Ejemplo de Uso (cURL)

```bash
# Descargar receta como PDF
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  "http://localhost:3000/recipes/<RECIPE_ID>/download?format=pdf" \
  --output receta.pdf

# Descargar imagen de receta
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  "http://localhost:3000/recipes/<RECIPE_ID>/download?format=image" \
  --output receta.jpg
```

## 🎨 Interfaz de Usuario (Frontend)

Los botones de descarga aparecen en la página de detalles de la receta:

```
┌─────────────────────────────┐
│    Nombre de la Receta       │
│  Descripción de la receta    │
│                              │
│  [Editar] [Eliminar]         │  ← Admin (si es tu receta)
│  [📄 PDF] [🖼️ Imagen]        │ ← Descargar (todos loginueados)
│                              │
│ [Imagen del carrusel]        │
│                              │
│ Ingredientes  │ Pasos        │
│ - Ing 1       │ 1. Paso 1    │
│ - Ing 2       │ 2. Paso 2    │
└─────────────────────────────┘
```

## ⚡ Rendimiento

- Descarga de PDF: ~1-2 segundos
- Descarga de imagen: Instantáneo (si es local) o según el tamaño

## 🚀 Próximas Mejoras (Futuras)

- [ ] Exportar en otros formatos (Word, Excel)
- [ ] Incluir imágenes en el PDF
- [ ] Descargar múltiples recetas como ZIP
- [ ] Compartir mediante URL directa
- [ ] Historial de descargas

---

**Versión**: 1.0  
**Fecha**: Febrero 20, 2026  
**Estado**: ✅ Implementado y en producción
