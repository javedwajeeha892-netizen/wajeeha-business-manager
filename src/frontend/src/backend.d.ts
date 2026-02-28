import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: bigint;
    name: string;
    createdAt: bigint;
    unit: string;
    description: string;
    imageUrl: string;
    barcode: string;
    quantity: bigint;
    category: string;
    price: number;
}
export interface Settings {
    ownerName: string;
    businessName: string;
    logoUrl: string;
}
export interface InvoiceItem {
    qty: bigint;
    productId: bigint;
    productName: string;
    unitPrice: number;
}
export interface Expense {
    id: bigint;
    date: bigint;
    description: string;
    category: string;
    amount: number;
}
export interface Customer {
    id: bigint;
    name: string;
    createdAt: bigint;
    phone: string;
    dueAmount: number;
}
export interface Sale {
    id: bigint;
    date: bigint;
    invoiceId: bigint;
    customerId: bigint;
    amount: number;
}
export interface Invoice {
    id: bigint;
    total: number;
    date: bigint;
    invoiceNumber: string;
    notes: string;
    customerId: bigint;
    items: Array<InvoiceItem>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomer(name: string, phone: string): Promise<Customer>;
    createExpense(amount: number, category: string, description: string): Promise<Expense>;
    createInvoice(customerId: bigint, items: Array<InvoiceItem>, total: number, notes: string): Promise<Invoice>;
    createProduct(name: string, price: number, quantity: bigint, imageUrl: string, category: string, description: string, unit: string, barcode: string): Promise<Product>;
    createSale(customerId: bigint, invoiceId: bigint, amount: number): Promise<Sale>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSales(): Promise<Array<Sale>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer>;
    getDashboardStats(): Promise<{
        totalProducts: bigint;
        totalSalesAmount: number;
        todayRevenue: number;
        totalCustomers: bigint;
    }>;
    getExpensesByCategory(category: string): Promise<Array<Expense>>;
    getExpensesByMonth(month: bigint, year: bigint): Promise<Array<Expense>>;
    getInvoice(id: bigint): Promise<Invoice>;
    getLowStockProducts(): Promise<Array<Product>>;
    getProduct(id: bigint): Promise<Product>;
    getProfitLoss(month: bigint, year: bigint): Promise<{
        expenses: number;
        sales: number;
        profit: number;
    }>;
    getSettings(): Promise<Settings>;
    getTotalSales(startDate: bigint, endDate: bigint): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCustomer(id: bigint, name: string, phone: string, dueAmount: number): Promise<Customer>;
    updateExpense(id: bigint, amount: number, category: string, description: string): Promise<Expense>;
    updateProduct(id: bigint, name: string, price: number, quantity: bigint, imageUrl: string, category: string, description: string, unit: string, barcode: string): Promise<Product>;
    updateSettings(newSettings: Settings): Promise<void>;
}
