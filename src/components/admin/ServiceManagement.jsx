import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ServiceManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const queryClient = useQueryClient();

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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      setIsEditing(false);
      setEditingService(null);
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
      max_participants: null,
      active: true,
      use_fixed_times: false,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      duration_minutes: parseInt(formData.get('duration_minutes')),
      price: parseFloat(formData.get('price')) || null,
      type: formData.get('type'),
      max_participants: formData.get('max_participants') ? parseInt(formData.get('max_participants')) : null,
      active: editingService.active,
      use_fixed_times: !!editingService.use_fixed_times,
    };

    if (editingService.id) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {editingService.id ? 'Angebot bearbeiten' : 'Neues Angebot'}
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingService.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Art *</Label>
                <Select name="type" defaultValue={editingService.type} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einzelstunde">Einzelstunde</SelectItem>
                    <SelectItem value="gruppenkurs">Gruppenkurs</SelectItem>
                    <SelectItem value="fastenkurs">Fastenkurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingService.description}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration_minutes">Dauer (Minuten) *</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  defaultValue={editingService.duration_minutes}
                  required
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="price">Preis (CHF)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingService.price || ""}
                />
              </div>
              <div>
                <Label htmlFor="max_participants">Max. Teilnehmer</Label>
                <Input
                  id="max_participants"
                  name="max_participants"
                  type="number"
                  defaultValue={editingService.max_participants || ""}
                  placeholder="Unbegrenzt"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingService.active}
                onCheckedChange={(checked) => setEditingService({...editingService, active: checked})}
              />
              <Label>Aktiv</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!editingService.use_fixed_times}
                onCheckedChange={(checked) => setEditingService({...editingService, use_fixed_times: checked})}
              />
              <Label className="cursor-pointer">
                Normale Zeiten (Lektionsplan) – bei der Anfrage werden die festen Zeiten zur Auswahl angezeigt (z. B. Hatha Yoga)
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Speichern
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
              <TableHead>Max. Teilnehmer</TableHead>
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
                <TableCell>{service.max_participants || 'Unbegrenzt'}</TableCell>
                <TableCell>
                  {service.use_fixed_times ? (
                    <Badge className="bg-blue-100 text-blue-800">Lektionsplan</Badge>
                  ) : (
                    <span className="text-xs text-gray-500">Eigene Zeit</span>
                  )}
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