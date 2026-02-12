import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function ReviewManagement() {
  const queryClient = useQueryClient();

  const { data: reviews } = useQuery({
    queryKey: ['reviews-admin'],
    queryFn: () => base44.entities.Review.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, approved, verified }) =>
      base44.entities.Review.update(id, { ...(approved !== undefined && { approved }), ...(verified !== undefined && { verified }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews-admin'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-public'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-home'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews-admin'] });
    },
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const { data: services = [] } = useQuery({
    queryKey: ['services-admin-names'],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const getCourseNames = (serviceIds) => {
    if (!serviceIds?.length) return "–";
    return serviceIds
      .map((id) => services.find((s) => s.id === id)?.name ?? id)
      .filter(Boolean)
      .join(", ");
  };

  const pendingReviews = reviews.filter(r => !r.approved);
  const approvedReviews = reviews.filter(r => r.approved);

  return (
    <div className="space-y-6">
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ausstehende Bewertungen ({pendingReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kurse</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bewertung</TableHead>
                    <TableHead>Kommentar</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium">{review.customer_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[140px] text-xs text-gray-600">
                          {getCourseNames(review.service_ids)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(review.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm text-gray-600">
                          {review.comment || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateMutation.mutate({ id: review.id, approved: true })}
                            title="Freigeben"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(review.id)}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Freigegebene Bewertungen ({approvedReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Keine freigegebenen Bewertungen vorhanden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Verifiziert</TableHead>
                    <TableHead>Kurse</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bewertung</TableHead>
                    <TableHead>Kommentar</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium">{review.customer_name}</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateMutation.mutate({ id: review.id, verified: !review.verified })}
                          title={review.verified ? "Blauen Haken entfernen" : "Blauen Haken vergeben (Verifizierter Kunde)"}
                          className={review.verified ? "text-blue-600" : "text-gray-400"}
                        >
                          <BadgeCheck className="h-5 w-5" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[140px] text-xs text-gray-600">
                          {getCourseNames(review.service_ids)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(review.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm text-gray-600">
                          {review.comment || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateMutation.mutate({ id: review.id, approved: false })}
                            title="Verbergen"
                          >
                            <XCircle className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(review.id)}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}