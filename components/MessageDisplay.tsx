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
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                className="fixed inset-x-0 top-4 z-[2000] flex justify-center px-4 sm:top-8"
            >
                <div className={`flex w-full max-w-md items-center gap-3 rounded-[24px] border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl ${message.type === 'success'
                        ? 'border-emerald-100 bg-white/90 text-emerald-700'
                        : 'border-white/20 bg-brand-terracotta text-white'
                    }`}>
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.type === 'success' ? 'bg-emerald-50' : 'bg-white/20'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-snug">{message.text}</p>
                    </div>
                    <button
                        onClick={() => setMessage(null)}
                        className="flex-shrink-0 p-2 -mr-1 opacity-40 transition-opacity hover:opacity-100"
                        aria-label="Close"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default MessageDisplay;
