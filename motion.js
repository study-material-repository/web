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
    const from = details.getBoundingClientRect().height;
    const closing = previous ? !previous.closing : details.open;
    if (previous) {
      previous.animation.onfinish = null;
      previous.animation.cancel();
    }
    details.open = true;
    const style = getComputedStyle(details);
    const to = closing
      ? summary.getBoundingClientRect().height +
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth)
      : details.getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    const animation = details.animate([{ height: from + 'px' }, { height: to + 'px' }], {
      duration: 220,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards',
    });
    animations.set(details, { animation, closing });
    animation.onfinish = () => {
      details.open = !closing;
      animation.cancel();
      details.style.overflow = '';
      animations.delete(details);
    };
  });
})();
