import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Mail, Phone, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function EventBookingManagement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['event-bookings-admin'],
    queryFn: () => base44.entities.EventBooking.list('-created_date'),
    initialData: [],
  });

  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EventBooking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-bookings-admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EventBooking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-bookings-admin'] });
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      "neu": "bg-blue-100 text-blue-800",
      "bestätigt": "bg-green-100 text-green-800",
      "abgesagt": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Event-Buchungen ({filteredBookings.length})</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="neu">Neu</SelectItem>
              <SelectItem value="bestätigt">Bestätigt</SelectItem>
              <SelectItem value="abgesagt">Abgesagt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Keine Buchungen vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Teilnehmer</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.event_title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.customer_name}</div>
                    </TableCell>
                    <TableCell>
                      {booking.selected_dates?.length > 0 ? (
                        <div className="text-sm">
                          {booking.selected_dates.map((date, idx) => (
                            <div key={idx} className="mb-1">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(date), 'dd.MM.yyyy', { locale: de })}
                              </div>
                              <div className="text-xs text-gray-400">
                                {format(new Date(date), 'HH:mm', { locale: de })} Uhr
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : booking.selected_date ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(booking.selected_date), 'dd.MM.yyyy', { locale: de })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(booking.selected_date), 'HH:mm', { locale: de })} Uhr
                          </div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{booking.number_of_participants}</TableCell>
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
                      <Select
                        value={booking.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: booking.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neu">Neu</SelectItem>
                          <SelectItem value="bestätigt">Bestätigt</SelectItem>
                          <SelectItem value="abgesagt">Abgesagt</SelectItem>
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