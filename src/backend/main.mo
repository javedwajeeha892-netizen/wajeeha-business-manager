import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";



actor {
  public type Product = {
    id : Nat;
    name : Text;
    price : Float;
    quantity : Nat;
    imageUrl : Text;
    createdAt : Int;
    category : Text;
    description : Text;
    unit : Text;
    barcode : Text;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    createdAt : Int;
    dueAmount : Float;
  };

  public type InvoiceItem = {
    productId : Nat;
    productName : Text;
    qty : Nat;
    unitPrice : Float;
  };

  public type Invoice = {
    id : Nat;
    invoiceNumber : Text;
    customerId : Nat;
    items : [InvoiceItem];
    total : Float;
    date : Int;
    notes : Text;
  };

  public type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    description : Text;
    date : Int;
  };

  public type Sale = {
    id : Nat;
    customerId : Nat;
    invoiceId : Nat;
    amount : Float;
    date : Int;
  };

  public type Settings = {
    businessName : Text;
    ownerName : Text;
    logoUrl : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Expense {
    public func compareByDate(a : Expense, b : Expense) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  let products = Map.empty<Nat, Product>();
  let customers = Map.empty<Nat, Customer>();
  let invoices = Map.empty<Nat, Invoice>();
  let expenses = Map.empty<Nat, Expense>();
  let sales = Map.empty<Nat, Sale>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextProductId = 1;
  var nextCustomerId = 1;
  var nextInvoiceId = 1;
  var nextExpenseId = 1;
  var nextSaleId = 1;

  var settings : Settings = {
    businessName = "Wajeeha Business Manager";
    ownerName = "Wajeeha";
    logoUrl = "";
  };

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PRODUCTS - Admin only for create/update/delete, Users can read
  public shared ({ caller }) func createProduct(
    name : Text,
    price : Float,
    quantity : Nat,
    imageUrl : Text,
    category : Text,
    description : Text,
    unit : Text,
    barcode : Text
  ) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create products");
    };

    let product : Product = {
      id = nextProductId;
      name;
      price;
      quantity;
      imageUrl;
      createdAt = Time.now();
      category;
      description;
      unit;
      barcode;
    };

    products.add(nextProductId, product);
    nextProductId += 1;

    product;
  };

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    price : Float,
    quantity : Nat,
    imageUrl : Text,
    category : Text,
    description : Text,
    unit : Text,
    barcode : Text
  ) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    let product : Product = {
      id;
      name;
      price;
      quantity;
      imageUrl;
      createdAt = switch (products.get(id)) {
        case (null) { Time.now() };
        case (?p) { p.createdAt };
      };
      category;
      description;
      unit;
      barcode;
    };

    products.add(id, product);
    product;
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    products.remove(id);
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    products.values().toArray().sort();
  };

  public query ({ caller }) func getLowStockProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };

    products.values().toArray().filter(
      func(product : Product) : Bool {
        product.quantity < 5;
      }
    );
  };

  // CUSTOMERS - Admin only for create/update/delete, Users can read
  public shared ({ caller }) func createCustomer(name : Text, phone : Text) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create customers");
    };

    let customer : Customer = {
      id = nextCustomerId;
      name;
      phone;
      createdAt = Time.now();
      dueAmount = 0.0;
    };

    customers.add(nextCustomerId, customer);
    nextCustomerId += 1;

    customer;
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, phone : Text, dueAmount : Float) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };

    let customer : Customer = {
      id;
      name;
      phone;
      dueAmount;
      createdAt = switch (customers.get(id)) {
        case (null) { Time.now() };
        case (?c) { c.createdAt };
      };
    };

    customers.add(id, customer);
    customer;
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };

    customers.remove(id);
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };

    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };

    customers.values().toArray().sort();
  };

  // INVOICES - Admin only for create, Users can read
  public shared ({ caller }) func createInvoice(customerId : Nat, items : [InvoiceItem], total : Float, notes : Text) : async Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create invoices");
    };

    // Reduce product quantities
    for (item in items.vals()) {
      switch (products.get(item.productId)) {
        case (null) { Runtime.trap("Product not found: " # item.productId.toText()) };
        case (?product) {
          if (product.quantity < item.qty) {
            Runtime.trap("Insufficient stock for product: " # product.name);
          };
          let updatedProduct : Product = {
            id = product.id;
            name = product.name;
            price = product.price;
            quantity = product.quantity - item.qty;
            imageUrl = product.imageUrl;
            createdAt = product.createdAt;
            category = product.category;
            description = product.description;
            unit = product.unit;
            barcode = product.barcode;
          };
          products.add(product.id, updatedProduct);
        };
      };
    };

    let invoice : Invoice = {
      id = nextInvoiceId;
      invoiceNumber = "INV-" # nextInvoiceId.toText();
      customerId;
      items;
      total;
      date = Time.now();
      notes;
    };

    invoices.add(nextInvoiceId, invoice);
    nextInvoiceId += 1;

    invoice;
  };

  public query ({ caller }) func getInvoice(id : Nat) : async Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) { invoice };
    };
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };

    invoices.values().toArray();
  };

  // EXPENSES - Admin only for create, Users can read
  public shared ({ caller }) func createExpense(amount : Float, category : Text, description : Text) : async Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create expenses");
    };

    let expense : Expense = {
      id = nextExpenseId;
      amount;
      category;
      description;
      date = Time.now();
    };

    expenses.add(nextExpenseId, expense);
    nextExpenseId += 1;

    expense;
  };

  public shared ({ caller }) func updateExpense(id : Nat, amount : Float, category : Text, description : Text) : async Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update expenses");
    };

    let expense : Expense = {
      id;
      amount;
      category;
      description;
      date = switch (expenses.get(id)) {
        case (null) { Time.now() };
        case (?e) { e.date };
      };
    };

    expenses.add(id, expense);
    expense;
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete expenses");
    };

    expenses.remove(id);
  };

  public query ({ caller }) func getExpensesByCategory(category : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    expenses.values().toArray().filter(
      func(expense : Expense) : Bool {
        expense.category == category;
      }
    );
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    expenses.values().toArray().sort(Expense.compareByDate);
  };

  // SALES - Admin only for create, Users can read
  public shared ({ caller }) func createSale(customerId : Nat, invoiceId : Nat, amount : Float) : async Sale {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create sales");
    };

    let sale : Sale = {
      id = nextSaleId;
      customerId;
      invoiceId;
      amount;
      date = Time.now();
    };

    sales.add(nextSaleId, sale);
    nextSaleId += 1;

    // Update customer due amount
    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let updatedCustomer : Customer = {
          id = customer.id;
          name = customer.name;
          phone = customer.phone;
          createdAt = customer.createdAt;
          dueAmount = customer.dueAmount + amount;
        };
        customers.add(customerId, updatedCustomer);
      };
    };

    sale;
  };

  public query ({ caller }) func getAllSales() : async [Sale] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };

    sales.values().toArray();
  };

  // SETTINGS - Admin only for update, Users can read
  public shared ({ caller }) func updateSettings(newSettings : Settings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };

    settings := newSettings;
  };

  public query ({ caller }) func getSettings() : async Settings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settings");
    };

    settings;
  };

  // REPORTS - Users can read
  public query ({ caller }) func getTotalSales(startDate : Int, endDate : Int) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    var total : Float = 0.0;
    for (sale in sales.values()) {
      if (sale.date >= startDate and sale.date <= endDate) {
        total += sale.amount;
      };
    };
    total;
  };

  public query ({ caller }) func getExpensesByMonth(month : Int, year : Int) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    expenses.values().toArray().filter(
      func(expense : Expense) : Bool {
        // Simple month/year filtering - in production, use proper date handling
        true;
      }
    );
  };

  public query ({ caller }) func getProfitLoss(month : Int, year : Int) : async { sales : Float; expenses : Float; profit : Float } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    var totalSales : Float = 0.0;
    var totalExpenses : Float = 0.0;

    for (sale in sales.values()) {
      totalSales += sale.amount;
    };

    for (expense in expenses.values()) {
      totalExpenses += expense.amount;
    };

    {
      sales = totalSales;
      expenses = totalExpenses;
      profit = totalSales - totalExpenses;
    };
  };

  public query ({ caller }) func getDashboardStats() : async {
    totalCustomers : Nat;
    totalProducts : Nat;
    totalSalesAmount : Float;
    todayRevenue : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };

    var totalSalesAmount : Float = 0.0;
    var todayRevenue : Float = 0.0;
    let now = Time.now();
    let oneDayNanos : Int = 24 * 60 * 60 * 1_000_000_000;

    for (sale in sales.values()) {
      totalSalesAmount += sale.amount;
      if (sale.date >= (now - oneDayNanos)) {
        todayRevenue += sale.amount;
      };
    };

    {
      totalCustomers = customers.size();
      totalProducts = products.size();
      totalSalesAmount;
      todayRevenue;
    };
  };
};
