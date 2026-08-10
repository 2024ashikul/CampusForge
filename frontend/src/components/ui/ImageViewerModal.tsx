import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ImageItem {
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageViewerModalProps {
  images: (string | ImageItem)[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const normalizedImages: ImageItem[] = images.map((img) =>
    typeof img === 'string' ? { url: img } : img
  );

  const total = normalizedImages.length;
  const currentImage = normalizedImages[currentIndex];

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
    },
    [total]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    },
    [total]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      {/* Background overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="text-xs font-semibold text-white/80 font-mono tracking-wide pointer-events-auto">
          {total > 1 ? `${currentIndex + 1} / ${total}` : ''}
          {currentImage.caption && (
            <span className="ml-3 text-white/90 text-sm font-sans truncate max-w-md inline-block align-bottom">
              {currentImage.caption}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all pointer-events-auto cursor-pointer border border-white/15 backdrop-blur-md hover:scale-105"
          title="Close viewer (Esc)"
          aria-label="Close viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative z-10 max-w-[92vw] max-h-[85vh] flex items-center justify-center p-2">
        {/* Ambient Blur Backdrop */}
        <img
          src={currentImage.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-30 scale-125 pointer-events-none"
        />

        {/* Crisp Main Image */}
        <img
          src={currentImage.url}
          alt={currentImage.alt || 'Full View'}
          className="relative z-10 max-w-[92vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Side Navigation Buttons (WhatsApp Style) */}
      {total > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer hover:scale-110 shadow-lg"
            title="Previous image (Left Arrow)"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer hover:scale-110 shadow-lg"
            title="Next image (Right Arrow)"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};

export default ImageViewerModal;
