import { createClient } from '@/lib/supabase/client'
import type { Producto } from '@/lib/productos'

type ProductoDB = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  precio: number | string
  estado: 'borrador' | 'publicado' | 'oculto'
  created_at: string
  updated_at: string
}

type VarianteDB = {
  id: string
  product_id: string
  color_nombre: string
  color_codigo: string
  talle: string
  stock: number | null
  precio: number | string | null
}

type FotoDB = {
  id: string
  product_id: string
  storage_path: string
  orden: number
}

type ColorEntrada = {
  nombre: string
  codigo: string
}

function crearUrlFoto (storagePath: string) {
  const supabase = createClient()

  const { data } = supabase.storage.from('prendas').getPublicUrl(storagePath)

  return data.publicUrl
}

export async function obtenerProductosSupabase (): Promise<Producto[]> {
  const supabase = createClient()

  const { data: filasProductos, error: errorProductos } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (errorProductos) {
    throw new Error(
      `No se pudieron cargar los productos: ${errorProductos.message}`
    )
  }

  const productosDB = (filasProductos ?? []) as ProductoDB[]

  if (productosDB.length === 0) {
    return []
  }

  const ids = productosDB.map(producto => producto.id)

  const [resultadoVariantes, resultadoFotos] = await Promise.all([
    supabase.from('product_variants').select('*').in('product_id', ids),
    supabase
      .from('product_images')
      .select('*')
      .in('product_id', ids)
      .order('orden', { ascending: true })
  ])

  if (resultadoVariantes.error) {
    throw new Error(
      `No se pudieron cargar las variantes: ${resultadoVariantes.error.message}`
    )
  }

  if (resultadoFotos.error) {
    throw new Error(
      `No se pudieron cargar las fotografías: ${resultadoFotos.error.message}`
    )
  }

  const variantesDB = (resultadoVariantes.data ?? []) as VarianteDB[]
  const fotosDB = (resultadoFotos.data ?? []) as FotoDB[]

  return productosDB.map(producto => ({
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    categoria: producto.categoria,
    precio: Number(producto.precio),

    fotos: fotosDB
      .filter(foto => foto.product_id === producto.id)
      .map(foto => crearUrlFoto(foto.storage_path)),

    variantes: variantesDB
      .filter(variante => variante.product_id === producto.id)
      .map(variante => ({
        id: variante.id,
        color: variante.color_nombre,
        talle: variante.talle,
        stock: variante.stock ?? 0,
        ...(variante.precio !== null ? { precio: Number(variante.precio) } : {})
      })),

    estado: producto.estado,
    creadoEn: producto.created_at,
    actualizadoEn: producto.updated_at
  }))
}

export async function guardarProductoSupabase (
  producto: Producto,
  archivos: File[],
  colores: ColorEntrada[]
): Promise<void> {
  const supabase = createClient()

  const { error: errorProducto } = await supabase.from('products').upsert({
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion || null,
    categoria: producto.categoria,
    precio: producto.precio,
    estado: producto.estado
  })

  if (errorProducto) {
    throw new Error(`No se pudo guardar la prenda: ${errorProducto.message}`)
  }

  // Las variantes se guardan como combinaciones independientes
  // de color y talle.
  const { error: errorEliminarVariantes } = await supabase
    .from('product_variants')
    .delete()
    .eq('product_id', producto.id)

  if (errorEliminarVariantes) {
    throw new Error(
      `No se pudieron actualizar las variantes: ${errorEliminarVariantes.message}`
    )
  }

  if (producto.variantes.length > 0) {
    const filasVariantes = producto.variantes.map(variante => {
      const color = colores.find(
        item => item.nombre.toLowerCase() === variante.color.toLowerCase()
      )

      return {
        id: variante.id,
        product_id: producto.id,
        color_nombre: variante.color,
        color_codigo: color?.codigo ?? '#929292',
        talle: variante.talle,
        stock: variante.stock,
        precio: variante.precio ?? null
      }
    })

    const { error: errorInsertarVariantes } = await supabase
      .from('product_variants')
      .insert(filasVariantes)

    if (errorInsertarVariantes) {
      throw new Error(
        `No se pudieron guardar las variantes: ${errorInsertarVariantes.message}`
      )
    }
  }

  // Las fotografías se suben al bucket "prendas" y luego
  // se guarda su ubicación en la tabla product_images.
  for (let indice = 0; indice < archivos.length; indice++) {
    const archivo = archivos[indice]

    const nombreSeguro = archivo.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')

    const ruta = `${producto.id}/${crypto.randomUUID()}-${nombreSeguro}`

    const { error: errorSubida } = await supabase.storage
      .from('prendas')
      .upload(ruta, archivo, {
        contentType: archivo.type,
        upsert: false
      })

    if (errorSubida) {
      throw new Error(
        `No se pudo subir la fotografía "${archivo.name}": ${errorSubida.message}`
      )
    }

    const { error: errorFoto } = await supabase.from('product_images').insert({
      product_id: producto.id,
      storage_path: ruta,
      texto_alternativo: producto.nombre,
      orden: indice
    })

    if (errorFoto) {
      throw new Error(
        `La fotografía se subió, pero no se pudo registrar: ${errorFoto.message}`
      )
    }
  }
}

export async function actualizarEstadoSupabase (
  id: string,
  estado: 'borrador' | 'publicado' | 'oculto'
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('products')
    .update({ estado })
    .eq('id', id)

  if (error) {
    throw new Error(`No se pudo actualizar el estado: ${error.message}`)
  }
}
export async function eliminarProductoSupabase (id: string): Promise<void> {
  const supabase = createClient()

  // Recuperar las rutas de las fotografías antes de eliminar el producto.
  const { data: fotos, error: errorFotos } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id)

  if (errorFotos) {
    throw new Error(
      `No se pudieron consultar las fotografías: ${errorFotos.message}`
    )
  }

  // Eliminar el producto. Las variantes y referencias a sus fotos
  // se eliminan automáticamente por las relaciones de la base de datos.
  const { error: errorProducto } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (errorProducto) {
    throw new Error(`No se pudo eliminar la prenda: ${errorProducto.message}`)
  }

  // Borrar también los archivos de imagen del almacenamiento.
  const rutas = (fotos ?? []).map(foto => foto.storage_path)

  if (rutas.length > 0) {
    const { error: errorAlmacenamiento } = await supabase.storage
      .from('prendas')
      .remove(rutas)

    if (errorAlmacenamiento) {
      console.error(
        'La prenda se eliminó, pero algunas fotografías quedaron en Storage:',
        errorAlmacenamiento.message
      )
    }
  }
}
