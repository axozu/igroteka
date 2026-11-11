// Плавное проявление блоков при прокрутке к ним. Без IntersectionObserver
// или при prefers-reduced-motion: reduce ничего не скрывается — всё видно сразу.

/**
 * @param {Iterable<Element>} elements
 */
export function mountReveal(elements) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  for (const el of elements) {
    el.classList.add('reveal');
    observer.observe(el);
  }
}
