import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';
import { Gift, MarketingSettings, UserProfile } from '../types';
import { 
  ShieldCheck, 
  RefreshCcw, 
  Megaphone, 
  Users, 
  Trash2, 
  Plus, 
  Minus, 
  Save, 
  Loader2, 
  Search,
  Lock,
  Zap,
  Gift as GiftIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { isAdmin, profile: adminProfile } = useAuth();
  const [marketing, setMarketing] = useState<MarketingSettings>({
    saleName: 'Mega Launch Party',
    discountPercentage: 50,
    isSaleActive: false,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingMarketing, setIsSavingMarketing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Gift Modal State
  const [selectedUserForGift, setSelectedUserForGift] = useState<UserProfile | null>(null);
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftMessage, setGiftMessage] = useState('A special gift for you!');
  const [isSendingGift, setIsSendingGift] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch Marketing Settings
    const marketingDoc = doc(db, 'settings', 'marketing');
    getDoc(marketingDoc).then(snap => {
      if (snap.exists()) {
        setMarketing(snap.data() as MarketingSettings);
      }
    });

    // Fetch Users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('joinedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setUsers(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleSaveMarketing = async () => {
    setIsSavingMarketing(true);
    try {
      const marketingDoc = doc(db, 'settings', 'marketing');
      await setDoc(marketingDoc, marketing);
      alert('Marketing settings updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/marketing');
    } finally {
      setIsSavingMarketing(false);
    }
  };

  const handleUpdateTokens = async (userId: string, amount: number) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const userProfile = users.find(u => u.uid === userId);
      if (!userProfile) return;
      
      const currentTokens = typeof userProfile.tokens === 'number' ? userProfile.tokens : 0;
      const newTokens = Math.max(0, currentTokens + amount);
      
      await updateDoc(userDoc, { tokens: newTokens });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === adminProfile?.uid) {
      alert('You cannot delete your own account!');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleSendGift = async () => {
    if (!selectedUserForGift) return;
    setIsSendingGift(true);
    try {
      const userDoc = doc(db, 'users', selectedUserForGift.uid);
      const newGift: Gift = {
        id: Math.random().toString(36).substring(2, 15),
        amount: giftAmount,
        message: giftMessage,
        isOpened: false,
        createdAt: Timestamp.now(),
      };
      
      const currentGifts = selectedUserForGift.gifts || [];
      await updateDoc(userDoc, {
        gifts: [newGift, ...currentGifts]
      });
      
      alert(`Gift of ${giftAmount} tokens sent to ${selectedUserForGift.displayName || selectedUserForGift.email}!`);
      setSelectedUserForGift(null);
      setGiftAmount(10);
      setGiftMessage('A special gift for you!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedUserForGift.uid}`);
    } finally {
      setIsSendingGift(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-text">Access Denied</h1>
          <p className="text-muted max-w-xs mx-auto">This area is strictly restricted to administrators only.</p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="bg-primary text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          Go Back
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 shrink-0">
            <ShieldCheck size={28} className="sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-text">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted font-medium">Manage users and tokens.</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto bg-card border border-border hover:border-primary text-text font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {/* Marketing & Sales */}
      <section className="bg-card border border-border rounded-3xl sm:rounded-[40px] p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-xl mx-4 sm:mx-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Megaphone size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text">Marketing & Sales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted ml-1 uppercase tracking-widest">Sale Name</label>
            <input 
              type="text" 
              value={marketing.saleName}
              onChange={(e) => setMarketing({ ...marketing, saleName: e.target.value })}
              className="w-full bg-background border border-border rounded-2xl py-4 px-6 text-text focus:outline-none focus:border-primary transition-all"
              placeholder="Mega Launch Party"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted ml-1 uppercase tracking-widest">Discount Percentage</label>
            <input 
              type="number" 
              value={marketing.discountPercentage}
              onChange={(e) => setMarketing({ ...marketing, discountPercentage: parseInt(e.target.value) || 0 })}
              className="w-full bg-background border border-border rounded-2xl py-4 px-6 text-text focus:outline-none focus:border-primary transition-all"
              placeholder="50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted ml-1 uppercase tracking-widest">Activate Sale Mode</label>
            <div className="flex items-center gap-4 py-4">
              <button 
                onClick={() => setMarketing({ ...marketing, isSaleActive: !marketing.isSaleActive })}
                className={`w-14 h-8 rounded-full p-1 transition-all ${marketing.isSaleActive ? 'bg-primary' : 'bg-muted/20'}`}
              >
                <motion.div 
                  animate={{ x: marketing.isSaleActive ? 24 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
              <span className={`text-sm font-bold ${marketing.isSaleActive ? 'text-primary' : 'text-muted'}`}>
                {marketing.isSaleActive ? 'Sale is ON' : 'Sale is OFF'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveMarketing}
          disabled={isSavingMarketing}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 disabled:bg-muted/20 text-white font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          {isSavingMarketing ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Save Settings
        </button>
      </section>

      {/* Registered Users */}
      <section className="bg-card border border-border rounded-3xl sm:rounded-[40px] overflow-hidden shadow-xl mx-4 sm:mx-0">
        <div className="p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text flex items-center gap-3">
              Users
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{users.length}</span>
            </h2>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-background border border-border rounded-2xl py-3 pl-12 pr-4 text-text text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 text-muted text-[10px] font-black uppercase tracking-widest border-b border-border">
                <th className="px-6 lg:px-10 py-6">User</th>
                <th className="px-6 lg:px-10 py-6">Email</th>
                <th className="px-6 lg:px-10 py-6">V-Tokens</th>
                <th className="px-6 lg:px-10 py-6">Joined</th>
                <th className="px-6 lg:px-10 py-6">Manage</th>
                <th className="px-6 lg:px-10 py-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 lg:px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
                        {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text truncate flex items-center gap-2">
                          {user.displayName || 'User'}
                          {user.role === 'admin' && <span className="px-2 py-0.5 bg-primary text-white text-[8px] rounded-full uppercase shrink-0">Admin</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-10 py-6 text-sm text-muted font-medium truncate max-w-[200px]">{user.email}</td>
                  <td className="px-6 lg:px-10 py-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-sm w-fit">
                      <Zap size={14} />
                      {user.tokens === '∞' ? '∞' : user.tokens}
                    </div>
                  </td>
                  <td className="px-6 lg:px-10 py-6 text-sm text-muted font-medium whitespace-nowrap">
                    {user.joinedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 lg:px-10 py-6">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        defaultValue={10}
                        id={`tokens-desktop-${user.uid}`}
                        className="w-14 bg-background border border-border rounded-lg py-2 px-1 text-center text-sm font-bold focus:outline-none focus:border-primary"
                      />
                      <button 
                        onClick={() => {
                          const val = parseInt((document.getElementById(`tokens-desktop-${user.uid}`) as HTMLInputElement).value) || 0;
                          handleUpdateTokens(user.uid, val);
                        }}
                        className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          const val = parseInt((document.getElementById(`tokens-desktop-${user.uid}`) as HTMLInputElement).value) || 0;
                          handleUpdateTokens(user.uid, -val);
                        }}
                        className="p-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 lg:px-10 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedUserForGift(user)}
                        className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2 px-3"
                        title="Send Gift"
                      >
                        <GiftIcon size={16} />
                        <span className="text-[10px] font-bold hidden xl:inline">Gift</span>
                      </button>
                      {user.uid === adminProfile?.uid ? (
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest italic">Self</span>
                      ) : (
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive hover:text-white transition-all flex items-center gap-2 px-3"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                          <span className="text-[10px] font-bold hidden xl:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {filteredUsers.map((user) => (
            <div key={user.uid} className="p-6 space-y-6 hover:bg-primary/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
                    {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-text truncate flex items-center gap-2">
                      {user.displayName || 'User'}
                      {user.role === 'admin' && <span className="px-2 py-0.5 bg-primary text-white text-[8px] rounded-full uppercase shrink-0">Admin</span>}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-xs shrink-0">
                  <Zap size={12} />
                  {user.tokens === '∞' ? '∞' : user.tokens}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Manage Tokens</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      defaultValue={10}
                      id={`tokens-mobile-${user.uid}`}
                      className="w-full bg-background border border-border rounded-lg py-2 px-2 text-center text-sm font-bold focus:outline-none focus:border-primary"
                    />
                    <button 
                      onClick={() => {
                        const val = parseInt((document.getElementById(`tokens-mobile-${user.uid}`) as HTMLInputElement).value) || 0;
                        handleUpdateTokens(user.uid, val);
                      }}
                      className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        const val = parseInt((document.getElementById(`tokens-mobile-${user.uid}`) as HTMLInputElement).value) || 0;
                        handleUpdateTokens(user.uid, -val);
                      }}
                      className="p-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg shrink-0"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Quick Actions</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedUserForGift(user)}
                      className="flex-1 p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center"
                    >
                      <GiftIcon size={16} />
                    </button>
                    {user.uid !== adminProfile?.uid && (
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="flex-1 p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gift Modal */}
      <AnimatePresence>
        {selectedUserForGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForGift(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <GiftIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-text">Send a Gift</h3>
                      <p className="text-sm text-muted">To: {selectedUserForGift.displayName || selectedUserForGift.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUserForGift(null)}
                    className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                  >
                    <X size={20} className="text-muted" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Token Amount</label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input 
                        type="number" 
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text font-bold focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Message (Optional)</label>
                    <textarea 
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl py-4 px-6 text-text text-sm focus:outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                      placeholder="Write a nice message..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSendGift}
                    disabled={isSendingGift || giftAmount <= 0}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted/20 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    {isSendingGift ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <GiftIcon size={20} />
                        <span>Send Gift Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
