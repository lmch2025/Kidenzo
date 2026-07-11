"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, RefreshCw, X, ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { useAppStore } from "@/lib/store";
import { AdminProduct } from "./EditProductModal";
import { motion, AnimatePresence } from "framer-motion";

interface AdminProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: AdminProduct) => void;
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
        const maxSize = 800;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function AdminProductCreateModal({ isOpen, onClose, onSuccess }: AdminProductCreateModalProps) {
  const { user, token, triggerConfetti } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("autre");
  const [formStock, setFormStock] = useState("");
  const [formMaxCommission, setFormMaxCommission] = useState("40");
  const [formCommissionPerClick, setFormCommissionPerClick] = useState("0");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [formImageFiles, setFormImageFiles] = useState<File[]>([]);
  const [formImagePreviews, setFormImagePreviews] = useState<string[]>([]);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory("autre");
    setFormStock("");
    setFormMaxCommission("40");
    setFormCommissionPerClick("0");
    setFormImageFiles([]);
    setFormImagePreviews([]);
    setFormImageUrls([]);
    setIsCategoryOpen(false);
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPreviews = [...formImagePreviews];
      const newFiles = [...formImageFiles];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`L'image ${file.name} dépasse 5MB.`);
          continue;
        }
        try {
          const compressed = await compressImage(file);
          newPreviews.push(compressed);
          newFiles.push(file);
        } catch (error) {
          console.error("Compression error:", error);
        }
      }
      setFormImagePreviews(newPreviews);
      setFormImageFiles(newFiles);
    }
  };

  const removeImage = (index: number) => {
    setFormImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormImageFiles((prev) => prev.filter((_, i) => i !== index));
    setFormImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedCategoryLabel = PRODUCT_CATEGORIES.find((c) => c.value === formCategory)?.label ?? "Choisir une catégorie";

  const handleCreateProduct = async () => {
    if (!user || !token) return;
    setIsCreating(true);

    try {
      let finalImageUrls = [...formImageUrls];

      // Upload files if any
      if (formImageFiles.length > 0) {
        setIsUploadingImages(true);
        for (let i = 0; i < formImageFiles.length; i++) {
          const file = formImageFiles[i];
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data.url) finalImageUrls.push(data.url);
          }
        }
        setIsUploadingImages(false);
      }

      if (finalImageUrls.length === 0) {
        alert("Veuillez ajouter au moins une image.");
        setIsCreating(false);
        return;
      }

      const productData = {
        name: formName,
        description: formDesc,
        basePrice: parseInt(formPrice) || 0,
        category: formCategory,
        stock: parseInt(formStock) || 0,
        images: finalImageUrls,
        // Brand is enforced server-side for admin_neolife, but send it explicitly too
        brand: user.role === "admin_neolife" ? "neolife" : "kidenzo",
        maxCommission: parseInt(formMaxCommission) || 0,
        commissionPerClick: parseInt(formCommissionPerClick) || 0,
        ownerId: user.id,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error("Erreur lors de la création");

      const data = await res.json();
      // API returns { product: {...} } — extract the actual product object
      const newProduct = data.product ?? data;
      triggerConfetti();
      onSuccess(newProduct);
      handleClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du produit.");
    } finally {
      setIsCreating(false);
    }
  };

  // Step validation
  const canGoNext = step === 1 ? formName.trim().length > 0 : formPrice.trim().length > 0 && parseInt(formPrice) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-strong max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm text-xl">Nouveau Produit</DialogTitle>
          <DialogDescription className="font-medium text-orange-400">
            Étape {step} sur 3
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-gradient-to-r from-orange-500 to-pink-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1 : Nom + Description + Photos ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nom du produit *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Complément alimentaire Neolife"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Décrivez votre produit en détail..."
                  className="h-24 bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Photos du produit</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formImagePreviews.map((preview, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group">
                      <img src={preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/20 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-muted-foreground hover:text-orange-400"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">Ajouter</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 : Prix (FCFA) + Stock + Catégorie ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Prix en FCFA */}
              <div className="space-y-2">
                <Label>Prix de vente *</Label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0"
                    className="bg-white/5 border-white/10 font-mono text-lg pr-16"
                  />
                  <span className="absolute right-3 text-sm font-semibold text-orange-400 pointer-events-none">FCFA</span>
                </div>
                {formPrice && parseInt(formPrice) > 0 && (
                  <p className="text-xs text-emerald-400">
                    ≈ {parseInt(formPrice).toLocaleString("fr-FR")} FCFA
                  </p>
                )}
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label>Stock disponible</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="Quantité en stock"
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Catégorie — native select pour éviter le bug controlled/uncontrolled */}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <div className="relative">
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer pr-10"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-background text-foreground">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                {formCategory && (
                  <p className="text-xs text-muted-foreground">
                    Catégorie sélectionnée : <span className="text-orange-400">{selectedCategoryLabel}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 : Commissions ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Commission max (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formMaxCommission}
                    onChange={(e) => setFormMaxCommission(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <span className="text-xl">%</span>
                </div>
                {formPrice && formMaxCommission && (
                  <p className="text-xs text-emerald-400">
                    Gain max : {Math.floor(parseInt(formPrice || "0") * parseInt(formMaxCommission || "0") / 100).toLocaleString("fr-FR")} FCFA / vente
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Part du prix de vente reversée aux revendeurs.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rémunération par Clic (PPC)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formCommissionPerClick}
                    onChange={(e) => setFormCommissionPerClick(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <span className="text-sm font-semibold text-orange-400 whitespace-nowrap">FCFA</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Combien gagne un promoteur lorsqu'un visiteur clique sur son lien (Pay-Per-Click).
                </p>
              </div>

              {/* Résumé avant création */}
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Récapitulatif</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produit</span>
                    <span className="font-medium text-white truncate max-w-[60%] text-right">{formName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-bold text-orange-400">{parseInt(formPrice || "0").toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="text-white">{selectedCategoryLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Photos</span>
                    <span className="text-white">{formImagePreviews.length} photo(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marque</span>
                    <span className="font-semibold text-emerald-400">
                      {user?.role === "admin_neolife" ? "Neolife" : "Kidenzo"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="flex sm:justify-between items-center w-full gap-2 mt-4 flex-row justify-between">
          <div className="flex gap-2 w-full justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-white/10 hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-white/10 hover:bg-white/5"
              >
                Annuler
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
                className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateProduct}
                disabled={isCreating || isUploadingImages}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {isCreating || isUploadingImages ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingImages ? "Upload..." : "Création..."}
                  </>
                ) : (
                  "✓ Créer le produit"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
