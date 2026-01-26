import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Create context
const FeedbackContext = createContext(null);

// Message types
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Feedback message component
function FeedbackMessage({ message, type, onClose }) {
  // Determine background color based on type
  const getBgColor = () => {
    switch (type) {
      case MESSAGE_TYPES.SUCCESS:
        return 'bg-green-500';
      case MESSAGE_TYPES.ERROR:
        return 'bg-red-500';
      case MESSAGE_TYPES.WARNING:
        return 'bg-yellow-500';
      case MESSAGE_TYPES.INFO:
      default:
        return 'bg-color1 ';
    }
  };

  return (
    <div className={`${getBgColor()} z-40 text-white p-4 rounded-md shadow-lg flex justify-between items-center min-w-[300px]`}>
      <span>{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 text-white hover:text-gray-200"
      >
        ✕
      </button>
    </div>
  );
}

// Provider component
export function FeedbackProvider({ children }) {
  const [messages, setMessages] = useState([]);

  // Add a new message
  const showMessage = useCallback((message, type = MESSAGE_TYPES.INFO) => {
    const id = Date.now();
    
    // Add message to state
    setMessages(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
    
    return id;
  }, []);

  // Remove a message by id
  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  }, []);

  // Convenience methods for different message types
  const showSuccess = useCallback((message) => {
    return showMessage(message, MESSAGE_TYPES.SUCCESS);
  }, [showMessage]);

  const showError = useCallback((message) => {
    return showMessage(message, MESSAGE_TYPES.ERROR);
  }, [showMessage]);

  const showInfo = useCallback((message) => {
    return showMessage(message, MESSAGE_TYPES.INFO);
  }, [showMessage]);

  const showWarning = useCallback((message) => {
    return showMessage(message, MESSAGE_TYPES.WARNING);
  }, [showMessage]);

  // Create the messages container
  const messagesContainer = (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {messages.map(({ id, message, type }) => (
        <div key={id} className="animate-slideIn z-[9999]">
          <FeedbackMessage 
            message={message} 
            type={type} 
            onClose={() => removeMessage(id)} 
          />
        </div>
      ))}
    </div>
  );

  return (
    <FeedbackContext.Provider 
      value={{ 
        showMessage, 
        showSuccess, 
        showError, 
        showInfo, 
        showWarning, 
        removeMessage 
      }}
    >
      {children}
      {createPortal(messagesContainer, document.body)}
    </FeedbackContext.Provider>
  );
}

// Custom hook to use the feedback context
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
