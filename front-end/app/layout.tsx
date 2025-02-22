import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

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

export const metadata: Metadata = {
  title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
  description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexler e Zangão.",
  icons: {
    icon: "/logo-glk.ico", // Favicon
  },
  openGraph: {
    title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
    description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexler e Zangão.",
    images: [
      {
        url: "/logo-glk.ico", // Usando a mesma imagem do favicon
        width: 800,
        height: 600,
        alt: "Logo GLK Eventos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clube Atlético Piracicabano - Evento Anos 70/80/90/2000",
    description: "Evento no Clube Atlético Piracicabano com DJs Guto Loureiro, Paulo Oexer e Zangão.",
    images: ["/logo-glk.ico"], // Usando a mesma imagem do favicon
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}

