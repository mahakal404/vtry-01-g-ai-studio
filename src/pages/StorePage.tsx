import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Gift, Zap, Star, Crown, Play, ShieldCheck, Loader2, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, addDays, isAfter } from 'date-fns';

export default function StorePage() {
  const { profile, user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('23:59:59');
  const [isClaiming, setIsClaiming] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (profile?.adsWatched !== undefined) {
      setAdsWatched(profile.adsWatched);
    }

    const timer = setInterval(() => {
      if (profile?.lastDailyReward) {
        try {
          const lastRewardDate = profile.lastDailyReward instanceof Timestamp 
            ? profile.lastDailyReward.toDate() 
            : new Date((profile.lastDailyReward as any).seconds * 1000);
            
          const nextReward = addDays(lastRewardDate, 1);
          const now = new Date();
          
          if (isAfter(now, nextReward)) {
            setTimeLeft('Available Now!');
          } else {
            const diff = nextReward.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
        } catch (e) {
          console.error("Error calculating time left:", e);
          setTimeLeft('Available Now!');
        }
      } else {
        setTimeLeft('Available Now!');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]);

  const handleClaimReward = async () => {
    if (!user || !profile) return;
    setIsClaiming(true);
    
    try {
      const userDoc = doc(db, 'users', user.uid);
      const currentTokens = typeof profile.tokens === 'number' ? profile.tokens : 0;
      await updateDoc(userDoc, {
        tokens: currentTokens + 10,
        lastDailyReward: Timestamp.now()
      });
      alert('You claimed 10 V-Tokens!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWatchAd = async () => {
    if (!user || !profile) return;
    setIsWatchingAd(true);
    
    setTimeout(async () => {
      try {
        const userDoc = doc(db, 'users', user.uid);
        const currentTokens = typeof profile.tokens === 'number' ? profile.tokens : 0;
        const newAdsWatched = (profile.adsWatched || 0) + 1;
        
        await updateDoc(userDoc, {
          tokens: currentTokens + 1,
          adsWatched: newAdsWatched
        });
        setAdsWatched(newAdsWatched);
        alert('You earned 1 V-Token!');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'users');
      } finally {
        setIsWatchingAd(false);
      }
    }, 2000);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !profile || !selectedPack) return;
    setIsPurchasing(true);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        const userDoc = doc(db, 'users', user.uid);
        const currentTokens = typeof profile.tokens === 'number' ? profile.tokens : 0;
        
        await updateDoc(userDoc, {
          tokens: currentTokens + selectedPack.tokens
        });
        
        alert(`Successfully purchased ${selectedPack.tokens} tokens!`);
        setSelectedPack(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'users');
      } finally {
        setIsPurchasing(false);
      }
    }, 1500);
  };

  const pricingCards = [
    {
      name: 'Starter Pack',
      price: '$0.99',
      tokens: 50,
      description: 'For Beginners',
      icon: Zap,
      badge: 'Save 50%',
      color: 'primary'
    },
    {
      name: 'Value Pack',
      price: '$2.99',
      tokens: 250,
      description: 'Best Seller',
      icon: Star,
      badge: 'Bestseller',
      color: 'purple-500',
      featured: true
    },
    {
      name: 'Pro Bundle',
      price: '$6.99',
      tokens: 800,
      description: 'Heavy Users',
      icon: Crown,
      badge: 'Save 50%',
      color: 'emerald-500'
    }
  ];

  return (
    <div className="space-y-12 pb-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-text">V-Store</h1>
        <p className="text-muted font-medium text-lg max-w-2xl mx-auto">
          Purchase V-Tokens to generate high-fidelity virtual try-ons. Each token grants one generation.
        </p>
      </div>

      {/* Daily Reward Banner */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative p-8 bg-card border border-primary/30 rounded-[40px] overflow-hidden group shadow-2xl shadow-primary/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
              <Gift size={40} />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-text flex items-center gap-2">
                Daily Login Reward <Sparkles className="text-primary" size={24} />
              </h2>
              <p className="text-muted font-medium">Come back tomorrow for more free tokens!</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex flex-col items-center md:items-end">
              <span className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                <Clock size={12} /> Next gift in
              </span>
              <span className="text-4xl font-black text-text font-mono tracking-tighter">
                {timeLeft}
              </span>
            </div>
            <button 
              onClick={handleClaimReward}
              disabled={timeLeft !== 'Available Now!' || isClaiming}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted/20 disabled:text-muted disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              {isClaiming ? <Loader2 className="animate-spin" /> : 'Claim Now'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingCards.map((card, index) => (
          <motion.div 
            key={card.name}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-8 bg-card border ${card.featured ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border'} rounded-[40px] flex flex-col items-center text-center group transition-all hover:border-primary`}
          >
            {card.badge && (
              <span className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${card.featured ? 'bg-primary text-white' : 'bg-muted/10 text-muted border border-border'}`}>
                {card.badge}
              </span>
            )}
            
            <div className={`w-16 h-16 bg-${card.color}/10 rounded-2xl flex items-center justify-center text-${card.color} mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon size={32} />
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-2xl font-black text-text">{card.name}</h3>
              <p className="text-sm text-muted font-medium">{card.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-text">{card.price}</span>
              <span className="text-muted font-bold text-sm uppercase tracking-widest">USD</span>
            </div>

            <div className="w-full space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="text-sm font-bold text-text">{card.tokens} V-Tokens</span>
                </div>
                <span className="text-xs text-muted font-bold">~{Math.floor(card.tokens / 5)} Try-Ons</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedPack(card)}
              className={`w-full py-4 rounded-2xl font-black transition-all active:scale-[0.98] ${card.featured ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background border border-border text-text hover:border-primary'}`}
            >
              Buy {card.tokens} Tokens
            </button>
          </motion.div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedPack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPack(null)}
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
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-${selectedPack.color}/10 rounded-xl flex items-center justify-center text-${selectedPack.color}`}>
                    <selectedPack.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text">Confirm Purchase</h3>
                    <p className="text-sm text-muted">Review your order details below</p>
                  </div>
                </div>

                <div className="bg-background/50 border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-bold text-sm uppercase tracking-wider">Product</span>
                    <span className="text-text font-black">{selectedPack.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-bold text-sm uppercase tracking-wider">Tokens</span>
                    <div className="flex items-center gap-2 text-primary">
                      <Zap size={16} />
                      <span className="font-black">{selectedPack.tokens} V-Tokens</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-muted font-bold text-sm uppercase tracking-wider">Total Price</span>
                    <span className="text-2xl font-black text-text">{selectedPack.price}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleConfirmPurchase}
                    disabled={isPurchasing}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted/20 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        <span>Confirm & Pay</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setSelectedPack(null)}
                    disabled={isPurchasing}
                    className="w-full bg-background border border-border hover:border-primary text-text font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-[10px] text-muted text-center uppercase font-bold tracking-widest">
                  Secure 256-bit encrypted transaction
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Earn Free Tokens Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border rounded-[40px] p-10 flex flex-col items-center text-center space-y-8"
      >
        <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500">
          <Play size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text">Earn Free Tokens</h2>
          <p className="text-muted font-medium max-w-md">Watch short ads to earn V-Tokens. Support the platform and keep generating for free!</p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-sm font-bold text-muted mb-2">
            <span>Daily Progress</span>
            <span>{adsWatched % 5} / 5 ads watched</span>
          </div>
          <div className="w-full h-3 bg-background border border-border rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((adsWatched % 5) / 5) * 100}%` }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(136,82,224,0.5)]"
            />
          </div>
        </div>

        <button 
          onClick={handleWatchAd}
          disabled={isWatchingAd}
          className="bg-primary hover:bg-primary/90 disabled:bg-muted/20 disabled:text-muted disabled:cursor-not-allowed text-white font-black px-12 py-5 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
        >
          {isWatchingAd ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Watching Ad...</span>
            </>
          ) : (
            <>
              <Play size={20} />
              <span>Watch Ad (+1 Token)</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 pt-8 border-t border-border">
        <div className="flex items-center gap-3 text-muted font-bold text-sm tracking-widest uppercase">
          <ShieldCheck size={18} className="text-emerald-500" />
          Secure Payment Processing
        </div>
        <p className="text-xs text-muted text-center max-w-2xl leading-relaxed">
          Transactions are processed securely. V-Tokens are non-refundable. If you encounter issues with generation quality, please contact support for a credit refund.
        </p>
      </div>
    </div>
  );
}
