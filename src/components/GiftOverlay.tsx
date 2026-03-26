import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Gift as GiftIcon, Zap, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift } from '../types';

export default function GiftOverlay() {
  const { profile, user } = useAuth();
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (profile?.gifts) {
      const unopenedGift = profile.gifts.find(g => !g.isOpened);
      if (unopenedGift) {
        setActiveGift(unopenedGift);
      } else {
        setActiveGift(null);
      }
    }
  }, [profile]);

  const handleOpenGift = async () => {
    if (!user || !profile || !activeGift) return;
    setIsOpening(true);

    try {
      const userDoc = doc(db, 'users', user.uid);
      const currentTokens = typeof profile.tokens === 'number' ? profile.tokens : 0;
      
      const updatedGifts = profile.gifts?.map(g => 
        g.id === activeGift.id ? { ...g, isOpened: true } : g
      ) || [];

      await updateDoc(userDoc, {
        tokens: currentTokens + activeGift.amount,
        gifts: updatedGifts
      });

      // Show success state for a moment before closing
      setTimeout(() => {
        setActiveGift(null);
        setIsOpening(false);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      setIsOpening(false);
    }
  };

  if (!activeGift) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm bg-card border-2 border-primary/50 rounded-[40px] p-10 text-center space-y-8 shadow-[0_0_50px_rgba(136,82,224,0.3)] overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/20 blur-[60px] rounded-full animate-pulse" />

        <div className="relative space-y-6">
          <motion.div 
            animate={{ 
              rotate: isOpening ? [0, -10, 10, -10, 10, 0] : [0, -5, 5, -5, 5, 0],
              scale: isOpening ? [1, 1.2, 1.1] : 1
            }}
            transition={{ 
              repeat: isOpening ? 0 : Infinity, 
              duration: isOpening ? 0.5 : 2 
            }}
            className="w-24 h-24 bg-primary rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-primary/40"
          >
            <GiftIcon size={48} />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-text flex items-center justify-center gap-2">
              You Got a Gift! <Sparkles className="text-primary" size={24} />
            </h2>
            <p className="text-muted font-medium">{activeGift.message}</p>
          </div>

          <AnimatePresence mode="wait">
            {isOpening ? (
              <motion.div 
                key="opening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 space-y-4"
              >
                <div className="flex items-center justify-center gap-3 text-4xl font-black text-primary">
                  <Zap size={32} />
                  <span>+{activeGift.amount}</span>
                </div>
                <p className="text-sm font-bold text-muted uppercase tracking-widest animate-pulse">Adding Tokens...</p>
              </motion.div>
            ) : (
              <motion.button 
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleOpenGift}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.95] flex items-center justify-center gap-3"
              >
                Open Gift
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
