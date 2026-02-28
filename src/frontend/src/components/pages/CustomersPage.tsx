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
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Edit2,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../../backend.d";
import {
  useAllCustomers,
  useAllInvoices,
  useAllSales,
  useCreateCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../../hooks/useQueries";

interface CustomerFormData {
  name: string;
  phone: string;
  dueAmount: string;
}

const emptyForm: CustomerFormData = { name: "", phone: "", dueAmount: "0" };

export default function CustomersPage() {
  const { data: customers, isLoading } = useAllCustomers();
  const { data: sales } = useAllSales();
  const { data: invoices } = useAllInvoices();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const filtered = (customers ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const openAdd = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      dueAmount: String(customer.dueAmount),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          dueAmount: Number.parseFloat(formData.dueAmount) || 0,
        });
        toast.success("Customer updated!");
      } else {
        await createCustomer.mutateAsync({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        });
        toast.success("Customer added!");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomer.mutateAsync(deleteId);
      toast.success("Customer deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const handleMarkPaid = async (customer: Customer) => {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        dueAmount: 0,
      });
      if (viewCustomer?.id === customer.id) {
        setViewCustomer({ ...customer, dueAmount: 0 });
      }
      toast.success("Payment marked as received!");
    } catch {
      toast.error("Failed to update payment");
    }
  };

  const getCustomerSales = (customerId: bigint) => {
    return (sales ?? []).filter(
      (s) => String(s.customerId) === String(customerId),
    );
  };

  const getInvoiceNumber = (invoiceId: bigint) => {
    const inv = (invoices ?? []).find(
      (i) => String(i.id) === String(invoiceId),
    );
    return inv?.invoiceNumber ?? `#${String(invoiceId)}`;
  };

  const isSaving = createCustomer.isPending || updateCustomer.isPending;

  if (viewCustomer) {
    const customerSales = getCustomerSales(viewCustomer.id);
    const currentCustomer =
      customers?.find((c) => String(c.id) === String(viewCustomer.id)) ??
      viewCustomer;

    return (
      <div className="min-h-screen bg-background">
        <div
          className="bg-card border-b border-border px-4 pb-3"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewCustomer(null)}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">
              {currentCustomer.name}
            </h1>
          </div>
        </div>

        <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-4">
          {/* Customer info card */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {currentCustomer.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-sm">
                    {currentCustomer.phone || "No phone"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewCustomer(null);
                  openEdit(currentCustomer);
                }}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {currentCustomer.dueAmount > 0 && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Outstanding Due
                  </p>
                  <p className="font-display text-lg font-bold text-amber-600">
                    PKR {currentCustomer.dueAmount.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkPaid(currentCustomer)}
                  disabled={updateCustomer.isPending}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "oklch(0.65 0.16 160)" }}
                >
                  Mark Paid
                </button>
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <h3 className="font-display font-semibold text-sm text-foreground mb-3">
              Purchase History
            </h3>
            {customerSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No purchases yet
              </p>
            ) : (
              <div className="space-y-2">
                {customerSales.map((sale) => (
                  <div
                    key={String(sale.id)}
                    className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {getInvoiceNumber(sale.invoiceId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(sale.date) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      PKR {sale.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-3"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl font-bold text-foreground mb-3">
            Customers
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
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
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">
              {search ? "No customers found" : "No customers yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try a different search"
                : "Tap + to add your first customer"}
            </p>
          </div>
        ) : (
          <motion.div className="space-y-2">
            <AnimatePresence>
              {filtered.map((customer, i) => (
                <motion.div
                  key={String(customer.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl px-4 py-3 card-shadow flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-lg"
                    style={{
                      background: "oklch(0.9 0.07 285)",
                      color: "oklch(0.45 0.18 285)",
                    }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => setViewCustomer(customer)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-sm text-foreground">
                        {customer.name}
                      </p>
                      {customer.dueAmount > 0 && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-lg">
                          PKR {customer.dueAmount.toLocaleString()} due
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {customer.phone || "No phone"}
                      </span>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewCustomer(customer)}
                      className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(customer)}
                      className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(customer.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={openAdd}
        className="fixed right-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-float no-print z-40"
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
              className="bg-card rounded-3xl p-6 w-full max-w-md shadow-float"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
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
                <div>
                  <label
                    htmlFor="customer-name"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Ahmed Ali"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer-phone"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="customer-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="03XX-XXXXXXX"
                      className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>

                {editingCustomer && (
                  <div>
                    <label
                      htmlFor="customer-due"
                      className="text-xs font-medium text-muted-foreground block mb-1.5"
                    >
                      Due Amount (PKR)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="customer-due"
                        type="number"
                        value={formData.dueAmount}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            dueAmount: e.target.value,
                          }))
                        }
                        placeholder="0"
                        min="0"
                        className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-11 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 h-11 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
                      color: "white",
                    }}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingCustomer ? (
                      "Update"
                    ) : (
                      "Add Customer"
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
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending ? (
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
