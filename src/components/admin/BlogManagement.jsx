import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, Eye, EyeOff, Upload, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function BlogManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    category: "news",
    published: false,
    price: "",
    location: "",
    max_participants: "",
    dates: [],
    bookable: false
  });
  const [uploading, setUploading] = useState(false);
  const [newDate, setNewDate] = useState("");

  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: () => base44.entities.BlogPost.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      setIsEditing(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      setIsEditing(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      category: "news",
      published: false,
      price: "",
      location: "",
      max_participants: "",
      dates: [],
      bookable: false
    });
    setEditingPost(null);
    setNewDate("");
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || "",
      category: post.category,
      published: post.published,
      price: post.price || "",
      location: post.location || "",
      max_participants: post.max_participants || "",
      dates: post.dates || [],
      bookable: post.bookable || false
    });
    setIsEditing(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: result.file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const addDate = () => {
    if (newDate) {
      const isoDate = new Date(newDate).toISOString();
      setFormData({ ...formData, dates: [...formData.dates, isoDate] });
      setNewDate("");
    }
  };

  const removeDate = (index) => {
    setFormData({ ...formData, dates: formData.dates.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
    };
    
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = { event: "Event", special: "Special", news: "News" };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      event: "bg-blue-100 text-blue-800",
      special: "bg-purple-100 text-purple-800",
      news: "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingPost ? "Beitrag bearbeiten" : "Neuer Beitrag"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  const newFormData = { ...formData, category: value };
                  if (value === 'news') {
                    newFormData.price = "";
                    newFormData.location = "";
                    newFormData.max_participants = "";
                    newFormData.dates = [];
                    newFormData.bookable = false;
                  }
                  setFormData(newFormData);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="image">Bild hochladen</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-gray-500">Lädt hoch...</span>}
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img src={formData.image_url} alt="Vorschau" className="max-h-32 rounded" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="content">Inhalt * (Gestalten Sie frei!)</Label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={quillModules}
                className="bg-white"
              />
            </div>

            {formData.category !== 'news' && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preis (CHF)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="z.B. 120.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_participants">Max. Teilnehmer</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                      placeholder="z.B. 10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Ort/Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="z.B. Marktgasse 40, Altstätten"
                  />
                </div>

                <div>
                  <Label>Termine (mehrere möglich)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="datetime-local"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addDate} variant="outline" className="shrink-0">
                      <Plus className="h-4 w-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                  {formData.dates.length > 0 && (
                    <div className="space-y-2">
                      {formData.dates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm flex-1">
                            {format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                          </span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeDate(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="bookable"
                    checked={formData.bookable}
                    onCheckedChange={(checked) => setFormData({ ...formData, bookable: checked })}
                  />
                  <Label htmlFor="bookable" className="cursor-pointer">
                    Reservierbar machen (Kunden können direkt reservieren)
                  </Label>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published" className="cursor-pointer">
                Veröffentlichen (erscheint auf Startseite)
              </Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPost ? "Aktualisieren" : "Erstellen"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  resetForm();
                }}
              >
                Abbrechen
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
        <div className="flex justify-between items-center">
          <CardTitle>Blog & Events ({posts.length})</CardTitle>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Beitrag
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Keine Beiträge vorhanden
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex gap-4">
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <Badge className={getCategoryColor(post.category)}>
                        {getCategoryLabel(post.category)}
                      </Badge>
                      {post.published ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="w-3 h-3 mr-1" />
                          Veröffentlicht
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Entwurf
                        </Badge>
                      )}
                      {post.bookable && (
                        <Badge className="bg-blue-100 text-blue-800">Reservierbar</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {post.price && <span>CHF {post.price} • </span>}
                      {post.location && <span>{post.location} • </span>}
                      {post.dates?.length > 0 && <span>{post.dates.length} Termin{post.dates.length > 1 ? 'e' : ''}</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(post.created_date), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(post.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}