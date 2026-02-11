import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    number_of_participants: 1,
    message: ""
  });

  const { data: bookings } = useQuery({
    queryKey: ['event-bookings', event.id],
    queryFn: () => base44.entities.EventBooking.filter({ event_id: event.id }),
    initialData: [],
    enabled: !!event.bookable && (isBookingOpen || !!event.max_participants)
  });

  const bookingMutation = useMutation({
    mutationFn: (data) => base44.entities.EventBooking.create({
      event_id: event.id,
      event_title: event.title,
      selected_dates: selectedDates,
      ...data,
      number_of_participants: parseInt(data.number_of_participants)
    }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    bookingMutation.mutate(formData);
  };

  const toggleDateSelection = (date) => {
    const dateString = date.toISOString();
    setSelectedDates(prev => 
      prev.includes(dateString) 
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString]
    );
  };

  const getBookingsForDate = (date) => {
    if (!bookings || bookings.length === 0 || !event.max_participants) return 0;
    return bookings.filter(booking => 
      booking.selected_dates?.some(d => isSameDay(new Date(d), new Date(date))) &&
      booking.status !== 'abgesagt'
    ).reduce((sum, b) => sum + (b.number_of_participants || 1), 0);
  };

  const isDateFullyBooked = (date) => {
    if (!event.max_participants) return false;
    const bookedCount = getBookingsForDate(date);
    return bookedCount >= event.max_participants;
  };

  const getSpotsLeft = (date) => {
    if (!event.max_participants) return null;
    const bookedCount = getBookingsForDate(date);
    return Math.max(0, event.max_participants - bookedCount);
  };

  const eventDates = (event.dates || []).map(d => new Date(d));
  const hasAvailableSpots = !event.max_participants || !event.dates || event.dates.length === 0 || eventDates.some(d => getSpotsLeft(d) > 0);

  const getCategoryColor = (category) => {
    const colors = {
      event: "bg-blue-500",
      special: "bg-purple-500",
      news: "bg-gray-700"
    };
    return colors[category] || "bg-gray-700";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      event: "Event",
      special: "Special Angebot",
      news: "Neuigkeit"
    };
    return labels[category] || category;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {event.image_url && (
        <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
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
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsDetailsOpen(true)}
          className="text-blue-600 hover:text-blue-700 px-0 mb-4"
        >
          Mehr erfahren
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>

        {event.category !== 'news' && (event.location || event.dates?.length > 0 || event.price || event.max_participants) && (
          <div className="space-y-2 mb-4 pt-4 border-t">
            {event.price && (
              <div className="text-lg font-bold text-gray-800">
                CHF {event.price.toFixed(2)}
              </div>
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
            {event.dates?.length > 0 && (
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
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div className="flex gap-2">
                <span className={`${getCategoryColor(event.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                  {getCategoryLabel(event.category)}
                </span>
              </div>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
              {event.category !== 'news' && (event.price || event.location || event.max_participants || event.dates?.length > 0) && (
                <div className="space-y-3 pt-4 border-t">
                  {event.price && (
                    <div>
                      <span className="text-sm text-gray-600">Preis:</span>
                      <div className="text-2xl font-bold text-gray-800">CHF {event.price.toFixed(2)}</div>
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
                      {event.dates?.length > 0 && (
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
                  {event.dates?.length > 0 && (
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
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setIsBookingOpen(true);
                  }}
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
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {submitted ? "Reservierung erhalten!" : event.title}
              </DialogTitle>
            </DialogHeader>
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Vielen Dank für Ihre Reservierung. Wir melden uns in Kürze bei Ihnen.
                </p>
                <Button 
                  onClick={() => {
                    setIsBookingOpen(false);
                    setSubmitted(false);
                    setSelectedDates([]);
                    setFormData({
                      customer_name: "",
                      customer_email: "",
                      customer_phone: "",
                      number_of_participants: 1,
                      message: ""
                    });
                  }}
                  className="mt-4"
                >
                  Schliessen
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {event.dates?.length > 0 ? (
                  <div>
                    <Label>Termine auswählen * (mehrere möglich)</Label>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {event.dates.map((date, index) => {
                        const dateObj = new Date(date);
                        const dateString = date;
                        const spotsLeft = getSpotsLeft(date);
                        const isFullDate = spotsLeft === 0;
                        const canSelectMore = !isFullDate && (!event.max_participants || spotsLeft >= parseInt(formData.number_of_participants));
                        
                        return (
                          <div key={index} className="flex items-start space-x-2">
                            <Checkbox
                              id={`date-${index}`}
                              checked={selectedDates.includes(dateString)}
                              onCheckedChange={() => {
                                setSelectedDates(prev => 
                                  prev.includes(dateString) 
                                    ? prev.filter(d => d !== dateString)
                                    : [...prev, dateString]
                                );
                              }}
                              disabled={isFullDate}
                            />
                            <label
                              htmlFor={`date-${index}`}
                              className={`text-sm cursor-pointer flex-1 ${isFullDate ? 'text-gray-400 line-through' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {format(dateObj, 'EEEE, dd.MM.yyyy, HH:mm', { locale: de })} Uhr
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
                    {selectedDates.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        {selectedDates.length} Termin{selectedDates.length > 1 ? 'e' : ''} ausgewählt
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    Für dieses Event sind keine konkreten Termine festgelegt. Nach Ihrer Anfrage werden wir uns mit Ihnen in Verbindung setzen, um einen passenden Termin zu vereinbaren.
                  </div>
                )}

                {event.dates?.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Kalenderansicht</Label>
                    <CalendarComponent
                      mode="multiple"
                      selected={selectedDates.map(d => new Date(d))}
                      onSelect={(dates) => {
                        if (dates) {
                          const validDates = Array.isArray(dates) ? dates : [dates];
                          const filtered = validDates.filter(d => 
                            event.dates.some(ed => isSameDay(new Date(ed), d)) &&
                            !isDateFullyBooked(event.dates.find(ed => isSameDay(new Date(ed), d)))
                          );
                          setSelectedDates(filtered.map(d => {
                            const matchingEventDate = event.dates.find(ed => isSameDay(new Date(ed), d));
                            return matchingEventDate || d.toISOString();
                          }));
                        }
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
                  <Label htmlFor="number_of_participants">Anzahl Teilnehmer *</Label>
                  <Input
                    id="number_of_participants"
                    type="number"
                    min="1"
                    max={event.max_participants || 100}
                    value={formData.number_of_participants}
                    onChange={(e) => setFormData({ ...formData, number_of_participants: e.target.value })}
                    required
                  />
                  {event.max_participants && (
                    <p className="text-xs text-gray-500 mt-1">
                      Bitte beachten: Pro Termin maximal {event.max_participants} Teilnehmer möglich
                    </p>
                  )}
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={bookingMutation.isPending || (event.dates?.length > 0 && selectedDates.length === 0)}
                >
                  {bookingMutation.isPending ? "Wird gesendet..." : "Verbindlich reservieren"}
                </Button>
                {event.dates?.length > 0 && selectedDates.length === 0 && (
                  <p className="text-xs text-red-600 text-center">
                    Bitte wählen Sie mindestens einen Termin aus
                  </p>
                )}
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}