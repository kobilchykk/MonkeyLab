import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Wrench, Banana, Key, Package, Users, BarChart3, Clock, 
  Database, Activity, Search, LogOut, Loader2, X, AlertCircle, Check,
  Trash2, Edit3, Instagram, Facebook, Camera, MessageSquare as DiscordIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  device: string;
  status: string;
  masterName: string;
  price: number;
  issueDescription?: string;
  deviceImageUrl?: string;
  createdAt?: any;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: any;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
}

function TechnicalAssets() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="scanline" />
      
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-brand-ink opacity-20" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-brand-ink opacity-20" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-brand-ink opacity-20" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-brand-ink opacity-20" />
      
      <svg className="absolute -top-20 -left-20 w-[400px] h-[400px] opacity-[0.03] scale-150 rotate-12" viewBox="0 0 100 100">
        <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10,50 L90,50 M50,10 L50,90" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M30,30 L70,70 M70,30 L30,70" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      
      <svg className="absolute -bottom-40 -right-40 w-[600px] h-[600px] opacity-[0.04] -rotate-12" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="0.8">
          <rect x="20" y="20" width="160" height="160" />
          <path d="M20,100 L180,100 M100,20 L100,180" />
          <circle cx="100" cy="100" r="40" />
          <path d="M60,60 L140,140 M140,60 L60,140" />
          <g opacity="0.5">
            <path d="M40,40 L160,160 M160,40 L40,160" strokeDasharray="4 2" />
          </g>
        </g>
      </svg>

      <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[8px] font-mono opacity-20 vertical-text tracking-[0.5em]">
        LAT_48.3794_LON_31.1656_ELEV_120M
      </div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-20 tracking-[1em]">
        SYSTEM_DIAGNOSTIC_ACTIVE_SECURE_LINK_ESTABLISHED
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffView, setIsStaffView] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewInventoryModalOpen, setIsNewInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);

  const isAdmin = userProfile?.role === 'admin' || user?.email?.toLowerCase() === 'makkob1337@gmail.com';
  const isRestrictedEmployee = user?.email?.toLowerCase() === 'makkob4ik@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsStaffView(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (err) {
          console.error("Error fetching user profile", err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isStaffView) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    });

    return () => unsubscribe();
  }, [user, isStaffView]);

  useEffect(() => {
    if (!user || !isStaffView) return;
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
      setClients(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clients'));
    return () => unsubscribe();
  }, [user, isStaffView]);

  useEffect(() => {
    if (!user || !isStaffView) return;
    const q = collection(db, 'inventory');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      setInventory(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory'));
    return () => unsubscribe();
  }, [user, isStaffView]);

  if (loading) {
    return (
      <div className="h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin opacity-20" />
      </div>
    );
  }

  if (!isStaffView) {
    return <PublicLanding onStaffLogin={() => setIsStaffView(true)} />;
  }

  if (!user && isStaffView) {
    return <LoginScreen onBackToSite={() => setIsStaffView(false)} />;
  }

  return (
    <div className="flex h-screen bg-brand-surface text-brand-ink font-sans select-none overflow-hidden relative">
      <TechnicalAssets />
      
      <aside className="w-64 border-r border-brand-line flex flex-col bg-brand-ink text-brand-bg">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="p-1.5 bg-brand-bg rounded-sm relative flex items-center justify-center w-10 h-10 shadow-[4px_4px_0px_rgba(255,255,255,0.1)]">
              <Banana className="w-7 h-7 text-brand-ink fill-brand-ink/10 rotate-12" />
              <Key className="w-4 h-4 text-brand-ink absolute -bottom-1 -right-1 -rotate-45 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-sm font-display tracking-tight leading-none uppercase text-brand-bg">
                Monkey<span className="ml-1">LAB</span>
              </h1>
              <span className="text-[8px] font-mono opacity-50 tracking-[0.2em] uppercase text-white/40 block mt-1">v2.0.0-PROD</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="bg-brand-bg/10 text-white/40 px-4 py-2 text-[10px] font-mono flex items-center justify-between mb-4 border border-white/10">
            <span>DASHBOARD</span>
            <div className="w-1.5 h-1.5 bg-brand-bg rounded-full animate-pulse" />
          </div>
          
          {[
            { id: 'orders', label: 'ЗАЯВКИ', count: orders.length, icon: Clock },
            { id: 'clients', label: 'КЛІЄНТИ', count: clients.length, icon: Users },
            { id: 'inventory', label: 'СКЛАД', count: inventory.length, icon: Package },
            { id: 'analytics', label: 'АНАЛІТИКА', icon: BarChart3, hidden: !isAdmin && userProfile?.role !== 'manager' && !isRestrictedEmployee },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-mono transition-colors border border-transparent ${
                activeTab === item.id 
                  ? 'bg-brand-bg text-brand-ink opacity-100 font-bold' 
                  : 'hover:bg-brand-bg/10 opacity-60'
              }`}
            >
              <span>{item.label} {item.count ? `(${item.count})` : ''}</span>
              <item.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 bg-brand-bg/10">
          <div className="text-[9px] font-mono opacity-50 uppercase mb-1 tracking-wider text-brand-bg">Current Session</div>
          <div className="text-[11px] font-bold truncate flex items-center gap-2 text-white">
            {userProfile?.name || user.email}
            {isAdmin && <span className="w-2 h-2 bg-blue-500 rounded-full" title="AD_PRIVILEGES_ACTIVE" />}
          </div>
          <p className="text-[9px] font-mono opacity-40 uppercase truncate mb-3 text-white/40">
            {isAdmin ? 'ADMIN' : (isRestrictedEmployee ? 'Staff' : (userProfile?.role || 'User'))}
          </p>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-bg text-brand-ink text-[10px] font-mono uppercase tracking-widest hover:opacity-90 transition-colors border border-brand-line"
          >
            <LogOut className="w-3 h-3" />
            Termination
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-brand-surface">
        <header className="h-16 border-b border-brand-line flex items-center justify-between px-8 bg-brand-ink text-brand-bg relative z-10">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono bg-brand-bg text-brand-ink px-2 py-0.5">MASTER_BRANCH</div>
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">System Security: Active</div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (activeTab === 'orders') setIsNewOrderModalOpen(true);
              else if (activeTab === 'clients') setIsNewClientModalOpen(true);
              else if (activeTab === 'inventory' && isAdmin) setIsNewInventoryModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-bg text-brand-ink px-5 py-2 text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity border border-brand-line"
          >
            <PlusCircle className="w-4 h-4" />
            {activeTab === 'orders' ? 'Нова заявка' : activeTab === 'clients' ? 'Новий клієнт' : activeTab === 'inventory' ? 'Додати товар' : 'Дія'}
          </button>
        </header>

        <div className="grid grid-cols-4 border-b border-brand-line shrink-0">
          <div className="technical-grid-item bg-brand-bg/10">
            <div className="text-[10px] font-mono opacity-60 uppercase mb-1 tracking-widest">Активні замовлення</div>
            <div className="text-4xl font-mono font-bold tracking-tight">{orders.length}</div>
            <div className="text-[9px] text-green-600 mt-1 font-bold font-mono">LIVE SYNC</div>
          </div>
          <div className="technical-grid-item">
            <div className="text-[9px] font-mono opacity-60 uppercase mb-1 tracking-widest">В обробці</div>
            <div className="text-4xl font-mono font-bold tracking-tighter">
              {orders.filter(o => o.status === 'В ОБРОБЦІ').length.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="technical-grid-item bg-brand-bg/10">
            <div className="text-[9px] font-mono opacity-60 uppercase mb-1 tracking-widest">Виручка (Загальна)</div>
            <div className="text-4xl font-mono font-bold tracking-tighter">
              ₴{orders.reduce((sum, o) => sum + Number(o.price || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
      {activeTab === 'orders' && (
        <OrdersView 
          orders={orders} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          userProfile={userProfile}
          user={user}
          isRestrictedEmployee={isRestrictedEmployee}
        />
      )}
      {activeTab === 'clients' && (
        <ClientsView 
          clients={clients} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isAdmin={isAdmin || isRestrictedEmployee}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryView 
          inventory={inventory} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isAdmin={isAdmin}
          onEdit={setEditingInventoryItem}
          isRestrictedEmployee={isRestrictedEmployee}
        />
      )}
          {activeTab === 'analytics' && (
            <AnalyticsView 
              orders={orders} 
              inventory={inventory} 
            />
          )}
        </div>

        <AnimatePresence>
          {isNewOrderModalOpen && (
            <NewOrderModal 
              onClose={() => setIsNewOrderModalOpen(false)} 
              onCreated={() => setIsNewOrderModalOpen(false)} 
              clients={clients}
            />
          )}
          {isNewClientModalOpen && (
            <NewClientModal 
              onClose={() => setIsNewClientModalOpen(false)} 
              onCreated={() => setIsNewClientModalOpen(false)} 
            />
          )}
          {isNewInventoryModalOpen && isAdmin && (
            <NewInventoryModal 
              onClose={() => setIsNewInventoryModalOpen(false)} 
              onCreated={() => setIsNewInventoryModalOpen(false)} 
            />
          )}
          {editingInventoryItem && isAdmin && (
            <EditInventoryModal 
              item={editingInventoryItem}
              onClose={() => setEditingInventoryItem(null)} 
              onUpdated={() => setEditingInventoryItem(null)} 
            />
          )}
        </AnimatePresence>
        <footer className="h-8 border-t-2 border-brand-ink bg-brand-bg text-brand-ink px-6 flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-[0.2em] relative z-20 shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-brand-ink rounded-full animate-pulse" /> SYSTEM_ONLINE</span>
            <span className="opacity-60">SECURE_ENCRYPTION_ACTIVE</span>
            <span className="opacity-60">ENCRYPTED_TUNNEL: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex gap-3 h-full items-center border-x border-brand-ink/10 px-4">
              <div className="w-1 h-3 bg-brand-ink/20" />
              <div className="w-1 h-4 bg-brand-ink/40" />
              <div className="w-1 h-2 bg-brand-ink/60" />
              <div className="w-1 h-5 bg-brand-ink" />
            </div>
            <span>© 2026 MONKEY LAB INFRASTRUCTURE</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function OrdersView({ orders, searchQuery, setSearchQuery, userProfile, user, isRestrictedEmployee }: any) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrderId || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriceChange = async (newPrice: string) => {
    if (!selectedOrderId || isUpdating) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum)) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrderId), {
        price: priceNum,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteOrder = async () => {
    if (!selectedOrderId || isUpdating) return;
    
    setIsUpdating(true);
    const idToDelete = selectedOrderId;
    
    try {
      await deleteDoc(doc(db, 'orders', idToDelete));
      setSelectedOrderId(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
      handleFirestoreError(err, OperationType.DELETE, `orders/${idToDelete}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const isAdmin = (userProfile?.role === 'admin' || user?.email?.toLowerCase() === 'makkob1337@gmail.com');
  const canEditStatus = isAdmin || userProfile?.role === 'manager' || isRestrictedEmployee;
  const canEditPrice = isAdmin || userProfile?.role === 'manager' || isRestrictedEmployee;

  return (
    <>
      <section className="flex-1 border-r border-brand-line overflow-auto flex flex-col">
        <div className="h-12 border-b border-brand-line flex items-center px-4 bg-brand-bg/10 shrink-0">
          <Search className="w-3.5 h-3.5 opacity-40 mr-3" />
          <input 
            type="text"
            placeholder="ПОШУК ЗА ПРИСТРОЄМ АБО КЛІЄНТОМ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-mono w-full uppercase tracking-widest placeholder:opacity-30"
          />
        </div>

        <div className="technical-table-header uppercase">
          <div>ID / ДАТА</div>
          <div>ПРИСТРІЙ / КЛІЄНТ</div>
          <div>СТАТУС</div>
          <div>МАЙСТЕР</div>
          <div className="text-right">ВАРТІСТЬ</div>
        </div>
        
        <div className="divide-y divide-brand-line/10 flex-1 overflow-auto">
          {orders.filter((order: any) => {
            const query = searchQuery.toLowerCase();
            return (
              order.device.toLowerCase().includes(query) ||
              order.clientName.toLowerCase().includes(query)
            );
          }).length === 0 ? (
            <div className="p-20 text-center opacity-20 font-mono text-[10px] uppercase tracking-widest">
              Заявок не знайдено
            </div>
          ) : (
            orders.filter((order: any) => {
              const query = searchQuery.toLowerCase();
              return (
                order.device.toLowerCase().includes(query) ||
                order.clientName.toLowerCase().includes(query)
              );
            }).map((order: any, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedOrderId(order.id)}
                className={`technical-table-row transition-colors cursor-pointer ${selectedOrderId === order.id ? 'bg-brand-ink text-brand-bg shadow-inner' : 'hover:bg-brand-ink/5'}`}
              >
                <div className="font-mono text-[10px] text-[#666]">
                  #{order.id.slice(0, 5)}
                  <div className="text-[8px] opacity-60">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'щойно'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-xs uppercase tracking-tight">{order.device}</div>
                    {order.deviceImageUrl && (
                      <Camera className="w-3 h-3 text-brand-ink/40" />
                    )}
                  </div>
                  <div className="text-[10px] opacity-50 font-mono tracking-tighter uppercase">{order.clientName}</div>
                </div>
                <div>
                  <span className={`border border-brand-line px-2 py-0.5 text-[9px] font-bold uppercase bg-brand-bg/80`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-[11px] font-serif italic text-brand-ink/60">{order.masterName || 'Не призначено'}</div>
                <div className="text-right font-mono font-bold text-xs">₴{order.price}</div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <aside className="w-80 flex flex-col bg-brand-ink text-brand-bg shrink-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedOrder ? (
            <motion.div 
              key={selectedOrder.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-6 space-y-8 h-full overflow-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest">Деталі замовлення</h3>
                <button 
                  onClick={() => setSelectedOrderId(null)}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <section>
                  <div className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-1">Статус</div>
                  {canEditStatus ? (
                    <div className="relative">
                      <select 
                        value={selectedOrder.status}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full bg-brand-bg/10 border border-white/20 p-2 text-xs font-mono uppercase focus:outline-none focus:border-white/40 appearance-none"
                      >
                        {["В ОБРОБЦІ", "В РОБОТІ", "Очікує запчастин", "Виконано", "Видано", "Скасовано"].map(opt => (
                          <option key={opt} value={opt} className="bg-brand-ink text-brand-bg">{opt}</option>
                        ))}
                      </select>
                      {isUpdating && <Loader2 className="absolute right-2 top-2 w-3 h-3 animate-spin opacity-50" />}
                    </div>
                  ) : (
                    <div className="text-xl font-black uppercase decoration-white/20 underline underline-offset-4 decoration-2">
                      {selectedOrder.status}
                    </div>
                  )}
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Клієнт</div>
                    <div className="text-xs font-bold uppercase">{selectedOrder.clientName}</div>
                    <div className="text-[10px] font-mono opacity-50">{selectedOrder.phone}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Пристрій</div>
                    <div className="text-xs font-bold uppercase">{selectedOrder.device}</div>
                  </div>
                </section>

                <section>
                  <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Опис проблеми</div>
                  <div className="text-[11px] leading-relaxed bg-brand-bg/10 p-3 rounded-sm border border-white/10 font-serif italic opacity-90 underline decoration-white/5 decoration-1 underline-offset-4">
                    {selectedOrder.issueDescription || "Опис відсутній"}
                  </div>
                </section>

                {selectedOrder.deviceImageUrl && (
                  <section>
                    <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Фото пристрою</div>
                    <div className="relative group overflow-hidden border border-white/10 rounded-sm">
                       <img 
                         src={selectedOrder.deviceImageUrl} 
                         alt="Device" 
                         className="w-full h-auto cursor-zoom-in transition-transform group-hover:scale-105" 
                         onClick={() => window.open(selectedOrder.deviceImageUrl, '_blank')}
                       />
                       <div className="absolute bottom-0 left-0 right-0 bg-brand-ink/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-mono uppercase tracking-widest text-brand-bg">Натисніть для перегляду</span>
                       </div>
                    </div>
                  </section>
                )}

                <section className="bg-brand-bg/10 p-3 border border-white/10">
                  <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Підтвердження</div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-tight">
                    {selectedOrder.needsCallback ? (
                      <span className="text-green-400 flex items-center gap-2">
                        <Check className="w-3 h-3" /> Потрібен дзвінок
                      </span>
                    ) : (
                      <span className="text-orange-400">Дзвінок не потрібен</span>
                    )}
                  </div>
                </section>

                <section className="border-t border-white/10 pt-4 flex justify-between items-end">
                   <div className="flex-1">
                      <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Вартість</div>
                      {canEditPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-bold tracking-tight">₴</span>
                          <input 
                            type="number"
                            defaultValue={selectedOrder.price}
                            onBlur={(e) => handlePriceChange(e.target.value)}
                            className="bg-brand-bg/10 border border-white/20 p-1 text-xl font-mono font-bold tracking-tight w-24 outline-none focus:border-white/40"
                          />
                        </div>
                      ) : (
                        <div className="text-2xl font-mono font-bold tracking-tight">₴{selectedOrder.price}</div>
                      )}
                   </div>
                   <div className="text-right">
                      <div className="text-[9px] font-mono opacity-40 uppercase mb-1">Майстер</div>
                      <div className="text-[11px] font-serif italic text-white/70">{selectedOrder.masterName}</div>
                   </div>
                </section>

                {(isAdmin || userProfile?.role === 'manager' || isRestrictedEmployee) && (
                  <div className="pt-2">
                    {!showDeleteConfirm ? (
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isUpdating}
                        className="w-full bg-red-600/10 border border-red-600/30 text-red-500 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        {isUpdating ? 'ОБРОБКА...' : 'ВИДАЛИТИ ЗАМОВЛЕННЯ'}
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 border border-red-500/30 bg-red-500/5 space-y-4"
                      >
                        <div className="text-[10px] font-mono uppercase text-red-500 text-center font-bold tracking-wider">
                          ВИ ВПЕВНЕНІ? ЦЕ ВИДАЛИТЬ ЗАПИС НАЗАВЖДИ
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleDeleteOrder}
                            disabled={isUpdating}
                            className="flex-1 bg-red-500 text-white py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                          >
                            ТАК, ВИДАЛИТИ
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 border border-white/20 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-brand-bg/10 transition-colors"
                          >
                            НІ, СТОП
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 border-b border-white/5 h-full overflow-auto"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-green-500" />
                <h3 className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Системний Лог</h3>
              </div>
              <div className="space-y-2">
                {[...orders].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds||0)).slice(0, 10).map((o: any) => (
                  <div key={o.id} className="text-[9px] font-mono border-l border-white/20 pl-3 py-1 bg-brand-bg/10">
                    <span className="opacity-40">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                    <div className="font-bold uppercase opacity-80">ORDER UPDATE #{o.id.slice(0, 5)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
}

function ClientsView({ clients, searchQuery, setSearchQuery, isAdmin }: any) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleDeleteClient = async (id: string) => {
    setIsProcessing(id);
    try {
      await deleteDoc(doc(db, 'clients', id));
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      alert('Помилка: недостатньо прав або збій мережі.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <section className="flex-1 overflow-auto flex flex-col">
      <div className="h-12 border-b border-brand-line flex items-center px-4 bg-brand-bg/10 shrink-0">
        <Search className="w-3.5 h-3.5 opacity-40 mr-3" />
        <input 
          type="text"
          placeholder="ПОШУК КЛІЄНТІВ ЗА ІМ'ЯМ АБО НОМЕРОМ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[10px] font-mono w-full uppercase tracking-widest placeholder:opacity-30"
        />
      </div>

      <div className="grid grid-cols-[1fr_200px_200px_150px_120px] p-4 bg-brand-ink text-brand-bg text-[10px] font-mono tracking-widest uppercase items-center shrink-0">
        <div>ПІБ КЛІЄНТА</div>
        <div>ТЕЛЕФОН</div>
        <div>EMAIL</div>
        <div className="text-right">ЗАРЕЄСТРОВАНО</div>
        <div className="text-center">ДІЇ</div>
      </div>
      
      <div className="divide-y divide-brand-line/10 flex-1 overflow-auto">
        {clients.filter((client: any) => {
          const query = searchQuery.toLowerCase();
          return client.name.toLowerCase().includes(query) || client.phone.includes(query);
        }).map((client: any) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-[1fr_200px_200px_150px_120px] p-4 border-b border-brand-line/10 items-center hover:bg-brand-ink/5 transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs uppercase">{client.name}</div>
            <div className="font-mono text-xs">{client.phone}</div>
            <div className="text-[10px] opacity-60 truncate">{client.email || '—'}</div>
            <div className="text-right font-mono text-[10px] opacity-40">
              {client.createdAt?.toDate ? client.createdAt.toDate().toLocaleDateString() : '—'}
            </div>
            <div className="flex justify-center gap-1">
              {isAdmin && (
                deletingId === client.id ? (
                  <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                      disabled={isProcessing === client.id}
                      className="bg-red-500 text-white px-2 py-1 text-[8px] font-bold uppercase hover:bg-red-600 disabled:opacity-50"
                    >
                      {isProcessing === client.id ? '...' : 'ТАК'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                      className="bg-brand-ink text-white px-2 py-1 text-[8px] font-bold uppercase hover:opacity-80"
                    >
                      НІ
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeletingId(client.id); }}
                    className="p-1.5 text-red-500 opacity-40 group-hover:opacity-100 hover:bg-red-50 transition-all rounded-sm flex items-center gap-1"
                    title="Видалити клієнта"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase hidden group-hover:inline">Видалити</span>
                  </button>
                )
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function InventoryView({ inventory, searchQuery, setSearchQuery, isAdmin, onEdit, isRestrictedEmployee }: any) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const canModify = isAdmin && !isRestrictedEmployee;

  const handleDeleteItem = async (id: string) => {
    setIsProcessing(id);
    try {
      await deleteDoc(doc(db, 'inventory', id));
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      alert('Помилка: недостатньо прав або збій мережі.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <section className="flex-1 overflow-auto flex flex-col">
      <div className="h-12 border-b border-brand-line flex items-center px-4 bg-brand-bg/10 shrink-0">
        <Search className="w-3.5 h-3.5 opacity-40 mr-3" />
        <input 
          type="text"
          placeholder="ПОШУК ЗАПЧАСТИН ЗА НАЗВОЮ АБО SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[10px] font-mono w-full uppercase tracking-widest placeholder:opacity-30"
        />
      </div>

      <div className="grid grid-cols-[1fr_120px_100px_100px_100px_120px] p-4 bg-brand-ink text-brand-bg text-[10px] font-mono tracking-widest uppercase items-center shrink-0">
        <div>НАЗВА ТОВАРУ</div>
        <div>SKU</div>
        <div className="text-right">КІЛЬКІСТЬ</div>
        <div className="text-right">ЗАКУПКА</div>
        <div className="text-right">ЦІНА ПРОДАЖУ</div>
        <div className="text-center">ДІЇ</div>
      </div>
      
      <div className="divide-y divide-brand-line/10 flex-1 overflow-auto">
        {inventory.filter((item: any) => {
          const query = searchQuery.toLowerCase();
          return item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query);
        }).map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-[1fr_120px_100px_100px_100px_120px] p-4 border-b border-brand-line/10 items-center hover:bg-brand-ink/5 transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs uppercase">{item.name}</div>
            <div className="font-mono text-[10px] opacity-50 uppercase">{item.sku}</div>
            <div className={`text-right font-mono font-bold ${item.quantity < 5 ? 'text-red-500' : ''}`}>
              {item.quantity} шт.
            </div>
            <div className="text-right font-mono text-[10px] opacity-40">₴{item.purchasePrice}</div>
            <div className="text-right font-mono font-bold text-blue-600">₴{item.sellPrice}</div>
            <div className="flex justify-center gap-1">
              {canModify && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="p-1.5 text-brand-ink opacity-40 group-hover:opacity-100 hover:bg-brand-bg transition-all rounded-sm"
                  title="Редагувати"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {canModify && (
                deletingId === item.id ? (
                  <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                      disabled={isProcessing === item.id}
                      className="bg-red-500 text-white px-2 py-1 text-[8px] font-bold uppercase hover:bg-red-600 disabled:opacity-50"
                    >
                      {isProcessing === item.id ? '...' : 'ТАК'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                      className="bg-brand-ink text-white px-2 py-1 text-[8px] font-bold uppercase hover:opacity-80"
                    >
                      НІ
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }}
                    className="p-1.5 text-red-500 opacity-40 group-hover:opacity-100 hover:bg-red-50 transition-all rounded-sm"
                    title="Видалити"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsView({ orders, inventory }: any) {
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.price || 0), 0);
  const orderCount = orders.length;
  const avgOrderPrice = orderCount > 0 ? totalRevenue / orderCount : 0;

  return (
    <section className="flex-1 overflow-auto p-12 space-y-12">
      <div className="grid grid-cols-3 gap-8">
        <div className="border border-brand-line p-8 bg-brand-bg shadow-[8px_8px_0px_#141414]">
          <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Загальна виручка</div>
          <div className="text-5xl font-bold tracking-tight">₴{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="border border-brand-line p-8 bg-brand-bg shadow-[8px_8px_0px_#141414]">
          <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Всього замовлень</div>
          <div className="text-5xl font-bold tracking-tight">{orderCount}</div>
        </div>
        <div className="border border-brand-line p-8 bg-brand-bg shadow-[8px_8px_0px_#141414]">
          <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Середній чек</div>
          <div className="text-5xl font-bold tracking-tight">₴{avgOrderPrice.toFixed(0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="border border-brand-line p-8 bg-brand-bg shadow-[8px_8px_0px_#141414]">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Розподіл статусів</h3>
          <div className="space-y-4">
             {["В ОБРОБЦІ", "В РОБОТІ", "Виконано", "Видано"].map(status => {
               const count = orders.filter((o: any) => o.status === status).length;
               const percentage = orderCount > 0 ? (count / orderCount) * 100 : 0;
               return (
                 <div key={status}>
                   <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                     <span>{status}</span>
                     <span>{count}</span>
                   </div>
                   <div className="bg-brand-ink/10 h-1.5 w-full">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="bg-brand-ink h-full" />
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
        <div className="border border-brand-line p-8 bg-brand-bg shadow-[8px_8px_0px_#141414]">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Складські залишки</h3>
          <div className="space-y-4">
             {inventory.slice(0, 5).map((item: any) => (
               <div key={item.id} className="flex justify-between items-center text-[11px] font-mono border-b border-brand-line/10 pb-2">
                 <span>{item.name}</span>
                 <span className={item.quantity < 5 ? 'text-red-500 font-bold' : ''}>{item.quantity} шт.</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DecorativeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none bg-brand-bg">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.8)_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
      
      <div className="corner-mark top-12 left-12 border-t-2 border-l-2 border-brand-ink/10 w-10 h-10" />
      <div className="corner-mark top-12 right-12 border-t-2 border-r-2 border-brand-ink/10 w-10 h-10" />
      <div className="corner-mark bottom-12 left-12 border-b-2 border-l-2 border-brand-ink/10 w-10 h-10" />
      <div className="corner-mark bottom-12 right-12 border-b-2 border-r-2 border-brand-ink/10 w-10 h-10" />
    </div>
  );
}

function PublicLanding({ onStaffLogin }: { onStaffLogin: () => void }) {
  const [activeTab, setActiveTab] = useState<'request' | 'status'>('request');
  const [formData, setFormData] = useState({ clientName: '', phone: '', device: '', issueDescription: '', needsCallback: true, deviceImageUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("Файл занадто великий. Будь ласка, оберіть фото менше 800КБ.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, deviceImageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };
  const [orderId, setOrderId] = useState('');
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveredOrders, setRecoveredOrders] = useState<any[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelOrder = async () => {
    if (!checkResult || !checkResult.id) return;
    
    setIsSubmitting(true);
    try {
      const orderRef = doc(db, 'orders', checkResult.id);
      await deleteDoc(orderRef);
      setCheckResult(null);
      setOrderId('');
      setShowCancelConfirm(false);
      setError('Замовлення було успішно видалено.');
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setError('Помилка доступу: ви не можете видалити це замовлення.');
      } else {
        setError('Не вдалося видалити замовлення.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'clients'), {
        name: formData.clientName,
        phone: formData.phone,
        createdAt: serverTimestamp()
      });

      const orderRef = await addDoc(collection(db, 'orders'), {
        clientName: formData.clientName,
        phone: formData.phone,
        device: formData.device,
        issueDescription: formData.issueDescription,
        deviceImageUrl: formData.deviceImageUrl,
        needsCallback: formData.needsCallback,
        status: 'В ОБРОБЦІ',
        masterName: '—',
        price: 0,
        createdAt: serverTimestamp(),
      });
      
      setSubmittedOrderId(orderRef.id);
      setFormData({ clientName: '', phone: '', device: '', issueDescription: '', needsCallback: true, deviceImageUrl: '' });
      setImagePreview(null);
    } catch (err) {
      setError('Помилка при створенні заявки. Спробуйте ще раз.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    setError('');
    setRecoveredOrders([]);
    try {
      const { where, getDocs, limit } = await import('firebase/firestore');
      const qPhone = query(collection(db, 'orders'), where('phone', '==', recoveryPhone.trim()), limit(5));
      const snap = await getDocs(qPhone);
      if (snap.empty) {
        setError('Замовлень за цим номером не знайдено.');
      } else {
        setRecoveredOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      setError('Помилка при пошуку замовлення.');
      console.error(err);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const docSnap = await getDoc(doc(db, 'orders', orderId.trim()));
      if (docSnap.exists()) {
        setCheckResult({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Замовлення з таким ID не знайдено');
      }
    } catch (err) {
      setError('Помилка при перевірці статусу.');
    }
  };

  return (
    <div className="min-h-screen text-brand-ink font-sans selection:bg-brand-ink selection:text-brand-bg relative overflow-x-hidden">
      <DecorativeBackground />
      <header className="border-b border-brand-line p-6 flex justify-between items-center bg-brand-ink text-brand-bg sticky top-0 z-40">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="p-1.5 bg-brand-bg rounded-sm text-brand-ink relative flex items-center justify-center w-12 h-12 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
              <Banana className="w-8 h-8 rotate-12 fill-brand-ink/10" />
            </div>
            <h1 className="text-xl font-display uppercase tracking-tight text-brand-bg">
              Monkey<span className="ml-1">LAB</span>
            </h1>
          </div>
        <button 
          onClick={onStaffLogin}
          className="text-[10px] font-mono border-2 border-brand-bg px-5 py-2 hover:bg-brand-bg hover:text-brand-ink transition-all uppercase tracking-widest text-brand-bg font-bold"
        >
          Staff.Access
        </button>
      </header>

      <main className="max-w-[1440px] mx-auto p-8 pt-20">
        <div className="grid lg:grid-cols-[180px_1fr_180px] gap-12 items-start">
          
          <aside className="hidden lg:block space-y-8 sticky top-32">
            <div className="border-4 border-brand-ink bg-brand-bg p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
              <div className="text-[10px] font-mono uppercase bg-brand-ink text-brand-bg px-2 py-0.5 inline-block mb-4">MISSION_OBJECTIVE</div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-3">Відновлення Технологій</h4>
              <p className="text-[11px] leading-relaxed font-serif italic opacity-80 border-l-2 border-brand-ink pl-3">
                Monkey Lab спеціалізується на відновленні складних електронних архітектур. Наш протокол передбачає повну діагностику та прецизійний ремонт кожного вузла.
              </p>
            </div>

            <div className="bg-brand-ink text-brand-bg p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                  <Banana className="w-4 h-4 text-brand-bg" />
                  <span className="text-[8.5px] font-mono uppercase tracking-widest font-bold">Protocol_4.0_READY</span>
                </div>
              </div>
              <div className="h-0.5 bg-brand-bg/10 w-full mb-3" />
              <p className="text-[9.5px] uppercase font-mono leading-relaxed font-bold opacity-90">Цифрова діагностика та апаратний тюнінг пристроїв будь-якої складності.</p>
            </div>
          </aside>

          <div className="flex flex-col">
            <section className="mb-20 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-black tracking-tighter uppercase mb-4 leading-[0.9]"
              >
                Monkey<br /><span className="text-brand-bg p-2 bg-brand-ink inline-block">Lab</span><br />Service
              </motion.h2>
              <p className="font-mono text-sm uppercase tracking-[0.2em] text-brand-ink font-black bg-brand-bg/90 px-3 py-1.5 inline-block shadow-[4px_4px_0px_#000000]">Швидко • Надійно • Екстремально</p>
            </section>

            <div className="grid md:grid-cols-[180px_1fr] gap-12">
              <div className="space-y-4">
                 <button 
                    onClick={() => setActiveTab('request')}
                    className={`w-full flex flex-col items-center justify-center py-8 border-4 ${activeTab === 'request' ? 'border-brand-ink bg-brand-bg shadow-[12px_12px_0px_#000000]' : 'border-brand-ink bg-brand-surface opacity-40 hover:opacity-100 hover:bg-brand-bg/40'} transition-all group`}
                 >
                    <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 font-bold ${activeTab === 'request' ? 'text-brand-ink' : 'text-brand-ink/60'}`}>Сервіс</div>
                    <h3 className="text-3xl font-display uppercase leading-none">Заявка</h3>
                 </button>

                 <button 
                    onClick={() => setActiveTab('status')}
                    className={`w-full flex flex-col items-center justify-center py-8 border-4 ${activeTab === 'status' ? 'border-brand-ink bg-brand-bg shadow-[12px_12px_0px_#000000]' : 'border-brand-line bg-brand-surface opacity-40 hover:opacity-100 hover:bg-brand-bg/40'} transition-all group`}
                 >
                    <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 font-bold ${activeTab === 'status' ? 'text-brand-ink' : 'text-brand-ink/60'}`}>Трекер</div>
                    <h3 className="text-3xl font-display uppercase leading-none">Статус</h3>
                 </button>
              </div>

              <div className="bg-brand-bg border-4 border-brand-ink shadow-[16px_16px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="bg-brand-ink h-2 w-full" />
                <div className="p-12">
                <AnimatePresence mode="wait">
                  {submittedOrderId ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10"
                    >
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight">Заявку прийнято!</h3>
                      
                      <div className="bg-brand-bg/50 p-4 border border-brand-line/20 rounded-sm space-y-3 text-left w-full">
                        <div className="flex gap-3">
                          <div className="w-5 h-5 bg-brand-ink text-brand-bg rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                          <p className="text-[10px] font-mono uppercase tracking-tight leading-relaxed">
                            Найближчим часом вам зателефонує наш майстер для уточнення деталей.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-5 h-5 bg-brand-ink text-brand-bg rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                          <p className="text-[10px] font-mono uppercase tracking-tight leading-relaxed">
                            Після розгляду заявки майстер запропонує відправити пристрій до найближчого відділення Нової Пошти.
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] font-mono opacity-60 uppercase tracking-widest max-w-[250px]">
                        Збережіть цей номер для відстеження статусу:
                      </p>
                      <div className="bg-brand-bg p-4 border border-brand-line w-full font-mono text-sm font-bold select-all cursor-pointer hover:bg-brand-line/10 transition-colors">
                        {submittedOrderId}
                      </div>
                      <div className="flex gap-4 w-full">
                        <button 
                          onClick={() => {
                            setOrderId(submittedOrderId);
                            setActiveTab('status');
                            setSubmittedOrderId(null);
                          }}
                          className="flex-1 bg-brand-ink text-brand-bg p-3 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          ПЕРЕВІРИТИ СТАТУС
                        </button>
                        <button 
                          onClick={() => setSubmittedOrderId(null)}
                          className="flex-1 border border-brand-line p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-bg transition-colors"
                        >
                          НОВА ЗАЯВКА
                        </button>
                      </div>
                    </motion.div>
                  ) : activeTab === 'request' ? (
                    <motion.div
                      key="req"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-8 border-b border-brand-line pb-4">Форма реєстрації</h4>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70">Ваше Ім'я</label>
                          <input 
                            required
                            value={formData.clientName}
                            onChange={e => setFormData({...formData, clientName: e.target.value})}
                            className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-brand-bg/10 focus:bg-brand-bg/20 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70">Номер телефону</label>
                          <input 
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-brand-bg/10 focus:bg-brand-bg/20 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70">Пристрій</label>
                          <input 
                            required
                            placeholder="напр. iPhone 13 Pro"
                            value={formData.device}
                            onChange={e => setFormData({...formData, device: e.target.value})}
                            className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-brand-bg/10 focus:bg-brand-bg/20 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70">Опис поломки</label>
                          <textarea 
                            required
                            rows={3}
                            value={formData.issueDescription}
                            onChange={e => setFormData({...formData, issueDescription: e.target.value})}
                            className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-brand-bg/10 focus:bg-brand-bg/20 outline-none resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70 block">Фото пристрою (Бажано)</label>
                          <div className="flex gap-4 items-start">
                            <label className="flex-1 border-2 border-dashed border-brand-ink/40 hover:border-brand-ink transition-colors cursor-pointer aspect-video flex flex-col items-center justify-center bg-brand-bg/10 group relative overflow-hidden">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="hidden" 
                              />
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 opacity-20 group-hover:opacity-40 transition-opacity mb-2" />
                                  <span className="text-[10px] font-mono opacity-40 group-hover:opacity-60 text-center px-4">Натисніть для завантаження фото поломки</span>
                                </>
                              )}
                              {imagePreview && (
                                <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-brand-bg text-[10px] font-bold uppercase tracking-widest">Змінити фото</span>
                                </div>
                              )}
                            </label>
                            {imagePreview && (
                              <button 
                                type="button" 
                                onClick={() => { setImagePreview(null); setFormData({...formData, deviceImageUrl: ''}); }}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 text-[8px] font-mono uppercase font-bold hover:bg-red-500 hover:text-white transition-all"
                              >
                                Видалити
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                           <input 
                             type="checkbox"
                             id="needsCallback"
                             checked={formData.needsCallback}
                             onChange={e => setFormData({...formData, needsCallback: e.target.checked})}
                             className="w-4 h-4 border-2 border-brand-ink bg-brand-bg/10 accent-brand-ink"
                           />
                           <label htmlFor="needsCallback" className="text-[10px] font-mono uppercase tracking-wide font-bold cursor-pointer select-none">
                             Передзвонити мені
                           </label>
                        </div>

                        {error && <div className="text-red-600 text-[10px] uppercase font-bold font-mono">{error}</div>}
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-ink text-brand-bg p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-brand-bg hover:text-brand-ink border-2 border-brand-ink transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ВІДПРАВИТИ ЗАПИТ'}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-8 border-b border-brand-line pb-4">Перевірка статусу</h4>
                      
                      {!showRecovery ? (
                        <>
                          <form onSubmit={handleStatusCheck} className="space-y-4 mb-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono uppercase font-bold text-brand-ink/70">ID Замовлення</label>
                              <div className="flex gap-2">
                                <input 
                                  required
                                  value={orderId}
                                  onChange={e => setOrderId(e.target.value)}
                                  placeholder="xxxxxxxxxxxxxxxx"
                                  className="flex-1 border-2 border-brand-ink p-3 font-mono text-xs outline-none bg-brand-bg/10 font-bold focus:bg-brand-bg/20"
                                />
                                <button type="submit" className="bg-brand-ink text-brand-bg px-6 uppercase text-[10px] font-bold tracking-widest border-2 border-brand-ink hover:bg-brand-bg hover:text-brand-ink transition-colors">
                                  OK
                                </button>
                              </div>
                            </div>
                          </form>
                          <button 
                            onClick={() => setShowRecovery(true)}
                            className="text-[9px] font-mono uppercase font-bold text-brand-ink/40 hover:text-brand-ink transition-colors mb-8 block"
                          >
                            Забули номер замовлення?
                          </button>
                        </>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mb-8">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase opacity-50">Пошук за номером телефону</label>
                            <form onSubmit={handleRecoverOrder} className="flex gap-2">
                              <input 
                                required
                                type="tel"
                                value={recoveryPhone}
                                onChange={e => setRecoveryPhone(e.target.value)}
                                placeholder="+380..."
                                className="flex-1 border-2 border-brand-ink p-3 font-mono text-xs outline-none bg-brand-bg/10 font-bold focus:bg-brand-bg/20"
                              />
                              <button type="submit" disabled={isRecovering} className="bg-brand-ink text-brand-bg px-6 uppercase text-[10px] font-bold tracking-widest min-w-[60px] border-2 border-brand-ink hover:bg-brand-bg hover:text-brand-ink transition-colors">
                                {isRecovering ? '...' : 'ЗНАЙТИ'}
                              </button>
                            </form>
                          </div>
                          
                          {recoveredOrders.length > 0 && (
                            <div className="space-y-2 max-h-[200px] overflow-auto border border-brand-line p-3 bg-brand-bg/10">
                              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Знайдені замовлення:</div>
                              {recoveredOrders.map(o => (
                                <div 
                                  key={o.id} 
                                  onClick={() => {
                                    setOrderId(o.id);
                                    setCheckResult(o);
                                    setShowRecovery(false);
                                  }}
                                  className="p-2 border border-brand-line/10 hover:border-brand-line cursor-pointer text-[10px] font-mono flex justify-between items-center"
                                >
                                  <span>{o.device}</span>
                                  <span className="font-bold">#{o.id.slice(0, 5)}...</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <button 
                            onClick={() => setShowRecovery(false)}
                            className="text-[9px] font-mono uppercase opacity-40 hover:opacity-100 transition-opacity"
                          >
                            ← Повернутися до вводу ID
                          </button>
                        </motion.div>
                      )}
                      
                      {error && <div className="text-red-500 text-[10px] uppercase font-mono mb-4">{error}</div>}

                      {checkResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-brand-line p-6 bg-brand-bg/10 space-y-4"
                        >
                          <div>
                            <div className="text-[9px] font-mono uppercase opacity-40">Статус</div>
                            <div className="text-xl font-black uppercase decoration-brand-ink underline underline-offset-4">{checkResult.status}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[9px] font-mono uppercase opacity-40">Пристрій</div>
                              <div className="text-xs font-bold uppercase">{checkResult.device}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono uppercase opacity-40">Ціна</div>
                              <div className="text-xs font-bold font-mono">₴{checkResult.price}</div>
                            </div>
                          </div>

                          {checkResult.deviceImageUrl && (
                            <div className="border-t border-brand-line/10 pt-4">
                               <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Ваше фото пристрою</div>
                               <div className="border border-brand-ink/20 p-1 bg-white">
                                 <img 
                                   src={checkResult.deviceImageUrl} 
                                   alt="Device" 
                                   className="w-full h-auto cursor-zoom-in" 
                                   onClick={() => window.open(checkResult.deviceImageUrl, '_blank')}
                                 />
                               </div>
                            </div>
                          )}

                          <div className="border-t border-brand-line/10 pt-4">
                            <div className="text-[9px] font-mono uppercase opacity-40 mb-1">Підтвердження дзвінком</div>
                            <div className="text-[10px] font-bold uppercase">
                              {checkResult.needsCallback ? "Запитано дзвінок для підтвердження" : "Підтвердження без дзвінка"}
                            </div>
                          </div>

                          {checkResult.status !== 'Скасовано' && checkResult.status !== 'Видано' && (
                            <div className="pt-2">
                              {!showCancelConfirm ? (
                                <button 
                                  onClick={() => setShowCancelConfirm(true)}
                                  disabled={isSubmitting}
                                  className="w-full border border-red-500/20 text-red-500 py-3 text-[9px] font-mono uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                  {isSubmitting ? 'ОБРОБКА...' : 'СКАСУВАТИ ЗАМОВЛЕННЯ'}
                                </button>
                              ) : (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-4 border border-red-500/30 bg-red-500/5 space-y-4"
                                >
                                  <div className="text-[10px] font-mono uppercase text-red-500 text-center font-bold tracking-wider">
                                    Ви впевнені, що хочете видалити це замовлення?
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={handleCancelOrder}
                                      disabled={isSubmitting}
                                      className="flex-1 bg-red-500 text-white py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                                    >
                                      ТАК, ВИДАЛИТИ
                                    </button>
                                    <button 
                                      onClick={() => setShowCancelConfirm(false)}
                                      className="flex-1 border border-brand-line py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-brand-bg transition-colors"
                                    >
                                      НІ, ЗАЛИШИТИ
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

          <aside className="hidden lg:block space-y-8 sticky top-32">
            <div className="border-4 border-brand-ink bg-brand-surface p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-mono uppercase bg-brand-ink text-brand-bg px-2 py-0.5 inline-block mb-4">SYSTEM_BENEFITS</div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-4 h-4 rounded-full border border-brand-ink flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-ink rounded-full" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase">Гарантія Якості</h5>
                    <p className="text-[9px] opacity-70 uppercase font-mono">Використовуємо лише оригінальні модулі та компоненти класу A+.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-4 h-4 rounded-full border border-brand-ink flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-ink rounded-full" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase">Прозорість</h5>
                    <p className="text-[9px] opacity-70 uppercase font-mono">Відстежуйте кожен крок ремонту в реальному часі через ID.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-4 h-4 rounded-full border border-brand-ink flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-ink rounded-full" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase">Швидкість</h5>
                    <p className="text-[9px] opacity-70 uppercase font-mono">Експрес-діагностика за 30 хвилин. Ремонт у день звернення.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-brand-ink text-brand-bg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono font-bold tracking-widest">LIVE_STATS</span>
                <div className="w-2 h-2 bg-brand-bg rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono">
                  <span>DEVICES_RESTORED</span>
                  <span>1,432</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span>MASTERS_ACTIVE</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span>CLIENT_SATISFACTION</span>
                  <span>99.8%</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-20 border-t-4 border-brand-ink bg-brand-bg relative z-10">
        <div className="max-w-[1440px] mx-auto py-16 px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-brand-ink text-brand-bg rounded-sm flex items-center justify-center w-10 h-10">
                  <Banana className="w-6 h-6 rotate-12" />
                </div>
                <h1 className="text-xl font-display uppercase tracking-tight text-brand-ink">
                  Monkey<span className="ml-1">LAB</span>
                </h1>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-widest leading-relaxed text-brand-ink font-bold">
                ВІДНОВЛЕННЯ ЦИФРОВИХ АРХІТЕКТУР ТА АПАРАТНИЙ ТЮНІНГ. ЕКСТРЕМАЛЬНА ЯКІСТЬ ТА НАДІЙНІСТЬ.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-ink border-b-2 border-brand-ink pb-2 inline-block">Контакти</h4>
              <ul className="space-y-2 text-[11px] font-mono uppercase font-bold text-brand-ink">
                <li>Вул. Кам'янецька, 54</li>
                <li>м. Хмельницький, Україна</li>
                <li>+380686061635</li>
                <li>support@monkeylab.ua</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-ink border-b-2 border-brand-ink pb-2 inline-block">Графік роботи</h4>
              <ul className="space-y-2 text-[11px] font-mono uppercase font-bold text-brand-ink">
                <li>ПН-ПТ: 09:00 — 20:00</li>
                <li>СБ: 10:00 — 18:00</li>
                <li>НД: ВИХІДНИЙ_РЕЖИМ</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-ink border-b-2 border-brand-ink pb-2 inline-block">Соціальні мережі</h4>
              <div className="flex gap-4">
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-brand-ink flex items-center justify-center hover:bg-brand-ink hover:text-brand-bg transition-all">
                  <DiscordIcon className="w-5 h-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-brand-ink flex items-center justify-center hover:bg-brand-ink hover:text-brand-bg transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-brand-ink flex items-center justify-center hover:bg-brand-ink hover:text-brand-bg transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-brand-ink pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[9px] font-mono uppercase font-black tracking-[0.5em] text-brand-ink">
              © 2026 MONKEY LAB ENTERPRISE INFRASTRUCTURE
            </div>
            <div className="flex gap-6 text-[9px] font-mono uppercase font-black text-brand-ink">
              <a href="#" className="hover:underline">Умови використання</a>
              <a href="#" className="hover:underline">Конфіденційність</a>
              <a href="#" className="hover:underline">Системний статус</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoginScreen({ onBackToSite }: { onBackToSite: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('НЕВІРНИЙ ЛОГІН АБО ПАРОЛЬ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-brand-ink flex items-center justify-center p-6 bg-[radial-gradient(rgba(255,210,0,0.3)_1px,transparent_1px)] [background-size:32px_32px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm overflow-hidden border-4 border-brand-bg shadow-[16px_16px_0px_#000000]"
      >
        <div className="bg-brand-surface p-8 flex flex-col items-center border-b-4 border-brand-ink">
          <div className="relative p-4 bg-brand-ink rounded-full mb-6 ring-4 ring-white/20">
            <Banana className="w-12 h-12 text-brand-bg fill-brand-bg/20 rotate-12" />
          </div>
          <h1 className="text-2xl font-display uppercase tracking-tight text-brand-ink">
            Monkey<span className="ml-1">LAB</span>
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold mt-2 bg-brand-ink text-brand-bg px-2 py-0.5">RESTRICTED_AREA</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface p-8 space-y-6">
          <button 
            type="button"
            onClick={onBackToSite}
            className="w-full border-2 border-brand-ink p-2 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-brand-bg hover:text-brand-ink transition-all mb-4"
          >
            ← RETURN_TO_BASE
          </button>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-brand-ink mb-1.5">User Identification</label>
              <input 
                required
                type="email"
                placeholder="EMAIL_ADDR"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg/10 border-2 border-brand-ink p-3 font-mono text-xs focus:bg-brand-bg/20 outline-none placeholder:opacity-30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-brand-ink mb-1.5">Encryption Key</label>
              <input 
                required
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg/10 border-2 border-brand-ink p-3 font-mono text-xs focus:bg-brand-bg/20 outline-none placeholder:opacity-30"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-600 text-white text-[10px] font-mono font-bold uppercase border-2 border-brand-ink">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-ink text-brand-bg p-4 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-bg hover:text-brand-ink border-2 border-brand-ink transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'EXEC_INITIALIZE'}
          </button>

          <div className="pt-4 text-center">
            <span className="text-[8px] font-mono uppercase opacity-30 tracking-[0.5em]">SYSTEM_VERSION_2.0.0_STABLE</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function NewOrderModal({ onClose, onCreated, clients }: { onClose: () => void, onCreated: () => void, clients: Client[] }) {
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    device: '',
    issueDescription: '',
    price: '',
    needsCallback: true,
    deviceImageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("Файл занадто великий. Будь ласка, оберіть фото менше 800КБ.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, deviceImageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        clientName: formData.clientName,
        phone: formData.phone,
        device: formData.device,
        issueDescription: formData.issueDescription,
        needsCallback: formData.needsCallback,
        deviceImageUrl: formData.deviceImageUrl,
        status: 'В ОБРОБЦІ',
        masterName: '—',
        price: Number(formData.price) || 0,
        createdAt: serverTimestamp(),
      });
      
      const existingClient = clients.find(c => c.phone === formData.phone);
      if (!existingClient) {
        await addDoc(collection(db, 'clients'), {
          name: formData.clientName,
          phone: formData.phone,
          createdAt: serverTimestamp()
        });
      }

      onCreated();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-md">
      <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }} className="w-full max-w-3xl bg-brand-surface border border-brand-line shadow-[20px_20px_0px_#14141411] overflow-hidden">
        <div className="bg-brand-ink text-brand-bg p-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest">Створення нової заявки</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-[9px] font-mono uppercase opacity-50 mb-1.5">ПІБ Клієнта</label><input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono outline-none bg-brand-bg/20" /></div>
              <div><label className="block text-[9px] font-mono uppercase opacity-50 mb-1.5">Телефон</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono outline-none bg-brand-bg/20" /></div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-[9px] font-mono uppercase opacity-50 mb-1.5">Пристрій (Модель)</label><input required value={formData.device} onChange={e => setFormData({...formData, device: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono outline-none bg-brand-bg/20" /></div>
              <div><label className="block text-[9px] font-mono uppercase opacity-50 mb-1.5">Ціна (₴)</label><input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono outline-none bg-brand-bg/20" /></div>
            </div>
          </div>
          <textarea required rows={3} placeholder="ОПИС НЕСПРАВНОСТІ" value={formData.issueDescription} onChange={e => setFormData({...formData, issueDescription: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono outline-none bg-brand-bg/20" />
          
          <div className="space-y-4">
            <label className="block text-[9px] font-mono uppercase opacity-50">Фото пристрою (Обов'язково)</label>
            <div className="flex gap-4 items-start">
              <label className="flex-1 border-2 border-dashed border-brand-line/20 hover:border-brand-ink/40 transition-colors cursor-pointer aspect-video flex flex-col items-center justify-center bg-brand-bg/5 group relative overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 opacity-20 group-hover:opacity-40 transition-opacity mb-2" />
                    <span className="text-[10px] font-mono opacity-40 group-hover:opacity-60">Натисніть для завантаження</span>
                  </>
                )}
                {imagePreview && (
                  <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-brand-bg text-[10px] font-bold uppercase tracking-widest">Змінити фото</span>
                  </div>
                )}
              </label>
              {imagePreview && (
                <button 
                  type="button" 
                  onClick={() => { setImagePreview(null); setFormData({...formData, deviceImageUrl: ''}); }}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 text-[8px] font-mono uppercase font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                  Видалити
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <input 
               type="checkbox"
               id="newOrderNeedsCallback"
               checked={formData.needsCallback}
               onChange={e => setFormData({...formData, needsCallback: e.target.checked})}
               className="w-4 h-4 accent-brand-ink"
             />
             <label htmlFor="newOrderNeedsCallback" className="text-[10px] font-mono uppercase tracking-widest cursor-pointer select-none opacity-60 hover:opacity-100 transition-opacity">
               Потрібен дзвінок для підтвердження
             </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-line p-3 text-[10px] font-bold uppercase tracking-widest">Скасувати</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-ink text-brand-bg p-3 text-[10px] font-bold uppercase tracking-widest">{isSubmitting ? '...' : 'Зберегти'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function NewClientModal({ onClose, onCreated }: any) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await addDoc(collection(db, 'clients'), { ...formData, createdAt: serverTimestamp() }); onCreated(); }
    catch (err) { handleFirestoreError(err, OperationType.WRITE, 'clients'); }
    finally { setIsSubmitting(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-md">
      <motion.div className="w-full max-w-xl bg-brand-surface border border-brand-line p-8 shadow-[20px_20px_0px_#14141411]">
        <h2 className="text-xs font-bold uppercase mb-6 tracking-widest">Новий клієнт</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="ПІБ" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          <input required placeholder="ТЕЛЕФОН" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          <input placeholder="EMAIL" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-line p-2 text-[10px] uppercase">Відміна</button>
            <button type="submit" className="flex-1 bg-brand-ink text-brand-bg p-2 text-[10px] uppercase">Зберегти</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function NewInventoryModal({ onClose, onCreated }: any) {
  const [formData, setFormData] = useState({ name: '', sku: '', quantity: '', purchasePrice: '', sellPrice: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await addDoc(collection(db, 'inventory'), { ...formData, quantity: Number(formData.quantity), purchasePrice: Number(formData.purchasePrice), sellPrice: Number(formData.sellPrice), createdAt: serverTimestamp() }); onCreated(); }
    catch (err) { handleFirestoreError(err, OperationType.WRITE, 'inventory'); }
    finally { setIsSubmitting(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-md">
      <motion.div className="w-full max-w-xl bg-brand-surface border border-brand-line p-8 shadow-[20px_20px_0px_#14141411]">
        <h2 className="text-xs font-bold uppercase mb-6 tracking-widest">Додати на склад</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="НАЗВА" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          <input required placeholder="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-40">Кількість</label>
              <input required type="number" placeholder="КІЛЬКІСТЬ" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-40">Закупка</label>
              <input required type="number" placeholder="ЗАКУПКА" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-40">Продаж</label>
              <input required type="number" placeholder="ПРОДАЖ" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-line p-2 text-[10px] uppercase">Відміна</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-ink text-brand-bg p-2 text-[10px] uppercase tracking-widest font-bold">
              {isSubmitting ? '...' : 'ДОДАТИ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditInventoryModal({ item, onClose, onUpdated }: any) {
  const [formData, setFormData] = useState({ 
    name: item.name, 
    sku: item.sku, 
    quantity: item.quantity.toString(), 
    purchasePrice: item.purchasePrice.toString(), 
    sellPrice: item.sellPrice.toString() 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try { 
      await updateDoc(doc(db, 'inventory', item.id), { 
        ...formData, 
        quantity: Number(formData.quantity), 
        purchasePrice: Number(formData.purchasePrice), 
        sellPrice: Number(formData.sellPrice),
        updatedAt: serverTimestamp()
      }); 
      onUpdated(); 
    }
    catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, `inventory/${item.id}`); 
    }
    finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-md">
      <motion.div className="w-full max-w-xl bg-brand-surface border border-brand-line p-8 shadow-[20px_20px_0px_#14141411]">
        <h2 className="text-xs font-bold uppercase mb-6 tracking-widest">Редагувати товар</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-mono uppercase opacity-50">Назва</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-mono uppercase opacity-50">SKU</label>
            <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-50">Кількість</label>
              <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-50">Закупка</label>
              <input required type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase opacity-50">Продаж</label>
              <input required type="number" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} className="w-full border border-brand-line p-2 text-xs font-mono" />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-line p-2 text-[10px] uppercase">Скасувати</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-ink text-brand-bg p-2 text-[10px] uppercase font-bold tracking-widest">
              {isSubmitting ? 'Оновлення...' : 'ЗБЕРЕГТИ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
