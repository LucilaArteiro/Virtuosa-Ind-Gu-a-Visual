'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

import './admin.css'

import {
  categorias,
  type EstadoProducto,
  type Producto,
  type VarianteProducto
} from '@/lib/productos'

import {
  obtenerProductosSupabase,
  guardarProductoSupabase,
  actualizarEstadoSupabase,
  eliminarProductoSupabase
} from '@/lib/supabase/productos'

type Seccion = 'inicio' | 'productos' | 'agregar'

type VarianteFormulario = {
  id: string
  color: string
  codigoColor: string
  talle: string
  stock: string
  precio: string
}

type ColorFormulario = {
  nombre: string
  codigo: string
}

const varianteVacia = (): VarianteFormulario => ({
  id: crypto.randomUUID(),
  color: '',
  codigoColor: '#c5a052',
  talle: '',
  stock: '0',
  precio: ''
})

const precioValido = (valor: string): boolean => {
  const numero = Number(valor)

  return valor.trim() !== '' && Number.isFinite(numero) && numero >= 0
}

const formatoPrecio = (precio: number): string =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const textoEstado = (estado: EstadoProducto): string => {
  if (estado === 'publicado') return 'Publicado'
  if (estado === 'oculto') return 'Oculto'

  return 'Borrador'
}

function obtenerCodigoColor (color: string): string {
  const colores: Record<string, string> = {
    negro: '#171417',
    blanco: '#ffffff',
    rosa: '#f4dce5',
    beige: '#d9c5a0',
    azul: '#244a78',
    celeste: '#9bcbea',
    marrón: '#76513d',
    gris: '#999999',
    rojo: '#b53636',
    verde: '#397451'
  }

  return colores[color.toLocaleLowerCase()] ?? '#c5a052'
}

export default function AdminPage () {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  const [seccionActiva, setSeccionActiva] = useState<Seccion>('productos')

  const [menuAbierto, setMenuAbierto] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const [productoEditando, setProductoEditando] = useState<Producto | null>(
    null
  )

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState<string>(categorias[0])
  const [precio, setPrecio] = useState('')

  const [estadoFormulario, setEstadoFormulario] =
    useState<EstadoProducto>('borrador')

  const [variantesFormulario, setVariantesFormulario] = useState<
    VarianteFormulario[]
  >([])

  const [fotosGuardadas, setFotosGuardadas] = useState<string[]>([])
  const [archivosFotos, setArchivosFotos] = useState<File[]>([])
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([])

  const [guardando, setGuardando] = useState(false)
  const [productoEnProceso, setProductoEnProceso] = useState<string | null>(
    null
  )

  const [mensaje, setMensaje] = useState('')

  async function cargarProductos () {
    setCargando(true)

    try {
      const lista = await obtenerProductosSupabase()
      setProductos(lista)
    } catch (error) {
      console.error('Error cargando los productos:', error)

      setMensaje('No se pudieron cargar las prendas. Revisá la conexión.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarProductos()
  }, [])

  useEffect(() => {
    const urls = archivosFotos.map(archivo => URL.createObjectURL(archivo))

    setPrevisualizaciones(urls)

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [archivosFotos])

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase()

    return productos.filter(producto => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLocaleLowerCase().includes(texto) ||
        producto.descripcion.toLocaleLowerCase().includes(texto) ||
        producto.categoria.toLocaleLowerCase().includes(texto)

      const coincideCategoria =
        filtroCategoria === 'Todas' || producto.categoria === filtroCategoria

      const coincideEstado =
        filtroEstado === 'Todos' || producto.estado === filtroEstado

      return coincideTexto && coincideCategoria && coincideEstado
    })
  }, [productos, busqueda, filtroCategoria, filtroEstado])

  const publicados = productos.filter(
    producto => producto.estado === 'publicado'
  ).length

  const borradores = productos.filter(
    producto => producto.estado === 'borrador'
  ).length

  const ocultos = productos.filter(
    producto => producto.estado === 'oculto'
  ).length

  function limpiarFormulario () {
    setProductoEditando(null)
    setNombre('')
    setDescripcion('')
    setCategoria(categorias[0])
    setPrecio('')
    setEstadoFormulario('borrador')
    setVariantesFormulario([])
    setFotosGuardadas([])
    setArchivosFotos([])
    setMensaje('')
  }

  function abrirFormularioNuevo () {
    limpiarFormulario()
    setSeccionActiva('agregar')
    setMenuAbierto(false)
  }

  function editarProducto (producto: Producto) {
    setProductoEditando(producto)
    setNombre(producto.nombre)
    setDescripcion(producto.descripcion)
    setCategoria(producto.categoria)
    setPrecio(String(producto.precio))
    setEstadoFormulario(producto.estado)
    setFotosGuardadas(producto.fotos ?? [])
    setArchivosFotos([])

    setVariantesFormulario(
      (producto.variantes ?? []).map(variante => ({
        id: variante.id,
        color: variante.color,
        codigoColor: obtenerCodigoColor(variante.color),
        talle: variante.talle,
        stock: String(variante.stock),
        precio: variante.precio === undefined ? '' : String(variante.precio)
      }))
    )

    setMensaje('')
    setSeccionActiva('agregar')
    setMenuAbierto(false)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  function agregarVariante () {
    setVariantesFormulario(actuales => [...actuales, varianteVacia()])
  }

  function actualizarVariante (
    id: string,
    campo: keyof Omit<VarianteFormulario, 'id'>,
    valor: string
  ) {
    setVariantesFormulario(actuales =>
      actuales.map(variante =>
        variante.id === id ? { ...variante, [campo]: valor } : variante
      )
    )
  }

  function quitarVariante (id: string) {
    setVariantesFormulario(actuales =>
      actuales.filter(variante => variante.id !== id)
    )
  }

  function seleccionarFotos (event: ChangeEvent<HTMLInputElement>) {
    const nuevasFotos = Array.from(event.target.files ?? [])

    if (nuevasFotos.length === 0) return

    setArchivosFotos(actuales => [...actuales, ...nuevasFotos])

    event.target.value = ''
  }

  function quitarFotoNueva (indice: number) {
    setArchivosFotos(actuales => actuales.filter((_, i) => i !== indice))
  }

  function quitarFotoGuardada (url: string) {
    setFotosGuardadas(actuales => actuales.filter(foto => foto !== url))
  }

  async function guardarFormulario (estadoSolicitado: EstadoProducto) {
    setMensaje('')

    if (!nombre.trim()) {
      setMensaje('Escribí el nombre de la prenda.')
      return
    }

    if (!precioValido(precio)) {
      setMensaje('Ingresá un precio válido, igual o mayor que cero.')
      return
    }

    const variantes: VarianteProducto[] = variantesFormulario
      .filter(variante => variante.color.trim() && variante.talle.trim())
      .map(variante => {
        const stockNumero = Number(variante.stock)

        const precioVariante = variante.precio.trim()
          ? Number(variante.precio)
          : undefined

        return {
          id: variante.id,
          color: variante.color.trim(),
          talle: variante.talle.trim(),
          stock:
            Number.isFinite(stockNumero) && stockNumero >= 0
              ? Math.floor(stockNumero)
              : 0,
          ...(precioVariante !== undefined &&
          Number.isFinite(precioVariante) &&
          precioVariante >= 0
            ? { precio: precioVariante }
            : {})
        }
      })

    /*
     * Tercer argumento obligatorio de guardarProductoSupabase:
     * una lista de colores únicos con su código visual.
     */
    const coloresMap = new Map<string, ColorFormulario>()

    variantesFormulario.forEach(variante => {
      const nombreColor = variante.color.trim()

      if (!nombreColor) return

      const clave = nombreColor.toLocaleLowerCase()

      if (!coloresMap.has(clave)) {
        coloresMap.set(clave, {
          nombre: nombreColor,
          codigo: variante.codigoColor
        })
      }
    })

    const colores = Array.from(coloresMap.values())

    const ahora = new Date().toISOString()

    const producto: Producto = {
      id: productoEditando?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria,
      precio: Number(precio),
      fotos: fotosGuardadas,
      variantes,
      estado: estadoSolicitado,
      creadoEn: productoEditando?.creadoEn ?? ahora,
      actualizadoEn: ahora
    }

    setGuardando(true)

    try {
      // CORREGIDO: se pasan los tres argumentos requeridos.
      await guardarProductoSupabase(producto, archivosFotos, colores)

      await cargarProductos()

      limpiarFormulario()
      setSeccionActiva('productos')

      setMensaje(
        estadoSolicitado === 'publicado'
          ? 'La prenda se guardó y quedó publicada.'
          : estadoSolicitado === 'oculto'
          ? 'La prenda se guardó como oculta.'
          : 'La prenda se guardó como borrador.'
      )
    } catch (error) {
      console.error('Error guardando la prenda:', error)

      setMensaje(
        'No se pudo guardar la prenda. Revisá la conexión e intentá nuevamente.'
      )
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstadoProducto (
    producto: Producto,
    nuevoEstado: EstadoProducto
  ) {
    setMensaje('')
    setProductoEnProceso(producto.id)

    try {
      await actualizarEstadoSupabase(producto.id, nuevoEstado)

      await cargarProductos()

      setMensaje(
        `“${producto.nombre}” ahora está en estado: ${textoEstado(
          nuevoEstado
        ).toLocaleLowerCase()}.`
      )
    } catch (error) {
      console.error('Error cambiando el estado:', error)

      setMensaje('No se pudo actualizar el estado de la prenda.')
    } finally {
      setProductoEnProceso(null)
    }
  }

  async function eliminarPrenda (producto: Producto) {
    const confirmar = window.confirm(
      `¿Querés eliminar definitivamente “${producto.nombre}”?\n\nSe eliminará de la tienda y del catálogo administrativo. Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    setMensaje('')
    setProductoEnProceso(producto.id)

    try {
      await eliminarProductoSupabase(producto.id)
      await cargarProductos()

      if (productoEditando?.id === producto.id) {
        limpiarFormulario()
        setSeccionActiva('productos')
      }

      setMensaje(`La prenda “${producto.nombre}” fue eliminada.`)
    } catch (error) {
      console.error('Error eliminando la prenda:', error)

      setMensaje(
        'No se pudo eliminar la prenda. Revisá la conexión e intentá nuevamente.'
      )
    } finally {
      setProductoEnProceso(null)
    }
  }

  return (
    <main className='admin'>
      <aside
        className={`admin-sidebar ${
          menuAbierto ? 'admin-sidebar-abierto' : ''
        }`}
      >
        <div className='admin-marca'>
          <span>V.I</span>
          <p>VIRTUOSA IND</p>
          <small>Panel administrativo</small>
        </div>

        <nav className='admin-navegacion'>
          <button
            type='button'
            className={seccionActiva === 'inicio' ? 'activo' : ''}
            onClick={() => {
              setSeccionActiva('inicio')
              setMenuAbierto(false)
            }}
          >
            Inicio
          </button>

          <button
            type='button'
            className={seccionActiva === 'productos' ? 'activo' : ''}
            onClick={() => {
              setSeccionActiva('productos')
              setMenuAbierto(false)
              void cargarProductos()
            }}
          >
            Productos
          </button>

          <button
            type='button'
            className={seccionActiva === 'agregar' ? 'activo' : ''}
            onClick={abrirFormularioNuevo}
          >
            + Agregar prenda
          </button>
        </nav>

        <div className='admin-sidebar-pie'>
          <a href='/' target='_blank' rel='noreferrer'>
            Ver tienda ↗
          </a>

          <small>Vestida de fuerza y dignidad</small>
        </div>
      </aside>

      {menuAbierto && (
        <button
          type='button'
          className='admin-overlay'
          aria-label='Cerrar menú'
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <section className='admin-contenido'>
        <header className='admin-header'>
          <button
            type='button'
            className='admin-menu-toggle'
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto(abierto => !abierto)}
          >
            {menuAbierto ? '×' : '☰'}
          </button>

          <div>
            <p className='admin-header-etiqueta'>VIRTUOSA IND</p>

            <h1>
              {seccionActiva === 'inicio'
                ? 'Inicio'
                : seccionActiva === 'productos'
                ? 'Productos'
                : productoEditando
                ? 'Editar prenda'
                : 'Agregar una prenda'}
            </h1>
          </div>

          <span className='admin-usuario'>Administradora</span>
        </header>

        {mensaje && (
          <div className='admin-mensaje' role='status'>
            <span>{mensaje}</span>

            <button
              type='button'
              aria-label='Cerrar mensaje'
              onClick={() => setMensaje('')}
            >
              ×
            </button>
          </div>
        )}

        {seccionActiva === 'inicio' && (
          <div className='admin-inicio'>
            <section className='admin-bienvenida'>
              <p className='admin-eyebrow'>PANEL DE CONTROL</p>

              <h2>Tu tienda, organizada en un solo lugar.</h2>

              <p>
                Administrá las prendas, revisá su estado y actualizá el catálogo
                de VIRTUOSA IND.
              </p>

              <button
                type='button'
                className='admin-boton-principal'
                onClick={abrirFormularioNuevo}
              >
                + Agregar una prenda
              </button>
            </section>

            <div className='admin-resumen'>
              <article>
                <span>Total de prendas</span>
                <strong>{productos.length}</strong>
              </article>

              <article>
                <span>Publicadas</span>
                <strong>{publicados}</strong>
              </article>

              <article>
                <span>Borradores</span>
                <strong>{borradores}</strong>
              </article>

              <article>
                <span>Ocultas</span>
                <strong>{ocultos}</strong>
              </article>
            </div>

            <button
              type='button'
              className='admin-boton-secundario'
              onClick={() => setSeccionActiva('productos')}
            >
              Ver catálogo administrativo →
            </button>
          </div>
        )}

        {seccionActiva === 'productos' && (
          <section className='admin-listado'>
            <div className='admin-listado-titulo'>
              <div>
                <p className='admin-eyebrow'>CATÁLOGO ADMINISTRATIVO</p>

                <h2>Todas las prendas</h2>

                <p>Editá, publicá, ocultá o eliminá productos del catálogo.</p>
              </div>

              <button
                type='button'
                className='admin-boton-principal'
                onClick={abrirFormularioNuevo}
              >
                + Agregar prenda
              </button>
            </div>

            <div className='admin-filtros'>
              <label>
                <span>Buscar</span>

                <input
                  type='search'
                  placeholder='Nombre, descripción o categoría'
                  value={busqueda}
                  onChange={event => setBusqueda(event.target.value)}
                />
              </label>

              <label>
                <span>Categoría</span>

                <select
                  value={filtroCategoria}
                  onChange={event => setFiltroCategoria(event.target.value)}
                >
                  <option value='Todas'>Todas las categorías</option>

                  {categorias.map(nombreCategoria => (
                    <option key={nombreCategoria} value={nombreCategoria}>
                      {nombreCategoria}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estado</span>

                <select
                  value={filtroEstado}
                  onChange={event => setFiltroEstado(event.target.value)}
                >
                  <option value='Todos'>Todos los estados</option>
                  <option value='publicado'>Publicados</option>
                  <option value='borrador'>Borradores</option>
                  <option value='oculto'>Ocultos</option>
                </select>
              </label>
            </div>

            {cargando ? (
              <p className='admin-estado-vacio'>Cargando prendas…</p>
            ) : productosFiltrados.length === 0 ? (
              <div className='admin-estado-vacio'>
                <span>◇</span>
                <h3>No encontramos prendas</h3>

                <p>Probá con otra búsqueda o agregá una prenda al catálogo.</p>

                <button
                  type='button'
                  className='admin-boton-secundario'
                  onClick={abrirFormularioNuevo}
                >
                  + Agregar prenda
                </button>
              </div>
            ) : (
              <div className='admin-productos-grid'>
                {productosFiltrados.map(producto => (
                  <article className='admin-producto-card' key={producto.id}>
                    <div className='admin-producto-foto'>
                      {producto.fotos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={producto.fotos[0]} alt={producto.nombre} />
                      ) : (
                        <div className='admin-sin-foto'>
                          <span>◇</span>
                          <small>Sin fotografía</small>
                        </div>
                      )}

                      <span
                        className={`admin-estado admin-estado-${producto.estado}`}
                      >
                        {textoEstado(producto.estado)}
                      </span>
                    </div>

                    <div className='admin-producto-info'>
                      <p className='admin-producto-categoria'>
                        {producto.categoria}
                      </p>

                      <h3>{producto.nombre}</h3>

                      <strong className='admin-producto-precio'>
                        {formatoPrecio(producto.precio)}
                      </strong>

                      <p className='admin-producto-variantes'>
                        {(producto.variantes ?? []).length} variantes
                      </p>

                      <div className='admin-producto-acciones'>
                        <button
                          type='button'
                          className='admin-boton-secundario'
                          onClick={() => editarProducto(producto)}
                        >
                          ✎ Editar prenda
                        </button>

                        {producto.estado === 'publicado' ? (
                          <>
                            <button
                              type='button'
                              className='admin-boton-secundario'
                              disabled={productoEnProceso === producto.id}
                              onClick={() =>
                                void cambiarEstadoProducto(producto, 'oculto')
                              }
                            >
                              {productoEnProceso === producto.id
                                ? 'Actualizando…'
                                : 'Ocultar en la tienda'}
                            </button>

                            <button
                              type='button'
                              className='admin-boton-secundario'
                              disabled={productoEnProceso === producto.id}
                              onClick={() =>
                                void cambiarEstadoProducto(producto, 'borrador')
                              }
                            >
                              Volver a borrador
                            </button>
                          </>
                        ) : (
                          <button
                            type='button'
                            className='admin-boton-principal'
                            disabled={productoEnProceso === producto.id}
                            onClick={() =>
                              void cambiarEstadoProducto(producto, 'publicado')
                            }
                          >
                            {productoEnProceso === producto.id
                              ? 'Publicando…'
                              : '↑ Publicar en la tienda'}
                          </button>
                        )}

                        {producto.estado === 'oculto' && (
                          <button
                            type='button'
                            className='admin-boton-secundario'
                            disabled={productoEnProceso === producto.id}
                            onClick={() =>
                              void cambiarEstadoProducto(producto, 'borrador')
                            }
                          >
                            Pasar a borrador
                          </button>
                        )}

                        <button
                          type='button'
                          className='admin-boton-eliminar'
                          disabled={productoEnProceso === producto.id}
                          onClick={() => void eliminarPrenda(producto)}
                        >
                          {productoEnProceso === producto.id
                            ? 'Procesando…'
                            : '× Eliminar prenda'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {seccionActiva === 'agregar' && (
          <section className='admin-formulario-contenedor'>
            <div className='admin-formulario-titulo'>
              <p className='admin-eyebrow'>
                {productoEditando ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
              </p>

              <h2>
                {productoEditando
                  ? 'Actualizá los datos de la prenda'
                  : 'Cargá una nueva prenda'}
              </h2>

              <p>
                Completá la información y guardá la prenda como borrador o
                publicala cuando esté lista.
              </p>
            </div>

            <form
              className='admin-formulario'
              onSubmit={event => {
                event.preventDefault()
                void guardarFormulario(estadoFormulario)
              }}
            >
              <section className='admin-formulario-seccion'>
                <h3>Información general</h3>

                <div className='admin-form-grid'>
                  <label>
                    <span>Nombre de la prenda *</span>

                    <input
                      value={nombre}
                      onChange={event => setNombre(event.target.value)}
                      placeholder='Ej.: Blusa de lino'
                      required
                    />
                  </label>

                  <label>
                    <span>Precio general (ARS) *</span>

                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      value={precio}
                      onChange={event => setPrecio(event.target.value)}
                      placeholder='Ej.: 25000'
                      required
                    />
                  </label>

                  <label className='admin-campo-completo'>
                    <span>Categoría *</span>

                    <select
                      value={categoria}
                      onChange={event => setCategoria(event.target.value)}
                      required
                    >
                      {categorias.map(nombreCategoria => (
                        <option key={nombreCategoria} value={nombreCategoria}>
                          {nombreCategoria}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className='admin-campo-completo'>
                    <span>Descripción</span>

                    <textarea
                      value={descripcion}
                      onChange={event => setDescripcion(event.target.value)}
                      placeholder='Contá detalles de la prenda, su tela o calce.'
                      rows={4}
                    />
                  </label>
                </div>
              </section>

              <section className='admin-formulario-seccion'>
                <h3>Fotografías</h3>

                <p>
                  Podés seleccionar varias imágenes. Las nuevas fotos se
                  mostrarán en la tienda después de guardar.
                </p>

                <label className='admin-selector-fotos'>
                  <span>＋ Seleccionar imágenes</span>

                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={seleccionarFotos}
                  />
                </label>

                {(fotosGuardadas.length > 0 ||
                  previsualizaciones.length > 0) && (
                  <div className='admin-fotos-preview'>
                    {fotosGuardadas.map((foto, index) => (
                      <div className='admin-foto-preview' key={foto}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto} alt={`Foto guardada ${index + 1}`} />

                        <button
                          type='button'
                          aria-label='Quitar fotografía guardada'
                          onClick={() => quitarFotoGuardada(foto)}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {previsualizaciones.map((foto, index) => (
                      <div className='admin-foto-preview' key={foto}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto} alt={`Vista previa ${index + 1}`} />

                        <button
                          type='button'
                          aria-label='Quitar fotografía nueva'
                          onClick={() => quitarFotoNueva(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className='admin-formulario-seccion'>
                <h3>Colores, talles y stock</h3>

                <p>
                  Cada fila representa una combinación concreta. Por ejemplo:
                  negro, talle XL, stock 5.
                </p>

                {variantesFormulario.length === 0 ? (
                  <div className='admin-sin-variantes'>
                    <p>
                      Todavía no agregaste variantes. Podés guardar la prenda
                      sin variantes y completar estos datos más adelante.
                    </p>
                  </div>
                ) : (
                  <div className='admin-variantes-lista'>
                    {variantesFormulario.map((variante, indice) => (
                      <div className='admin-variante-fila' key={variante.id}>
                        <div className='admin-variante-numero'>
                          Variante {indice + 1}
                        </div>

                        <label>
                          <span>Color</span>

                          <input
                            value={variante.color}
                            onChange={event =>
                              actualizarVariante(
                                variante.id,
                                'color',
                                event.target.value
                              )
                            }
                            placeholder='Ej.: Negro'
                          />
                        </label>

                        <label>
                          <span>Muestra de color</span>

                          <input
                            type='color'
                            value={variante.codigoColor}
                            onChange={event =>
                              actualizarVariante(
                                variante.id,
                                'codigoColor',
                                event.target.value
                              )
                            }
                            aria-label='Elegir código visual del color'
                          />
                        </label>

                        <label>
                          <span>Talle</span>

                          <input
                            value={variante.talle}
                            onChange={event =>
                              actualizarVariante(
                                variante.id,
                                'talle',
                                event.target.value
                              )
                            }
                            placeholder='Ej.: S, XL, 42'
                          />
                        </label>

                        <label>
                          <span>Stock</span>

                          <input
                            type='number'
                            min='0'
                            step='1'
                            value={variante.stock}
                            onChange={event =>
                              actualizarVariante(
                                variante.id,
                                'stock',
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>Precio particular (opcional)</span>

                          <input
                            type='number'
                            min='0'
                            step='0.01'
                            value={variante.precio}
                            onChange={event =>
                              actualizarVariante(
                                variante.id,
                                'precio',
                                event.target.value
                              )
                            }
                            placeholder='Usar precio general'
                          />
                        </label>

                        <button
                          type='button'
                          className='admin-boton-eliminar'
                          onClick={() => quitarVariante(variante.id)}
                        >
                          × Quitar variante
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type='button'
                  className='admin-boton-secundario'
                  onClick={agregarVariante}
                >
                  + Agregar color, talle y stock
                </button>
              </section>

              <section className='admin-formulario-seccion'>
                <h3>Publicación</h3>

                <p>
                  Los borradores no son visibles para los clientes. Podés
                  publicar la prenda ahora o guardarla para más adelante.
                </p>

                <label>
                  <span>Estado al guardar</span>

                  <select
                    value={estadoFormulario}
                    onChange={event =>
                      setEstadoFormulario(event.target.value as EstadoProducto)
                    }
                  >
                    <option value='borrador'>Borrador</option>
                    <option value='publicado'>Publicado en la tienda</option>
                    <option value='oculto'>Oculto en la tienda</option>
                  </select>
                </label>
              </section>

              {mensaje && (
                <p className='admin-formulario-mensaje' role='status'>
                  {mensaje}
                </p>
              )}

              <div className='admin-formulario-acciones'>
                <button
                  type='button'
                  className='admin-boton-secundario'
                  disabled={guardando}
                  onClick={() => {
                    limpiarFormulario()
                    setSeccionActiva('productos')
                  }}
                >
                  Cancelar
                </button>

                <button
                  type='button'
                  className='admin-boton-secundario'
                  disabled={guardando}
                  onClick={() => void guardarFormulario('borrador')}
                >
                  Guardar como borrador
                </button>

                <button
                  type='submit'
                  className='admin-boton-principal'
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando…'
                    : estadoFormulario === 'publicado'
                    ? 'Guardar y publicar'
                    : estadoFormulario === 'oculto'
                    ? 'Guardar como oculto'
                    : 'Guardar cambios'}
                </button>

                {productoEditando && (
                  <button
                    type='button'
                    className='admin-boton-eliminar'
                    disabled={guardando}
                    onClick={() => void eliminarPrenda(productoEditando)}
                  >
                    × Eliminar prenda
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </section>
    </main>
  )
}
