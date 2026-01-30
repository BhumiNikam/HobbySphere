import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { scrollToTop } from '../utils/animations';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={() => scrollToTop()}
          className="fixed bottom-8 right-8 glass-strong p-4 rounded-full shadow-glow-lg hover:scale-110 active:scale-95 transition-smooth z-50 will-animate group"
          aria-label="Scroll to top"
        >
          <ArrowUp 
            size={24} 
            className="text-indigo-600 group-hover:translate-y-[-2px] transition-transform will-animate" 
          />
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
