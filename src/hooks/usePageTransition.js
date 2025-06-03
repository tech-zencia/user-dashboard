// File: src/hooks/usePageTransition.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTransition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation(); // Always call hooks unconditionally

  useEffect(() => {
    // Show loading when route starts changing
    setIsLoading(true);

    // Hide loading after a short delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Adjust this delay as needed

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return { isLoading, setIsLoading };
};

export default usePageTransition;