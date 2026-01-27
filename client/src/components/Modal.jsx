import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal component that uses React Portal for rendering
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size (sm, md, lg, xl)
 * @param {boolean} props.closeOnOverlayClick - Whether clicking the overlay closes the modal
 * @param {string} props.maxHeight - Maximum height of modal content (e.g., '80vh', '500px')
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  closeOnOverlayClick = true,
  maxHeight = '80vh'
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // Get size class
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',  
    full: 'max-w-full mx-4'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-4 md:p-7"
      onClick={handleOverlayClick}
    >
      <div 
        className={`${sizeClass} w-full bg-white rounded-lg shadow-xl transform transition-all flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h3 id="modal-title" className="text-lg font-medium">{title}</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto" style={{ maxHeight }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
