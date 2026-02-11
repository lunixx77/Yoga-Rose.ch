import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Reviews() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    rating: 5,
    comment: "",
    booking_id: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const { data: reviews } = useQuery({
    queryKey: ['reviews-public'],
    queryFn: () => base44.entities.Review.filter({ approved: true }, '-created_date'),
    initialData: [],
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data) => {
      const review = await base44.entities.Review.create(data);
      
      // E-Mail an Betreiber
      await base44.integrations.Core.SendEmail({
        to: "rosemarie.fischlin@example.com",
        subject: "Neue Bewertung erhalten",
        body: `Neue Bewertung von ${data.customer_name}\n\nSterne: ${'⭐'.repeat(data.rating)}\n${data.comment ? `\nKommentar:\n${data.comment}` : ''}`
      });
      
      return review;
    },
    onSuccess: () => {
      setSubmitted(true);
      setShowForm(false);
      setFormData({ customer_name: "", rating: 5, comment: "", booking_id: "" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({ ...formData, approved: true });
  };

  const renderStars = (rating, size = "w-5 h-5") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full border-2 border-gray-300 bg-white">
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-700 mb-4">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Bewertung erhalten</h1>
            <p className="text-gray-600 text-sm mb-8">
              Vielen Dank für Ihre Bewertung. Sie ist jetzt veröffentlicht und sichtbar.
            </p>
            <Button 
              variant="outline" 
              className="border-2 border-gray-700 text-gray-700 hover:bg-gray-100"
              onClick={() => setSubmitted(false)}
            >
              Zurück zu Bewertungen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" className="mb-4 text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <div className="border-b-2 border-gray-300 pb-3 mb-4">
            <h1 className="text-3xl font-serif text-gray-800">Bewertungen</h1>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="bg-white border-2 border-gray-300 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-gray-800 mb-2">{averageRating}</div>
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-gray-800">{reviews.length}</div>
                <div className="text-sm text-gray-600">Bewertungen</div>
              </div>
            </div>
          </div>
        )}

        {!showForm ? (
          <div className="mb-8">
            <Button 
              variant="outline"
              className="w-full border-2 border-gray-700 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowForm(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Bewertung schreiben
            </Button>
          </div>
        ) : (
          <div className="border-2 border-gray-300 bg-white p-8 mb-8">
            <h2 className="text-xl font-serif text-gray-800 mb-6">Ihre Bewertung</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="customer_name">Ihr Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                  placeholder="Ihr Name"
                />
              </div>

              <div>
                <Label>Bewertung *</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          star <= formData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Ihr Kommentar</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Teilen Sie Ihre Erfahrungen..."
                  rows={5}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 border-2 border-gray-400 text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowForm(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  variant="outline"
                  className="flex-1 border-2 border-gray-700 text-gray-700 hover:bg-gray-100"
                  disabled={createReviewMutation.isPending}
                >
                  {createReviewMutation.isPending ? "Wird gesendet..." : "Bewertung absenden"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white border border-gray-300 p-8">
              Noch keine Bewertungen vorhanden
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-300 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{review.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(review.created_date), 'dd. MMMM yyyy', { locale: de })}
                    </div>
                  </div>
                  {renderStars(review.rating, "w-4 h-4")}
                </div>
                {review.comment && (
                  <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}