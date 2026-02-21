import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Trash2, CheckCircle, Search, Calendar as CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function BookingManagement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: allBookings, isLoading } = useQuery({
    queryKey: ['bookings-admin'],
    queryFn: async () => base44.entities.Booking.list('-created_date'),
    initialData: [],
  });

  // Filter and search bookings
  const bookings = useMemo(() => {
    let filtered = allBookings;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.created_date);
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        
        if (dateFilter === "today") {
          return bookingDay.getTime() === today.getTime();
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return bookingDay >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return bookingDay >= monthAgo;
        }
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.customer_name?.toLowerCase().includes(term) ||
        b.customer_email?.toLowerCase().includes(term) ||
        b.service_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allBookings, statusFilter, dateFilter, searchTerm]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, booking }) => {
      await base44.entities.Booking.update(id, { status });
      
      // E-Mail an Kunden wenn bestätigt
      if (status === 'bestätigt' && booking) {
        await base44.integrations.Core.SendEmail({
          to: booking.customer_email,
          subject: "Deine Anfrage wurde bestätigt",
          body: `Hallo ${booking.customer_name},\n\nDeine Anfrage für "${booking.service_name}" wurde bestätigt.\n\nIch freue mich auf unser Treffen!\n\nHerzliche Grüsse\nRosemarie Fischlin`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-admin'] });
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      "neu": "bg-blue-100 text-blue-800",
      "kontaktiert": "bg-yellow-100 text-yellow-800",
      "bestätigt": "bg-green-100 text-green-800",
      "abgeschlossen": "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anfragen ({bookings.length})</CardTitle>
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Suche nach Name, E-Mail oder Angebot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="neu">Neu</SelectItem>
              <SelectItem value="kontaktiert">Kontaktiert</SelectItem>
              <SelectItem value="bestätigt">Bestätigt</SelectItem>
              <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Zeiträume</SelectItem>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="week">Letzte 7 Tage</SelectItem>
              <SelectItem value="month">Letzter Monat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Keine Anfragen vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Angebot</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.customer_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(booking.created_date), 'dd.MM.yyyy', { locale: de })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(booking.created_date), 'HH:mm', { locale: de })} Uhr
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.service_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <a href={`mailto:${booking.customer_email}`} className="text-blue-600 hover:underline">
                            {booking.customer_email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <a href={`tel:${booking.customer_phone}`} className="text-blue-600 hover:underline">
                            {booking.customer_phone}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {booking.preferred_time && (
                          <div className="font-semibold text-blue-700">{booking.preferred_time}</div>
                        )}
                        {booking.preferred_date && (
                          <div className="text-gray-700">Startdatum: {booking.preferred_date}</div>
                        )}
                        {booking.number_of_days && (
                          <div>{booking.number_of_days} Mal{booking.number_of_days > 1 ? 'e' : ''}</div>
                        )}
                        {booking.is_trial && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Schnuppern
                          </Badge>
                        )}
                        {booking.message && (
                          <div className="text-gray-600 mt-2 max-w-xs">
                            {booking.message}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={booking.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: booking.id, status, booking })}
                      >
                        <SelectTrigger className="w-36">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neu">Neu</SelectItem>
                          <SelectItem value="kontaktiert">Kontaktiert</SelectItem>
                          <SelectItem value="bestätigt">Bestätigt</SelectItem>
                          <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(booking.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}