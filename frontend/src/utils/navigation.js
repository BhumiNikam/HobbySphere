/**
 * Safe navigation utility that prevents going back to authentication pages
 * @param {Function} navigate - React Router navigate function
 */
export const safeNavigateBack = (navigate) => {
  // Check if there's any meaningful history to go back to
  const hasHistory = window.history.state && window.history.state.idx > 0;
  
  if (!hasHistory) {
    // No history, go to home
    navigate('/');
    return;
  }
  
  // Get the previous path from sessionStorage if available
  const navigationHistory = getNavigationHistory();
  
  // Auth pages that we should never navigate back to
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  // Check if we have tracked navigation history
  if (navigationHistory.length >= 2) {
    // Get the page we would go back to (second to last in history)
    const previousPage = navigationHistory[navigationHistory.length - 2];
    
    // If previous page is an auth page, go to home instead
    if (authPages.some(authPage => previousPage.startsWith(authPage))) {
      navigate('/');
      return;
    }
  }
  
  // If history length is very small (1-3 entries), we likely just came from auth
  // Better to go home than risk going back to login/signup pages
  if (window.history.length <= 3) {
    navigate('/');
    return;
  }
  
  // Safe to go back - we have sufficient history
  navigate(-1);
};

/**
 * Get navigation history from sessionStorage
 */
function getNavigationHistory() {
  try {
    const history = sessionStorage.getItem('nav_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Track navigation history - call this in App.jsx when location changes
 * @param {string} pathname - Current pathname
 */
export const trackNavigation = (pathname) => {
  try {
    const history = getNavigationHistory();
    
    // Only add if it's different from the last entry
    if (history.length === 0 || history[history.length - 1] !== pathname) {
      history.push(pathname);
      
      // Keep only last 10 entries to avoid sessionStorage bloat
      if (history.length > 10) {
        history.shift();
      }
      
      sessionStorage.setItem('nav_history', JSON.stringify(history));
    }
  } catch (e) {
    // Fail silently if sessionStorage is not available
    console.warn('Navigation tracking failed:', e);
  }
};

/**
 * Clear navigation history - call this on logout
 */
export const clearNavigationHistory = () => {
  try {
    sessionStorage.removeItem('nav_history');
  } catch {
    // Fail silently
  }
};
