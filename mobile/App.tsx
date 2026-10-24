
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import {
  loginUser,
  registerUser,
  logoutUser,
  placeOrder,
  getUserOrders,
  createServiceRequest,
  getMyServiceRequests,
  submitDealerApplication,
  getMyDealerApplication,
} from "./firebaseService";

type Category =
  | "All"
  | "Purifiers"
  | "Filters"
  | "Pumps"
  | "Dispensers"
  | "Spares";

type Product = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  description: string;
  icon: string;
};

type CartItem = { product: Product; quantity: number };
type Screen = "shop" | "cart" | "account" | "checkout" | "orders" | "service" | "dealer";

const categories: Category[] = [
  "All",
  "Purifiers",
  "Filters",
  "Pumps",
  "Dispensers",
  "Spares",
];

// Demonstration products and prices. Replace with verified inventory before launch.
const products: Product[] = [
  { id: "p01", name: "RO Water Purifier", category: "Purifiers", price: 8999, description: "Multi-stage purification", icon: "💧" },
  { id: "p02", name: "RO+UV Purifier", category: "Purifiers", price: 11999, description: "RO and UV protection", icon: "🚰" },
  { id: "p03", name: "UV Water Purifier", category: "Purifiers", price: 6499, description: "UV purification system", icon: "💦" },
  { id: "p04", name: "UF Water Purifier", category: "Purifiers", price: 3999, description: "Ultrafiltration system", icon: "💧" },
  { id: "p05", name: "Copper RO Purifier", category: "Purifiers", price: 13999, description: "Copper-enriched water system", icon: "🫗" },
  { id: "p06", name: "Alkaline Water Purifier", category: "Purifiers", price: 14999, description: "Alkaline filtration system", icon: "💧" },
  { id: "p07", name: "Commercial RO System", category: "Purifiers", price: 24999, description: "High-capacity purification", icon: "🏭" },
  { id: "p08", name: "Wall Mount Purifier", category: "Purifiers", price: 7999, description: "Space-saving design", icon: "🚰" },
  { id: "p09", name: "Under Sink Purifier", category: "Purifiers", price: 10999, description: "Concealed water filtration", icon: "💧" },
  { id: "p10", name: "Portable Water Filter", category: "Purifiers", price: 1499, description: "Compact filtration option", icon: "🧴" },
  { id: "p11", name: "Sediment Filter", category: "Filters", price: 299, description: "Captures suspended particles", icon: "🧰" },
  { id: "p12", name: "Activated Carbon Filter", category: "Filters", price: 499, description: "Helps reduce chlorine and odour", icon: "⚫" },
  { id: "p13", name: "RO Membrane 75 GPD", category: "Filters", price: 1299, description: "Replacement RO membrane", icon: "🔧" },
  { id: "p14", name: "RO Membrane 100 GPD", category: "Filters", price: 1599, description: "High-capacity membrane", icon: "🔧" },
  { id: "p15", name: "UF Filter Cartridge", category: "Filters", price: 599, description: "UF replacement cartridge", icon: "🧰" },
  { id: "p16", name: "Inline Carbon Filter", category: "Filters", price: 399, description: "Inline carbon filtration", icon: "⚫" },
  { id: "p17", name: "Mineral Filter", category: "Filters", price: 499, description: "Mineral cartridge", icon: "💎" },
  { id: "p18", name: "Alkaline Filter", category: "Filters", price: 799, description: "Alkaline media cartridge", icon: "💧" },
  { id: "p19", name: "Iron Removal Filter", category: "Filters", price: 999, description: "Iron-reduction filter", icon: "🧰" },
  { id: "p20", name: "Whole House Filter", category: "Filters", price: 2499, description: "Main-line water filtration", icon: "🏠" },
  { id: "p21", name: "RO Booster Pump 75 GPD", category: "Pumps", price: 1299, description: "Booster pump for compatible RO systems", icon: "⚙️" },
  { id: "p22", name: "RO Booster Pump 100 GPD", category: "Pumps", price: 1599, description: "Higher-capacity booster pump", icon: "⚙️" },
  { id: "p23", name: "Pressure Pump", category: "Pumps", price: 1899, description: "Water pressure support", icon: "🔩" },
  { id: "p24", name: "Feed Water Pump", category: "Pumps", price: 1499, description: "Feed pump for compatible systems", icon: "⚙️" },
  { id: "p25", name: "Mini Transfer Pump", category: "Pumps", price: 999, description: "Compact water transfer pump", icon: "💦" },
  { id: "p26", name: "Self Priming Pump", category: "Pumps", price: 2299, description: "Self-priming pump option", icon: "🔩" },
  { id: "p27", name: "Commercial RO Pump", category: "Pumps", price: 3499, description: "Commercial system pump", icon: "⚙️" },
  { id: "p28", name: "Booster Pump Adapter", category: "Pumps", price: 299, description: "Compatible pump power adapter", icon: "🔌" },
  { id: "p29", name: "Pressure Switch Pump Kit", category: "Pumps", price: 449, description: "Pump control kit", icon: "🧰" },
  { id: "p30", name: "Pump Mounting Kit", category: "Pumps", price: 249, description: "Mounting accessories", icon: "🔩" },
  { id: "p31", name: "Tabletop Water Dispenser", category: "Dispensers", price: 2499, description: "Compact dispenser", icon: "🚰" },
  { id: "p32", name: "Hot and Cold Dispenser", category: "Dispensers", price: 6999, description: "Hot and cold water options", icon: "🥤" },
  { id: "p33", name: "Bottom Load Dispenser", category: "Dispensers", price: 8999, description: "Convenient bottle loading", icon: "💧" },
  { id: "p34", name: "Floor Standing Dispenser", category: "Dispensers", price: 4499, description: "Floor-standing design", icon: "🚰" },
  { id: "p35", name: "Office Water Dispenser", category: "Dispensers", price: 5999, description: "For shared spaces", icon: "🏢" },
  { id: "p36", name: "Manual Water Dispenser", category: "Dispensers", price: 499, description: "Simple manual dispensing", icon: "🫗" },
  { id: "p37", name: "Bottle Top Dispenser", category: "Dispensers", price: 299, description: "Bottle-top dispensing unit", icon: "🧴" },
  { id: "p38", name: "Stainless Steel Dispenser", category: "Dispensers", price: 3499, description: "Stainless steel body", icon: "🥤" },
  { id: "p39", name: "Commercial Dispenser", category: "Dispensers", price: 9999, description: "Higher-capacity dispensing", icon: "🏢" },
  { id: "p40", name: "Dispenser Drip Tray", category: "Dispensers", price: 199, description: "Replacement drip tray", icon: "🧰" },
  { id: "p41", name: "RO Faucet", category: "Spares", price: 249, description: "Replacement water tap", icon: "🔧" },
  { id: "p42", name: "Food Grade Tubing", category: "Spares", price: 199, description: "Tubing for compatible systems", icon: "〰️" },
  { id: "p43", name: "Filter Housing", category: "Spares", price: 399, description: "Replacement housing", icon: "🧰" },
  { id: "p44", name: "SMPS Power Supply", category: "Spares", price: 499, description: "Power supply for compatible units", icon: "🔌" },
  { id: "p45", name: "Float Valve", category: "Spares", price: 149, description: "Automatic tank-level valve", icon: "🔩" },
  { id: "p46", name: "Solenoid Valve", category: "Spares", price: 349, description: "Electric water control valve", icon: "⚙️" },
  { id: "p47", name: "Flow Restrictor", category: "Spares", price: 129, description: "RO flow-control component", icon: "🧰" },
  { id: "p48", name: "TDS Meter", category: "Spares", price: 399, description: "Measures total dissolved solids", icon: "📟" },
  { id: "p49", name: "Leakage Detector", category: "Spares", price: 599, description: "Water leak detection device", icon: "💧" },
  { id: "p50", name: "RO Installation Kit", category: "Spares", price: 699, description: "Basic compatible fittings kit", icon: "🧰" },
];

const money = (value: number) => "₹" + value.toLocaleString("en-IN");

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [screen, setScreen] = useState<Screen>("shop");
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [servicePhone, setServicePhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceType, setServiceType] = useState("Installation");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [serviceBusy, setServiceBusy] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [dealerApplication, setDealerApplication] = useState<any[]>([]);
  const [dealerBusy, setDealerBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  async function handleAuth() {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (registering) {
        await registerUser(email, password);
        Alert.alert("Account created", "Your Califnco account is ready.");
      } else {
        await loginUser(email, password);
      }
    } catch (error: any) {
      Alert.alert(
        registering ? "Registration failed" : "Login failed",
        error?.message ?? "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      setEmail("");
      setPassword("");
      setCart([]);
      setScreen("shop");
    } catch (error: any) {
      Alert.alert("Sign out failed", error?.message ?? "Please try again.");
    }
  }

  function addToCart(product: Product) {
    setCart((old) => {
      const existing = old.find((item) => item.product.id === product.id);
      if (existing) {
        return old.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...old, { product, quantity: 1 }];
    });
    Alert.alert("Added to cart", product.name);
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((old) =>
      old
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function loadOrders() {
    if (!user) return;

    setOrdersLoading(true);
    try {
      const result = await getUserOrders(user.uid);
      setOrders(result);
    } catch (error: any) {
      Alert.alert("Could not load orders", error?.message ?? "Please try again.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadServiceRequests() {
    setServiceBusy(true);
    try { setServiceRequests(await getMyServiceRequests()); }
    catch (error: any) { Alert.alert("Could not load service requests", error?.message ?? "Please try again."); }
    finally { setServiceBusy(false); }
  }

  async function handleServiceBooking() {
    if (!/^[0-9]{10}$/.test(servicePhone.trim())) { Alert.alert("Phone required", "Enter a 10-digit phone number."); return; }
    setServiceBusy(true);
    try {
      const id = await createServiceRequest({ customerName: serviceName, phone: servicePhone, address: serviceAddress, serviceType, preferredDate: serviceDate, notes: serviceNotes });
      Alert.alert("Request submitted", `Your service request ID is ${id}.`);
      setServiceNotes(""); await loadServiceRequests();
    } catch (error: any) { Alert.alert("Booking failed", error?.message ?? "Please try again."); }
    finally { setServiceBusy(false); }
  }

  async function loadDealerApplication() {
    setDealerBusy(true);
    try { setDealerApplication(await getMyDealerApplication()); }
    catch (error: any) { Alert.alert("Could not load application", error?.message ?? "Please try again."); }
    finally { setDealerBusy(false); }
  }

  async function handleDealerApplication() {
    setDealerBusy(true);
    try {
      await submitDealerApplication({ businessName, contactName, contactPhone, businessAddress, taxId });
      Alert.alert("Application submitted", "Your dealer application is pending admin review.");
      await loadDealerApplication();
    } catch (error: any) { Alert.alert("Application failed", error?.message ?? "Please try again."); }
    finally { setDealerBusy(false); }
  }

  async function handleCheckout() {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in before ordering.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Cart is empty", "Add products before checkout.");
      return;
    }
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert(
        "Delivery details required",
        "Enter your name, phone number and delivery address.",
      );
      return;
    }
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert("Invalid phone number", "Enter a 10-digit phone number.");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderId = await placeOrder(user.uid, {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        items: cart.map(({ product, quantity }) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })),
        subtotal: total,
      });

      setCart([]);
      await loadOrders();
      setScreen("orders");

      Alert.alert(
        "Order placed",
        `Your order was saved successfully.\nOrder ID: ${orderId}`,
      );
    } catch (error: any) {
      Alert.alert("Could not place order", error?.message ?? "Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#17434b" />
        <Text style={styles.muted}>Loading Califnco...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f8f8" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.authContainer}>
            <Text style={styles.brand}>califnco</Text>
            <Text style={styles.tagline}>PURE WATER. BETTER LIVING.</Text>

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>WELCOME TO CALIFNCO</Text>
              <Text style={styles.heroTitle}>
                {registering ? "Create your account." : "Welcome back."}
              </Text>
              <Text style={styles.subtitle}>
                Sign in to explore your water solutions store.
              </Text>
            </View>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#839397"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#839397"
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabled]}
              onPress={handleAuth}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {registering ? "Create account" : "Sign in"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setRegistering(!registering)}
              disabled={submitting}
            >
              <Text style={styles.switchText}>
                {registering
                  ? "Already have an account? Sign in"
                  : "New customer? Create an account"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>Secure access powered by Firebase</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f8f8" />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>califnco</Text>
          <Text style={styles.smallTagline}>PURE WATER. BETTER LIVING.</Text>
        </View>
        <TouchableOpacity
          style={styles.cartBubble}
          onPress={() => setScreen("cart")}
        >
          <Text style={styles.cartBubbleText}>Cart · {cartCount}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nav}>
        {(["shop", "cart", "orders", "service", "dealer", "account"] as Screen[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={async () => {
              setScreen(tab);
              if (tab === "orders") await loadOrders();
              if (tab === "service") await loadServiceRequests();
              if (tab === "dealer") await loadDealerApplication();
            }}
            style={[styles.navButton, screen === tab && styles.navActive]}
          >
            <Text style={[styles.navText, screen === tab && styles.navTextActive]}>
              {tab === "shop"
                ? "Shop"
                : tab === "cart"
                  ? `Cart (${cartCount})`
                  : tab === "orders"
                    ? "Orders"
                    : tab === "service"
                      ? "Service"
                      : tab === "dealer"
                        ? "Dealer"
                        : "Account"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {screen === "shop" && (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.shopHero}>
            <Text style={styles.eyebrow}>YOUR WATER, YOUR WAY</Text>
            <Text style={styles.heroTitle}>Find your perfect water solution.</Text>
            <Text style={styles.subtitle}>
              Explore purifiers, filters, pumps and accessories.
            </Text>
            <Text style={styles.productCount}>50 products · Sample catalogue</Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#839397"
            style={styles.searchInput}
            returnKeyType="search"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryChip,
                  category === item && styles.categorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item && styles.categoryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>
            {category === "All" ? "Popular water solutions" : category}
          </Text>
          <Text style={styles.resultText}>
            {filteredProducts.length} products found
          </Text>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.muted}>Try another search or category.</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productArtwork}>
                    <Text style={styles.productIcon}>{product.icon}</Text>
                  </View>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>
                    {product.description}
                  </Text>
                  <Text style={styles.price}>{money(product.price)}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(product)}
                  >
                    <Text style={styles.addButtonText}>+ Add to cart</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.footer}>
            Sample catalogue. Confirm product compatibility and prices before purchase.
          </Text>
        </ScrollView>
      )}

      {screen === "cart" && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Your shopping cart</Text>
          <Text style={styles.muted}>
            {cartCount} item{cartCount === 1 ? "" : "s"} in your cart
          </Text>

          {cart.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.productIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.muted}>Browse the catalogue to add products.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setScreen("shop")}
              >
                <Text style={styles.primaryButtonText}>Explore products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {cart.map(({ product, quantity }) => (
                <View key={product.id} style={styles.cartItem}>
                  <View style={styles.cartIcon}>
                    <Text style={styles.productIcon}>{product.icon}</Text>
                  </View>
                  <View style={styles.cartInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.price}>{money(product.price)}</Text>
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => changeQuantity(product.id, -1)}
                      >
                        <Text style={styles.quantityText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityNumber}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => changeQuantity(product.id, 1)}
                      >
                        <Text style={styles.quantityText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>
                    {money(product.price * quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalPrice}>{money(total)}</Text>
                <Text style={styles.muted}>
                  Shipping and applicable taxes are not included.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setScreen("checkout")}
                >
                  <Text style={styles.primaryButtonText}>Continue to checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {screen === "checkout" && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <Text style={styles.muted}>Order subtotal: {money(total)}</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Enter your full name"
            placeholderTextColor="#839397"
            style={styles.input}
          />

          <Text style={styles.label}>10-digit phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            placeholderTextColor="#839397"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          <Text style={styles.label}>Delivery address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="House number, street, city, PIN code"
            placeholderTextColor="#839397"
            multiline
            style={[styles.input, styles.addressInput]}
          />

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Order subtotal</Text>
            <Text style={styles.totalPrice}>{money(total)}</Text>
            <Text style={styles.muted}>
              Demo checkout. No payment will be collected.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, placingOrder && styles.disabled]}
              onPress={handleCheckout}
              disabled={placingOrder}
            >
              {placingOrder ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Place order</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setScreen("cart")}
              disabled={placingOrder}
            >
              <Text style={styles.switchText}>Back to cart</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {screen === "orders" && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Your orders</Text>
          <Text style={styles.muted}>Orders saved to your Firebase account.</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={loadOrders}
            disabled={ordersLoading}
          >
            <Text style={styles.addButtonText}>Refresh orders</Text>
          </TouchableOpacity>

          {ordersLoading ? (
            <ActivityIndicator
              size="large"
              color="#17434b"
              style={styles.loadingOrders}
            />
          ) : orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.muted}>
                Your placed orders will appear here.
              </Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.totalCard}>
                <Text style={styles.productName}>
                  Order #{order.id.slice(0, 8)}
                </Text>
                <Text style={styles.price}>
                  {money(Number(order.subtotal ?? 0))}
                </Text>
                <Text style={styles.muted}>Status: {order.status ?? "placed"}</Text>
                <Text style={styles.muted}>Delivery to: {order.address}</Text>
                {(order.items ?? []).map((item: any, index: number) => (
                  <Text
                    key={`${order.id}-${index}`}
                    style={styles.productDescription}
                  >
                    {item.name} × {item.quantity}
                  </Text>
                ))}
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen("shop")}
          >
            <Text style={styles.primaryButtonText}>Continue shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {screen === "service" && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Book a service</Text>
          <Text style={styles.muted}>Request installation, maintenance, or repair.</Text>
          <Text style={styles.label}>Full name</Text><TextInput value={serviceName} onChangeText={setServiceName} placeholder="Your name" placeholderTextColor="#839397" style={styles.input} />
          <Text style={styles.label}>Phone number</Text><TextInput value={servicePhone} onChangeText={setServicePhone} placeholder="10-digit phone number" placeholderTextColor="#839397" keyboardType="phone-pad" maxLength={10} style={styles.input} />
          <Text style={styles.label}>Service address</Text><TextInput value={serviceAddress} onChangeText={setServiceAddress} placeholder="Full address" placeholderTextColor="#839397" style={[styles.input, styles.addressInput]} multiline />
          <Text style={styles.label}>Service type</Text>
          {(["Installation", "Maintenance", "Repair", "Filter replacement"] as const).map(t => <TouchableOpacity key={t} style={[styles.categoryChip, serviceType === t && styles.categorySelected]} onPress={() => setServiceType(t)}><Text style={[styles.categoryText, serviceType === t && styles.categoryTextSelected]}>{t}</Text></TouchableOpacity>)}
          <Text style={styles.label}>Preferred date (optional)</Text><TextInput value={serviceDate} onChangeText={setServiceDate} placeholder="YYYY-MM-DD" placeholderTextColor="#839397" style={styles.input} />
          <Text style={styles.label}>Notes (optional)</Text><TextInput value={serviceNotes} onChangeText={setServiceNotes} placeholder="Describe the issue" placeholderTextColor="#839397" style={[styles.input, styles.addressInput]} multiline />
          <TouchableOpacity style={styles.primaryButton} disabled={serviceBusy} onPress={handleServiceBooking}>{serviceBusy ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Submit service request</Text>}</TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={loadServiceRequests}><Text style={styles.addButtonText}>Refresh my requests</Text></TouchableOpacity>
          {serviceRequests.map(r => <View key={r.id} style={styles.totalCard}><Text style={styles.productName}>{r.serviceType}</Text><Text style={styles.muted}>Status: {r.status}</Text><Text style={styles.muted}>{r.address}</Text><Text style={styles.muted}>Preferred date: {r.preferredDate || "Not specified"}</Text></View>)}
        </ScrollView>
      )}

      {screen === "dealer" && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Dealer registration</Text>
          <Text style={styles.muted}>Apply for wholesale access. Admin approval is required; this form does not grant dealer privileges.</Text>
          <Text style={styles.label}>Business name</Text><TextInput value={businessName} onChangeText={setBusinessName} placeholder="Registered business name" placeholderTextColor="#839397" style={styles.input} />
          <Text style={styles.label}>Contact person</Text><TextInput value={contactName} onChangeText={setContactName} placeholder="Contact name" placeholderTextColor="#839397" style={styles.input} />
          <Text style={styles.label}>Contact phone</Text><TextInput value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" placeholderTextColor="#839397" keyboardType="phone-pad" style={styles.input} />
          <Text style={styles.label}>Business address</Text><TextInput value={businessAddress} onChangeText={setBusinessAddress} placeholder="Business address" placeholderTextColor="#839397" style={[styles.input, styles.addressInput]} multiline />
          <Text style={styles.label}>GSTIN / tax ID (optional)</Text><TextInput value={taxId} onChangeText={setTaxId} placeholder="Tax ID" placeholderTextColor="#839397" autoCapitalize="characters" style={styles.input} />
          <TouchableOpacity style={styles.primaryButton} disabled={dealerBusy} onPress={handleDealerApplication}>{dealerBusy ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Submit dealer application</Text>}</TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={loadDealerApplication}><Text style={styles.addButtonText}>Check application status</Text></TouchableOpacity>
          {dealerApplication.map(a => <View key={a.id} style={styles.totalCard}><Text style={styles.productName}>{a.businessName}</Text><Text style={styles.muted}>Application status: {a.status}</Text></View>)}
        </ScrollView>
      )}

      {screen === "account" && (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.shopHero}>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.heroTitle}>You're signed in.</Text>
            <Text style={styles.subtitle}>Welcome to your Califnco account.</Text>
          </View>

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.email?.[0] ?? "C").toUpperCase()}
              </Text>
            </View>
            <Text style={styles.accountLabel}>Signed in with Firebase</Text>
            <Text style={styles.email}>{user.email ?? "Email unavailable"}</Text>
            <Text style={styles.muted}>Customer account</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              setScreen("orders");
              await loadOrders();
            }}
          >
            <Text style={styles.primaryButtonText}>View order history</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
            <Text style={styles.primaryButtonText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f3f8f8" },
  center: {
    flex: 1,
    backgroundColor: "#f3f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  authContainer: { padding: 26, paddingTop: 36, flexGrow: 1 },
  page: { padding: 18, paddingBottom: 35 },
  brand: { color: "#17434b", fontSize: 34, fontWeight: "900", letterSpacing: -1.8 },
  tagline: {
    color: "#71878a",
    fontSize: 12,
    letterSpacing: 2.5,
    marginTop: 4,
    marginBottom: 36,
  },
  smallTagline: { color: "#71878a", fontSize: 9, letterSpacing: 1.4, marginTop: 2 },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartBubble: { backgroundColor: "#dcefed", borderRadius: 20, paddingVertical: 11, paddingHorizontal: 13 },
  cartBubbleText: { color: "#17434b", fontWeight: "800", fontSize: 13 },
  nav: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  navButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "#e8f0f0" },
  navActive: { backgroundColor: "#17434b" },
  navText: { color: "#527074", fontWeight: "700", fontSize: 12 },
  navTextActive: { color: "#ffffff" },
  hero: { backgroundColor: "#dcefed", borderRadius: 24, padding: 24, marginBottom: 28 },
  shopHero: { backgroundColor: "#dcefed", borderRadius: 22, padding: 20, marginBottom: 18 },
  eyebrow: { color: "#387a75", fontWeight: "800", fontSize: 11, letterSpacing: 1.6, marginBottom: 10 },
  heroTitle: { color: "#173f47", fontSize: 29, fontWeight: "800", lineHeight: 36 },
  subtitle: { color: "#60787d", fontSize: 15, lineHeight: 23, marginTop: 10 },
  productCount: { color: "#387a75", fontSize: 12, fontWeight: "800", marginTop: 14 },
  label: { color: "#173f47", fontWeight: "700", fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#dce6e6",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#173f47",
    marginBottom: 20,
  },
  addressInput: { minHeight: 100, textAlignVertical: "top" },
  searchInput: { backgroundColor: "#ffffff", borderColor: "#dce6e6", borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, color: "#173f47", marginBottom: 14 },
  categoryScroll: { marginBottom: 20, flexGrow: 0 },
  categoryRow: { gap: 8, paddingRight: 8 },
  categoryChip: { backgroundColor: "#ffffff", borderColor: "#dce6e6", borderWidth: 1, borderRadius: 22, paddingVertical: 9, paddingHorizontal: 14 },
  categorySelected: { backgroundColor: "#17434b", borderColor: "#17434b" },
  categoryText: { color: "#527074", fontSize: 12, fontWeight: "700" },
  categoryTextSelected: { color: "#ffffff" },
  sectionTitle: { color: "#173f47", fontSize: 22, fontWeight: "800", marginBottom: 5 },
  resultText: { color: "#71878a", fontSize: 12, marginBottom: 14 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCard: { width: "48%", flexGrow: 1, flexBasis: "44%", backgroundColor: "#ffffff", borderRadius: 17, padding: 12, marginBottom: 2 },
  productArtwork: { height: 96, borderRadius: 13, backgroundColor: "#eaf5f3", alignItems: "center", justifyContent: "center", marginBottom: 11 },
  productIcon: { fontSize: 36 },
  productCategory: { color: "#387a75", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 5 },
  productName: { color: "#173f47", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  productDescription: { color: "#71878a", fontSize: 11, lineHeight: 16, marginTop: 5, minHeight: 16 },
  price: { color: "#17434b", fontSize: 16, fontWeight: "900", marginTop: 10 },
  addButton: { backgroundColor: "#17434b", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center", marginTop: 11 },
  addButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  primaryButton: { backgroundColor: "#17434b", borderRadius: 15, padding: 17, alignItems: "center", justifyContent: "center", minHeight: 54, marginTop: 8 },
  disabled: { opacity: 0.65 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  switchButton: { padding: 18, alignItems: "center" },
  switchText: { color: "#236c69", fontSize: 15, fontWeight: "700", textAlign: "center" },
  footer: { color: "#87989a", fontSize: 11, textAlign: "center", marginTop: 24, marginBottom: 10, lineHeight: 17 },
  emptyCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 24, alignItems: "center", marginTop: 16 },
  emptyTitle: { color: "#173f47", fontSize: 18, fontWeight: "800", marginVertical: 8 },
  cartItem: { backgroundColor: "#ffffff", borderRadius: 16, padding: 12, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  cartIcon: { width: 58, height: 58, borderRadius: 12, backgroundColor: "#eaf5f3", alignItems: "center", justifyContent: "center" },
  cartInfo: { flex: 1 },
  lineTotal: { color: "#17434b", fontWeight: "800", fontSize: 12 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 13, marginTop: 9 },
  quantityButton: { width: 29, height: 29, borderRadius: 9, backgroundColor: "#dcefed", alignItems: "center", justifyContent: "center" },
  quantityText: { color: "#17434b", fontSize: 19, fontWeight: "800" },
  quantityNumber: { color: "#173f47", fontWeight: "800", fontSize: 14 },
  totalCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 18, marginTop: 18 },
  totalLabel: { color: "#71878a", fontSize: 14 },
  totalPrice: { color: "#173f47", fontSize: 27, fontWeight: "900", marginVertical: 5 },
  accountCard: { backgroundColor: "#ffffff", borderRadius: 22, padding: 24, alignItems: "center", marginBottom: 22 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#dcefed", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  avatarText: { color: "#17434b", fontSize: 30, fontWeight: "800" },
  accountLabel: { color: "#71878a", fontSize: 14, marginBottom: 8 },
  email: { color: "#173f47", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  muted: { color: "#71878a", fontSize: 14, lineHeight: 21 },
  loadingOrders: { marginTop: 24 },
});
