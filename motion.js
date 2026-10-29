(() => {
  const bar = document.createElement('div');
  bar.id = 'page-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Loading');
  bar.hidden = true;
  document.body.append(bar);
  let pending = 0,
    timer;
  window.SMRProgress = {
    start() {
      if (pending++ === 0) {
        bar.hidden = false;
        document.body.dataset.networkBusy = '';
        bar.style.width = '12%';
        timer = setInterval(() => {
          const width = parseFloat(bar.style.width);
          bar.style.width = Math.min(90, width + (92 - width) * 0.09) + '%';
        }, 500);
      }
    },
    end() {
      pending = Math.max(0, pending - 1);
      if (!pending) {
        clearInterval(timer);
        bar.style.width = '100%';
        setTimeout(() => {
          if (!pending) {
            delete document.body.dataset.networkBusy;
            bar.hidden = true;
            bar.style.width = '0';
          }
        }, 240);
      }
    },
  };
  const animations = new WeakMap();
  document.addEventListener('click', (event) => {
    const summary = event.target.closest('summary');
    if (
      !summary ||
      event.target.closest('button,a,input') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const details = summary.parentElement;
    if (details.tagName !== 'DETAILS') return;
    event.preventDefault();
    const previous = animations.get(details);
    if (previous) {
      previous.finish();
    }
    const closing = details.open,
      from = details.getBoundingClientRect().height;
    details.open = true;
    const to = closing
      ? summary.getBoundingClientRect().height +
        parseFloat(getComputedStyle(details).paddingTop) +
        parseFloat(getComputedStyle(details).paddingBottom)
      : details.getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    const animation = details.animate([{ height: from + 'px' }, { height: to + 'px' }], {
      duration: 220,
      easing: 'cubic-bezier(.2,.8,.2,1)',
    });
    animations.set(details, animation);
    animation.onfinish = () => {
      details.open = !closing;
      details.style.overflow = '';
      animations.delete(details);
    };
  });
})();
