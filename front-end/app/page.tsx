"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Heart, Home, MapPin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Background } from "@/components/background"
import { TicketSidebar } from "@/components/ticket-sidebar"

const EventDetails = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-gray-300">
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span>{children}</span>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-4 text-xl font-bold sm:text-2xl">{children}</h2>
)

export default function EventPage() {
  const scrollToTickets = () => {
    const ticketSection = document.getElementById("ticket-section")
    if (ticketSection) {
      const offset = 80 // Adjust this value to fine-tune the scroll position
      const elementPosition = ticketSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="min-h-screen text-white">
      <Background />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-gradient-to-r from-black-900/50 via-black/50 to-black/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold sm:text-2xl">
              GLK Eventos
            </Link>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                className="rounded-full bg-white text-black hover:bg-white/90"
                onClick={scrollToTickets}
              >
                Comprar convite
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-yellow-500/20" />
        <div className="container relative mx-auto px-4 py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                REMEMBER ANOS 70/80/90/2000
              </h1>
              <EventDetails icon={CalendarDays}>sábado, 12 de Abril às 21:00</EventDetails>
              <EventDetails icon={MapPin}>Av. Brasil, 571 - Vila Rezende, Piracicaba - SP</EventDetails>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full" onClick={scrollToTickets}>
                  Convites a partir de R$25,00
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white text-black hover:bg-white/90"
                  onClick={scrollToTickets}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  TENHO INTERESSE
                </Button>
              </div>
              <p className="text-sm text-gray-400">312 têm interesse</p>
            </div>
            <div
              className="relative w-full h-full overflow-hidden rounded-lg mx-auto"
              style={{ aspectRatio: "1080 / 1350", maxWidth: "500px" }}
            >
              <Image
                src="/remember.png"
                alt="Remember Anos 70/80/90/2000"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Secure Ticket Section */}
            <Card className="bg-black/40 border-white/10 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="text-yellow-400 text-2xl">🎟️</div>
                <div>
                  <h2 className="text-lg font-bold mb-2 text-white">Garanta seu convite agora! convites limitados.</h2>
                  <p className="text-gray-400 text-sm">
                    Não perca essa oportunidade única! Adquira já seu convite para o evento exclusivo. Corra, os convite
                    são limitados!
                  </p>
                </div>
              </div>
            </Card>

            {/* Description Section */}
            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Descrição</SectionTitle>
              <p className="text-gray-300">Uma noite especial com o melhor das décadas de 70, 80, 90 e 2000!</p>
            </section>

            {/* Lineup Section */}
            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Line-up</SectionTitle>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { name: "DJ Guto Loureiro", location: "Atração nacional", image: "/dj-guto-loureiro.png" },
                  { name: "DJ Paulo Oexler", location: "Santa Catarina", image: "/dj-paulo-oexer.png" },
                  { name: "DJ Zangão", location: "Rio das Pedras", image: "/dj-zangao.png" },
                ].map((dj) => (
                  <div key={dj.name} className="space-y-2">
                    <div className="aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={dj.image || "/placeholder.png"}
                        alt={dj.name}
                        width={200}
                        height={200}
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        layout="intrinsic"
                      />
                    </div>
                    <p className="text-sm text-gray-300">{dj.name}</p>
                    <p className="text-xs text-gray-400">{dj.location}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Organizer Section */}
            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Organizado Por</SectionTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src="/logo-glk.png"
                    alt="Logo GLK Eventos"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold">GLK Eventos</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:contato@grupoglk.com.br" className="hover:text-white">
                        contato@grupoglk.com.br
                      </a>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-white text-black hover:bg-white/90"
                  asChild
                >
                  <Link
                    href="https://www.facebook.com/profile.php?id=61573071087463"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    SEGUIR
                  </Link>
                </Button>
              </div>
            </section>

            {/* Mood Section */}
            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Estilos</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {["HOUSE", "BLACK", "CHARME", "EURODANCE", "ANOS 70", "ANOS 80", "ANOS 90", "ANOS 2000"].map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </section>

            {/* Location Section */}
            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Localização</SectionTitle>
              <div className="space-y-4">
                <EventDetails icon={Home}>
                  <a
                    href="https://www.google.com/maps/place/Clube+Atl%C3%A9tico+Piracicabano/@-22.6931677,-47.6617896,20z/data=!4m14!1m7!3m6!1s0x94c633c18cd12d27:0x4978fe04860cf59!2sClube+Atl%C3%A9tico+Piracicabano!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7!3m5!1s0x94c633c18cd12d27:0x4978fe04860cf59!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoJLDEwMjExMjM0SAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    Clube Atlético Piracicabano
                  </a>
                </EventDetails>
                <EventDetails icon={MapPin}>
                  <a
                    href="https://www.google.com/maps/place/Clube+Atl%C3%A9tico+Piracicabano/@-22.6931677,-47.6617896,20z/data=!4m14!1m7!3m6!1s0x94c633c18cd12d27:0x4978fe04860cf59!2sClube+Atl%C3%A9tico+Piracicabano!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7!3m5!1s0x94c633c18cd12d27:0x4978fe04860cf59!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoJLDEwMjExMjM0SAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    Av. Brasil, 571 - Vila Rezende, Piracicaba - SP, 13414-220
                  </a>
                </EventDetails>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
                  <a
                    href="https://www.google.com/maps/place/Clube+Atl%C3%A9tico+Piracicabano/@-22.6931677,-47.6617896,20z/data=!4m14!1m7!3m6!1s0x94c633c18cd12d27:0x4978fe04860cf59!2sClube+Atl%C3%A9tico+Piracicabano!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7!3m5!1s0x94c633c18cd12d27:0x4978fe04860cf59!8m2!3d-22.6930983!4d-47.6617754!16s%2Fg%2F1tj2d2z7?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoJLDEwMjExMjM0SAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src="/google-maps.png"
                      alt="Google Maps"
                      width={1272}
                      height={717}
                      className="object-cover"
                    />
                  </a>
                </div>
              </div>
            </section>

            <section className="bg-black/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
              <SectionTitle>Tipos de Convites</SectionTitle>
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-black/40 border-white/10 p-4 backdrop-blur-sm">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-yellow-400">🎫</span>
                      Convite Unitário
                    </h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Entrada individual para uma pessoa</li>
                      <li>• Opção de adquirir mesa e estacionamento (sujeito a disponibilidade)</li>
                    </ul>
                  </div>
                </Card>

                <Card className="bg-black/40 border-white/10 p-4 backdrop-blur-sm">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-yellow-400">🎫🎫</span>
                      Convite Casal
                    </h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Entrada para duas pessoas</li>
                      <li>• Desconto em relação a dois convites unitários</li>
                      <li>• Opção de adquirir mesa e estacionamento (sujeito a disponibilidade)</li>
                    </ul>
                  </div>
                </Card>

                <Card className="bg-black/40 border-white/10 p-4 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 text-xs font-bold">
                    PREMIUM
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-yellow-400">⭐</span>
                      Convite Camarote
                    </h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Entrada para quatro pessoas</li>
                      <li>• Mesa exclusiva inclusa em área privilegiada</li>
                      <li>• Localização premium com melhor visão do evento</li>
                      <li>• Opção de adquirir estacionamento (sujeito a disponibilidade)</li>{" "}
                    </ul>
                  </div>
                </Card>
              </div>
            </section>
          </div>

          {/* Ticket Sidebar */}
          <div id="ticket-section">
            <TicketSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

