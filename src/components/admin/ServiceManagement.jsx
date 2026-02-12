import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export default function ServiceManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-admin'],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      setIsEditing(false);
      setEditingService(null);
      toast({ title: "Angebot erstellt", description: "Das neue Angebot wurde gespeichert." });
    },
    onError: (err) => {
      toast({
        title: "Speichern fehlgeschlagen",
        description: err?.message || "Das Angebot konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      setIsEditing(false);
      setEditingService(null);
      toast({ title: "Angebot gespeichert", description: "Die Änderungen wurden übernommen." });
    },
    onError: (err) => {
      toast({
        title: "Speichern fehlgeschlagen",
        description: err?.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
    },
  });

  const handleEdit = (service) => {
    setEditingService(service);
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingService({
      name: "",
      description: "",
      duration_minutes: 60,
      price: 0,
      type: "einzelstunde",
      active: true,
      use_fixed_times: false,
      fixed_times_type: "",
    });
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const fixedTimesType = editingService.fixed_times_type ?? (editingService.use_fixed_times ? "hatha" : "");
    const durationRaw = formData.get("duration_minutes");
    const durationMinutes = parseInt(String(durationRaw), 10);
    const data = {
      name: String(formData.get("name") ?? "").trim(),
      description: formData.get("description") != null ? String(formData.get("description")).trim() : null,
      duration_minutes: Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 60,
      price: (() => {
        const p = parseFloat(formData.get("price"));
        return Number.isFinite(p) ? p : null;
      })(),
      type: String(formData.get("type") ?? "gruppenkurs").trim() || "gruppenkurs",
      active: !!editingService.active,
      use_fixed_times: fixedTimesType === "hatha" || fixedTimesType === "schwangerschaftsyoga",
      fixed_times_type: fixedTimesType || "",
    };

    if (!data.name) {
      toast({ title: "Name fehlt", description: "Bitte geben Sie einen Namen für das Angebot ein.", variant: "destructive" });
      return;
    }

    if (editingService.id) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && editingService) {
    const fixedTimesValue = editingService.fixed_times_type ?? (editingService.use_fixed_times ? "hatha" : "") ?? "";
    return (
      <Card className="border-2 border-gray-200 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-gray-900">
            {editingService.id ? 'Angebot bearbeiten' : 'Neues Angebot'}
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-900">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingService.name}
                  required
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-gray-900">Art *</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingService.type}
                  required
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="einzelstunde">Einzelstunde</option>
                  <option value="gruppenkurs">Gruppenkurs</option>
                  <option value="fastenkurs">Fastenkurs</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-900">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingService.description}
                rows={3}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_minutes" className="text-gray-900">Dauer (Minuten) *</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  defaultValue={editingService.duration_minutes}
                  required
                  min="1"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-gray-900">Preis (CHF)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingService.price || ""}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingService.active}
                onCheckedChange={(checked) => setEditingService({...editingService, active: checked})}
              />
              <Label className="text-gray-900">Aktiv</Label>
            </div>

            <div>
              <Label htmlFor="fixed_times_type" className="text-gray-900">Zeiten bei Anfrage</Label>
              <select
                id="fixed_times_type"
                value={fixedTimesValue}
                onChange={(e) => setEditingService({ ...editingService, fixed_times_type: e.target.value })}
                className="mt-1.5 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">Keine festen Zeiten (Gast gibt Zeit frei an)</option>
                <option value="hatha">Normale Zeiten (Hatha Yoga) – Lektionsplan-Zeiten</option>
                <option value="schwangerschaftsyoga">Schwangerschaftsyoga – 19:00 – 20:15 Uhr</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={createMutation.isPending || updateMutation.isPending}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Wird gespeichert …" : "Speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Angebote
          <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Neues Angebot
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Art</TableHead>
              <TableHead>Dauer</TableHead>
              <TableHead>Preis</TableHead>
              <TableHead>Normale Zeiten</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {service.type === 'einzelstunde' ? 'Einzelstunde' : 
                     service.type === 'gruppenkurs' ? 'Gruppenkurs' : 'Fastenkurs'}
                  </Badge>
                </TableCell>
                <TableCell>{service.duration_minutes} Min.</TableCell>
                <TableCell>{service.price ? `CHF ${service.price.toFixed(2)}` : '-'}</TableCell>
                <TableCell>
                  {(service.fixed_times_type ?? (service.use_fixed_times ? "hatha" : "")) === "hatha" ? (
                    <Badge className="bg-blue-100 text-blue-800">Hatha Yoga</Badge>
                  ) : (service.fixed_times_type === "schwangerschaftsyoga" ? (
                    <Badge className="bg-violet-100 text-violet-800">Schwangerschaftsyoga</Badge>
                  ) : (
                    <span className="text-xs text-gray-500">Eigene Zeit</span>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge className={service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {service.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}