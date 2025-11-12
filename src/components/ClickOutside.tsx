import React, { useRef, useEffect } from 'react';

interface ClickOutsideProps {
  onOutsideClick: () => void;
  children: React.ReactNode;
  className?: string;
}

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

  return <div ref={wrapperRef} className={className || ''}>{children}</div>;
};

export default ClickOutside;