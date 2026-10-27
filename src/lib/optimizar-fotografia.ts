const TAMANO_MAXIMO = 1600
const CALIDAD_WEBP = 0.82

export async function optimizarFotografia (archivo: File): Promise<File> {
  const tipo = archivo.type.toLowerCase()

  // No modificar archivos que no podamos procesar con seguridad.
  if (
    !tipo.startsWith('image/') ||
    tipo === 'image/gif' ||
    tipo === 'image/svg+xml' ||
    typeof createImageBitmap !== 'function'
  ) {
    return archivo
  }

  let imagen: ImageBitmap | null = null

  try {
    imagen = await createImageBitmap(archivo)

    const ladoMayor = Math.max(imagen.width, imagen.height)

    if (ladoMayor === 0) {
      return archivo
    }

    const escala = Math.min(1, TAMANO_MAXIMO / ladoMayor)

    const ancho = Math.max(1, Math.round(imagen.width * escala))
    const alto = Math.max(1, Math.round(imagen.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto

    const contexto = canvas.getContext('2d')

    if (!contexto) {
      return archivo
    }

    contexto.drawImage(imagen, 0, 0, ancho, alto)

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/webp', CALIDAD_WEBP)
    })

    // Si el navegador no genera WebP, conservamos el original.
    if (!blob || blob.type !== 'image/webp') {
      return archivo
    }

    // Nunca reemplazar una imagen por una versión más pesada.
    if (blob.size >= archivo.size) {
      return archivo
    }

    const nombreBase = archivo.name.replace(/\.[^/.]+$/, '') || 'fotografia'

    return new File([blob], `${nombreBase}.webp`, {
      type: 'image/webp',
      lastModified: Date.now()
    })
  } catch (error) {
    console.warn(
      `No se pudo optimizar la imagen "${archivo.name}". Se conservará el original.`,
      error
    )

    return archivo
  } finally {
    imagen?.close()
  }
}
