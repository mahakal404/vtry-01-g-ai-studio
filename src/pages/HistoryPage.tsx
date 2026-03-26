import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { HistoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock, Trash2, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch from Firestore
    const historyRef = collection(db, 'history');
    const q = isAdmin 
      ? query(historyRef, orderBy('createdAt', 'desc'))
      : query(historyRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HistoryItem));
      setHistory(items);
      setLoading(false);
      
      // Update LocalStorage
      localStorage.setItem('vtry_history', JSON.stringify(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'history');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this history item?')) return;
    
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, 'history', id));
      // LocalStorage will be updated via onSnapshot
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `history/${id}`);
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-text">History</h1>
        <p className="text-muted font-medium">View your past virtual try-ons and reuse images.</p>
      </div>

      <AnimatePresence mode="wait">
        {history.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card border border-border rounded-[40px] p-16 flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center text-muted">
              <Clock size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-text">No generations yet</h3>
              <p className="text-muted max-w-xs mx-auto">Visit the Studio to start your first virtual try-on experience.</p>
            </div>
            <Link 
              to="/"
              className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Go to Studio
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {history.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:border-primary transition-all shadow-xl hover:shadow-primary/10"
              >
                {/* Result Image */}
                <div className="aspect-square overflow-hidden">
                  <img src={item.resultImage} alt="Result" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                      <img src={item.userImage} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                      <img src={item.clothImage} alt="Cloth" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <p className="text-xs text-white/70 font-medium">
                    {item.createdAt.toDate().toLocaleDateString()} at {item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 bg-white text-black font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      <ExternalLink size={16} />
                      View
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                      className="p-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
                    >
                      {isDeleting === item.id ? (
                        <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh] overflow-y-auto lg:overflow-hidden">
                {/* Result Large */}
                <div className="bg-muted/5 flex items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-border">
                  <div className="relative group w-full aspect-[3/4] max-w-md">
                    <img 
                      src={selectedItem.resultImage} 
                      alt="Result" 
                      className="w-full h-full object-cover rounded-3xl shadow-2xl"
                    />
                    <a 
                      href={selectedItem.resultImage} 
                      download="try-on-result.png"
                      className="absolute bottom-4 right-4 bg-primary text-white font-black px-6 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      Download Result
                    </a>
                  </div>
                </div>

                {/* Details & Inputs */}
                <div className="p-8 lg:p-12 flex flex-col gap-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter">Try-on Details</h2>
                    <p className="text-muted font-medium">
                      Generated on {selectedItem.createdAt.toDate().toLocaleDateString()} at {selectedItem.createdAt.toDate().toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-muted">User Image</p>
                      <div className="aspect-[3/4] bg-muted/10 rounded-2xl overflow-hidden border border-border">
                        <img src={selectedItem.userImage} alt="User" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-muted">Cloth Image</p>
                      <div className="aspect-[3/4] bg-muted/10 rounded-2xl overflow-hidden border border-border">
                        <img src={selectedItem.clothImage} alt="Cloth" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-border flex gap-4">
                    <Link 
                      to="/"
                      state={{ 
                        userImage: selectedItem.userImage,
                        clothImage: selectedItem.clothImage
                      }}
                      className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-center hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                      Reuse Images
                    </Link>
                    <button 
                      onClick={() => {
                        handleDelete(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      className="px-6 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-black rounded-2xl transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
