"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, RefreshCw, X, ArrowLeft, Star } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

// Use the same type as in AdminProducts
export interface ProductImage {
  id: string;
  storageUrl: string;
  position: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  stock: number;
  status: string;
  maxCommission: number;
  weight: string;
  dimensions: string;
  sourceUrl: string | null;
  createdAt: string;
  images: ProductImage[];
  miniSite: any;
  owner: any;
}

interface EditProductModalProps {
  product: AdminProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: AdminProduct) => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1080;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/webp", 0.8);
          resolve(dataUrl.split(",")[1]);
        } else {
          reject(new Error("Canvas context null"));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function EditProductModal({ product, isOpen, onClose, onSuccess }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(product?.basePrice.toString() || "");
  const [category, setCategory] = useState(product?.category || "autre");
  const [stock, setStock] = useState(product?.stock.toString() || "");
  const [maxCommission, setMaxCommission] = useState(product?.maxCommission.toString() || "");
  const [weight, setWeight] = useState(product?.weight || "");
  const [dimensions, setDimensions] = useState(product?.dimensions || "");
  
  // Store images as array of objects with url and id (optional, if it's an existing image)
  const [images, setImages] = useState<{ url: string; id?: string }[]>(
    product?.images?.map(img => ({ url: img.storageUrl, id: img.id })) || []
  );
  const [isUploading, setIsUploading] = useState(false);

  // When product changes, reset form
  useEffect(() => {
    if (product && isOpen) {
      setName(product.name);
      setDescription(product.description);
      setBasePrice(product.basePrice.toString());
      setCategory(product.category);
      setStock(product.stock.toString());
      setMaxCommission(product.maxCommission.toString());
      setWeight(product.weight || "");
      setDimensions(product.dimensions || "");
      // Sort images by position to ensure correct order
      const sortedImages = [...(product.images || [])].sort((a, b) => a.position - b.position);
      setImages(sortedImages.map(img => ({ url: img.storageUrl, id: img.id })));
    }
  }, [product, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const base64String = await compressImage(file);
        const uploadRes = await fetch("/api/upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          setImages(prev => [...prev, { url: uploadData.url }]);
        }
      }
    } catch (err) {
      console.error("Error uploading image", err);
    } finally {
      setIsUploading(false);
    }
  };

  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const selected = newImages.splice(index, 1)[0];
      newImages.unshift(selected); // Put at the beginning
      return newImages;
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit-product",
          id: product.id,
          name,
          description,
          basePrice: parseFloat(basePrice),
          category,
          stock: parseInt(stock) || 0,
          maxCommission: parseInt(maxCommission) || 0,
          weight,
          dimensions,
          images: images.map((img, i) => ({ url: img.url, position: i }))
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.product);
        onClose();
      } else {
        console.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-strong max-w-[95vw] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm text-xl">Modifier le produit</DialogTitle>
          <DialogDescription>
            Modifiez les informations et gérez les images du produit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Images */}
            <div className="space-y-2">
              <Label>Images du produit (L'image étoile est la principale)</Label>
              
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className={`relative w-24 h-24 rounded-md overflow-hidden border-2 ${i === 0 ? 'border-orange-500' : 'border-border'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Preview" className="w-full h-full object-contain bg-black/10" />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsMainImage(i)}
                          className="bg-black/70 text-white p-1 rounded-full hover:bg-orange-500 transition-colors"
                          title="Définir comme image principale"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="bg-black/70 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                        title="Supprimer l'image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-orange-500 text-white p-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Upload Button */}
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                  {isUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-orange-400 mb-1" />
                      <span className="text-[10px] text-muted-foreground">Ajouter</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du produit</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Prix (FCFA)</Label>
                <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Commission max (%)</Label>
                <Input type="number" value={maxCommission} onChange={(e) => setMaxCommission(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Poids</Label>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 500g" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
