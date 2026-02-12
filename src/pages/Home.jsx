import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Heart, Sparkles, Phone, Mail, MapPin, Star, BadgeCheck } from "lucide-react";
import EventCard from "@/components/EventCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#C5A572] via-[#B8956A] to-[#A88759] text-white py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="text-lg md:text-xl text-gray-200 mb-1">Yogaschule</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Rosemarie Fischlin</h1>
            <p className="text-base text-gray-200 mb-1">dipl. Yogalehrerin / Yogatherapeutin SYV</p>
            <p className="text-base text-gray-200 mb-1">Ausbildnerin FA</p>
            <p className="text-sm text-gray-300">Mitglied schweizerischer Yoga-Verband</p>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg leading-relaxed mb-8 text-gray-200">
              Willkommen in meiner Yoga-Praxis.
              Mit jahrelanger Erfahrung begleite ich Sie auf Ihrem Weg zu mehr Balance,
              Gesundheit und innerer Ruhe.
            </p>
            <Link to={createPageUrl("Booking")}>
              <Button size="lg" className="bg-white text-slate-700 hover:bg-gray-100 shadow-xl text-lg px-8 py-6">
                <Sparkles className="mr-2 h-5 w-5" />
                Tauche in die Yoga Welt ein
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <YogaGallery />

      {/* Konfigurierbare Karten von der Startseite (Admin → Startseite) */}
      <HomeCardsSection />

      {/* Blog Section - Events & Specials */}
      <BlogSection />

      {/* Reviews Section - Prominently placed */}
      <ReviewsSection />

      {/* Lektionsplan – angepasst an Flyer */}
      <div className="py-16 px-6 bg-[#f5f0e8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-stone-800 mb-8">Lektionsplan</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-lg font-semibold text-stone-700 mb-4">Regelmässige Kurse</h3>
              <ul className="space-y-3 text-stone-700">
                <li><span className="font-medium">Montag</span></li>
                <li className="pl-4">08:15 – 09:30 Uhr  Hatha Yoga</li>
                <li className="pl-4">18:30 – 19:45 Uhr  Hatha Yoga</li>
                <li className="pl-4">20:00 – 21:15 Uhr  Hatha Yoga</li>
                <li className="pt-2"><span className="font-medium">Donnerstag</span></li>
                <li className="pl-4">10:00 – 11:15 Uhr  Hatha Yoga</li>
                <li className="pl-4">19:30 – 20:45 Uhr  Hatha Yoga</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-700 mb-4">auf Anfrage:</h3>
              <ul className="space-y-2 text-stone-700">
                <li>Einzelstunden / Yoga zu Zweit</li>
                <li>Yogatherapie</li>
                <li>Yoga-Workshops</li>
                <li>Seminare / Schwangerschaftsyoga</li>
                <li>Yoga mit Kindern</li>
              </ul>
              <p className="mt-6 text-stone-600 text-sm italic">
                Deinen Möglichkeiten angepasster Unterricht in kleinen Gruppen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section – Flyer: Gemüsemarkt 5, Anmeldung und Auskunft */}
      <div className="bg-stone-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-10 text-stone-800">Kontakt & Anfahrt</h2>
          <p className="text-center text-stone-600 mb-8">Anmeldung und Auskunft:</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-stone-700" />
              </div>
              <h3 className="font-semibold mb-3 text-stone-800">Adresse</h3>
              <p className="text-stone-600 text-sm">Gemüsemarkt 5</p>
              <p className="text-stone-600 text-sm">9450 Altstätten</p>
              <p className="text-stone-600 text-sm">Schweiz</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-stone-700" />
              </div>
              <h3 className="font-semibold mb-3 text-stone-800">Telefon</h3>
              <a href="tel:0786404811" className="text-stone-700 hover:text-stone-900 font-medium">
                078 640 48 11
              </a>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-stone-700" />
              </div>
              <h3 className="font-semibold mb-3 text-stone-800">E-Mail</h3>
              <a href="mailto:fischlin_rosemarie@bluewin.ch" className="text-stone-700 hover:text-stone-900 break-all text-sm font-medium">
                fischlin_rosemarie@bluewin.ch
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#C5A572] to-[#A88759] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">Bereit für Ihre Yoga-Reise?</h2>
          <p className="text-lg text-gray-200 mb-8">Ich freue mich darauf, Sie persönlich kennenzulernen</p>
          <Link to={createPageUrl("Booking")}>
            <Button size="lg" className="bg-white text-slate-700 hover:bg-gray-100 shadow-xl text-lg px-8 py-6">
              <Calendar className="mr-2 h-5 w-5" />
              Jetzt Termin vereinbaren
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BlogSection() {
  const { data: posts } = useQuery({
    queryKey: ['blog-posts-home'],
    queryFn: () => base44.entities.BlogPost.filter({ published: true }, '-created_date', 6),
    initialData: [],
  });

  if (posts.length === 0) return null;

  return (
    <div className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-gray-800 mb-3">Aktuelle Events, Specials & Neuigkeiten</h2>
          <p className="text-gray-600">Entdecken Sie unsere neuesten Angebote, Veranstaltungen und Nachrichten</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <EventCard key={post.id} event={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

function YogaGallery() {
  const images = [
    { url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", alt: "Yoga Meditation" },
    { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80", alt: "Yoga Pose" },
    { url: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80", alt: "Yoga Studio" },
    { url: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80", alt: "Yoga Gruppe" }
  ];

  return (
    <div className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-gray-800 mb-3">Einblicke in die Yoga Welt</h2>
          <p className="text-gray-600">Erleben Sie die Atmosphäre und Energie meiner Yoga-Praxis</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className={`relative overflow-hidden rounded-lg shadow-lg group ${index === 0 ? 'md:col-span-2' : ''}`}
            >
              <img 
                src={image.url} 
                alt={image.alt}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${index === 0 ? 'h-96' : 'h-64'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeCardsSection() {
  const { data: cards } = useQuery({
    queryKey: ["home-cards-public"],
    queryFn: () => base44.entities.HomeCard.list(),
    initialData: [],
  });

  const visibleCards = cards
    .filter((c) => c.visible)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  if (visibleCards.length === 0) return null;

  const resolvePageUrl = (page) => {
    const target = page || "Booking";
    return createPageUrl(target);
  };

  return (
    <div className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-gray-800 mb-3">Meine Angebote</h2>
          <p className="text-gray-600">
            Entdecken Sie die Vielfalt meiner Yoga- und Heilangebote
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {visibleCards.map((card) => (
            <div
              key={card.id}
              className={`bg-gradient-to-br ${card.bg_color || "from-purple-50 to-purple-100"} rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {card.title}
              </h3>
              {card.description && (
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {card.description}
                </p>
              )}
              <Link to={resolvePageUrl(card.cta_page)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-700 hover:bg-white"
                >
                  {card.cta_label || "Anfragen"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsSection() {
  const { data: reviews } = useQuery({
    queryKey: ['reviews-home'],
    queryFn: () => base44.entities.Review.filter({ approved: true }, '-created_date', 6),
    initialData: [],
  });
  const { data: services = [] } = useQuery({
    queryKey: ['services-home'],
    queryFn: () => base44.entities.Service.filter({ active: true }),
    initialData: [],
  });

  if (reviews.length === 0) return null;

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-gray-800 mb-3">Das sagen meine Kunden</h2>
          <p className="text-gray-600 mb-8">Erfahrungen und Bewertungen von zufriedenen Yogis</p>
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg">
            <div>
              <div className="text-4xl font-bold text-gray-800">{averageRating}</div>
              <div className="text-xs text-gray-500">von 5.0</div>
            </div>
            <div className="border-l border-gray-200 pl-4">
              {renderStars(Math.round(parseFloat(averageRating)))}
              <div className="text-xs text-gray-500 mt-1">{reviews.length} Bewertungen</div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="mb-4">
                {renderStars(review.rating)}
              </div>
              {review.comment && (
                <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-4 italic">
                  "{review.comment}"
                </p>
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800">{review.customer_name}</span>
                    {review.verified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" title="Verifizierter Kunde" />
                    )}
                  </div>
                  {review.verified && (
                    <div className="text-xs text-gray-500">Verifizierter Kunde</div>
                  )}
                  {review.service_ids?.length > 0 && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      {review.service_ids
                        .map((id) => services.find((s) => s.id === id)?.name ?? id)
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to={createPageUrl("Reviews")}>
            <Button size="lg" variant="outline" className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100">
              Alle {reviews.length} Bewertungen ansehen
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}