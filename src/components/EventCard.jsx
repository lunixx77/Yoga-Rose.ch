import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, CheckCircle, ArrowRight } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function EventCard({ event }) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [participantsPerDate, setParticipantsPerDate] = useState({});
  const [globalParticipants, setGlobalParticipants] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    message: ""
  });

  const hasDates = event.dates?.length > 0;

  const { data: bookings } = useQuery({
    queryKey: ['event-bookings', event.id],
    queryFn: () => base44.entities.EventBooking.filter({ event_id: event.id }),
    initialData: [],
    enabled: !!event.bookable && (isBookingOpen || !!event.max_participants)
  });

  const buildDatesSummary = (dates, ppd) => {
    if (!dates || dates.length === 0) return "–";
    return dates
      .map(d => {
        const count = ppd?.[d] ?? 1;
        const label = format(new Date(d), 'dd.MM.yyyy, HH:mm', { locale: de }) + " Uhr";
        return `${label} (${count} ${count === 1 ? "Person" : "Personen"})`;
      })
      .join(", ");
  };

  const bookingMutation = useMutation({
    mutationFn: (data) => base44.entities.EventBooking.create({
      event_id: event.id,
      event_title: event.title,
      selected_dates: selectedDates,
      participants_per_date: hasDates ? participantsPerDate : null,
      number_of_participants: totalParticipants,
      status: "neu",
      ...data,
    }),
    onSuccess: async (_, variables) => {
      // E-Mails senden (optional – Fehler blockieren nicht)
      try {
        const { sendEventBookingNotification, sendEventBookingConfirmation } = await import("@/api/emailService");
        const emailData = {
          ...variables,
          event_title: event.title,
          number_of_participants: totalParticipants,
          dates_summary: hasDates
            ? buildDatesSummary(selectedDates, participantsPerDate)
            : `${totalParticipants} Teilnehmer`,
        };
        await Promise.allSettled([
          sendEventBookingNotification(emailData),
          sendEventBookingConfirmation(emailData),
        ]);
      } catch (_) { /* E-Mail optional */ }

      setSubmitted(true);
      setShowConfirm(false);
    },
  });

  const totalParticipants = hasDates
    ? Object.values(participantsPerDate).reduce((sum, n) => sum + (n || 1), 0)
    : globalParticipants;

  const totalPrice = event.price > 0
    ? (hasDates
        ? selectedDates.reduce((sum, d) => sum + event.price * (participantsPerDate[d] || 1), 0)
        : event.price * globalParticipants)
    : 0;

  const getBookingsForDate = (date) => {
    if (!bookings || bookings.length === 0 || !event.max_participants) return 0;
    return bookings
      .filter(booking =>
        booking.selected_dates?.some(d => isSameDay(new Date(d), new Date(date))) &&
        booking.status !== 'abgesagt'
      )
      .reduce((sum, b) => {
        if (b.participants_per_date) {
          const matchingDate = b.selected_dates?.find(d => isSameDay(new Date(d), new Date(date)));
          if (matchingDate !== undefined && b.participants_per_date[matchingDate] !== undefined) {
            return sum + (b.participants_per_date[matchingDate] || 1);
          }
        }
        return sum + (b.number_of_participants || 1);
      }, 0);
  };

  const isDateFullyBooked = (date) => {
    if (!event.max_participants) return false;
    return getBookingsForDate(date) >= event.max_participants;
  };

  const getSpotsLeft = (date) => {
    if (!event.max_participants) return null;
    return Math.max(0, event.max_participants - getBookingsForDate(date));
  };

  const toggleDate = (dateString) => {
    const isSelected = selectedDates.includes(dateString);
    if (isSelected) {
      setSelectedDates(prev => prev.filter(d => d !== dateString));
      setParticipantsPerDate(prev => {
        const next = { ...prev };
        delete next[dateString];
        return next;
      });
    } else {
      setSelectedDates(prev => [...prev, dateString]);
      setParticipantsPerDate(prev => ({ ...prev, [dateString]: 1 }));
    }
  };

  const handleReservationClick = () => {
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone) return;
    if (hasDates && selectedDates.length === 0) return;
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = () => {
    bookingMutation.mutate(formData);
  };

  const resetForm = () => {
    setSubmitted(false);
    setSelectedDates([]);
    setParticipantsPerDate({});
    setGlobalParticipants(1);
    setShowConfirm(false);
    setFormData({ customer_name: "", customer_email: "", customer_phone: "", message: "" });
  };

  const eventDates = (event.dates || []).map(d => new Date(d));
  const hasAvailableSpots = !event.max_participants || !hasDates || eventDates.some(d => getSpotsLeft(d) > 0);

  const getCategoryColor = (category) => {
    const colors = { event: "bg-blue-500", special: "bg-purple-500", news: "bg-gray-700" };
    return colors[category] || "bg-gray-700";
  };

  const getCategoryLabel = (category) => {
    const labels = { event: "Event", special: "Special Angebot", news: "Neuigkeit" };
    return labels[category] || category;
  };

  const canSubmit =
    formData.customer_name &&
    formData.customer_email &&
    formData.customer_phone &&
    (!hasDates || selectedDates.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {event.image_url && (
        <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className={`absolute top-4 left-4 ${getCategoryColor(event.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
            {getCategoryLabel(event.category)}
          </div>
        </div>
      )}
      <div className="p-6">
        {!event.image_url && (
          <div className="mb-3">
            <span className={`${getCategoryColor(event.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
              {getCategoryLabel(event.category)}
            </span>
          </div>
        )}
        <h3
          className="text-xl font-semibold text-gray-800 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setIsDetailsOpen(true)}
        >
          {event.title}
        </h3>
        <div
          className="text-gray-600 text-sm leading-relaxed mb-4 prose prose-sm max-w-none line-clamp-3 cursor-pointer"
          dangerouslySetInnerHTML={{ __html: event.content }}
          onClick={() => setIsDetailsOpen(true)}
        />

        <Button variant="ghost" size="sm" onClick={() => setIsDetailsOpen(true)} className="text-blue-600 hover:text-blue-700 px-0 mb-4">
          Mehr erfahren
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>

        {event.category !== 'news' && (event.location || hasDates || event.price || event.max_participants) && (
          <div className="space-y-2 mb-4 pt-4 border-t">
            {event.price && (
              <div className="text-lg font-bold text-gray-800">CHF {event.price.toFixed(2)} pro Person</div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
            {event.max_participants && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Max. {event.max_participants} Teilnehmer
              </div>
            )}
            {hasDates && (
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">Termine:</span>
                </div>
                <div className="ml-6 space-y-1">
                  {event.dates.slice(0, 2).map((date, index) => {
                    const spotsLeft = getSpotsLeft(date);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span>{format(new Date(date), 'dd.MM.yyyy, HH:mm', { locale: de })} Uhr</span>
                        {spotsLeft !== null && (
                          <span className={`text-xs ${spotsLeft === 0 ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                            {spotsLeft === 0 ? 'Ausgebucht' : `${spotsLeft} Plätze frei`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {event.dates.length > 2 && (
                    <div className="text-xs text-gray-500">+{event.dates.length - 2} weitere</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {event.bookable && event.category !== 'news' && (
          <Button
            className="w-full"
            onClick={() => setIsBookingOpen(true)}
            disabled={!hasAvailableSpots}
            variant={!hasAvailableSpots ? "outline" : "default"}
          >
            {hasAvailableSpots ? "Jetzt reservieren" : "Ausgebucht"}
          </Button>
        )}

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover rounded-lg" />
              )}
              <div className="flex gap-2">
                <span className={`${getCategoryColor(event.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                  {getCategoryLabel(event.category)}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: event.content }} />
              {event.category !== 'news' && (event.price || event.location || event.max_participants || hasDates) && (
                <div className="space-y-3 pt-4 border-t">
                  {event.price && (
                    <div>
                      <span className="text-sm text-gray-600">Preis:</span>
                      <div className="text-2xl font-bold text-gray-800">CHF {event.price.toFixed(2)} pro Person</div>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.max_participants && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <span>Max. {event.max_participants} Teilnehmer pro Termin</span>
                      </div>
                      {hasDates && (
                        <div className="ml-7 space-y-1 text-sm">
                          {event.dates.map((date, index) => {
                            const bookedCount = getBookingsForDate(date);
                            const spotsLeft = getSpotsLeft(date);
                            return (
                              <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600">
                                  {format(new Date(date), 'dd.MM.yyyy, HH:mm', { locale: de })} Uhr
                                </span>
                                <span className={`font-semibold ${spotsLeft === 0 ? 'text-red-600' : spotsLeft <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {bookedCount} gebucht / {spotsLeft} frei
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {hasDates && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-gray-700">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <span className="font-semibold">Termine:</span>
                      </div>
                      <div className="ml-7 space-y-2">
                        {event.dates.map((date, index) => (
                          <div key={index} className="text-gray-700">
                            {format(new Date(date), 'EEEE, dd.MM.yyyy, HH:mm', { locale: de })} Uhr
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {event.bookable && event.category !== 'news' && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => { setIsDetailsOpen(false); setIsBookingOpen(true); }}
                  disabled={!hasAvailableSpots}
                  variant={!hasAvailableSpots ? "outline" : "default"}
                >
                  {hasAvailableSpots ? "Jetzt reservieren" : "Ausgebucht"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsBookingOpen(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{submitted ? "Reservierung erhalten!" : event.title}</DialogTitle>
            </DialogHeader>

            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Vielen Dank für Deine Reservierung. Ich melde mich in Kürze bei Dir.
                </p>
                <Button onClick={() => { setIsBookingOpen(false); resetForm(); }} className="mt-4">
                  Schliessen
                </Button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Termine auswählen */}
                {hasDates ? (
                  <div>
                    <Label>Termine auswählen * (mehrere möglich)</Label>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {event.dates.map((date, index) => {
                        const dateString = date;
                        const spotsLeft = getSpotsLeft(date);
                        const isFullDate = spotsLeft === 0;
                        return (
                          <div key={index} className="flex items-start space-x-2">
                            <Checkbox
                              id={`date-${index}`}
                              checked={selectedDates.includes(dateString)}
                              onCheckedChange={() => toggleDate(dateString)}
                              disabled={isFullDate}
                            />
                            <label
                              htmlFor={`date-${index}`}
                              className={`text-sm cursor-pointer flex-1 ${isFullDate ? 'text-gray-400 line-through' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {format(new Date(date), 'EEEE, dd.MM.yyyy, HH:mm', { locale: de })} Uhr
                                </span>
                                {spotsLeft !== null && (
                                  <span className={`text-xs font-semibold ${isFullDate ? 'text-red-600' : spotsLeft <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {isFullDate ? 'Ausgebucht' : `${spotsLeft} Plätze frei`}
                                  </span>
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {/* Anzahl Teilnehmer pro Termin */}
                    {selectedDates.length > 0 && (
                      <div className="mt-4 space-y-3 border rounded-lg p-4 bg-gray-50">
                        <Label className="text-sm font-semibold">Anzahl Teilnehmer pro Termin</Label>
                        {selectedDates.map((dateString) => {
                          const spotsLeft = getSpotsLeft(dateString);
                          const count = participantsPerDate[dateString] || 1;
                          const tooMany = spotsLeft !== null && count > spotsLeft;
                          return (
                            <div key={dateString} className="flex items-center gap-3">
                              <span className="text-sm text-gray-700 flex-1">
                                {format(new Date(dateString), 'dd.MM.yyyy, HH:mm', { locale: de })} Uhr
                              </span>
                              <Input
                                type="number"
                                min="1"
                                max={spotsLeft ?? (event.max_participants || 100)}
                                value={count}
                                onChange={(e) =>
                                  setParticipantsPerDate(prev => ({
                                    ...prev,
                                    [dateString]: Math.max(1, parseInt(e.target.value) || 1)
                                  }))
                                }
                                className={`w-24 ${tooMany ? 'border-red-500' : ''}`}
                              />
                              {tooMany && (
                                <span className="text-xs text-red-600">Nur {spotsLeft} frei</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg mb-3">
                      Für dieses Event sind keine konkreten Termine festgelegt. Nach Deiner Anfrage melde ich mich bei Dir, um einen passenden Termin zu vereinbaren.
                    </div>
                    <Label htmlFor="global_participants">Anzahl Teilnehmer *</Label>
                    <Input
                      id="global_participants"
                      type="number"
                      min="1"
                      max={event.max_participants || 100}
                      value={globalParticipants}
                      onChange={(e) => setGlobalParticipants(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Kalenderansicht */}
                {hasDates && (
                  <div>
                    <Label className="mb-2 block">Kalenderansicht</Label>
                    <CalendarComponent
                      mode="multiple"
                      selected={selectedDates.map(d => new Date(d))}
                      onSelect={(dates) => {
                        if (!dates) return;
                        const validDates = Array.isArray(dates) ? dates : [dates];
                        const newSelected = validDates
                          .map(d => event.dates.find(ed => isSameDay(new Date(ed), d)))
                          .filter(Boolean);
                        // add new ones, remove deselected ones
                        const added = newSelected.filter(d => !selectedDates.includes(d));
                        const removed = selectedDates.filter(d => !newSelected.includes(d));
                        let updated = [...selectedDates];
                        let updatedPPD = { ...participantsPerDate };
                        for (const d of added) { updated.push(d); updatedPPD[d] = 1; }
                        for (const d of removed) { updated = updated.filter(x => x !== d); delete updatedPPD[d]; }
                        setSelectedDates(updated);
                        setParticipantsPerDate(updatedPPD);
                      }}
                      disabled={(date) => {
                        const hasDate = event.dates.some(d => isSameDay(new Date(d), date));
                        if (!hasDate) return true;
                        const matchingDate = event.dates.find(d => isSameDay(new Date(d), date));
                        return isDateFullyBooked(matchingDate);
                      }}
                      modifiers={{
                        eventDate: eventDates,
                        fullyBooked: eventDates.filter(d => isDateFullyBooked(d))
                      }}
                      modifiersStyles={{
                        eventDate: { fontWeight: 'bold', textDecoration: 'underline' },
                        fullyBooked: { color: '#dc2626', textDecoration: 'line-through' }
                      }}
                      className="rounded-md border"
                    />
                  </div>
                )}

                {/* Kontaktdaten */}
                <div>
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_email">E-Mail *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_phone">Telefon *</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Zwischensumme */}
                {event.price > 0 && (hasDates ? selectedDates.length > 0 : true) && (
                  <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-5">
                    <div className="space-y-2 mb-3">
                      {hasDates ? (
                        selectedDates.map(dateString => {
                          const count = participantsPerDate[dateString] || 1;
                          return (
                            <div key={dateString} className="flex justify-between text-sm text-gray-600">
                              <span>
                                {format(new Date(dateString), 'dd.MM.yyyy', { locale: de })} × {count} {count === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                              </span>
                              <span>CHF {(event.price * count).toFixed(2)}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{event.title} × {globalParticipants} Teilnehmer</span>
                          <span>CHF {(event.price * globalParticipants).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-xl border-t-2 border-gray-300 pt-3 mt-3">
                      <span>Gesamt</span>
                      <span>CHF {totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Wird vor Ort bezahlt. TWINT/BAR.</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  className="w-full rounded-md border-2 border-gray-700 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={!canSubmit}
                  onClick={handleReservationClick}
                >
                  Verbindlich reservieren
                </button>

                {hasDates && selectedDates.length === 0 && (
                  <p className="text-xs text-red-600 text-center">Bitte wähle mindestens einen Termin aus</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bestätigungs-Dialog */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reservierung bestätigen</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Event:</span> {event.title}
                  </div>

                  {hasDates && selectedDates.length > 0 && (
                    <div>
                      <span className="font-semibold">Gewählte Termine:</span>
                      <ul className="mt-1 space-y-1 ml-2">
                        {selectedDates.map(dateString => {
                          const count = participantsPerDate[dateString] || 1;
                          return (
                            <li key={dateString} className="flex justify-between">
                              <span>{format(new Date(dateString), 'EEEE, dd.MM.yyyy, HH:mm', { locale: de })} Uhr</span>
                              <span className="font-medium ml-4">{count} {count === 1 ? 'Person' : 'Personen'}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {!hasDates && (
                    <div>
                      <span className="font-semibold">Teilnehmer:</span> {globalParticipants}
                    </div>
                  )}

                  <div>
                    <span className="font-semibold">Name:</span> {formData.customer_name}
                  </div>
                  <div>
                    <span className="font-semibold">E-Mail:</span> {formData.customer_email}
                  </div>
                  <div>
                    <span className="font-semibold">Telefon:</span> {formData.customer_phone}
                  </div>

                  {event.price > 0 && (
                    <div className="border-t pt-3 mt-2">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Gesamtbetrag:</span>
                        <span>CHF {totalPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Wird vor Ort bezahlt. TWINT/BAR.</p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmedSubmit}
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? "Wird gesendet..." : "Ja, verbindlich reservieren"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
