import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Package,
  Plus,
  Printer,
  Receipt,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer, Invoice, InvoiceItem, Product } from "../../backend.d";
import {
  useAllCustomers,
  useAllInvoices,
  useAllProducts,
  useCreateInvoice,
  useCreateSale,
} from "../../hooks/useQueries";

interface CartItem {
  product: Product;
  qty: number;
}

type InvoiceView = "list" | "create" | "detail";

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useAllInvoices();
  const { data: customers } = useAllCustomers();
  const { data: products } = useAllProducts();
  const createInvoice = useCreateInvoice();
  const createSale = useCreateSale();

  const [view, setView] = useState<InvoiceView>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productQty, setProductQty] = useState("1");

  const getCustomerName = (customerId: bigint) => {
    return (
      customers?.find((c) => String(c.id) === String(customerId))?.name ??
      "Unknown"
    );
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const addToCart = () => {
    const product = products?.find((p) => String(p.id) === selectedProductId);
    if (!product) return;

    const qty = Number.parseInt(productQty) || 1;
    const existing = cart.findIndex(
      (item) => String(item.product.id) === selectedProductId,
    );

    if (existing >= 0) {
      setCart((prev) =>
        prev.map((item, i) =>
          i === existing ? { ...item, qty: item.qty + qty } : item,
        ),
      );
    } else {
      setCart((prev) => [...prev, { product, qty }]);
    }
    setSelectedProductId("");
    setProductQty("1");
  };

  const removeFromCart = (productId: bigint) => {
    setCart((prev) =>
      prev.filter((item) => String(item.product.id) !== String(productId)),
    );
  };

  const resetCreate = () => {
    setSelectedCustomerId("");
    setCart([]);
    setNotes("");
    setSelectedProductId("");
    setProductQty("1");
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    const items: InvoiceItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      qty: BigInt(item.qty),
      unitPrice: item.product.price,
    }));

    const total = getTotal();
    const customerId = BigInt(selectedCustomerId);

    try {
      const invoice = await createInvoice.mutateAsync({
        customerId,
        items,
        total,
        notes,
      });

      await createSale.mutateAsync({
        customerId,
        invoiceId: invoice.id,
        amount: total,
      });

      toast.success(`Invoice ${invoice.invoiceNumber} created!`);
      resetCreate();
      setView("list");
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  const isSaving = createInvoice.isPending || createSale.isPending;

  if (view === "detail" && selectedInvoice) {
    const customerName = getCustomerName(selectedInvoice.customerId);
    const invoiceDate = new Date(Number(selectedInvoice.date) / 1_000_000);

    return (
      <div className="min-h-screen bg-background">
        <div
          className="bg-card border-b border-border px-4 pb-3 no-print"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setSelectedInvoice(null);
                }}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="font-display text-lg font-bold text-foreground">
                {selectedInvoice.invoiceNumber}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: "oklch(0.55 0.18 285)" }}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Detail — also shows when printing */}
        <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto">
          <div
            id="invoice-print"
            className="bg-card rounded-2xl p-5 card-shadow space-y-4"
          >
            {/* Invoice header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img
                  src="/assets/generated/wajeeha-logo-transparent.dim_200x200.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">
                  Wajeeha Business Manager
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Bill To</p>
                <p className="font-medium text-sm text-foreground">
                  {customerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                <p className="font-medium text-sm text-foreground">
                  {invoiceDate.toLocaleDateString("en-PK")}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="grid grid-cols-12 text-xs text-muted-foreground font-semibold uppercase tracking-wide pb-2 border-b border-border">
                <span className="col-span-5">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-3 text-right">Total</span>
              </div>
              <div className="space-y-2 mt-2">
                {selectedInvoice.items.map((item) => (
                  <div
                    key={`${String(item.productId)}-${item.productName}`}
                    className="grid grid-cols-12 text-sm"
                  >
                    <span className="col-span-5 text-foreground">
                      {item.productName}
                    </span>
                    <span className="col-span-2 text-center text-muted-foreground">
                      {Number(item.qty)}
                    </span>
                    <span className="col-span-2 text-right text-muted-foreground">
                      {item.unitPrice.toLocaleString()}
                    </span>
                    <span className="col-span-3 text-right font-medium text-foreground">
                      {(item.unitPrice * Number(item.qty)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-display font-bold text-foreground">
                Total
              </span>
              <span
                className="font-display text-xl font-bold"
                style={{ color: "oklch(0.55 0.18 285)" }}
              >
                PKR {selectedInvoice.total.toLocaleString()}
              </span>
            </div>

            {selectedInvoice.notes && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="bg-card border-b border-border px-4 pb-3"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setView("list");
                resetCreate();
              }}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">
              Create Invoice
            </h1>
          </div>
        </div>

        <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-4">
          {/* Customer Select */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <label
              htmlFor="invoice-customer"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3"
            >
              Customer
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                id="invoice-customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 pl-9 pr-8 rounded-xl border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="">Select customer...</option>
                {(customers ?? []).map((c: Customer) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Add Products */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <label
              htmlFor="invoice-product"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3"
            >
              Add Products
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  id="invoice-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="">Select product...</option>
                  {(products ?? []).map((p: Product) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {p.name} — PKR {p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <input
                type="number"
                value={productQty}
                onChange={(e) => setProductQty(e.target.value)}
                placeholder="Qty"
                min="1"
                className="w-16 h-10 px-2 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={addToCart}
                disabled={!selectedProductId}
                className="h-10 px-4 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all text-white"
                style={{ background: "oklch(0.55 0.18 285)" }}
              >
                Add
              </button>
            </div>

            {/* Cart Items */}
            {cart.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-12 text-xs text-muted-foreground font-semibold uppercase tracking-wide pb-1 border-b border-border">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Subtotal</span>
                  <span className="col-span-2" />
                </div>
                {cart.map((item) => (
                  <div
                    key={String(item.product.id)}
                    className="grid grid-cols-12 items-center text-sm"
                  >
                    <span className="col-span-5 text-foreground truncate">
                      {item.product.name}
                    </span>
                    <span className="col-span-2 text-center text-muted-foreground">
                      {item.qty}
                    </span>
                    <span className="col-span-3 text-right font-medium text-foreground">
                      PKR {(item.product.price * item.qty).toLocaleString()}
                    </span>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-display font-bold text-sm text-foreground">
                    Total
                  </span>
                  <span
                    className="font-display font-bold text-lg"
                    style={{ color: "oklch(0.55 0.18 285)" }}
                  >
                    PKR {getTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <label
              htmlFor="invoice-notes"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3"
            >
              Notes (optional)
            </label>
            <textarea
              id="invoice-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this invoice..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateInvoice}
            disabled={isSaving || !selectedCustomerId || cart.length === 0}
            className="w-full h-13 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 shadow-float"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
              color: "white",
              height: "52px",
            }}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                Create Invoice
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <div
        className="bg-card border-b border-border px-4 pb-3"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">
            Invoices
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("create")}
            className="h-9 px-4 rounded-xl font-display font-semibold text-sm flex items-center gap-1.5 text-white"
            style={{ background: "oklch(0.55 0.18 285)" }}
          >
            <Plus className="w-4 h-4" />
            New
          </motion.button>
        </div>
      </div>

      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">
              No invoices yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap "New" to create your first invoice
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {[...(invoices ?? [])].reverse().map((invoice, i) => {
                const customer = customers?.find(
                  (c) => String(c.id) === String(invoice.customerId),
                );
                return (
                  <motion.button
                    key={String(invoice.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setView("detail");
                    }}
                    className="w-full bg-card rounded-2xl px-4 py-3.5 card-shadow flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.92 0.06 285)" }}
                    >
                      <Receipt
                        className="w-5 h-5"
                        style={{ color: "oklch(0.45 0.18 285)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {customer?.name ?? "Unknown Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm text-foreground">
                        PKR {invoice.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(
                          Number(invoice.date) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
