'use client'

import { useEffect, useRef, useState } from 'react'
import './admin.css'
import { obtenerProductos, guardarProductos } from '@/lib/almacenProductos'
import type { Producto } from '@/lib/productos'

type Seccion = 'inicio' | 'productos' | 'agregar'

type FotoPreview = {
  id: string
  nombre: string
  url: string
}

type ColorDisponible = {
  nombre: string
  codigo: string
}

type VariantePrenda = {
  id: string
  color: string
  talle: string
  stock: number
  precio: string
}

const COLORES_PREDEFINIDOS: ColorDisponible[] = [
  { nombre: 'Negro', codigo: '#171417' },
  { nombre: 'Blanco', codigo: '#FFFFFF' },
  { nombre: 'Gris', codigo: '#929292' },
  { nombre: 'Beige', codigo: '#D8B995' },
  { nombre: 'Marrón', codigo: '#80543C' },
  { nombre: 'Rosa', codigo: '#E99AB7' },
  { nombre: 'Rojo', codigo: '#E52B38' },
  { nombre: 'Bordó', codigo: '#800020' },
  { nombre: 'Azul', codigo: '#2176D2' },
  { nombre: 'Celeste', codigo: '#7CC5EE' },
  { nombre: 'Verde', codigo: '#659B58' },
  { nombre: 'Violeta', codigo: '#8A4BC0' },
  { nombre: 'Amarillo', codigo: '#F5D13D' },
  { nombre: 'Naranja', codigo: '#F28A32' }
]

export default function AdminPage () {
  const [fotosPreview, setFotosPreview] = useState<FotoPreview[]>([])
  const fotosPreviewRef = useRef<FotoPreview[]>([])

  const [seccionActiva, setSeccionActiva] = useState<Seccion>('inicio')
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoEditando, setProductoEditando] = useState<string | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [colores, setColores] =
    useState<ColorDisponible[]>(COLORES_PREDEFINIDOS)
  const [coloresSeleccionados, setColoresSeleccionados] = useState<string[]>([])
  const [nombreColorNuevo, setNombreColorNuevo] = useState('')
  const [codigoColorNuevo, setCodigoColorNuevo] = useState('#C5A052')

  const [talles, setTalles] = useState<string[]>([])
  const [nombreTalleNuevo, setNombreTalleNuevo] = useState('')

  const [variantes, setVariantes] = useState<VariantePrenda[]>([])
  const [colorVariante, setColorVariante] = useState('')
  const [talleVariante, setTalleVariante] = useState('')
  const [stockVariante, setStockVariante] = useState('0')
  const [precioVariante, setPrecioVariante] = useState('')

  useEffect(() => {
    setProductos(obtenerProductos())
  }, [])

  useEffect(() => {
    return () => {
      fotosPreviewRef.current.forEach(foto => {
        URL.revokeObjectURL(foto.url)
      })
    }
  }, [])

  const seleccionarFotografias = (
    evento: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivos = Array.from(evento.target.files ?? []).filter(archivo =>
      archivo.type.startsWith('image/')
    )

    fotosPreviewRef.current.forEach(foto => {
      URL.revokeObjectURL(foto.url)
    })

    const nuevasFotos = archivos.map(archivo => ({
      id: crypto.randomUUID(),
      nombre: archivo.name,
      url: URL.createObjectURL(archivo)
    }))

    fotosPreviewRef.current = nuevasFotos
    setFotosPreview(nuevasFotos)
  }

  const quitarFotografia = (id: string) => {
    const foto = fotosPreviewRef.current.find(item => item.id === id)

    if (foto) {
      URL.revokeObjectURL(foto.url)
    }

    const nuevasFotos = fotosPreviewRef.current.filter(item => item.id !== id)

    fotosPreviewRef.current = nuevasFotos
    setFotosPreview(nuevasFotos)
  }

  const alternarColor = (nombre: string) => {
    setColoresSeleccionados(actual =>
      actual.includes(nombre)
        ? actual.filter(color => color !== nombre)
        : [...actual, nombre]
    )
  }

  const agregarColorPersonalizado = () => {
    const nombre = nombreColorNuevo.trim()

    if (!nombre) {
      alert('Escribí el nombre del color.')
      return
    }

    if (
      colores.some(color => color.nombre.toLowerCase() === nombre.toLowerCase())
    ) {
      alert('Ese color ya está en la lista.')
      return
    }

    setColores(actual => [...actual, { nombre, codigo: codigoColorNuevo }])
    setColoresSeleccionados(actual => [...actual, nombre])
    setNombreColorNuevo('')
    setCodigoColorNuevo('#C5A052')
  }

  const agregarTalle = () => {
    const nombre = nombreTalleNuevo.trim().toUpperCase()

    if (!nombre) return

    if (talles.some(talle => talle.toLowerCase() === nombre.toLowerCase())) {
      alert('Ese talle ya está en la lista.')
      return
    }

    setTalles(actual => [...actual, nombre])
    setNombreTalleNuevo('')
  }

  const agregarVariante = () => {
    if (!colorVariante || !talleVariante) {
      alert('Elegí un color y un talle para agregar la variante.')
      return
    }

    if (
      variantes.some(
        variante =>
          variante.color === colorVariante && variante.talle === talleVariante
      )
    ) {
      alert('Esa combinación de color y talle ya existe.')
      return
    }

    const stock = Number(stockVariante)

    if (!Number.isInteger(stock) || stock < 0) {
      alert('El stock debe ser un número entero igual o mayor que cero.')
      return
    }

    if (
      precioVariante.trim() !== '' &&
      (!Number.isFinite(Number(precioVariante)) || Number(precioVariante) <= 0)
    ) {
      alert('El precio personalizado debe ser mayor que cero.')
      return
    }

    setVariantes(actual => [
      ...actual,
      {
        id: crypto.randomUUID(),
        color: colorVariante,
        talle: talleVariante,
        stock,
        precio: precioVariante.trim()
      }
    ])

    setStockVariante('0')
    setPrecioVariante('')
  }

  const eliminarVariante = (id: string) => {
    setVariantes(actual => actual.filter(variante => variante.id !== id))
  }

  const cambiarSeccion = (seccion: Seccion) => {
    setSeccionActiva(seccion)
    setMenuAbierto(false)
  }

  // Esta función ahora está fuera de cambiarSeccion.
  // Por eso los botones de edición pueden acceder a ella.
  const editarProducto = (producto: Producto) => {
    setProductoEditando(producto.id)
    setSeccionActiva('agregar')
    setMenuAbierto(false)

    // Recuperar los colores y talles que ya se usan en las variantes.
    const coloresDelProducto = [
      ...new Set(producto.variantes.map(variante => variante.color))
    ]

    const tallesDelProducto = [
      ...new Set(producto.variantes.map(variante => variante.talle))
    ]

    // Agregar a la lista los colores guardados que no estén predefinidos.
    setColores(actual => {
      const nuevosColores = coloresDelProducto
        .filter(
          nombre =>
            !actual.some(
              color => color.nombre.toLowerCase() === nombre.toLowerCase()
            )
        )
        .map(nombre => ({
          nombre,
          codigo: '#929292'
        }))

      return [...actual, ...nuevosColores]
    })

    setColoresSeleccionados(coloresDelProducto)
    setTalles(tallesDelProducto)

    setVariantes(
      producto.variantes.map(variante => ({
        id: variante.id,
        color: variante.color,
        talle: variante.talle,
        stock: variante.stock,
        precio: variante.precio !== undefined ? String(variante.precio) : ''
      }))
    )

    setColorVariante('')
    setTalleVariante('')
    setStockVariante('0')
    setPrecioVariante('')

    // Los campos del formulario se completan después de mostrarlo.
    window.setTimeout(() => {
      const formulario = document.querySelector<HTMLFormElement>(
        '.admin-producto-formulario'
      )

      if (!formulario) return

      const nombre = formulario.elements.namedItem(
        'nombre'
      ) as HTMLInputElement | null

      const categoria = formulario.elements.namedItem(
        'categoria'
      ) as HTMLSelectElement | null

      const descripcion = formulario.elements.namedItem(
        'descripcion'
      ) as HTMLTextAreaElement | null

      const precio = formulario.elements.namedItem(
        'precio'
      ) as HTMLInputElement | null

      if (nombre) nombre.value = producto.nombre
      if (categoria) categoria.value = producto.categoria
      if (descripcion) descripcion.value = producto.descripcion
      if (precio) precio.value = String(producto.precio)
    }, 0)
  }

  const guardarNuevaPrenda = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const formulario = evento.currentTarget
    const datos = new FormData(formulario)

    const nombre = String(datos.get('nombre') ?? '').trim()
    const categoria = String(datos.get('categoria') ?? '')
    const descripcion = String(datos.get('descripcion') ?? '').trim()
    const precio = Number(datos.get('precio'))

    if (!nombre || !categoria || !Number.isFinite(precio) || precio <= 0) {
      alert('Revisá el nombre, la categoría y el precio de la prenda.')
      return
    }

    const variantesProducto = variantes.map(variante => ({
      id: variante.id,
      color: variante.color,
      talle: variante.talle,
      stock: variante.stock,
      ...(variante.precio.trim() !== ''
        ? { precio: Number(variante.precio) }
        : {})
    }))

    const fechaActual = new Date().toISOString()
    const productosGuardados = obtenerProductos()

    const productoAnterior = productoEditando
      ? productosGuardados.find(item => item.id === productoEditando)
      : undefined

    const nuevaPrenda: Producto = {
      id: productoEditando ?? crypto.randomUUID(),
      nombre,
      descripcion,
      categoria,
      precio,
      fotos: productoAnterior?.fotos ?? [],
      variantes: variantesProducto,
      estado: productoAnterior?.estado ?? 'borrador',
      creadoEn: productoAnterior?.creadoEn ?? fechaActual,
      actualizadoEn: fechaActual
    }

    const productosActualizados = productoEditando
      ? productosGuardados.map(producto =>
          producto.id === productoEditando ? nuevaPrenda : producto
        )
      : [...productosGuardados, nuevaPrenda]

    const guardado = guardarProductos(productosActualizados)

    if (!guardado) {
      alert(
        'No se pudo guardar la prenda. Revisá el espacio disponible del navegador.'
      )
      return
    }

    setProductos(productosActualizados)
    setProductoEditando(null)

    alert(
      productoEditando
        ? '¡Cambios guardados correctamente!'
        : '¡Prenda guardada! Se almacenó como borrador.'
    )

    formulario.reset()
    setVariantes([])
    setColoresSeleccionados([])
    setTalles([])
    setColorVariante('')
    setTalleVariante('')
    setStockVariante('0')
    setPrecioVariante('')
    setNombreColorNuevo('')
    setCodigoColorNuevo('#C5A052')
    setNombreTalleNuevo('')

    fotosPreviewRef.current.forEach(foto => {
      URL.revokeObjectURL(foto.url)
    })

    fotosPreviewRef.current = []
    setFotosPreview([])
    setSeccionActiva('productos')
  }

  const cancelarEdicion = () => {
    const formulario = document.querySelector<HTMLFormElement>(
      '.admin-producto-formulario'
    )

    formulario?.reset()

    setProductoEditando(null)
    setVariantes([])
    setColoresSeleccionados([])
    setTalles([])
    setColorVariante('')
    setTalleVariante('')
    setStockVariante('0')
    setPrecioVariante('')
    setNombreColorNuevo('')
    setCodigoColorNuevo('#C5A052')
    setNombreTalleNuevo('')

    fotosPreviewRef.current.forEach(foto => {
      URL.revokeObjectURL(foto.url)
    })

    fotosPreviewRef.current = []
    setFotosPreview([])
    cambiarSeccion('productos')
  }

  const cambiarEstadoProducto = (
    producto: Producto,
    nuevoEstado: 'borrador' | 'publicado'
  ) => {
    const productosActualizados = productos.map(item =>
      item.id === producto.id
        ? {
            ...item,
            estado: nuevoEstado,
            actualizadoEn: new Date().toISOString()
          }
        : item
    )

    if (!guardarProductos(productosActualizados)) {
      alert('No se pudo guardar el cambio.')
      return
    }

    setProductos(productosActualizados)

    alert(
      nuevoEstado === 'publicado'
        ? 'La prenda quedó marcada como publicada. Todavía falta conectarla con la tienda visible para los clientes.'
        : 'La prenda volvió a borradores.'
    )
  }

  return (
    <main className='admin'>
      <aside
        className={`admin-sidebar ${
          menuAbierto ? 'admin-sidebar-abierto' : ''
        }`}
      >
        <div className='admin-marca'>
          <div className='admin-logo'>V.I</div>
          <div>
            <p>VIRTUOSA IND</p>
            <small>Panel administrativo</small>
          </div>
        </div>

        <nav className='admin-nav'>
          <span className='admin-nav-titulo'>MENÚ PRINCIPAL</span>

          <button
            type='button'
            className={seccionActiva === 'inicio' ? 'activo' : ''}
            onClick={() => cambiarSeccion('inicio')}
          >
            <span>⌂</span>
            Inicio
          </button>

          <button
            type='button'
            className={seccionActiva === 'productos' ? 'activo' : ''}
            onClick={() => cambiarSeccion('productos')}
          >
            <span>▤</span>
            Productos
          </button>

          <button
            type='button'
            className={seccionActiva === 'agregar' ? 'activo' : ''}
            onClick={() => {
              setProductoEditando(null)
              cambiarSeccion('agregar')
            }}
          >
            <span>＋</span>
            Agregar prenda
          </button>

          <a href='/' className='admin-volver'>
            <span>↗</span>
            Ver tienda
          </a>
        </nav>

        <div className='admin-sidebar-pie'>
          <span>VIRTUOSA IND</span>
          <small>Vestida de fuerza y dignidad</small>
        </div>
      </aside>

      {menuAbierto && (
        <button
          type='button'
          className='admin-fondo-menu'
          aria-label='Cerrar menú'
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <section className='admin-principal'>
        <header className='admin-header'>
          <button
            type='button'
            className='admin-menu-toggle'
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => {
              alert('El botón recibió el toque')
              setMenuAbierto(!menuAbierto)
            }}
          >
            {menuAbierto ? '✕' : '☰'}
          </button>

          <div className='admin-header-titulo'>
            <span>VIRTUOSA IND / ADMINISTRACIÓN</span>
            <h1>
              {seccionActiva === 'inicio'
                ? 'Inicio'
                : seccionActiva === 'productos'
                ? 'Productos'
                : productoEditando
                ? 'Editar una prenda'
                : 'Agregar una prenda'}
            </h1>
          </div>

          <div className='admin-perfil'>
            <span className='admin-perfil-icono'>V</span>
            <div>
              <strong>Administradora</strong>
              <small>Panel privado</small>
            </div>
          </div>
        </header>

        <div className='admin-contenido'>
          {seccionActiva === 'inicio' && (
            <div className='admin-inicio'>
              <div className='admin-bienvenida'>
                <span className='admin-etiqueta'>TU ESPACIO DE TRABAJO</span>

                <h2>Bienvenida a tu tienda.</h2>

                <p>
                  Desde acá vas a poder administrar tus prendas, actualizar
                  precios y organizar tu catálogo.
                </p>

                <button
                  type='button'
                  className='admin-boton-principal'
                  onClick={() => {
                    setProductoEditando(null)
                    cambiarSeccion('agregar')
                  }}
                >
                  ＋ Agregar una prenda
                </button>
              </div>

              <div className='admin-tarjetas-resumen'>
                <article className='admin-tarjeta'>
                  <span>CATÁLOGO</span>
                  <strong>Productos</strong>
                  <p>Administrá las prendas de tu tienda.</p>

                  <button
                    type='button'
                    onClick={() => cambiarSeccion('productos')}
                  >
                    Ver productos →
                  </button>
                </article>

                <article className='admin-tarjeta'>
                  <span>NUEVO PRODUCTO</span>
                  <strong>Agregar prenda</strong>
                  <p>Cargá fotos, precios, colores y talles.</p>

                  <button
                    type='button'
                    onClick={() => {
                      setProductoEditando(null)
                      cambiarSeccion('agregar')
                    }}
                  >
                    Comenzar →
                  </button>
                </article>
              </div>
            </div>
          )}

          {seccionActiva === 'productos' && (
            <div className='admin-panel-seccion'>
              <span className='admin-etiqueta'>TU CATÁLOGO</span>
              <h2>Productos</h2>

              <p>
                Administrá tus prendas y elegí cuáles querés mostrar en la
                tienda.
              </p>

              <div className='admin-tarjetas-resumen'>
                <article className='admin-tarjeta'>
                  <span>PRENDAS GUARDADAS</span>
                  <strong>{productos.length}</strong>
                  <p>Total de productos registrados.</p>
                </article>

                <article className='admin-tarjeta'>
                  <span>BORRADORES</span>
                  <strong>
                    {
                      productos.filter(
                        producto => producto.estado === 'borrador'
                      ).length
                    }
                  </strong>
                  <p>Prendas que todavía no están publicadas.</p>
                </article>

                <article className='admin-tarjeta'>
                  <span>PUBLICADAS</span>
                  <strong>
                    {
                      productos.filter(
                        producto => producto.estado === 'publicado'
                      ).length
                    }
                  </strong>
                  <p>Prendas marcadas como publicadas.</p>
                </article>
              </div>

              {productos.length === 0 ? (
                <div className='admin-vacio'>
                  <span>▤</span>
                  <h3>Todavía no hay prendas guardadas</h3>
                  <p>Agregá una prenda para que aparezca en este catálogo.</p>

                  <button
                    type='button'
                    className='admin-boton-principal'
                    onClick={() => {
                      setProductoEditando(null)
                      cambiarSeccion('agregar')
                    }}
                  >
                    ＋ Agregar primera prenda
                  </button>
                </div>
              ) : (
                <div className='admin-lista-productos'>
                  {productos.map(producto => {
                    const coloresProducto = [
                      ...new Set(
                        producto.variantes.map(variante => variante.color)
                      )
                    ]

                    const tallesProducto = [
                      ...new Set(
                        producto.variantes.map(variante => variante.talle)
                      )
                    ]

                    const agotado =
                      producto.variantes.length > 0 &&
                      producto.variantes.every(variante => variante.stock === 0)

                    return (
                      <article
                        className='admin-tarjeta admin-producto-guardado'
                        key={producto.id}
                      >
                        <span>{producto.categoria}</span>

                        <h3>{producto.nombre}</h3>

                        <p>{producto.descripcion || 'Sin descripción.'}</p>

                        <p>
                          <strong>
                            ${producto.precio.toLocaleString('es-AR')}
                          </strong>
                        </p>

                        <p>Variantes: {producto.variantes.length}</p>

                        <div className='admin-producto-detalles'>
                          <p>
                            <strong>Colores:</strong>{' '}
                            {coloresProducto.length > 0
                              ? coloresProducto.join(', ')
                              : 'Sin colores cargados'}
                          </p>

                          <p>
                            <strong>Talles:</strong>{' '}
                            {tallesProducto.length > 0
                              ? tallesProducto.join(', ')
                              : 'Sin talles cargados'}
                          </p>
                        </div>

                        {agotado && (
                          <p className='admin-producto-agotado'>
                            Agotada · Todas las variantes tienen stock cero
                          </p>
                        )}

                        <p>
                          <button
                            type='button'
                            className='admin-boton-secundario'
                            onClick={() => editarProducto(producto)}
                          >
                            ✎ Editar prenda
                          </button>
                        </p>

                        <p>
                          Estado:{' '}
                          <strong>
                            {producto.estado === 'publicado'
                              ? 'Publicado'
                              : producto.estado === 'oculto'
                              ? 'Oculto'
                              : 'Borrador'}
                          </strong>
                        </p>

                        {producto.estado === 'publicado' ? (
                          <button
                            type='button'
                            className='admin-boton-secundario'
                            onClick={() =>
                              cambiarEstadoProducto(producto, 'borrador')
                            }
                          >
                            Volver a borrador
                          </button>
                        ) : (
                          <button
                            type='button'
                            className='admin-boton-principal'
                            onClick={() =>
                              cambiarEstadoProducto(producto, 'publicado')
                            }
                          >
                            ↑ Publicar en la tienda
                          </button>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {seccionActiva === 'agregar' && (
            <div className='admin-panel-seccion'>
              <span className='admin-etiqueta'>CATÁLOGO DE PRENDAS</span>

              <h2>
                {productoEditando ? 'Editar una prenda' : 'Agregar una prenda'}
              </h2>

              <p>
                Completá la información de la prenda. Los campos marcados con *
                son obligatorios.
              </p>

              <form
                className='admin-producto-formulario'
                onSubmit={guardarNuevaPrenda}
              >
                <section className='admin-form-bloque'>
                  <h3>Información general</h3>

                  <div className='admin-form-grid'>
                    <label className='admin-form-campo'>
                      Nombre de la prenda *
                      <input
                        type='text'
                        name='nombre'
                        placeholder='Ej.: Blusa de lino'
                        required
                      />
                    </label>

                    <label className='admin-form-campo'>
                      Categoría *
                      <select name='categoria' defaultValue='' required>
                        <option value='' disabled>
                          Elegí una categoría
                        </option>
                        <option>Remeras y musculosas</option>
                        <option>Blusas y camisas</option>
                        <option>Pantalones</option>
                        <option>Jeans</option>
                        <option>Shorts y bermudas</option>
                        <option>Vestidos</option>
                        <option>Camperas</option>
                        <option>Suéteres</option>
                        <option>Conjuntos</option>
                        <option>Outfits</option>
                        <option>Accesorios</option>
                        <option>SALE</option>
                      </select>
                    </label>

                    <label className='admin-form-campo admin-form-ancho'>
                      Descripción
                      <textarea
                        name='descripcion'
                        rows={4}
                        placeholder='Materiales, detalles y características de la prenda...'
                      />
                    </label>

                    <label className='admin-form-campo'>
                      Precio de venta *
                      <span className='admin-form-precio'>
                        <span>$</span>
                        <input
                          type='number'
                          name='precio'
                          min='1'
                          step='1'
                          placeholder='22000'
                          required
                        />
                      </span>
                    </label>
                  </div>
                </section>

                <section className='admin-form-bloque'>
                  <h3>Fotografías</h3>

                  <p>
                    Seleccioná las imágenes de la prenda. Podrás verlas antes de
                    guardar y quitar las que no quieras usar.
                  </p>

                  <label className='admin-form-campo'>
                    Seleccionar imágenes
                    <input
                      type='file'
                      name='fotografias'
                      accept='image/*'
                      multiple
                      onChange={seleccionarFotografias}
                    />
                  </label>

                  {fotosPreview.length > 0 && (
                    <div className='admin-fotos-preview'>
                      <h4>Vista previa de las fotografías</h4>

                      <div className='admin-fotos-grid'>
                        {fotosPreview.map((foto, indice) => (
                          <article className='admin-foto-preview' key={foto.id}>
                            <img
                              src={foto.url}
                              alt={`Vista previa ${indice + 1}`}
                            />

                            <span className='admin-foto-numero'>
                              Foto {indice + 1}
                            </span>

                            <p title={foto.nombre}>{foto.nombre}</p>

                            <button
                              type='button'
                              onClick={() => quitarFotografia(foto.id)}
                            >
                              × Quitar foto
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className='admin-form-bloque'>
                  <h3>Colores, talles y stock</h3>

                  <p>
                    Elegí los colores disponibles, agregá los talles y creá cada
                    variante con su stock correspondiente.
                  </p>

                  <div className='admin-colores-selector'>
                    <h4>Colores disponibles</h4>

                    <div className='admin-circulos-colores'>
                      {colores.map(color => {
                        const seleccionado = coloresSeleccionados.includes(
                          color.nombre
                        )

                        return (
                          <button
                            key={color.nombre}
                            type='button'
                            className={`admin-color-opcion ${
                              seleccionado ? 'seleccionado' : ''
                            }`}
                            onClick={() => alternarColor(color.nombre)}
                            aria-pressed={seleccionado}
                            title={color.nombre}
                          >
                            <span
                              className='admin-color-circulo'
                              style={{ backgroundColor: color.codigo }}
                            >
                              {seleccionado && (
                                <span
                                  className={
                                    color.nombre === 'Blanco' ||
                                    color.nombre === 'Amarillo'
                                      ? 'admin-color-check oscuro'
                                      : 'admin-color-check'
                                  }
                                >
                                  ✓
                                </span>
                              )}
                            </span>

                            <span className='admin-color-nombre'>
                              {color.nombre}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className='admin-color-personalizado'>
                      <label className='admin-form-campo'>
                        Agregar otro color
                        <input
                          type='text'
                          value={nombreColorNuevo}
                          onChange={evento =>
                            setNombreColorNuevo(evento.target.value)
                          }
                          placeholder='Ej.: Bordó claro'
                        />
                      </label>

                      <label className='admin-form-campo admin-color-elegir-tono'>
                        Elegir tono
                        <input
                          type='color'
                          value={codigoColorNuevo}
                          onChange={evento =>
                            setCodigoColorNuevo(evento.target.value)
                          }
                          aria-label='Elegir tono del nuevo color'
                        />
                      </label>

                      <button
                        type='button'
                        className='admin-variante-agregar'
                        onClick={agregarColorPersonalizado}
                      >
                        + Agregar color
                      </button>
                    </div>

                    <p className='admin-form-ayuda'>
                      Colores seleccionados: {coloresSeleccionados.length}
                    </p>
                  </div>

                  <div className='admin-talles-selector'>
                    <h4>Talles disponibles</h4>

                    <div className='admin-talles-lista'>
                      {talles.map(talle => (
                        <button
                          type='button'
                          key={talle}
                          className='admin-talle-opcion'
                          onClick={() =>
                            setTalles(actual =>
                              actual.filter(item => item !== talle)
                            )
                          }
                          title={`Quitar talle ${talle}`}
                        >
                          {talle} <span>×</span>
                        </button>
                      ))}
                    </div>

                    <div className='admin-variante-entrada'>
                      <input
                        type='text'
                        value={nombreTalleNuevo}
                        onChange={evento =>
                          setNombreTalleNuevo(evento.target.value)
                        }
                        onKeyDown={evento => {
                          if (evento.key === 'Enter') {
                            evento.preventDefault()
                            agregarTalle()
                          }
                        }}
                        placeholder='Ej.: S, M, XL, 40, 42...'
                        aria-label='Nuevo talle'
                      />

                      <button
                        type='button'
                        className='admin-variante-agregar'
                        onClick={agregarTalle}
                      >
                        + Agregar talle
                      </button>
                    </div>
                  </div>

                  <div className='admin-variante-editor'>
                    <h4>Agregar una variante</h4>

                    <p>
                      Cada variante corresponde a un color y talle concretos.
                    </p>

                    <div className='admin-form-grid'>
                      <label className='admin-form-campo'>
                        Color *
                        <select
                          value={colorVariante}
                          onChange={evento =>
                            setColorVariante(evento.target.value)
                          }
                        >
                          <option value=''>Elegí un color</option>
                          {coloresSeleccionados.map(nombre => (
                            <option key={nombre} value={nombre}>
                              {nombre}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className='admin-form-campo'>
                        Talle *
                        <select
                          value={talleVariante}
                          onChange={evento =>
                            setTalleVariante(evento.target.value)
                          }
                        >
                          <option value=''>Elegí un talle</option>
                          {talles.map(talle => (
                            <option key={talle} value={talle}>
                              {talle}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className='admin-form-campo'>
                        Stock disponible *
                        <input
                          type='number'
                          min='0'
                          step='1'
                          value={stockVariante}
                          onChange={evento =>
                            setStockVariante(evento.target.value)
                          }
                          required
                        />
                      </label>

                      <label className='admin-form-campo'>
                        Precio personalizado (opcional)
                        <span className='admin-form-precio'>
                          <span>$</span>
                          <input
                            type='number'
                            min='1'
                            step='1'
                            value={precioVariante}
                            onChange={evento =>
                              setPrecioVariante(evento.target.value)
                            }
                            placeholder='Usar precio general'
                          />
                        </span>
                      </label>
                    </div>

                    <button
                      type='button'
                      className='admin-boton-principal'
                      onClick={agregarVariante}
                    >
                      + Agregar variante
                    </button>
                  </div>

                  <div className='admin-variantes-lista'>
                    <h4>Variantes de esta prenda ({variantes.length})</h4>

                    {variantes.length === 0 ? (
                      <div className='admin-variantes-vacio'>
                        <span>＋</span>
                        <strong>Todavía no hay variantes</strong>
                        <small>
                          Seleccioná colores y talles, y agregá cada combinación
                          por separado.
                        </small>
                      </div>
                    ) : (
                      <div className='admin-variantes-tabla'>
                        {variantes.map(variante => {
                          const color = colores.find(
                            item => item.nombre === variante.color
                          )

                          return (
                            <article
                              className='admin-variante-fila'
                              key={variante.id}
                            >
                              <span
                                className='admin-color-circulo admin-color-mini'
                                style={{
                                  backgroundColor: color?.codigo ?? '#929292'
                                }}
                              />

                              <div className='admin-variante-datos'>
                                <strong>
                                  {variante.color} · {variante.talle}
                                </strong>
                                <small>
                                  {variante.stock === 0
                                    ? 'Agotada'
                                    : `${variante.stock} unidades disponibles`}
                                </small>
                              </div>

                              <div className='admin-variante-precio'>
                                {variante.precio
                                  ? `$${Number(variante.precio).toLocaleString(
                                      'es-AR'
                                    )}`
                                  : 'Precio general'}
                              </div>

                              <button
                                type='button'
                                className='admin-variante-eliminar'
                                onClick={() => eliminarVariante(variante.id)}
                                aria-label={`Eliminar variante ${variante.color} talle ${variante.talle}`}
                                title='Eliminar variante'
                              >
                                ×
                              </button>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </section>

                <div className='admin-form-acciones'>
                  <button
                    type='button'
                    className='admin-form-cancelar'
                    onClick={cancelarEdicion}
                  >
                    Cancelar
                  </button>

                  <button type='submit' className='admin-boton-principal'>
                    {productoEditando ? 'Guardar cambios' : 'Guardar prenda'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
