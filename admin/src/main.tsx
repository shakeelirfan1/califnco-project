import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Search,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, db } from './firebase';
import './style.css';

type Order = {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  date: string;
};

type Dealer = {
  id: string;
  name: string;
  city: string;
  contactName: string;
  contactPhone: string;
  status: string;
};

type ServiceRequest = {
  id: string;
  name: string;
  customer: string;
  date: string;
  status: string;
};

const ORDER_STATUSES = [
  'Placed',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function formatStatus(value: unknown): string {
  const status = String(value || 'Placed');
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function App() {
  const [page, setPage] = useState('Overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [savingOrderId, setSavingOrderId] = useState('');

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingRecordId, setSavingRecordId] = useState('');

  const [search, setSearch] = useState('');

  // Authentication is checked first. Orders are subscribed to only after
  // Firebase confirms that the signed-in user has the admin custom claim.
  useEffect(() => {
    let active = true;
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeDealers: (() => void) | undefined;
    let unsubscribeServices: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeOrders?.();
      unsubscribeDealers?.();
      unsubscribeServices?.();
      unsubscribeOrders = undefined;
      unsubscribeDealers = undefined;
      unsubscribeServices = undefined;

      if (!active) return;
      setUser(currentUser);
      setIsAdmin(false);
      setOrders([]);
      setDealers([]);
      setServices([]);
      setOrdersError('');
      setLoginError('');
      setLoadingOrders(false);
      setLoadingDealers(false);
      setLoadingServices(false);

      if (!currentUser) {
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(true);
      try {
        const tokenResult = await currentUser.getIdTokenResult(true);
        if (!active) return;
        if (tokenResult.claims.admin !== true) {
          setOrdersError('This account is not authorized. Sign in with the administrator account.');
          setCheckingAuth(false);
          await signOut(auth);
          return;
        }

        setIsAdmin(true);
        setCheckingAuth(false);
        setLoadingOrders(true);
        setLoadingDealers(true);
        setLoadingServices(true);

        unsubscribeOrders = onSnapshot(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            if (!active) return;
            const liveOrders: Order[] = snapshot.docs.map((document) => {
              const data = document.data();
              const items = Array.isArray(data.items) ? data.items : [];
              const itemCount = items.reduce(
                (sum: number, item: { quantity?: unknown }) => sum + Math.max(0, Number(item.quantity) || 0),
                0
              );
              const timestamp = data.createdAt;
              const createdDate = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : null;
              return {
                id: document.id,
                customer: String(data.customerName || data.email || 'Customer'),
                items: itemCount,
                total: Number(data.total ?? data.subtotal ?? 0),
                status: formatStatus(data.status),
                date: createdDate ? createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable',
              };
            });
            setOrders(liveOrders);
            setLoadingOrders(false);
          },
          (error) => {
            console.error('Could not load Firestore orders:', error);
            setOrdersError(error.code === 'permission-denied' ? 'Firestore denied access to orders. Check the admin claim and Firestore rules.' : 'Unable to load orders. Check Firebase configuration and internet connection.');
            setLoadingOrders(false);
          }
        );

        unsubscribeDealers = onSnapshot(
          query(collection(db, 'dealerApplications'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            if (!active) return;
            setDealers(snapshot.docs.map((document) => {
              const data = document.data();
              return {
                id: document.id,
                name: String(data.businessName || data.contactName || 'Unnamed dealer'),
                city: String(data.businessAddress || data.city || 'Address not provided'),
                contactName: String(data.contactName || ''),
                contactPhone: String(data.contactPhone || ''),
                status: formatStatus(data.status || 'pending'),
              };
            }));
            setLoadingDealers(false);
          },
          (error) => {
            console.error('Could not load dealer applications:', error);
            setOrdersError(error.code === 'permission-denied' ? 'Firestore denied access to dealer applications. Verify the admin claim and rules.' : 'Unable to load dealer applications.');
            setLoadingDealers(false);
          }
        );

        unsubscribeServices = onSnapshot(
          query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            if (!active) return;
            setServices(snapshot.docs.map((document) => {
              const data = document.data();
              const timestamp = data.createdAt;
              const createdDate = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : null;
              return {
                id: document.id,
                name: String(data.serviceType || 'Service request'),
                customer: String(data.customerName || 'Customer'),
                date: createdDate ? createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable',
                status: formatStatus(data.status || 'requested'),
              };
            }));
            setLoadingServices(false);
          },
          (error) => {
            console.error('Could not load service requests:', error);
            setOrdersError(error.code === 'permission-denied' ? 'Firestore denied access to service requests. Verify the admin claim and rules.' : 'Unable to load service requests.');
            setLoadingServices(false);
          }
        );
      } catch (error) {
        console.error('Admin verification failed:', error);
        if (active) {
          setOrdersError('Could not verify admin access. Please sign in again.');
          setCheckingAuth(false);
          await signOut(auth);
        }
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
      unsubscribeOrders?.();
      unsubscribeDealers?.();
      unsubscribeServices?.();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setOrdersError('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Admin login failed:', error);
      setLoginError('Sign-in failed. Check the admin email and password.');
    }
  };

  const handleLogout = async () => {
    setLoginError('');
    setOrdersError('');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
      setOrdersError('Could not sign out. Please try again.');
    }
  };

  const nav = [
    ['Overview', LayoutDashboard],
    ['Orders', ShoppingBag],
    ['Dealers', Users],
    ['Service desk', CalendarClock],
  ] as const;

  const updateOrder = async (id: string, status: string) => {
    if (!user || !isAdmin) {
      setOrdersError('Administrator sign-in is required to update orders.');
      return;
    }

    setSavingOrderId(id);
    setOrdersError('');

    try {
      // Store normalized lower-case status values in Firestore.
      await updateDoc(doc(db, 'orders', id), {
        status: status.toLowerCase(),
      });
      // onSnapshot will refresh the displayed order from Firestore.
    } catch (error) {
      console.error('Could not update order status:', error);
      setOrdersError(
        'Could not save the order status. Verify that Firestore rules permit admin status updates.'
      );
    } finally {
      setSavingOrderId('');
    }
  };

  const updateDealerStatus = async (dealer: Dealer, status: 'approved' | 'rejected') => {
    if (!user || !isAdmin) {
      setOrdersError('Administrator sign-in is required to update dealer applications.');
      return;
    }
    setSavingRecordId(dealer.id);
    setOrdersError('');
    try {
      await updateDoc(doc(db, 'dealerApplications', dealer.id), { status });
    } catch (error) {
      console.error('Could not update dealer application:', error);
      setOrdersError('Could not update dealer status. Check Firestore rules and admin permissions.');
    } finally {
      setSavingRecordId('');
    }
  };

  const updateServiceStatus = async (service: ServiceRequest, status: 'scheduled' | 'completed') => {
    if (!user || !isAdmin) {
      setOrdersError('Administrator sign-in is required to update service requests.');
      return;
    }
    setSavingRecordId(service.id);
    setOrdersError('');
    try {
      await updateDoc(doc(db, 'serviceRequests', service.id), { status });
    } catch (error) {
      console.error('Could not update service request:', error);
      setOrdersError('Could not update service request. Check Firestore rules and admin permissions.');
    } finally {
      setSavingRecordId('');
    }
  };

  const pendingOrders = orders.filter(
    (order) =>
      order.status.toLowerCase() === 'pending' ||
      order.status.toLowerCase() === 'placed'
  ).length;

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const currency = (amount: number) => '₹' + amount.toLocaleString('en-IN');

  if (checkingAuth) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        Checking administrator access…
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#f5f7f8',
          boxSizing: 'border-box',
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: 390,
            display: 'grid',
            gap: 16,
            padding: 28,
            borderRadius: 12,
            background: '#fff',
            boxShadow: '0 4px 24px #00000012',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px' }}>Califnco Admin</h1>
            <p style={{ margin: 0, color: '#64748b' }}>
              Sign in with your authorized administrator account.
            </p>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #cbd5e1',
                borderRadius: 7,
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #cbd5e1',
                borderRadius: 7,
                boxSizing: 'border-box',
              }}
            />
          </label>

          {loginError && (
            <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
              {loginError}
            </p>
          )}
          {ordersError && (
            <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
              {ordersError}
            </p>
          )}

          <button type="submit" style={{ padding: 12, cursor: 'pointer' }}>
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logoMark">c.</span>
          <div>
            <b>califnco</b>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>

        <div className="workspace">
          <span className="dot"></span>
          <span>Water commerce</span>
          <ChevronDown size={14} />
        </div>

        <p className="navLabel">WORKSPACE</p>

        {nav.map(([name, Icon]) => (
          <button
            key={name}
            className={'navItem ' + (page === name ? 'active' : '')}
            onClick={() => setPage(name)}
          >
            <Icon size={18} />
            {name}
            {name === 'Orders' && (
              <span className="navCount">{pendingOrders}</span>
            )}
          </button>
        ))}

        <div className="sideBottom">
          <div className="secure">
            <ShieldCheck size={17} />
            <span>
              <b>Firebase connected</b>
              <small>Live order data</small>
            </span>
          </div>

          <div className="user">
            <div className="userAvatar">A</div>
            <div>
              <b>Administrator</b>
              <small>{user.email || 'Signed in'}</small>
            </div>
            <ShieldCheck size={15} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobileMenu" onClick={() => setPage('Overview')} aria-label="Go to overview">
            <Menu />
          </button>

          <div className="crumb">
            Workspace <span>/</span> <b>{page}</b>
          </div>

          <div className="topRight">
            <span className="liveDot"></span>
            <span>Live order data</span>
            <button className="outline" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        <section className="content">
          <div className="pageHead">
            <div>
              <p className="eyebrow">CALIFNCO ADMINISTRATION</p>
              <h1>{page === 'Overview' ? 'Good morning, Admin' : page}</h1>
              <p className="subhead">
                {page === 'Overview'
                  ? 'Here is your store order overview.'
                  : 'Review and manage your store operations.'}
              </p>
            </div>

            <button
              className="outline"
              onClick={() =>
                alert('Storefront navigation has not been configured yet.')
              }
            >
              <ArrowUpRight size={16} /> View store
            </button>
          </div>

          {ordersError && (
            <div
              role="alert"
              style={{
                padding: 14,
                marginBottom: 16,
                border: '1px solid #d97757',
                borderRadius: 8,
                color: '#9a3412',
                background: '#fff7ed',
              }}
            >
              <b>Notice</b>
              <p>{ordersError}</p>
              <small>
                Do not make Firestore rules public to fix permission errors.
              </small>
            </div>
          )}

          {page === 'Overview' && (
            <>
              <div className="stats">
                <div className="stat">
                  <div className="statTop">
                    <span>Total orders</span>
                    <ShoppingBag size={18} />
                  </div>
                  <strong>{loadingOrders ? '…' : orders.length}</strong>
                  <small className="muted">Firestore orders</small>
                </div>

                <div className="stat">
                  <div className="statTop">
                    <span>Order value</span>
                    <span className="rupee">₹</span>
                  </div>
                  <strong>{loadingOrders ? '…' : currency(revenue)}</strong>
                  <small className="muted">Sum of loaded order totals</small>
                </div>

                <div className="stat">
                  <div className="statTop">
                    <span>Pending orders</span>
                    <Clock3 size={18} />
                  </div>
                  <strong>{loadingOrders ? '…' : pendingOrders}</strong>
                  <small className="muted">Placed or pending</small>
                </div>

                <div className="stat">
                  <div className="statTop">
                    <span>Dealer requests</span>
                    <Users size={18} />
                  </div>
                  <strong>
                    {dealers.filter((dealer) => dealer.status === 'Pending').length}
                  </strong>
                  <small className="muted">Live Firestore applications</small>
                </div>
              </div>

              <div className="twoCol">
                <div className="panel">
                  <div className="panelHead">
                    <div>
                      <h2>Recent orders</h2>
                      <p>Latest customer purchases from Firestore</p>
                    </div>
                    <button className="textButton" onClick={() => setPage('Orders')}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {loadingOrders ? (
                    <p className="empty">Loading orders…</p>
                  ) : (
                    <OrderTable
                      orders={orders.slice(0, 4)}
                      updateOrder={updateOrder}
                      savingOrderId={savingOrderId}
                    />
                  )}
                </div>

                <div className="panel">
                  <div className="panelHead">
                    <div><h2>Dealer applications</h2><p>Live applications from Firestore</p></div>
                    <button className="textButton" onClick={() => setPage('Dealers')}>View all <ArrowUpRight size={14} /></button>
                  </div>
                  {loadingDealers ? <p className="empty">Loading dealer applications…</p> : dealers.filter((dealer) => dealer.status.toLowerCase() === 'pending').slice(0, 4).map((dealer) => (
                    <div className="dealerRow" key={dealer.id}>
                      <div className="dealerIcon">{dealer.name.charAt(0).toUpperCase()}</div>
                      <div className="dealerInfo"><b>{dealer.name}</b><small>{dealer.city}</small></div>
                      <span className="pill pending">{dealer.status}</span>
                      <button className="iconButton" title="Approve dealer" disabled={savingRecordId === dealer.id} onClick={() => updateDealerStatus(dealer, 'approved')}><CheckCircle2 size={17} /></button>
                    </div>
                  ))}
                  {!loadingDealers && dealers.filter((dealer) => dealer.status.toLowerCase() === 'pending').length === 0 && <p className="empty">No pending dealer applications.</p>}
                </div>
              </div>

              <div className="panel servicePanel">
                <div className="panelHead"><div><h2>Service desk</h2><p>Live service requests from Firestore</p></div><button className="textButton" onClick={() => setPage('Service desk')}>Manage requests <ArrowUpRight size={14} /></button></div>
                {loadingServices ? <p className="empty">Loading service requests…</p> : <div className="serviceList">
                  {services.slice(0, 4).map((service) => <div className="serviceRow" key={service.id}>
                    <div className="serviceIcon"><CalendarClock size={18} /></div>
                    <div className="serviceInfo"><b>{service.name}</b><small>{service.customer} · {service.date}</small></div>
                    <span className="pill pending">{service.status}</span>
                    <button className="outline small" disabled={savingRecordId === service.id} onClick={() => updateServiceStatus(service, 'scheduled')}>Schedule</button>
                  </div>)}
                  {!services.length && <p className="empty">No service requests found.</p>}
                </div>}
              </div>
            </>
          )}

          {page === 'Orders' && (
            <div className="panel">
              <div className="panelHead">
                <div>
                  <h2>All orders</h2>
                  <p>Orders loaded from your Firestore database</p>
                </div>

                <label className="search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search orders or customers"
                  />
                </label>
              </div>

              {loadingOrders ? (
                <p className="empty">Loading orders from Firestore…</p>
              ) : (
                <OrderTable
                  orders={orders.filter((order) =>
                    (order.id + ' ' + order.customer)
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )}
                  updateOrder={updateOrder}
                  savingOrderId={savingOrderId}
                />
              )}
            </div>
          )}

          {page === 'Dealers' && (
            <div className="panel">
              <div className="panelHead"><div><h2>Dealer applications</h2><p>Live applications from Firestore</p></div></div>
              {loadingDealers ? <p className="empty">Loading dealer applications…</p> : dealers.map((dealer) => (
                <div className="dealerRow" key={dealer.id}>
                  <div className="dealerIcon">{dealer.name.charAt(0).toUpperCase()}</div>
                  <div className="dealerInfo"><b>{dealer.name}</b><small>{dealer.city}{dealer.contactName ? ` · Contact: ${dealer.contactName}` : ''}{dealer.contactPhone ? ` · ${dealer.contactPhone}` : ''}</small></div>
                  <span className={'pill ' + (dealer.status.toLowerCase() === 'approved' ? 'approved' : dealer.status.toLowerCase() === 'rejected' ? 'rejected' : 'pending')}>{dealer.status}</span>
                  {dealer.status.toLowerCase() === 'pending' && <>
                    <button className="approve" disabled={savingRecordId === dealer.id} onClick={() => updateDealerStatus(dealer, 'approved')}>{savingRecordId === dealer.id ? 'Saving…' : 'Approve'}</button>
                    <button className="reject" disabled={savingRecordId === dealer.id} onClick={() => updateDealerStatus(dealer, 'rejected')}>Reject</button>
                  </>}
                </div>
              ))}
              {!loadingDealers && dealers.length === 0 && <p className="empty">No dealer applications found.</p>}
            </div>
          )}

          {page === 'Service desk' && (
            <div className="panel">
              <div className="panelHead"><div><h2>Service requests</h2><p>Live service requests from Firestore</p></div></div>
              {loadingServices ? <p className="empty">Loading service requests…</p> : services.map((service) => (
                <div className="serviceRow" key={service.id}>
                  <div className="serviceIcon"><CalendarClock size={18} /></div>
                  <div className="serviceInfo"><b>{service.name}</b><small>{service.customer} · {service.date}</small></div>
                  <span className="pill pending">{service.status}</span>
                  <button className="outline small" disabled={savingRecordId === service.id} onClick={() => updateServiceStatus(service, 'scheduled')}>{savingRecordId === service.id ? 'Saving…' : 'Schedule'}</button>
                  <button className="outline small" disabled={savingRecordId === service.id} onClick={() => updateServiceStatus(service, 'completed')}>Complete</button>
                </div>
              ))}
              {!loadingServices && services.length === 0 && <p className="empty">No service requests found.</p>}
            </div>
          )}

          <div className="disclaimer">
            <ShieldCheck size={16} />
            <span>
              <b>Live data:</b> Orders, dealer applications, and service requests are read from Firestore after administrator verification. Status changes are saved to Firestore.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function OrderTable({
  orders,
  updateOrder,
  savingOrderId,
}: {
  orders: Order[];
  updateOrder: (id: string, status: string) => void;
  savingOrderId: string;
}) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>CUSTOMER</th>
            <th>ITEMS</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <b>{order.id}</b>
                <small className="cellSub">{order.date}</small>
              </td>
              <td>{order.customer}</td>
              <td>{order.items} item(s)</td>
              <td className="money">₹{order.total.toLocaleString('en-IN')}</td>
              <td>
                <span className={'pill ' + order.status.toLowerCase()}>
                  {order.status}
                </span>
              </td>
              <td>
                <select
                  value={order.status}
                  disabled={savingOrderId === order.id}
                  onChange={(event) => updateOrder(order.id, event.target.value)}
                  aria-label={'Change status for order ' + order.id}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {savingOrderId === order.id && <small> Saving…</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p className="empty">No orders found.</p>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
