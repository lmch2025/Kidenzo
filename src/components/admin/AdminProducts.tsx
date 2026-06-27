"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ExternalLink,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  Warehouse,
  Pencil,
} from "lucide-react";
import { formatPrice } from "@/lib/store";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditProductModal } from "./EditProductModal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductImage {
  id: string;
  storageUrl: string;
  position: number;
}

interface ProductMiniSite {
  id: string;
  slug: string;
}

interface ProductOwner {
  id: string;
  name: string | null;
  phone: string;
}

interface AdminProduct {
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
  miniSite: ProductMiniSite | null;
  owner: ProductOwner;
}

interface ProductsResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
}

type StatusFilter = "all" | "active" | "inactive";

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-white/8" />
          <div className="h-4 w-20 rounded bg-white/8" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 w-24 rounded bg-white/10" />
          <div className="h-5 w-14 rounded bg-white/8" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 rounded-lg bg-white/8" />
          <div className="h-8 w-8 rounded-lg bg-white/8" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const limit = 12;

  // ─── Fetch products ─────────────────────────────────────────────────────

  const fetchProducts = useCallback(
    async (p: number, s: string, status: StatusFilter) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          action: "all-products",
          page: p.toString(),
          limit: limit.toString(),
        });
        if (s) params.set("search", s);
        if (status !== "all") params.set("status", status);

        const res = await fetch(`/api/admin?${params}`);
        if (res.ok) {
          const data: ProductsResponse = await res.json();
          setProducts(data.products);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts(page, search, statusFilter);
  }, [page, search, statusFilter, fetchProducts]);

  // ─── Search with debounce ───────────────────────────────────────────────

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // ─── Toggle product status ──────────────────────────────────────────────

  const handleToggleStatus = async (productId: string) => {
    setIsToggling(productId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-product-status", productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, status: data.product.status } : p,
          ),
        );
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
    } finally {
      setIsToggling(null);
    }
  };

  // ─── Delete product ─────────────────────────────────────────────────────

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(productId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-product", productId }),
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // ─── Refresh ────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchProducts(page, search, statusFilter);
  };

  // ─── Status tabs config ─────────────────────────────────────────────────

  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: "all", label: "Tous", count: total },
    { id: "active", label: "Actifs" },
    { id: "inactive", label: "Inactifs" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Package className="w-6 h-6 text-orange-400" />
          Gestion des Produits
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({total})
            </span>
          )}
        </motion.h2>

        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Importer
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Search & Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 h-10"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 glass rounded-lg p-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <Filter className="w-3 h-3" />
                {tab.label}
                {isActive && tab.count !== undefined && (
                  <span className="ml-0.5 text-[10px] opacity-70">
                    ({tab.count})
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Product Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-orange-400/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Aucun produit ne correspond à "${search}"`
                : statusFilter !== "all"
                  ? `Aucun produit ${statusFilter === "active" ? "actif" : "inactif"}`
                  : "Commencez par ajouter ou importer des produits"}
            </p>
            {(search || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  isToggling={isToggling === product.id}
                  isDeleting={isDeleting === product.id}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteProduct}
                  onEdit={() => setEditingProduct(product)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(updatedProduct) => {
          setProducts((prev) => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          className="flex items-center justify-center gap-2 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-white/10 hover:bg-white/5 text-sm"
          >
            Précédent
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter((p) => {
                // Show first, last, and nearby pages
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (p - prev > 1) acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-muted-foreground text-xs"
                  >
                    ...
                  </span>
                ) : (
                  <motion.button
                    key={item}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(item)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      page === item
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </motion.button>
                ),
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border-white/10 hover:bg-white/5 text-sm"
          >
            Suivant
          </Button>
        </motion.div>
      )}

      {/* Page info */}
      {total > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          Page {page} sur {totalPages} · {total} produit{total > 1 ? "s" : ""}{" "}
          au total
        </div>
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

interface ProductCardProps {
  product: AdminProduct;
  index: number;
  isToggling: boolean;
  isDeleting: boolean;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

function ProductCard({
  product,
  index,
  isToggling,
  isDeleting,
  onToggleStatus,
  onDelete,
  onEdit,
}: ProductCardProps) {
  const mainImage = product.images?.[0]?.storageUrl;
  const isActive = product.status === "active";
  const hasMiniSite = !!product.miniSite;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card rounded-xl overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-white/10" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={`text-[10px] font-semibold border backdrop-blur-md ${
              isActive
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-red-500/20 text-red-400 border-red-500/40"
            }`}
          >
            {isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>

        {/* Mini-site badge */}
        {hasMiniSite && (
          <div className="absolute top-3 right-3">
            <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/40 backdrop-blur-md">
              <ExternalLink className="w-2.5 h-2.5 mr-1" />
              Mini-site
            </Badge>
          </div>
        )}

        {/* Image count */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <Badge className="text-[10px] bg-black/40 text-white border-white/10 backdrop-blur-md">
              <ImageIcon className="w-2.5 h-2.5 mr-1" />
              {product.images.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-orange-400 transition-colors">
          {product.name}
        </h3>

        {/* Category + Owner */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] border-white/10 text-muted-foreground"
          >
            <Tag className="w-2.5 h-2.5 mr-1" />
            {PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label || product.category}
          </Badge>
          {product.sourceUrl && (
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/20 text-emerald-400"
            >
              Importé
            </Badge>
          )}
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold gradient-text">
            {formatPrice(product.basePrice)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Warehouse className="w-3 h-3" />
            <span
              className={
                product.stock <= 0
                  ? "text-red-400"
                  : product.stock < 10
                    ? "text-yellow-400"
                    : ""
              }
            >
              {product.stock} en stock
            </span>
          </div>
        </div>

        {/* Commission info */}
        {product.maxCommission > 0 && (
          <div className="text-[10px] text-muted-foreground">
            Commission max:{" "}
            <span className="text-orange-400">{product.maxCommission}%</span>
          </div>
        )}

        {/* Owner info */}
        <div className="text-[10px] text-muted-foreground truncate">
          Propriétaire: {product.owner.name || product.owner.phone}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {/* Toggle status */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleStatus(product.id)}
            disabled={isToggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 ${
              isActive
                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            } disabled:opacity-50`}
          >
            {isToggling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isActive ? (
              <ToggleRight className="w-3.5 h-3.5" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5" />
            )}
            {isActive ? "Désactiver" : "Activer"}
          </motion.button>

          {/* Mini-site link */}
          {hasMiniSite && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              href={`/s/${product.miniSite!.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
              title="Voir le mini-site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </motion.a>
          )}

          {/* Edit */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </motion.button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="gradient-text-warm">
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong className="text-foreground">{product.name}</strong> ?
                  Cette action est irréversible. Toutes les données associées
                  (mini-site, commandes, commissions) seront définitivement
                  supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 hover:bg-white/5">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(product.id)}
                  disabled={isDeleting}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Supprimer définitivement"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}
