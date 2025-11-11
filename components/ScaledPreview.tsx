import React, { useLayoutEffect, useRef, useState } from 'react';

interface ScaledPreviewProps {
  children: React.ReactNode;
  aspectRatio: string;
  contentWidth: number;
  contentHeight: number;
  className?: string;
}

const ScaledPreview: React.FC<ScaledPreviewProps> = ({ children, aspectRatio, contentWidth, contentHeight, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Use a 0.95 multiplier to ensure there's a small margin around the preview
        const newScale = (containerWidth / contentWidth) * 0.95;
        setScale(newScale);
      }
    };

    calculateScale();
    const debouncedCalculateScale = () => setTimeout(calculateScale, 100);
    window.addEventListener('resize', debouncedCalculateScale);
    return () => window.removeEventListener('resize', debouncedCalculateScale);
  }, [contentWidth]);

  return (
    <div 
      ref={containerRef} 
      style={{ aspectRatio }} 
      className={`w-full overflow-hidden flex items-center justify-center ${className}`}
    >
      <div 
        className="transform origin-center" 
        style={{ width: `${contentWidth}px`, height: `${contentHeight}px`, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaledPreview;
