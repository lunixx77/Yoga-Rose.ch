import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Services() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ active: true }),
    initialData: [],
  });

  const getTypeLabel = (type) => {
    const labels = {
      "einzelstunde": "Einzelstunde",
      "gruppenkurs": "Gruppenkurs",
      "fastenkurs": "Fastenkurs"
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      "einzelstunde": "bg-blue-100 text-blue-800",
      "gruppenkurs": "bg-green-100 text-green-800",
      "fastenkurs": "bg-purple-100 text-purple-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" className="mb-4 text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <div className="border-b-2 border-gray-300 pb-3 mb-4">
            <h1 className="text-3xl font-serif text-gray-800">Meine Angebote</h1>
          </div>
          <p className="text-base text-gray-600">
            Wählen Sie aus meinen vielfältigen Angeboten für Körper, Geist und Seele
          </p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-300 p-6 bg-white">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="border border-gray-300 p-12 text-center bg-white">
            <p className="text-gray-500">
              Derzeit sind keine Angebote verfügbar. Bitte kontaktieren Sie mich direkt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="border-2 border-gray-300 p-6 bg-white hover:border-gray-400 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{service.name}</h3>
                      <Badge variant="outline" className="border-gray-400 text-gray-700">
                        {getTypeLabel(service.type)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3 text-sm">{service.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration_minutes} Min.
                      </div>
                      {service.max_participants && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Max. {service.max_participants} Teilnehmer
                        </div>
                      )}
                      {service.price && (
                        <div className="font-semibold text-gray-800">
                          CHF {service.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:ml-4">
                    <Link to={createPageUrl("Booking") + "?service_id=" + service.id}>
                      <Button variant="outline" className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100 w-full md:w-auto">
                        <Calendar className="mr-2 h-4 w-4" />
                        Buchen
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-10 border-2 border-gray-300 p-6 text-center bg-white">
          <h2 className="text-xl font-serif mb-3 text-gray-800">Haben Sie Fragen?</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Ich berate Sie gerne persönlich zu meinen Angeboten
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:0786404811">
              <Button variant="outline" className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100">
                078 640 48 11
              </Button>
            </a>
            <a href="mailto:fischlin_rosemarie@bluewin.ch">
              <Button variant="outline" className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100">
                E-Mail senden
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}