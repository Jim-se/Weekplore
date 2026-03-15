import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface MessageDisplayProps {
    message: { type: 'success' | 'error'; text: string } | null;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, setMessage }) => (
    <AnimatePresence mode="wait">
        {message && (
            <motion.div
                initial={{ opacity: 0, y: -100, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -100, x: '-50%' }}
                className={`fixed left-1/2 top-4 z-[2000] flex w-[92%] max-w-md items-center gap-3 rounded-[24px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl border sm:top-8 ${message.type === 'success'
                        ? 'bg-white/90 text-emerald-700 border-emerald-100'
                        : 'bg-brand-terracotta text-white border-white/20'
                    }`}
            >
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${message.type === 'success' ? 'bg-emerald-50' : 'bg-white/20'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold leading-snug">{message.text}</p>
                </div>
                <button 
                    onClick={() => setMessage(null)} 
                    className="flex-shrink-0 p-2 -mr-1 opacity-40 hover:opacity-100 transition-opacity"
                    aria-label="Close"
                >
                    <XCircle className="w-5 h-5" />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);

export default MessageDisplay;
