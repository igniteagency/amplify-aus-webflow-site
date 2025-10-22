/**
 * General Slider component
 * To create standalone sliders on the page, add swiper script and this component script to the page
 */

class Slider {
  COMPONENT_SELECTOR = '[data-slider-el="component"]';
  NAV_PREV_BUTTON_SELECTOR = '[data-slider-el="nav-prev"]';
  NAV_NEXT_BUTTON_SELECTOR = '[data-slider-el="nav-next"]';

  swiperComponents: NodeListOf<HTMLElement> | [];
  swiper: Swiper | null;

  constructor() {
    this.swiperComponents = document.querySelectorAll(this.COMPONENT_SELECTOR);
    this.initSliders();
  }

  initSliders() {
    this.swiperComponents.forEach((swiperComponent) => {
      const swiperEl = swiperComponent.querySelector('.swiper');
      if (!swiperEl) {
        console.error('`.swiper` element not found', swiperComponent);
        return;
      }

      const navPrevButtonEl = swiperComponent.querySelector(this.NAV_PREV_BUTTON_SELECTOR);
      const navNextButtonEl = swiperComponent.querySelector(this.NAV_NEXT_BUTTON_SELECTOR);

      // Allow overriding autoplay delay via attribute on the component wrapper
      // Usage: <div data-slider-el="component" data-slider-autoplay-delay="5000">...</div>
      const delayAttr = swiperComponent.getAttribute('data-slider-autoplay-delay')
        ?? (swiperEl as HTMLElement).getAttribute('data-slider-autoplay-delay');
      const parsedDelay = delayAttr ? parseInt(delayAttr, 10) : NaN;
      const autoplayDelay = Number.isFinite(parsedDelay) && parsedDelay > 0 ? parsedDelay : 3000;

      const navigationConfig =
        navPrevButtonEl && navNextButtonEl
          ? {
              nextEl: navNextButtonEl,
              prevEl: navPrevButtonEl,
              disabledClass: 'is-disabled',
            }
          : false;

      this.swiper = new Swiper(swiperEl, {
        loop: true,
        spaceBetween: 32,
        speed: 1000,
        slidesPerView: 'auto',
        autoplay: {
          delay: autoplayDelay,
          disableOnInteraction: false,
        },
        centeredSlides: true,
        // navigation: navigationConfig,
        // slideActiveClass: 'is-active',
        // slidePrevClass: 'is-previous',
        // slideNextClass: 'is-next',
        // a11y: {
        //   enabled: true,
        // },
      });
    });
  }
}

window.loadScript('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js', {
  name: 'swiper',
});

document.addEventListener('scriptLoaded:swiper', () => {
  new Slider();
});
