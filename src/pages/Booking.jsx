import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

export default function Booking() {
  const [formData, setFormData] = useState({
    service_id: "",
    service_name: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    number_of_days: 1,
    number_of_participants: 1,
    preferred_time: "",
    is_trial: false,
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ active: true }),
    initialData: [],
  });

  // Get service from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('service_id');
    if (serviceId && services) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setFormData(prev => ({
          ...prev,
          service_id: service.id,
          service_name: service.name
        }));
      }
    }
  }, [services]);

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const booking = await base44.entities.Booking.create(data);
      
      // E-Mail an Betreiber
      await base44.integrations.Core.SendEmail({
        to: "rosemarie.fischlin@example.com",
        subject: "Neue Anfrage erhalten",
        body: `Neue Anfrage von ${data.customer_name}\n\nAngebot: ${data.service_name}\nE-Mail: ${data.customer_email}\nTelefon: ${data.customer_phone}\n${data.preferred_time ? `Bevorzugte Zeit: ${data.preferred_time}\n` : ''}${data.number_of_days ? `Tage: ${data.number_of_days}\n` : ''}${data.number_of_participants ? `Teilnehmer: ${data.number_of_participants}\n` : ''}${data.is_trial ? 'Schnupperstunde: Ja\n' : ''}${data.message ? `\nNachricht:\n${data.message}` : ''}`
      });
      
      return booking;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRequestMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      service_name: service?.name || "",
      preferred_time: ""
    }));
  };

  const selectedService = services?.find(s => s.id === formData.service_id);
  const fixedTimesType = selectedService?.fixed_times_type ?? (selectedService?.use_fixed_times ? "hatha" : "");
  const useFixedTimes = fixedTimesType === "hatha" || fixedTimesType === "schwangerschaftsyoga" || fixedTimesType === "yoganidra";

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full border-2 border-gray-300 bg-white">
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-700 mb-4">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Anfrage erhalten</h1>
            <p className="text-gray-600 text-sm mb-8">
              Vielen Dank für Ihre Anfrage. Ich melde mich in Kürze bei Ihnen.
            </p>
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100">
                Zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" className="mb-4 text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <div className="border-b-2 border-gray-300 pb-3 mb-4">
            <h1 className="text-3xl font-serif text-gray-800">Anfrage senden</h1>
          </div>
          <p className="text-base text-gray-600">
            Füllen Sie das Formular aus und ich melde mich bei Ihnen
          </p>
        </div>

        <div className="border-2 border-gray-300 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="service_id">Angebot *</Label>
              <Select 
                value={formData.service_id} 
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie ein Angebot" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} {service.price ? `- CHF ${service.price}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customer_name">Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  required
                  placeholder="Ihr vollständiger Name"
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Telefon *</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange('customer_phone', e.target.value)}
                  required
                  placeholder="079 123 45 67"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_email">E-Mail *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleChange('customer_email', e.target.value)}
                required
                placeholder="ihre.email@beispiel.ch"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="number_of_days">Anzahl Tage</Label>
                <Input
                  id="number_of_days"
                  type="number"
                  min="1"
                  value={formData.number_of_days}
                  onChange={(e) => handleChange('number_of_days', parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="number_of_participants">Anzahl Teilnehmer</Label>
                <Input
                  id="number_of_participants"
                  type="number"
                  min="1"
                  value={formData.number_of_participants}
                  onChange={(e) => handleChange('number_of_participants', parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferred_time">Bevorzugte Zeit *</Label>
              {fixedTimesType === "hatha" ? (
                <Select
                  value={formData.preferred_time}
                  onValueChange={(value) => handleChange('preferred_time', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Zeit (Hatha Yoga)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Montag 08:15 - 09:30 Uhr">Montag 08:15 – 09:30 Uhr</SelectItem>
                    <SelectItem value="Montag 18:30 - 19:45 Uhr">Montag 18:30 – 19:45 Uhr</SelectItem>
                    <SelectItem value="Montag 20:00 - 21:15 Uhr">Montag 20:00 – 21:15 Uhr</SelectItem>
                    <SelectItem value="Mittwoch 12:00 - 13:15 Uhr">Mittwoch 12:00 – 13:15 Uhr</SelectItem>
                    <SelectItem value="Donnerstag 10:00 - 11:15 Uhr">Donnerstag 10:00 – 11:15 Uhr</SelectItem>
                  </SelectContent>
                </Select>
              ) : fixedTimesType === "schwangerschaftsyoga" ? (
                <Select
                  value={formData.preferred_time}
                  onValueChange={(value) => handleChange('preferred_time', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Zeit (Schwangerschaftsyoga)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Donnerstag 17:30 - 18:15 Uhr">Donnerstag 17:30 – 18:15 Uhr</SelectItem>
                  </SelectContent>
                </Select>
              ) : fixedTimesType === "yoganidra" ? (
                <Select
                  value={formData.preferred_time}
                  onValueChange={(value) => handleChange('preferred_time', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Zeit (Yoganidra)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Donnerstag 19:00 - 20:15 Uhr">Donnerstag 19:00 – 20:15 Uhr</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="preferred_time"
                  value={formData.preferred_time}
                  onChange={(e) => handleChange('preferred_time', e.target.value)}
                  required
                  placeholder="z. B. Dienstag Vormittag, oder 15. März 10 Uhr"
                />
              )}
              {!formData.service_id && (
                <p className="text-xs text-gray-500 mt-1">Bitte zuerst ein Angebot wählen. Bei „Normale Zeiten“ erscheinen die Lektionsplan-Zeiten.</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_trial"
                checked={formData.is_trial}
                onCheckedChange={(checked) => handleChange('is_trial', checked)}
              />
              <Label htmlFor="is_trial" className="cursor-pointer">
                Ich möchte schnuppern
              </Label>
            </div>

            <div>
              <Label htmlFor="message">Nachricht / Wünsche</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Teilen Sie mir Ihre Wünsche und Fragen mit..."
                rows={5}
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                variant="outline"
                className="w-full border-2 border-gray-700 text-gray-700 hover:bg-gray-100"
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  "Wird gesendet..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Anfrage senden
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}