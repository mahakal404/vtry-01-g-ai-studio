import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, User, Shirt, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { HistoryItem } from '../types';
import { useLocation } from 'react-router-dom';

export default function StudioPage() {
  const { profile, user } = useAuth();
  const location = useLocation();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const userFileRef = useRef<HTMLInputElement>(null);
  const clothFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state) {
      const { userImage: passedUserImage, clothImage: passedClothImage } = location.state as { userImage?: string; clothImage?: string };
      if (passedUserImage) setUserImage(passedUserImage);
      if (passedClothImage) setClothImage(passedClothImage);
      
      // Clear state to prevent re-populating on refresh if needed, 
      // but usually React Router state persists for that session.
    }
  }, [location.state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'cloth') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'user') setUserImage(reader.result as string);
        else setClothImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !clothImage || !user || !profile) return;
    
    // Check tokens if not admin
    const isAdminUser = profile.role === 'admin' || profile.email === 'admin@vtry.com';
    const currentTokens = typeof profile.tokens === 'number' ? profile.tokens : 0;
    
    if (!isAdminUser && currentTokens <= 0) {
      alert('You do not have enough V-Tokens. Please visit the Store to get more!');
      return;
    }

    setIsProcessing(true);
    setResultImage(null);

    // Simulate processing time
    setTimeout(async () => {
      // For demo, we'll just use the user image as the result or a combined placeholder
      const mockResult = userImage; // In a real app, this would be the processed image
      setResultImage(mockResult);
      setIsProcessing(false);

      // Save to Firestore
      const historyItem: Omit<HistoryItem, 'id'> = {
        userId: user.uid,
        userImage,
        clothImage,
        resultImage: mockResult,
        createdAt: Timestamp.now(),
      };

      try {
        const docRef = await addDoc(collection(db, 'history'), historyItem);
        
        // Save to LocalStorage as requested
        const localHistory = JSON.parse(localStorage.getItem('vtry_history') || '[]');
        localStorage.setItem('vtry_history', JSON.stringify([{ ...historyItem, id: docRef.id }, ...localHistory]));

        // Deduct tokens if not admin
        if (!isAdminUser) {
          const userDoc = doc(db, 'users', user.uid);
          const newTokens = currentTokens - 1;
          
          // Update Firestore
          await updateDoc(userDoc, { tokens: newTokens });
          
          // Update LocalStorage balance as requested
          localStorage.setItem('vtry_tokens', newTokens.toString());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'history');
      }
    }, 3000);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-black tracking-tighter text-text"
        >
          V-Try
        </motion.h1>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted font-medium text-lg"
        >
          Virtual Try-On Experience
        </motion.p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Image Upload */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => userFileRef.current?.click()}
          className="relative aspect-video bg-card border-2 border-dashed border-border hover:border-primary rounded-3xl cursor-pointer flex flex-col items-center justify-center p-6 group transition-all overflow-hidden"
        >
          <input 
            type="file" 
            ref={userFileRef} 
            onChange={(e) => handleFileChange(e, 'user')} 
            className="hidden" 
            accept="image/*"
          />
          {userImage ? (
            <img src={userImage} alt="User" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
          ) : null}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <User size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text">Upload Your Image</h3>
              <p className="text-sm text-muted">Tap anywhere to add a photo of yourself</p>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Upload size={16} />
              <span>Choose Photo</span>
            </div>
          </div>
        </motion.div>

        {/* Cloth Image Upload */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => clothFileRef.current?.click()}
          className="relative aspect-video bg-card border-2 border-dashed border-border hover:border-primary rounded-3xl cursor-pointer flex flex-col items-center justify-center p-6 group transition-all overflow-hidden"
        >
          <input 
            type="file" 
            ref={clothFileRef} 
            onChange={(e) => handleFileChange(e, 'cloth')} 
            className="hidden" 
            accept="image/*"
          />
          {clothImage ? (
            <img src={clothImage} alt="Cloth" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
          ) : null}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
              <Shirt size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text">Upload Your Cloth</h3>
              <p className="text-sm text-muted">Tap anywhere to add a clothing item</p>
            </div>
            <div className="flex items-center gap-2 text-pink-500 font-bold text-sm">
              <Upload size={16} />
              <span>Choose Photo</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-sm">
          <Sparkles size={16} />
          <span>{profile?.tokens === '∞' ? '∞' : profile?.tokens || 0} V-Tokens</span>
        </div>
        
        <button 
          onClick={handleTryOn}
          disabled={!userImage || !clothImage || isProcessing || (profile?.role !== 'admin' && profile?.email !== 'admin@vtry.com' && (typeof profile?.tokens === 'number' ? profile.tokens : 0) <= 0)}
          className="w-full max-w-2xl bg-primary hover:bg-primary/90 disabled:bg-muted/20 disabled:text-muted disabled:cursor-not-allowed text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          {isProcessing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles size={24} />
              <span>Try On <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">1 Token</span></span>
            </>
          )}
        </button>
      </div>

      {/* Result Preview */}
      <div className="relative w-full max-w-2xl mx-auto aspect-square bg-card border border-border rounded-[40px] flex flex-col items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {resultImage ? (
            <motion.img 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={resultImage} 
              alt="Result" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center text-muted">
                <Sparkles size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-text">Result Preview</h3>
                <p className="text-muted max-w-xs">
                  Upload your photo and clothing, then click "Try On" to see the result here
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-primary animate-pulse">Generating your look...</p>
          </div>
        )}
      </div>
    </div>
  );
}
