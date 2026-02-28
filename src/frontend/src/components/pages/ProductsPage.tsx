import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit2,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import {
  useAllProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "../../hooks/useQueries";
import { ExternalBlob } from "../../utils/ExternalBlob";

interface ProductFormData {
  name: string;
  price: string;
  quantity: string;
  imageUrl: string;
  category: string;
  description: string;
  unit: string;
  barcode: string;
}

const emptyForm: ProductFormData = {
  name: "",
  price: "",
  quantity: "",
  imageUrl: "",
  category: "Other",
  description: "",
  unit: "pcs",
  barcode: "",
};

const CATEGORIES = [
  "All",
  "Electronics",
  "Clothing",
  "Food",
  "Groceries",
  "Medicine",
  "Accessories",
  "Other",
] as const;

const UNITS = ["pcs", "kg", "gram", "litre", "box", "dozen", "meter"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Electronics:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Clothing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Groceries:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Medicine: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Accessories:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Other: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function ProductsPage() {
  const { data: products, isLoading } = useAllProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = (products ?? []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const openAdd = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: String(product.price),
      quantity: String(product.quantity),
      imageUrl: product.imageUrl,
      category: product.category || "Other",
      description: product.description || "",
      unit: product.unit || "pcs",
      barcode: product.barcode || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      const url = blob.getDirectURL();
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number.parseFloat(formData.price);
    const quantity = BigInt(Math.floor(Number(formData.quantity) || 0));

    if (!formData.name.trim() || Number.isNaN(price) || price < 0) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name: formData.name.trim(),
          price,
          quantity,
          imageUrl: formData.imageUrl,
          category: formData.category,
          description: formData.description.trim(),
          unit: formData.unit,
          barcode: formData.barcode.trim(),
        });
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync({
          name: formData.name.trim(),
          price,
          quantity,
          imageUrl: formData.imageUrl,
          category: formData.category,
          description: formData.description.trim(),
          unit: formData.unit,
          barcode: formData.barcode.trim(),
        });
        toast.success("Product added!");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-3"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl font-bold text-foreground mb-3">
            Products
          </h1>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  activeCategory === cat
                    ? "text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
                style={
                  activeCategory === cat
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
                      }
                    : {}
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">
              {search || activeCategory !== "All"
                ? "No products found"
                : "No products yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || activeCategory !== "All"
                ? "Try a different search or category"
                : "Tap + to add your first product"}
            </p>
          </div>
        ) : (
          <motion.div className="space-y-3">
            <AnimatePresence>
              {filtered.map((product, i) => {
                const isLowStock = Number(product.quantity) < 5;
                const categoryColor =
                  CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other;
                return (
                  <motion.div
                    key={String(product.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-2xl p-3 card-shadow flex items-center gap-3"
                  >
                    {/* Image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-display font-semibold text-sm text-foreground truncate">
                          {product.name}
                        </p>
                      </div>
                      {product.description ? (
                        <p className="text-xs text-muted-foreground truncate leading-tight mb-0.5">
                          {product.description}
                        </p>
                      ) : null}
                      <p className="text-xs font-semibold text-foreground/80 mb-1">
                        PKR {product.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Category badge */}
                        {product.category ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}
                          >
                            {product.category}
                          </span>
                        ) : null}
                        {/* Stock badge */}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            isLowStock
                              ? "bg-red-50 text-red-500 dark:bg-red-900/20"
                              : "bg-green-50 text-green-600 dark:bg-green-900/20"
                          }`}
                        >
                          {Number(product.quantity)} {product.unit || "pcs"} in
                          stock
                        </span>
                        {isLowStock && (
                          <span className="text-xs text-red-400 font-medium">
                            ⚠️ Low
                          </span>
                        )}
                      </div>
                      {product.barcode ? (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                          #{product.barcode}
                        </p>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(product.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-float no-print z-40"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
          bottom: "calc(72px + env(safe-area-inset-bottom))",
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="bg-card rounded-3xl p-6 w-full max-w-md shadow-float max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label
                    htmlFor="product-image-upload"
                    className="text-xs font-medium text-muted-foreground block mb-2"
                  >
                    Product Image
                  </label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-28 rounded-2xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors relative overflow-hidden"
                  >
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Tap to upload image
                        </span>
                      </>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 rounded-2xl">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="text-xs text-white">
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </button>
                  <input
                    id="product-image-upload"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, imageUrl: "" }))
                      }
                      className="text-xs text-red-400 mt-1"
                    >
                      Remove image
                    </button>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="product-name"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Product Name *
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Samsung Galaxy A54"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="product-description"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="product-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Short description..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  />
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="product-category"
                      className="text-xs font-medium text-muted-foreground block mb-1.5"
                    >
                      Category *
                    </label>
                    <select
                      id="product-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, category: e.target.value }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                      required
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="product-unit"
                      className="text-xs font-medium text-muted-foreground block mb-1.5"
                    >
                      Unit *
                    </label>
                    <select
                      id="product-unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, unit: e.target.value }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                      required
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="product-price"
                      className="text-xs font-medium text-muted-foreground block mb-1.5"
                    >
                      Price (PKR) *
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="0"
                      min="0"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="product-qty"
                      className="text-xs font-medium text-muted-foreground block mb-1.5"
                    >
                      Quantity *
                    </label>
                    <input
                      id="product-qty"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          quantity: e.target.value,
                        }))
                      }
                      placeholder="0"
                      min="0"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Barcode */}
                <div>
                  <label
                    htmlFor="product-barcode"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Barcode / SKU
                  </label>
                  <input
                    id="product-barcode"
                    type="text"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, barcode: e.target.value }))
                    }
                    placeholder="e.g. 1234567890123"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-11 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm transition-colors hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="flex-1 h-11 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
                      color: "white",
                    }}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingProduct ? (
                      <>
                        <Upload className="w-4 h-4" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-3xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
