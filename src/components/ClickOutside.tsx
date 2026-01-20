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
        // Prevent triggering if the click is inside another dialog (e.g. stacked modals)
        const target = event.target as Element;
        if (target && target.closest && target.closest('[role="dialog"]') && !wrapperRef.current.contains(target.closest('[role="dialog"]') as Node)) {
          return;
        }

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