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
                className={`fixed left-1/2 top-4 z-[2000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-md sm:top-6 sm:w-[90%] sm:items-center ${message.type === 'success'
                        ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-100'
                        : 'bg-brand-terracotta text-white border border-brand-terracotta/20'
                    }`}
            >
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                <span className="text-sm font-bold leading-relaxed">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto flex-shrink-0 p-1 opacity-50 hover:opacity-100">
                    <XCircle className="w-4 h-4" />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);

export default MessageDisplay;
