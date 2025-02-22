import "./globals.css"
import { VendedorProvider } from "./hooks/useVendedor"
import localFont from "next/font/local"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata = {
  title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
  description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexler e Zangão.",
  icons: {
    icon: "/logo-glk.ico",
  },
  openGraph: {
    title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
    description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexler e Zangão.",
    images: [
      {
        url: "/logo-glk.ico",
        width: 800,
        height: 600,
        alt: "Logo GLK Eventos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
    description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexler e Zangão.",
    openGraph: {
      images: ["/logo-glk.png"],
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <VendedorProvider>{children}</VendedorProvider>
      </body>
    </html>
  )
}
