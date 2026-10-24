'use client'

import { useState } from 'react'

const categorias = [
  'Remeras y musculosas',
  'Blusas y camisas',
  'Pantalones',
  'Jeans',
  'Shorts y bermudas',
  'Vestidos',
  'Camperas',
  'Suéteres',
  'Conjuntos',
  'Outfits',
  'Accesorios',
  'SALE'
]

type OpcionColor = {
  nombre: string
  codigo: string
}

type Producto = {
  id: number
  nombre: string
  categoria: string
  precio: number
  imagen: string
  talles: string[]
  colores: OpcionColor[]
}

type ItemCarrito = {
  producto: Producto
  cantidad: number
  talle: string
  color: OpcionColor
}

const rosa: OpcionColor = { nombre: 'Rosa', codigo: '#e8a0b4' }
const blanco: OpcionColor = { nombre: 'Blanco', codigo: '#ffffff' }
const negro: OpcionColor = { nombre: 'Negro', codigo: '#202020' }
const beige: OpcionColor = { nombre: 'Beige', codigo: '#d6c0a1' }
const azul: OpcionColor = { nombre: 'Azul', codigo: '#456fba' }
const celeste: OpcionColor = { nombre: 'Celeste', codigo: '#a5d5ee' }
const marrón: OpcionColor = { nombre: 'marrón', codigo: '#895129' }
const gris: OpcionColor = { nombre: 'gris', codigo: '#898989' }

const productos: Producto[] = [
  {
    id: 1,
    nombre: 'Remera de prueba',
    categoria: 'Remeras y musculosas',
    precio: 15000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [rosa, blanco, negro]
  },
  {
    id: 2,
    nombre: 'Blusa de prueba',
    categoria: 'Blusas y camisas',
    precio: 22000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [blanco, rosa, beige]
  },
  {
    id: 3,
    nombre: 'Jean de prueba',
    categoria: 'Jeans',
    precio: 35000,
    imagen: '',
    talles: ['38', '40', '42', '44'],
    colores: [azul, celeste, negro, gris]
  },
  {
    id: 4,
    nombre: 'Vestido de prueba',
    categoria: 'Vestidos',
    precio: 28000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [negro, marrón, rosa]
  },
  {
    id: 5,
    nombre: 'Vestido de prueba',
    categoria: 'Vestidos',
    precio: 28000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [negro, marrón, rosa]
  },
  {
    id: 6,
    nombre: 'Vestido de prueba',
    categoria: 'Vestidos',
    precio: 28000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [negro, marrón, rosa]
  },
  {
    id: 7,
    nombre: 'Vestido de prueba',
    categoria: 'Vestidos',
    precio: 28000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [negro, marrón, rosa]
  },
  {
    id: 8,
    nombre: 'Vestido de prueba',
    categoria: 'Vestidos',
    precio: 28000,
    imagen: '',
    talles: ['S', 'M', 'L'],
    colores: [negro, marrón, rosa]
  }
]

function formatoPrecio (precio: number) {
  return `$${precio.toLocaleString('es-AR')}`
}

export default function Home () {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos los productos')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [consultaCliente, setConsultaCliente] = useState('')
  const [tallesElegidos, setTallesElegidos] = useState<Record<number, string>>(
    {}
  )
  const [coloresElegidos, setColoresElegidos] = useState<
    Record<number, string>
  >({})

  const productosFiltrados = productos.filter(
    producto =>
      categoriaActiva === 'Todos los productos' ||
      producto.categoria === categoriaActiva
  )

  const cantidadCarrito = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  )

  const totalCarrito = carrito.reduce(
    (total, item) => total + item.producto.precio * item.cantidad,
    0
  )

  function seleccionarCategoria (categoria: string) {
    setCategoriaActiva(categoria)
    setMenuAbierto(false)

    document.getElementById('productos')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  function agregarAlCarrito (producto: Producto) {
    const talle = tallesElegidos[producto.id]
    const nombreColor = coloresElegidos[producto.id]
    const color = producto.colores.find(opcion => opcion.nombre === nombreColor)

    if (!talle || !color) {
      alert('Elegí el talle y el color antes de agregar la prenda al carrito.')
      return
    }

    setCarrito(actual => {
      const existente = actual.find(
        item =>
          item.producto.id === producto.id &&
          item.talle === talle &&
          item.color.nombre === color.nombre
      )

      if (existente) {
        return actual.map(item =>
          item.producto.id === producto.id &&
          item.talle === talle &&
          item.color.nombre === color.nombre
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }

      return [...actual, { producto, cantidad: 1, talle, color }]
    })
  }

  function cambiarCantidad (
    id: number,
    talle: string,
    colorNombre: string,
    cambio: number
  ) {
    setCarrito(actual =>
      actual
        .map(item =>
          item.producto.id === id &&
          item.talle === talle &&
          item.color.nombre === colorNombre
            ? { ...item, cantidad: item.cantidad + cambio }
            : item
        )
        .filter(item => item.cantidad > 0)
    )
  }

  function eliminarDelCarrito (id: number, talle: string, colorNombre: string) {
    setCarrito(actual =>
      actual.filter(
        item =>
          !(
            item.producto.id === id &&
            item.talle === talle &&
            item.color.nombre === colorNombre
          )
      )
    )
  }

  function prepararPedidoWhatsApp () {
    if (carrito.length === 0) return

    const lineas = carrito.map(
      item =>
        `• ${item.producto.nombre} | Color: ${item.color.nombre} | Talle: ${
          item.talle
        } | Cantidad: ${item.cantidad} | Subtotal: ${formatoPrecio(
          item.producto.precio * item.cantidad
        )}`
    )

    const mensaje = [
      '¡Hola! Quiero consultar por este pedido de VIRTUOSA IND.:',
      '',
      ...lineas,
      '',
      `Total estimado: ${formatoPrecio(totalCarrito)}`,
      '',
      'Mi consulta:',
      consultaCliente.trim() || 'No agregué ninguna consulta adicional.',
      '',
      '¿Me confirman la disponibilidad, por favor?'
    ].join('\n')

    // Reemplazar por el número real de la tienda, con código de país
    // y sin el signo +, espacios ni guiones.
    const numeroWhatsApp = '543412701052'

    if (!numeroWhatsApp) {
      alert('Todavía falta configurar el número de WhatsApp de la tienda.')
      return
    }

    window.open(
      `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <main>
      <div className='barra-superior'>
        <span>MODA CON PROPÓSITO</span>
        <span className='barra-separador'>✦</span>
        <span>SIN TEMOR AL FUTURO</span>
      </div>

      <header className='encabezado'>
        <button
          className='boton-menu'
          type='button'
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          onClick={() => {
            console.log('TOQUE EN EL MENÚ')
            setMenuAbierto(actual => !actual)
          }}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <a className='marca' href='#inicio' aria-label='VIRTUOSA IND, inicio'>
          <span className='logo'>
            VIRTUOSA <span>IND.</span>
          </span>
          <span className='eslogan'>Vestida de fuerza y dignidad</span>
        </a>

        <nav className='navegacion' aria-label='Navegación principal'>
          <a href='#inicio'>Inicio</a>
          <a href='#productos'>Colección</a>
          <a href='#contacto'>Contacto</a>
        </nav>

        <button
          className='boton-carrito'
          type='button'
          onClick={() => setCarritoAbierto(true)}
          aria-label={`Abrir carrito. ${cantidadCarrito} productos`}
        >
          <span className='icono-corazon' aria-hidden='true'>
            ♡
          </span>
          <span className='texto-carrito'>Mi carrito</span>
          <span className='contador-carrito'>{cantidadCarrito}</span>
        </button>
      </header>

      {menuAbierto && (
        <>
          <button
            className='fondo-menu'
            type='button'
            aria-label='Cerrar menú'
            onClick={() => setMenuAbierto(false)}
          />

          <aside className='panel-menu' aria-label='Menú de la tienda'>
            <div className='encabezado-menu'>
              <div>
                <span className='etiqueta-dorada'>VIRTUOSA IND.</span>
                <h2>Explorá la tienda</h2>
              </div>
              <button
                type='button'
                className='cerrar-panel'
                onClick={() => setMenuAbierto(false)}
                aria-label='Cerrar menú'
              >
                ✕
              </button>
            </div>

            <button
              className={`enlace-menu ${
                categoriaActiva === 'Todos los productos' ? 'activo' : ''
              }`}
              type='button'
              onClick={() => seleccionarCategoria('Todos los productos')}
            >
              Todos los productos <span>›</span>
            </button>

            <p className='titulo-categorias-menu'>CATEGORÍAS</p>

            <nav className='enlaces-menu'>
              {categorias.map((categoria, indice) => (
                <button
                  className={`enlace-menu ${
                    categoriaActiva === categoria ? 'activo' : ''
                  }`}
                  type='button'
                  key={categoria}
                  onClick={() => seleccionarCategoria(categoria)}
                >
                  <span className='numero-menu'>
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  <span className='nombre-menu'>{categoria}</span>
                  <span className='flecha-menu'>›</span>
                </button>
              ))}
            </nav>

            <button
              className='boton-menu-carrito'
              type='button'
              onClick={() => {
                setMenuAbierto(false)
                setCarritoAbierto(true)
              }}
            >
              Ver mi carrito <span>♡</span>
            </button>
          </aside>
        </>
      )}

      <section className='portada' id='inicio'>
        <div className='portada-contenido'>
          <span className='etiqueta-portada'>NUEVA FORMA DE EXPRESARTE</span>
          <h1>
            Tu estilo.
            <br />
            <span>Tu esencia.</span>
          </h1>
          <p className='descripcion-portada'>
            Prendas y accesorios para sentirte vos misma. Encontrá ese estilo
            que habla de quién sos.
          </p>
          <button
            className='boton-principal'
            type='button'
            onClick={() => setMenuAbierto(true)}
          >
            EXPLORAR COLECCIÓN <span>↗</span>
          </button>
        </div>

        <div className='portada-visual' aria-label='Presentación de la marca'>
          <div className='marco-portada'>
            <span className='marco-esquina esquina-superior' />
            <div className='portada-iniciales'>
              V<span>.</span>I
            </div>
            <div className='linea-portada' />
            <p>VIRTUOSA IND.</p>
            <span className='marco-esquina esquina-inferior' />
          </div>
        </div>
      </section>

      <section className='franja-informativa'>
        <span>MODA</span>
        <span className='separador-franja'>✦</span>
        <span>IDENTIDAD</span>
        <span className='separador-franja'>✦</span>
        <span>CONFIANZA</span>
        <span className='separador-franja'>✦</span>
      </section>

      <section className='productos' id='productos'>
        <div className='encabezado-productos'>
          <div>
            <span className='etiqueta-dorada'>SELECCIÓN VIRTUOSA</span>
            <h2>
              {categoriaActiva === 'Todos los productos'
                ? 'Nuestra colección'
                : categoriaActiva}
            </h2>
            <p>Encontrá prendas que reflejen tu personalidad.</p>
          </div>

          {categoriaActiva !== 'Todos los productos' && (
            <button
              type='button'
              className='boton-ver-todo'
              onClick={() => setCategoriaActiva('Todos los productos')}
            >
              Ver todo <span>↗</span>
            </button>
          )}
        </div>

        {productosFiltrados.length > 0 ? (
          <div className='grilla-productos'>
            {productosFiltrados.map(producto => {
              const talleElegido = tallesElegidos[producto.id] || ''
              const colorElegido = coloresElegidos[producto.id] || ''

              const colorActivo = producto.colores.find(
                color => color.nombre === colorElegido
              )

              return (
                <article className='tarjeta-producto' key={producto.id}>
                  <div
                    className='foto-producto'
                    style={
                      !producto.imagen
                        ? {
                            background: `linear-gradient(145deg, ${producto.colores[0].codigo} 0%, #f5f0f1 100%)`
                          }
                        : undefined
                    }
                  >
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} />
                    ) : (
                      <div className='imagen-sin-foto'>
                        <span className='texto-prenda-prueba'>
                          V<span>.</span>I
                        </span>
                        <span>{producto.nombre}</span>
                      </div>
                    )}

                    <span className='etiqueta-producto'>
                      {producto.categoria}
                    </span>
                  </div>

                  <div className='datos-producto'>
                    <h3>{producto.nombre}</h3>
                    <p className='precio-producto'>
                      {formatoPrecio(producto.precio)}
                    </p>

                    <div className='selector-variante'>
                      <span className='etiqueta-selector'>
                        Color:{' '}
                        <strong>{colorElegido || 'Elegí un color'}</strong>
                      </span>

                      <div className='opciones-colores'>
                        {producto.colores.map(color => (
                          <button
                            key={color.nombre}
                            type='button'
                            className={`muestra-color ${
                              colorElegido === color.nombre
                                ? 'color-seleccionado'
                                : ''
                            }`}
                            style={{ backgroundColor: color.codigo }}
                            title={color.nombre}
                            aria-label={`Elegir color ${color.nombre}`}
                            aria-pressed={colorElegido === color.nombre}
                            onClick={() =>
                              setColoresElegidos(actual => ({
                                ...actual,
                                [producto.id]: color.nombre
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className='selector-variante'>
                      <span className='etiqueta-selector'>
                        Talle:{' '}
                        <strong>{talleElegido || 'Elegí un talle'}</strong>
                      </span>

                      <div className='opciones-talles'>
                        {producto.talles.map(talle => (
                          <button
                            key={talle}
                            type='button'
                            className={`opcion-talle ${
                              talleElegido === talle ? 'talle-seleccionado' : ''
                            }`}
                            aria-pressed={talleElegido === talle}
                            onClick={() =>
                              setTallesElegidos(actual => ({
                                ...actual,
                                [producto.id]: talle
                              }))
                            }
                          >
                            {talle}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className='boton-agregar'
                      type='button'
                      onClick={() => agregarAlCarrito(producto)}
                    >
                      AGREGAR AL CARRITO <span>＋</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className='catalogo-vacio'>
            <div className='icono-catalogo'>♡</div>
            <span className='etiqueta-dorada'>PRÓXIMAMENTE</span>
            <h3>Tu próxima prenda favorita te espera</h3>
            <p>
              Estamos preparando el catálogo. Pronto vas a encontrar fotos,
              talles y precios de nuestras prendas.
            </p>
            {categoriaActiva !== 'Todos los productos' && (
              <button
                className='boton-secundario'
                type='button'
                onClick={() => setCategoriaActiva('Todos los productos')}
              >
                VER TODA LA COLECCIÓN
              </button>
            )}
          </div>
        )}
      </section>

      <section className='seccion-contacto' id='contacto'>
        <span className='etiqueta-dorada'>ESTAMOS PARA VOS</span>
        <h2>¿Tenés alguna consulta?</h2>
        <p>Escribinos y te ayudamos a encontrar lo que buscás.</p>

        <div className='botones-contacto'>
          <a
            href='https://www.instagram.com/virtuosaind_/'
            target='_blank'
            rel='noopener noreferrer'
            className='boton-contacto boton-instagram'
            aria-label='Visitar nuestro Instagram'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='3' width='18' height='18' rx='5' />
              <circle cx='12' cy='12' r='4' />
              <circle cx='17.5' cy='6.5' r='0.8' fill='currentColor' />
            </svg>
            Instagram
          </a>

          <a
            href='https://wa.me/543412701052'
            target='_blank'
            rel='noopener noreferrer'
            className='boton-contacto boton-whatsapp'
            aria-label='Contactarnos por WhatsApp'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z' />
            </svg>
            WhatsApp
          </a>
        </div>
      </section>

      <footer className='pie'>
        <a className='logo logo-pie' href='#inicio'>
          VIRTUOSA <span>IND.</span>
        </a>
        <p>Vestida de fuerza y dignidad · Sin temor al futuro</p>
        <small>© 2026 VIRTUOSA IND. Todos los derechos reservados.</small>
      </footer>

      {carritoAbierto && (
        <div className='fondo-carrito' onClick={() => setCarritoAbierto(false)}>
          <aside
            className='panel-carrito'
            role='dialog'
            aria-modal='true'
            aria-labelledby='titulo-carrito'
            onClick={evento => evento.stopPropagation()}
          >
            <div className='encabezado-carrito'>
              <div>
                <span className='etiqueta-dorada'>TU SELECCIÓN</span>
                <h2 id='titulo-carrito'>Mi carrito</h2>
              </div>
              <button
                className='cerrar-panel'
                type='button'
                onClick={() => setCarritoAbierto(false)}
                aria-label='Cerrar carrito'
              >
                ✕
              </button>
            </div>

            {carrito.length === 0 ? (
              <div className='carrito-vacio'>
                <span className='icono-catalogo'>♡</span>
                <h3>Tu carrito está vacío</h3>
                <p>Las prendas que elijas van a aparecer acá.</p>
                <button
                  className='boton-principal'
                  type='button'
                  onClick={() => setCarritoAbierto(false)}
                >
                  SEGUIR EXPLORANDO
                </button>
              </div>
            ) : (
              <>
                <div className='lista-carrito'>
                  {carrito.map(item => (
                    <article
                      className='item-carrito'
                      key={`${item.producto.id}-${item.talle}-${item.color.nombre}`}
                    >
                      {item.producto.imagen ? (
                        <img
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                        />
                      ) : (
                        <div
                          className='imagen-sin-foto imagen-carrito-color'
                          style={{ backgroundColor: item.color.codigo }}
                        >
                          {item.producto.nombre}
                        </div>
                      )}

                      <div className='info-item-carrito'>
                        <h3>{item.producto.nombre}</h3>
                        <p>Talle: {item.talle}</p>
                        <p className='detalle-color-carrito'>
                          Color:
                          <span
                            className='muestra-color mini-color'
                            style={{ backgroundColor: item.color.codigo }}
                            aria-label={item.color.nombre}
                          />
                          {item.color.nombre}
                        </p>
                        <strong>
                          {formatoPrecio(item.producto.precio * item.cantidad)}
                        </strong>

                        <div className='acciones-cantidad'>
                          <div className='controles-cantidad'>
                            <button
                              type='button'
                              aria-label='Disminuir cantidad'
                              onClick={() =>
                                cambiarCantidad(
                                  item.producto.id,
                                  item.talle,
                                  item.color.nombre,
                                  -1
                                )
                              }
                            >
                              −
                            </button>

                            <span>{item.cantidad}</span>

                            <button
                              type='button'
                              aria-label='Aumentar cantidad'
                              onClick={() =>
                                cambiarCantidad(
                                  item.producto.id,
                                  item.talle,
                                  item.color.nombre,
                                  1
                                )
                              }
                            >
                              +
                            </button>
                          </div>

                          <button
                            type='button'
                            className='boton-eliminar-prenda'
                            aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                            title='Eliminar prenda'
                            onClick={() =>
                              eliminarDelCarrito(
                                item.producto.id,
                                item.talle,
                                item.color.nombre
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className='resumen-carrito'>
                  <div className='fila-total'>
                    <span>Total estimado</span>
                    <strong>{formatoPrecio(totalCarrito)}</strong>
                  </div>

                  <p>
                    El envío, la disponibilidad, y el total final se confirman
                    por WhatsApp.
                  </p>
                  <div className='consulta-carrito'>
                    <label htmlFor='consulta-cliente'>
                      ¿Tenés alguna pregunta?
                    </label>

                    <p>
                      Escribinos tu consulta sobre las prendas, los talles, los
                      colores o el retiro/envío del pedido.
                    </p>

                    <textarea
                      id='consulta-cliente'
                      value={consultaCliente}
                      onChange={evento =>
                        setConsultaCliente(evento.target.value)
                      }
                      placeholder='Escribí tu consulta acá...'
                      rows={4}
                      maxLength={1000}
                    />

                    <span className='contador-consulta'>
                      {consultaCliente.length}/1000 caracteres
                    </span>
                  </div>

                  <button
                    className='boton-principal boton-whatsapp'
                    type='button'
                    onClick={prepararPedidoWhatsApp}
                  >
                    CONTINUAR POR WHATSAPP <span>↗</span>
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
