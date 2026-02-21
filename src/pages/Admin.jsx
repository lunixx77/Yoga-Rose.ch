import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Star, FileText, Calendar, LayoutTemplate, Database, AlertCircle } from "lucide-react";
import { useSupabase } from "@/api/supabaseClient";
import ServiceManagement from "@/components/admin/ServiceManagement";
import BookingManagement from "@/components/admin/BookingManagement";
import ReviewManagement from "@/components/admin/ReviewManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import EventBookingManagement from "@/components/admin/EventBookingManagement";
import HomeDesignManagement from "@/components/admin/HomeDesignManagement";

export default function Admin() {
  const useDb = useSupabase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Verwaltung</h1>
          <p className="text-gray-600">Verwalte Deine Angebote und Anfragen</p>

          {useDb ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <Database className="h-5 w-5 shrink-0" />
              <span><strong>Datenbank verbunden.</strong> Alle Änderungen werden gespeichert und sind für jeden Nutzer sichtbar.</span>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span><strong>Keine Datenbank verbunden.</strong> Änderungen werden nur lokal in diesem Browser gespeichert und sind nicht für andere Nutzer sichtbar. Siehe <code className="rounded bg-amber-100 px-1">supabase/README.md</code> zum Einrichten.</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Anfragen
            </TabsTrigger>
            <TabsTrigger value="event-bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Bewertungen
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Angebote
            </TabsTrigger>
            <TabsTrigger value="home-design" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Startseite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="event-bookings">
            <EventBookingManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="home-design">
            <HomeDesignManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}