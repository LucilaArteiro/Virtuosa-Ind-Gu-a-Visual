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

/* =========================================================
   FOTOGRAFÍAS
   ========================================================= */

function crearUrlFoto (storagePath: string): string {
  const supabase = createClient()

  const { data } = supabase.storage.from('prendas').getPublicUrl(storagePath)

  return data.publicUrl
}

/* =========================================================
   OBTENER PRODUCTOS
   ========================================================= */

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
        colorCodigo: variante.color_codigo,
        talle: variante.talle,
        stock: variante.stock ?? 0,
        ...(variante.precio !== null ? { precio: Number(variante.precio) } : {})
      })),

    estado: producto.estado,
    creadoEn: producto.created_at,
    actualizadoEn: producto.updated_at
  }))
}

/* =========================================================
   GUARDAR O ACTUALIZAR UNA PRENDA
   ========================================================= */

export async function guardarProductoSupabase (
  producto: Producto,
  archivos: File[],
  colores: ColorEntrada[]
): Promise<void> {
  const supabase = createClient()

  /* 1. Guardar los datos principales de la prenda. */

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

  /* 2. Consultar las variantes que ya existen. */

  const { data: variantesAnteriores, error: errorLeerVariantes } =
    await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', producto.id)

  if (errorLeerVariantes) {
    throw new Error(
      `No se pudieron consultar las variantes anteriores: ${errorLeerVariantes.message}`
    )
  }

  /* 3. Actualizar o insertar las variantes.
     Cada combinación de color y talle mantiene su propio stock. */

  const filasVariantes = producto.variantes.map(variante => {
    const color = colores.find(
      item =>
        item.nombre.toLocaleLowerCase() === variante.color.toLocaleLowerCase()
    )

    return {
      id: variante.id,
      product_id: producto.id,
      color_nombre: variante.color,
      color_codigo: variante.colorCodigo ?? color?.codigo ?? '#929292',
      talle: variante.talle,
      stock: variante.stock,
      precio: variante.precio ?? null
    }
  })

  if (filasVariantes.length > 0) {
    const { error: errorGuardarVariantes } = await supabase
      .from('product_variants')
      .upsert(filasVariantes)

    if (errorGuardarVariantes) {
      throw new Error(
        `No se pudieron guardar las variantes: ${errorGuardarVariantes.message}`
      )
    }
  }

  /* 4. Eliminar únicamente las variantes quitadas del formulario.
     Las combinaciones conservadas no se eliminan previamente. */

  const idsActuales = new Set(producto.variantes.map(variante => variante.id))

  const idsParaEliminar = (variantesAnteriores ?? [])
    .filter(variante => !idsActuales.has(variante.id))
    .map(variante => variante.id)

  if (idsParaEliminar.length > 0) {
    const { error: errorEliminarVariantes } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', producto.id)
      .in('id', idsParaEliminar)

    if (errorEliminarVariantes) {
      throw new Error(
        `Las variantes se guardaron, pero no se pudieron quitar las combinaciones eliminadas: ${errorEliminarVariantes.message}`
      )
    }
  }

  /* 5. Consultar las fotografías registradas anteriormente. */

  const { data: fotosAnteriores, error: errorLeerFotos } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', producto.id)
    .order('orden', { ascending: true })

  if (errorLeerFotos) {
    throw new Error(
      `No se pudieron consultar las fotografías anteriores: ${errorLeerFotos.message}`
    )
  }

  const fotosExistentes = (fotosAnteriores ?? []) as FotoDB[]

  /* Identificar qué fotografías guardadas se conservan. */

  const fotosConservar: FotoDB[] = []

  for (const url of producto.fotos ?? []) {
    const foto = fotosExistentes.find(
      item => crearUrlFoto(item.storage_path) === url
    )

    if (foto && !fotosConservar.some(item => item.id === foto.id)) {
      fotosConservar.push(foto)
    }
  }

  const idsFotosConservar = new Set(fotosConservar.map(foto => foto.id))

  const fotosParaEliminar = fotosExistentes.filter(
    foto => !idsFotosConservar.has(foto.id)
  )

  /* 6. Subir las fotografías nuevas. */

  const nuevasFotos: { storage_path: string }[] = []

  try {
    for (const archivo of archivos) {
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

      nuevasFotos.push({ storage_path: ruta })
    }
  } catch (error) {
    // Intentar limpiar los archivos que se hayan subido en esta operación.
    const rutasSubidas = nuevasFotos.map(foto => foto.storage_path)

    if (rutasSubidas.length > 0) {
      const { error: errorLimpieza } = await supabase.storage
        .from('prendas')
        .remove(rutasSubidas)

      if (errorLimpieza) {
        console.error(
          'No se pudieron limpiar algunas fotos nuevas:',
          errorLimpieza.message
        )
      }
    }

    throw error
  }

  /* 7. Registrar las fotografías nuevas en la base de datos. */

  if (nuevasFotos.length > 0) {
    const filasFotos = nuevasFotos.map((foto, indice) => ({
      product_id: producto.id,
      storage_path: foto.storage_path,
      texto_alternativo: producto.nombre,
      orden: fotosConservar.length + indice
    }))

    const { error: errorRegistrarFotos } = await supabase
      .from('product_images')
      .insert(filasFotos)

    if (errorRegistrarFotos) {
      const rutasSubidas = nuevasFotos.map(foto => foto.storage_path)

      const { error: errorLimpieza } = await supabase.storage
        .from('prendas')
        .remove(rutasSubidas)

      if (errorLimpieza) {
        console.error(
          'No se pudieron limpiar algunas fotos nuevas:',
          errorLimpieza.message
        )
      }

      throw new Error(
        `Las fotos se subieron, pero no se pudieron registrar: ${errorRegistrarFotos.message}`
      )
    }
  }

  /* 8. Quitar las referencias de las fotos eliminadas del formulario. */

  if (fotosParaEliminar.length > 0) {
    const idsFotosParaEliminar = fotosParaEliminar.map(foto => foto.id)

    const { error: errorEliminarFotos } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', producto.id)
      .in('id', idsFotosParaEliminar)

    if (errorEliminarFotos) {
      throw new Error(
        `La prenda se guardó, pero no se pudieron quitar algunas fotografías: ${errorEliminarFotos.message}`
      )
    }

    /* Borrar también los archivos del almacenamiento. */

    const rutasParaEliminar = fotosParaEliminar.map(foto => foto.storage_path)

    const { error: errorEliminarArchivos } = await supabase.storage
      .from('prendas')
      .remove(rutasParaEliminar)

    if (errorEliminarArchivos) {
      console.error(
        'Se quitaron las referencias de algunas fotos, pero quedaron archivos en Storage:',
        errorEliminarArchivos.message
      )
    }
  }

  /* 9. Actualizar el orden de las fotografías conservadas. */

  for (let indice = 0; indice < fotosConservar.length; indice++) {
    const foto = fotosConservar[indice]

    const { error: errorOrden } = await supabase
      .from('product_images')
      .update({ orden: indice })
      .eq('id', foto.id)
      .eq('product_id', producto.id)

    if (errorOrden) {
      throw new Error(
        `Las fotos se guardaron, pero no se pudo actualizar su orden: ${errorOrden.message}`
      )
    }
  }
}

/* =========================================================
   ACTUALIZAR EL ESTADO DE UNA PRENDA
   ========================================================= */

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

/* =========================================================
   ELIMINAR UNA PRENDA
   ========================================================= */

export async function eliminarProductoSupabase (id: string): Promise<void> {
  const supabase = createClient()

  /* 1. Recuperar las rutas de las fotos antes de borrar la prenda. */

  const { data: fotos, error: errorFotos } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id)

  if (errorFotos) {
    throw new Error(
      `No se pudieron consultar las fotografías: ${errorFotos.message}`
    )
  }

  /* 2. Eliminar el producto.
     Las variantes y referencias a sus fotos dependen de las relaciones
     configuradas en la base de datos. */

  const { error: errorProducto } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (errorProducto) {
    throw new Error(`No se pudo eliminar la prenda: ${errorProducto.message}`)
  }

  /* 3. Eliminar los archivos de imagen del almacenamiento. */

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
