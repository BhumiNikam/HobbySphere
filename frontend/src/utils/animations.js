// Intersection Observer for fade-in animations
export const setupFadeInObserver = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally unobserve after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with fade-in-view class
  const elements = document.querySelectorAll('.fade-in-view');
  elements.forEach(el => observer.observe(el));

  return observer;
};

// Smooth scroll to top
export const scrollToTop = (duration = 300) => {
  const start = window.pageYOffset;
  const startTime = performance.now();

  const easeInOutQuad = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  const scroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easing = easeInOutQuad(progress);
    
    window.scrollTo(0, start * (1 - easing));
    
    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

// Page transition helper
export const pageTransition = (element) => {
  if (element) {
    element.classList.add('page-enter');
    // Clean up after animation
    setTimeout(() => {
      element.classList.remove('page-enter');
    }, 400);
  }
};
