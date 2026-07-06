"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, X, Link2, Copy, AlertCircle, Check, ImageIcon, Weight, Ruler, Package, Sparkles, Star, Camera } from "lucide-react";
import { PRODUCT_CATEGORIES as CATEGORIES } from "@/lib/categories";
import { useAppStore, type ImportProductResult } from "@/lib/store";
import { AdminProduct } from "./EditProductModal";
import { motion, AnimatePresence } from "framer-motion";

const USD_TO_FCFA = 610;

interface AdminProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: AdminProduct) => void;
}

function ImportShimmerSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
        <div>
          <motion.p
            className="text-sm font-medium text-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Analyse en cours
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}>.</motion.span>
          </motion.p>
          <p className="text-xs text-muted-foreground">Extraction des données produit...</p>
        </div>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-20 rounded bg-muted/50 shimmer" />
          <div className="h-9 w-full rounded-md bg-muted/30 shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
        </div>
      ))}

      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-muted/50 shimmer" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-16 h-16 rounded-lg bg-muted/30 shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminProductImportModal({ isOpen, onClose, onSuccess }: AdminProductImportModalProps) {
  const { user, token, triggerConfetti } = useAppStore();

  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<ImportProductResult | null>(null);
  const [importCreating, setImportCreating] = useState(false);

  // Form State
  const [importFormName, setImportFormName] = useState("");
  const [importFormDesc, setImportFormDesc] = useState("");
  const [importFormPrice, setImportFormPrice] = useState("");
  const [importFormCategory, setImportFormCategory] = useState("autre");
  const [importFormStock, setImportFormStock] = useState("10");
  const [importFormMaxCommission, setImportFormMaxCommission] = useState("40");
  const [importSelectedImages, setImportSelectedImages] = useState<Set<number>>(new Set());
  const [importMainImageIndex, setImportMainImageIndex] = useState<number>(0);
  const [importSelectedVideo, setImportSelectedVideo] = useState<number | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState("");

  const resetImportForm = () => {
    setImportUrl("");
    setImportLoading(false);
    setImportError(null);
    setImportedData(null);
    setImportCreating(false);
    setImportFormName("");
    setImportFormDesc("");
    setImportFormPrice("");
    setImportFormCategory("autre");
    setImportFormStock("10");
    setImportFormMaxCommission("40");
    setImportSelectedImages(new Set());
    setImportMainImageIndex(0);
    setImportSelectedVideo(null);
    setManualVideoUrl("");
  };

  const handleClose = () => {
    resetImportForm();
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setImportUrl(text);
        setImportError(null);
      }
    } catch (err) {
      console.error("Paste failed", err);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!importUrl.trim()) return;
    setImportLoading(true);
    setImportError(null);
    setImportedData(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/import-product", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || "Erreur lors de l'analyse");
      }

      const data = await res.json();
      const product: ImportProductResult = data.product;

      setImportedData(product);
      setImportFormName(product.name);
      setImportFormDesc(product.description);
      const fcfaPrice = Math.round(product.price * USD_TO_FCFA);
      setImportFormPrice(String(fcfaPrice));
      setImportFormCategory(product.category || "autre");
      setImportSelectedImages(new Set(product.images.map((_, i) => i)));
      setImportMainImageIndex(0);
      setImportSelectedVideo(product.videos && product.videos.length > 0 ? 0 : null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Erreur lors de l'analyse du lien");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateImportedProduct = async () => {
    if (!user || !token) return;
    if (!importFormName || !importFormPrice) return;
    setImportCreating(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      headers["Authorization"] = `Bearer ${token}`;

      const selectedImages = importedData
        ? [
            ...(importSelectedImages.has(importMainImageIndex) ? [importedData.images[importMainImageIndex]] : []),
            ...importedData.images.filter((_, i) => importSelectedImages.has(i) && i !== importMainImageIndex),
          ]
        : [];

      const res = await fetch("/api/products", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ownerId: user.id,
          name: importFormName,
          description: importFormDesc,
          basePrice: parseFloat(importFormPrice),
          category: importFormCategory,
          stock: parseInt(importFormStock) || 0,
          maxCommission: parseInt(importFormMaxCommission) || 40,
          weight: importedData?.weight || "",
          dimensions: importedData?.dimensions || "",
          sourceUrl: importedData?.sourceUrl || importUrl,
          videoUrl: (importedData && importedData.videos && importSelectedVideo !== null) ? importedData.videos[importSelectedVideo] : null,
          images: selectedImages,
          brand: user.role === 'admin_neolife' ? 'neolife' : 'kidenzo',
        }),
      });

      if (!res.ok) throw new Error("Failed to create imported product");

      const data = await res.json();
      const newProduct = data.product || data;
      triggerConfetti();
      onSuccess(newProduct);
      handleClose();
    } catch (error) {
      console.error("Failed to create imported product:", error);
      alert("Erreur lors de la création du produit.");
    } finally {
      setImportCreating(false);
    }
  };

  const toggleImageSelection = (index: number) => {
    setImportSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-strong !max-w-[calc(100vw-2rem)] sm:!max-w-lg max-h-[85vh] overflow-y-auto !p-3 sm:!p-6 !rounded-xl !gap-2 sm:!gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Importer un produit
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Collez un lien Alibaba ou AliExpress pour importer automatiquement les données
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!importedData && !importLoading && (
            <motion.div
              key="url-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 py-1 min-w-0 overflow-hidden"
            >
              <div className="space-y-2">
                <Label htmlFor="import-url" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Lien du produit
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Input
                      id="import-url"
                      placeholder="https://www.alibaba.com/..."
                      value={importUrl}
                      onChange={(e) => {
                        setImportUrl(e.target.value);
                        setImportError(null);
                      }}
                      className="bg-background/50 pr-10 border-emerald-500/30 focus:border-emerald-500/60 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && importUrl.trim()) {
                          handleAnalyzeUrl();
                        }
                      }}
                    />
                    {importUrl && (
                      <button
                        onClick={() => setImportUrl("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePaste}
                    className="shrink-0 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                    title="Coller depuis le presse-papier"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Supporte les liens Alibaba, AliExpress et 1688.com
                </p>
              </div>

              <AnimatePresence>
                {importError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 min-w-0">{importError}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeUrl}
                      className="h-7 text-xs border-red-500/30 hover:bg-red-500/10 text-red-400"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Réessayer
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20">
                <div className="flex -space-x-1 shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold border-2 border-background">
                    A
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold border-2 border-background">
                    AE
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex-1 min-w-0">
                  Les données seront extraites automatiquement : nom, prix, description, images
                </p>
              </div>
            </motion.div>
          )}

          {importLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ImportShimmerSkeleton />
            </motion.div>
          )}

          {importedData && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 py-1 min-w-0 overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                >
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </motion.div>
                <p className="text-[10px] sm:text-xs text-emerald-400 font-medium min-w-0">
                  Analysé avec succès ! Vérifiez et modifiez les infos ci-dessous.
                </p>
              </motion.div>

              <div className="space-y-1">
                <Label htmlFor="import-name" className="text-xs">Nom du produit</Label>
                <Input
                  id="import-name"
                  value={importFormName}
                  onChange={(e) => setImportFormName(e.target.value)}
                  className="bg-background/50 text-sm h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="import-desc" className="text-xs">Description</Label>
                <Textarea
                  id="import-desc"
                  value={importFormDesc}
                  onChange={(e) => setImportFormDesc(e.target.value)}
                  className="bg-background/50 resize-none text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="import-price" className="text-xs">Prix (FCFA)</Label>
                <Input
                  id="import-price"
                  type="number"
                  value={importFormPrice}
                  onChange={(e) => setImportFormPrice(e.target.value)}
                  className="bg-background/50 text-sm h-9"
                />
                {importedData.price > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    <span className="text-emerald-400">≈ {importedData.price} USD</span>
                    {" "}· 1 USD ≈ {USD_TO_FCFA} FCFA
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catégorie</Label>
                <Select value={importFormCategory} onValueChange={setImportFormCategory}>
                  <SelectTrigger className="w-full bg-background/50 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value || cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="import-stock" className="text-xs">Stock</Label>
                  <Input
                    id="import-stock"
                    type="number"
                    value={importFormStock}
                    onChange={(e) => setImportFormStock(e.target.value)}
                    className="bg-background/50 text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="import-maxcomm" className="text-xs">Commission (%)</Label>
                  <Input
                    id="import-maxcomm"
                    type="number"
                    min="0"
                    max="100"
                    value={importFormMaxCommission}
                    onChange={(e) => setImportFormMaxCommission(e.target.value)}
                    className="bg-background/50 text-sm h-9"
                  />
                </div>
              </div>

              {importedData.images.length > 0 && (
                <div className="space-y-1.5 min-w-0 overflow-hidden">
                  <Label className="text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Images ({importSelectedImages.size}/{importedData.images.length})</span>
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                    {importedData.images.map((imgUrl, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative group rounded-md overflow-hidden border-2 cursor-pointer aspect-square transition-all duration-200 ${
                          importSelectedImages.has(idx)
                            ? (importMainImageIndex === idx ? "border-orange-500 shadow-sm shadow-orange-500/40" : "border-emerald-500 shadow-sm shadow-emerald-500/20")
                            : "border-border/50 opacity-50 hover:opacity-80"
                        }`}
                        onClick={() => toggleImageSelection(idx)}
                      >
                        <img
                          src={imgUrl}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <div className={`absolute inset-0 flex items-start justify-between p-1 transition-colors ${
                          importSelectedImages.has(idx) ? "bg-emerald-500/20" : "bg-background/40"
                        }`}>
                          <Checkbox checked={importSelectedImages.has(idx)} className="pointer-events-none mt-1 ml-1" />
                          {importSelectedImages.has(idx) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportMainImageIndex(idx);
                              }}
                              className={`w-6 h-6 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                                importMainImageIndex === idx
                                  ? "bg-orange-500 text-white"
                                  : "bg-black/50 text-white/50 hover:bg-orange-500/80 hover:text-white"
                              }`}
                              title="Définir comme image principale"
                            >
                              <Star className={`w-3.5 h-3.5 ${importMainImageIndex === idx ? "fill-current" : ""}`} />
                            </button>
                          )}
                        </div>
                        {importMainImageIndex === idx && importSelectedImages.has(idx) && (
                          <Badge className="absolute bottom-0 left-0 right-0 text-[9px] py-0.5 bg-orange-500 text-white border-0 rounded-none justify-center">
                            Principale
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                      onClick={() => setImportSelectedImages(new Set(importedData.images.map((_, i) => i)))}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] border-border/50 hover:bg-muted/50"
                      onClick={() => setImportSelectedImages(new Set())}
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 min-w-0 overflow-hidden mt-3">
                <Label className="text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Vidéo ({importSelectedVideo !== null ? "1" : "0"}/{importedData.videos?.length || 0})
                  </span>
                </Label>
                
                {importedData.videos && importedData.videos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto mb-2">
                    {importedData.videos.map((vidUrl, idx) => (
                      <motion.div
                        key={`vid-${idx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative group rounded-md overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                          importSelectedVideo === idx ? "border-emerald-500 shadow-sm shadow-emerald-500/20" : "border-border/50 opacity-50 hover:opacity-80"
                        }`}
                        onClick={() => setImportSelectedVideo(importSelectedVideo === idx ? null : idx)}
                      >
                        <video src={vidUrl} className="w-full aspect-video object-cover bg-black" controls={false} muted playsInline autoPlay={false} />
                        <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                          importSelectedVideo === idx ? "bg-emerald-500/20" : "bg-background/40"
                        }`}>
                          <Checkbox checked={importSelectedVideo === idx} className="pointer-events-none" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Coller un lien vidéo (MP4)..."
                    value={manualVideoUrl}
                    onChange={(e) => setManualVideoUrl(e.target.value)}
                    className="h-8 text-xs bg-background/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    disabled={!manualVideoUrl.trim()}
                    onClick={() => {
                      if (manualVideoUrl.trim()) {
                        const newVideos = [...(importedData.videos || []), manualVideoUrl.trim()];
                        setImportedData({ ...importedData, videos: newVideos });
                        setImportSelectedVideo(newVideos.length - 1);
                        setManualVideoUrl("");
                      }
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              {(importedData.weight || importedData.dimensions) && (
                <div className="grid grid-cols-2 gap-2">
                  {importedData.weight && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                      <Weight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-muted-foreground">Poids</p>
                        <p className="text-[11px] font-medium truncate">{importedData.weight}</p>
                      </div>
                    </div>
                  )}
                  {importedData.dimensions && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                      <Ruler className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-muted-foreground">Dimensions</p>
                        <p className="text-[11px] font-medium truncate">{importedData.dimensions}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importedData.sourceUrl && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                  <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-muted-foreground">Source</p>
                    <p className="text-[11px] truncate">{importedData.sourceUrl}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="!flex-col gap-2 sm:!flex-row mt-1 sm:mt-2">
          {!importedData && !importLoading && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">
                Annuler
              </Button>
              <Button
                onClick={handleAnalyzeUrl}
                disabled={!importUrl.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white w-full sm:w-auto order-1 sm:order-2"
              >
                <Link2 className="w-4 h-4" />
                Analyser le lien
              </Button>
            </>
          )}

          {importLoading && (
            <Button variant="outline" onClick={() => { setImportLoading(false); setImportError(null); }} className="w-full sm:w-auto">
              Annuler
            </Button>
          )}

          {importedData && (
            <>
              <Button variant="outline" onClick={() => { setImportedData(null); setImportError(null); }} className="w-full sm:w-auto order-2 sm:order-1">
                <RefreshCw className="w-3.5 h-3.5" />
                Nouvelle analyse
              </Button>
              <Button
                onClick={handleCreateImportedProduct}
                disabled={!importFormName || !importFormPrice || importCreating}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white w-full sm:w-auto order-1 sm:order-2"
              >
                {importCreating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Package className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {importCreating ? "Création..." : "Créer le produit"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
