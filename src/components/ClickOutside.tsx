import React, { useRef, useEffect } from 'react';

interface ClickOutsideProps {
  onOutsideClick: () => void;
  children: React.ReactNode;
  // ADD: optional className prop for styling the wrapper div
  className?: string;
}

// UPDATE: Destructure and accept className
const ClickOutside: React.FC<ClickOutsideProps> = ({ children, onOutsideClick, className }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onOutsideClick]);

  // UPDATE: Apply the className prop to the wrapper div
  return <div ref={wrapperRef} className={className}>{children}</div>;
};

export default ClickOutside;