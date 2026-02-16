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
  
  // If history length is very small (1-3 entries), we likely just came from auth
  // Better to go home than risk going back to login/signup pages
  if (window.history.length <= 3) {
    navigate('/');
    return;
  }
  
  // Safe to go back - we have sufficient history
  navigate(-1);
};
