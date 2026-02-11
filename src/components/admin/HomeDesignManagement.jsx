import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical, Check } from "lucide-react";

// Farben: sichtbare Kacheln → speichern wir weiterhin als Tailwind-Klasse
const COLOR_OPTIONS = [
  { label: "Lila", value: "from-purple-50 to-purple-100" },
  { label: "Rosa", value: "from-pink-50 to-pink-100" },
  { label: "Gelb", value: "from-yellow-50 to-yellow-100" },
  { label: "Grün", value: "from-green-50 to-green-100" },
  { label: "Türkis", value: "from-teal-50 to-teal-100" },
  { label: "Blau", value: "from-blue-50 to-blue-100" },
  { label: "Pfirsich", value: "from-orange-50 to-orange-100" },
  { label: "Beige", value: "from-amber-50 to-amber-100" },
  { label: "Grau", value: "from-slate-100 to-slate-200" },
  { label: "Weiss", value: "from-gray-50 to-gray-100" },
];

// Emojis zur Auswahl (Yoga / Wellness / Kurse)
const EMOJI_OPTIONS = [
  "🧘‍♀️", "🧘", "🤰", "👶", "🌿", "🌸", "💆", "🕉️", "☮️", "🌅",
  "🍃", "🦋", "✨", "💫", "🌺", "🧘‍♂️", "🙏", "❤️", "🌱", "☀️",
];

export default function HomeDesignManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const queryClient = useQueryClient();

  const { data: cards } = useQuery({
    queryKey: ["home-cards"],
    queryFn: () => base44.entities.HomeCard.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cards"] });
      setIsEditing(false);
      setEditingCard(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HomeCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cards"] });
      setIsEditing(false);
      setEditingCard(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeCard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cards"] });
    },
  });

  const handleNew = () => {
    setEditingCard({
      title: "",
      description: "",
      icon: "🧘‍♀️",
      bg_color: "from-purple-50 to-purple-100",
      cta_label: "Anfragen",
      cta_page: "Booking",
      visible: true,
      order_index: (cards?.length || 0) + 1,
    });
    setIsEditing(true);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      icon: editingCard.icon || "🧘‍♀️",
      bg_color: editingCard.bg_color || "from-purple-50 to-purple-100",
      cta_label: formData.get("cta_label") || "Anfragen",
      cta_page: formData.get("cta_page") || "Booking",
      visible: editingCard.visible,
      order_index: parseInt(formData.get("order_index") || "0") || 0,
    };

    if (editingCard.id) {
      updateMutation.mutate({ id: editingCard.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && editingCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingCard.id ? "Karte bearbeiten" : "Neue Karte für Startseite"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingCard.title}
                required
              />
            </div>

            <div>
              <Label className="block mb-2">Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditingCard({ ...editingCard, icon: emoji })}
                    className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                      editingCard.icon === emoji
                        ? "border-slate-800 bg-slate-100 ring-2 ring-slate-400"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editingCard.description}
              />
            </div>

            <div>
              <Label className="block mb-2">Hintergrundfarbe</Label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((opt) => {
                  const isSelected = (editingCard.bg_color || "") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditingCard({ ...editingCard, bg_color: opt.value })}
                      className={`rounded-xl w-14 h-14 bg-gradient-to-br ${opt.value} border-2 shadow-sm flex items-center justify-center transition-all ${
                        isSelected ? "border-slate-800 ring-2 ring-offset-2 ring-slate-500" : "border-gray-300 hover:border-gray-500"
                      }`}
                      title={opt.label}
                    >
                      {isSelected ? <Check className="h-5 w-5 text-slate-700" /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">{COLOR_OPTIONS.find((c) => c.value === editingCard.bg_color)?.label ?? "—"}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cta_label">Button-Text</Label>
                <Input
                  id="cta_label"
                  name="cta_label"
                  defaultValue={editingCard.cta_label}
                />
              </div>
              <div>
                <Label htmlFor="cta_page">Ziel-Seite</Label>
                <select
                  id="cta_page"
                  name="cta_page"
                  defaultValue={editingCard.cta_page}
                  className="border border-input bg-background px-3 py-2 text-sm rounded-md w-full"
                >
                  <option value="Booking">Anfrage (Booking)</option>
                  <option value="Services">Angebote</option>
                  <option value="Reviews">Bewertungen</option>
                  <option value="Home">Startseite</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div>
                <Label htmlFor="order_index">Reihenfolge</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  type="number"
                  defaultValue={editingCard.order_index ?? 0}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingCard.visible}
                  onCheckedChange={(checked) =>
                    setEditingCard({ ...editingCard, visible: checked })
                  }
                />
                <Label>Sichtbar auf Startseite</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingCard(null);
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit">
                Speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const sortedCards = [...cards].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Startseite – Karten
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Karte
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Noch keine Karten vorhanden. Erstellen Sie Ihre erste Karte für die Startseite.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Button</TableHead>
                <TableHead>Seite</TableHead>
                <TableHead>Sichtbar</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="mr-2">{card.icon}</span>
                    {card.title}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-gray-600">
                    {card.description}
                  </TableCell>
                  <TableCell className="text-sm">{card.cta_label}</TableCell>
                  <TableCell className="text-sm">{card.cta_page}</TableCell>
                  <TableCell>
                    {card.visible ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Sichtbar
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        Versteckt
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(card)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(card.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

