import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function UnauthorizedAccessAlert() {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [severity, setSeverity] = useState<'error' | 'warning'>('error');

  useEffect(() => {
    // Check for unauthorized access message
    const unauthorizedMessage = sessionStorage.getItem('unauthorizedAccessMessage');
    if (unauthorizedMessage) {
      setMessage(unauthorizedMessage);
      setIsVisible(true);
      
      // Determine severity based on message content
      if (unauthorizedMessage.includes('modify recipes you have created')) {
        setSeverity('error');
      } else {
        setSeverity('warning');
      }
      
      // Clear the message from session storage
      sessionStorage.removeItem('unauthorizedAccessMessage');
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className={`${
            severity === 'error' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          } border rounded-lg shadow-lg p-4`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className={`w-5 h-5 ${
                  severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium mb-1 ${
                  severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {severity === 'error' ? 'Access Denied (403)' : 'Access Warning'}
                </h3>
                <p className={`text-sm ${
                  severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {message}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={`flex-shrink-0 transition-colors ${
                  severity === 'error' 
                    ? 'text-red-400 hover:text-red-600' 
                    : 'text-yellow-400 hover:text-yellow-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}