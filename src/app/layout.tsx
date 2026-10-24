import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'VIRTUOSA IND | Tienda de ropa',
  description:
    'Descubrí la colección de VIRTUOSA IND y encontrá prendas que reflejen tu personalidad.'
}

export default function RootLayout ({ children }: LayoutProps<'/'>) {
  return (
    <html lang='es' className={montserrat.variable}>
      <body>{children}</body>
    </html>
  )
}
