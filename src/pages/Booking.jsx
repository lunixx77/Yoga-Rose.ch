import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
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
    preferred_date: "",
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      created_date: new Date().toISOString(),
      service_id: formData.service_id || null,
      service_name: formData.service_name || null,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      number_of_days: formData.number_of_days || 1,
      number_of_participants: formData.number_of_participants || 1,
      preferred_time: formData.preferred_time || null,
      preferred_date: formData.preferred_date || null,
      is_trial: formData.is_trial || false,
      message: formData.message || null,
      status: "neu",
    };

    try {
      if (supabase) {
        const { data, error } = await supabase.from("bookings").insert(row).select();
        if (error) {
          if (error.message?.includes("preferred_date") || error.message?.includes("number_of_participants")) {
            delete row.preferred_date;
            delete row.number_of_participants;
            const { error: retry } = await supabase.from("bookings").insert(row).select();
            if (retry) throw new Error(retry.message);
          } else {
            throw new Error(error.message);
          }
        }
      } else {
        await base44.entities.Booking.create(row);
      }

      try {
        const { sendBookingNotification, sendBookingConfirmation } = await import("@/api/emailService");
        await Promise.allSettled([
          sendBookingNotification(formData),
          sendBookingConfirmation(formData),
        ]);
      } catch (_) { /* email is optional */ }

      setSubmitted(true);
    } catch (err) {
      console.error("Anfrage fehlgeschlagen:", err);
      setSubmitError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
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
              Vielen Dank für Deine Anfrage. Ich melde mich in Kürze bei Dir.
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
            Fülle das Formular aus und ich melde mich bei Dir
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
                  <SelectValue placeholder="Wähle ein Angebot" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} {service.price ? `– CHF ${service.price} pro Person` : ''}
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
                  placeholder="Dein vollständiger Name"
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

            {selectedService?.show_days && (
              <div>
                <Label htmlFor="number_of_days">Anzahl Male *</Label>
                <Input
                  id="number_of_days"
                  type="number"
                  min="1"
                  required
                  value={formData.number_of_days}
                  onChange={(e) => handleChange('number_of_days', parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="preferred_time">Bevorzugte Zeit *</Label>
              {fixedTimesType === "hatha" ? (
                <Select
                  value={formData.preferred_time}
                  onValueChange={(value) => handleChange('preferred_time', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Zeit (Hatha Yoga)" />
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
                    <SelectValue placeholder="Wähle eine Zeit (Schwangerschaftsyoga)" />
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
                    <SelectValue placeholder="Wähle eine Zeit (Yoganidra)" />
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

            <div>
              <Label htmlFor="preferred_date">Gewünschtes Startdatum</Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => handleChange('preferred_date', e.target.value)}
              />
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
                placeholder="Teile mir Deine Wünsche und Fragen mit..."
                rows={5}
              />
            </div>

            {selectedService?.price > 0 && (
              <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-5">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>
                    {selectedService.name}
                    {selectedService.show_days && (formData.number_of_days || 1) > 1
                      ? ` \u00d7 ${formData.number_of_days} Male`
                      : ""}
                  </span>
                  <span>CHF {selectedService.price.toFixed(2)} pro Mal</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-xl border-t-2 border-gray-300 pt-3 mt-3">
                  <span>Preis</span>
                  <span>
                    {selectedService.show_days
                      ? `CHF ${(selectedService.price * (formData.number_of_days || 1)).toFixed(2)}`
                      : `CHF ${selectedService.price.toFixed(2)} pro Mal`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Die Preise werden pro Quartal abgerechnet.</p>
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 text-red-700 text-sm">
                <strong>Fehler:</strong> {submitError}
              </div>
            )}

            <div className="pt-4">
              <Button 
                type="submit" 
                variant="outline"
                className="w-full border-2 border-gray-700 text-gray-700 hover:bg-gray-100"
                disabled={submitting}
              >
                {submitting ? (
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