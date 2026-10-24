
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export async function registerUser(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    email: credential.user.email,
    role: "customer",
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export type OrderProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type NewOrder = {
  customerName: string;
  phone: string;
  address: string;
  items: OrderProduct[];
  subtotal: number;
};

export async function placeOrder(
  userId: string,
  order: NewOrder,
): Promise<string> {
  if (auth.currentUser?.uid !== userId) {
    throw new Error("Please sign in again before placing your order.");
  }

  if (order.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  if (
    !order.customerName.trim() ||
    !order.phone.trim() ||
    !order.address.trim()
  ) {
    throw new Error("Please enter your name, phone number and address.");
  }

  const orderRef = await addDoc(collection(db, "orders"), {
    userId,
    customerName: order.customerName.trim(),
    phone: order.phone.trim(),
    address: order.address.trim(),
    items: order.items,
    subtotal: order.subtotal,
    status: "placed",
    createdAt: serverTimestamp(),
  });

  return orderRef.id;
}

export async function getUserOrders(userId: string) {
  if (auth.currentUser?.uid !== userId) {
    throw new Error("Please sign in to view your orders.");
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs
    .map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data(),
    }))
    .sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? 0;
      return timeB - timeA;
    });
}


// Customer service booking
export async function createServiceRequest(input: {
  customerName: string; phone: string; address: string; serviceType: string;
  preferredDate?: string; notes?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  if (!input.customerName.trim() || !input.phone.trim() || !input.address.trim() || !input.serviceType.trim()) {
    throw new Error("Complete your name, phone, address, and service type.");
  }
  const ref = await addDoc(collection(db, "serviceRequests"), {
    ...input, userId: user.uid, status: "requested", createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMyServiceRequests() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  const q = query(collection(db, "serviceRequests"), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Dealer application. Approval must be performed by a trusted admin.
export async function submitDealerApplication(input: {
  businessName: string; contactName: string; contactPhone: string; businessAddress: string; taxId?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  if (!input.businessName.trim() || !input.contactName.trim() || !input.contactPhone.trim() || !input.businessAddress.trim()) {
    throw new Error("Complete all required business details.");
  }
  const existing = await getDocs(query(collection(db, "dealerApplications"), where("userId", "==", user.uid)));
  if (!existing.empty) throw new Error("You have already submitted a dealer application.");
  const ref = await addDoc(collection(db, "dealerApplications"), {
    ...input, userId: user.uid, status: "pending", createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMyDealerApplication() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  const snap = await getDocs(query(collection(db, "dealerApplications"), where("userId", "==", user.uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
