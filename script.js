const body = document.body;
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');
const header = document.querySelector('.site-header');
const themeToggle = document.querySelector('.theme-toggle');
const cartButton = document.getElementById('cart-button');
const cartPanel = document.getElementById('cart-panel');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const toast = document.getElementById('toast');
const filterButtons = document.querySelectorAll('.filter-btn');
const menuCards = document.querySelectorAll('.menu-card');
const addToOrderButtons = document.querySelectorAll('.add-to-order');
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
const testimonials = document.querySelectorAll('.testimonial');
const prevButton = document.querySelector('.testimonial-btn.prev');
const nextButton = document.querySelector('.testimonial-btn.next');
const revealItems = document.querySelectorAll('.reveal');

let cart = JSON.parse(localStorage.getItem('brewHavenCart')) || [];
let testimonialIndex = 0;

/**
 * Ensure cart items have image URLs. When items were saved before images were captured,
 * attempt to resolve their image by looking up the corresponding menu card.
 */
function resolveCartImages() {
  cart = cart.map((item) => {
    if (item.image) return item;
    const btn = document.querySelector(`.add-to-order[data-name="${item.name}"]`);
    if (btn) {
      const imgEl = btn.closest('.menu-card')?.querySelector('img');
      if (imgEl && imgEl.src) {
        return { ...item, image: imgEl.src };
      }
    }
    // fallback: small transparent placeholder
    return { ...item, image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==' };
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function updateCart() {
  localStorage.setItem('brewHavenCart', JSON.stringify(cart));

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty. Start with something warm and delicious.</p>';
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-item">
              <img class="cart-item-thumb" src="${item.image || ''}" alt="${item.name} thumbnail" />
            <div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-meta">
                  <span>${formatNumber(item.price)}</span>
                  <div class="qty-controls" aria-label="Quantity controls for ${item.name}">
                    <button type="button" data-action="decrease" data-name="${item.name}" aria-label="Decrease quantity">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="increase" data-name="${item.name}" aria-label="Increase quantity">+</button>
                  </div>
                </div>
              </div>
              <button type="button" class="remove-item" data-name="${item.name}" aria-label="Remove ${item.name}">Remove</button>
            </div>
          `
        )
        .join('');
    }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatNumber(total);
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  const removeButtons = document.querySelectorAll('.remove-item');
  const qtyButtons = document.querySelectorAll('[data-action]');

  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { name } = button.dataset;
      cart = cart.filter((item) => item.name !== name);
      updateCart();
      showToast(`${name} removed from your order.`);
    });
  });

  qtyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { action, name } = button.dataset;
      const item = cart.find((entry) => entry.name === name);

      if (!item) return;

      if (action === 'increase') {
        item.quantity += 1;
      } else if (action === 'decrease') {
        item.quantity -= 1;
      }

      if (item.quantity <= 0) {
        cart = cart.filter((entry) => entry.name !== name);
      }

      updateCart();
    });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const icon = themeToggle.querySelector('i');
  icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  localStorage.setItem('brewHavenTheme', theme);
}

function getSavedTheme() {
  const storedTheme = localStorage.getItem('brewHavenTheme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleMenu() {
  siteNav.classList.toggle('open');
  menuToggle.classList.toggle('open');
}

function filterMenu(category) {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
  });

  menuCards.forEach((card) => {
    const shouldShow = category === 'all' || card.dataset.category === category;
    card.classList.toggle('hidden', !shouldShow);
  });
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('main section[id]');
  const scrollPosition = window.scrollY + 150;

  sections.forEach((section) => {
    const id = section.getAttribute('id');
    const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
    if (!navLink) return;

    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const active = scrollPosition >= top && scrollPosition < bottom;
    navLink.classList.toggle('active', active);
  });
}

function setupRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function moveTestimonials(direction) {
  const total = testimonials.length;
  testimonials[testimonialIndex].classList.remove('active');
  testimonialIndex = (testimonialIndex + direction + total) % total;
  testimonials[testimonialIndex].classList.add('active');
}

function validateForm() {
  const formData = new FormData(contactForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!name || !email || !subject || !message) {
    formMessage.textContent = 'Please fill in all fields before sending your message.';
    formMessage.className = 'form-message error';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    formMessage.textContent = 'Please enter a valid email address.';
    formMessage.className = 'form-message error';
    return false;
  }

  formMessage.textContent = 'Your message has been sent successfully. We will be in touch soon.';
  formMessage.className = 'form-message success';
  return true;
}

function attachEvents() {
  menuToggle.addEventListener('click', toggleMenu);

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  themeToggle.addEventListener('click', () => {
    const nextTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  cartButton.addEventListener('click', () => {
    cartPanel.classList.add('open');
  });

  closeCart.addEventListener('click', () => {
    cartPanel.classList.remove('open');
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => filterMenu(button.dataset.filter));
  });

  addToOrderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { name, price } = button.dataset;
        // try to grab the product image from the card
        const imgEl = button.closest('.menu-card')?.querySelector('img');
        const image = imgEl?.src || '';

        const existingItem = cart.find((item) => item.name === name);

        if (existingItem) {
          existingItem.quantity += 1;
          // ensure image is present
          if (!existingItem.image && image) existingItem.image = image;
        } else {
          cart.push({ name, price: Number(price), quantity: 1, image });
        }

        updateCart();
        cartPanel.classList.add('open');
        showToast(`${name} added to your order.`);
      });
    });

  prevButton.addEventListener('click', () => moveTestimonials(-1));
  nextButton.addEventListener('click', () => moveTestimonials(1));

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (validateForm()) {
      contactForm.reset();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideCart = cartPanel.contains(event.target);
    const clickedCartButton = cartButton.contains(event.target);
    const clickedCloseCart = closeCart.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideCart && !clickedCartButton && !clickedCloseCart && !clickedToggle && cartPanel.classList.contains('open')) {
      cartPanel.classList.remove('open');
    }
  });
}

function init() {
  const theme = getSavedTheme();
  setTheme(theme);
  // Resolve any missing image URLs for items persisted before thumbnail support
  resolveCartImages();
  updateCart();
  setupRevealObserver();
  attachEvents();
  updateActiveNavLink();

  window.addEventListener('scroll', () => {
    const scrollThreshold = 20;
    header.classList.toggle('scrolled', window.scrollY > scrollThreshold);
    updateActiveNavLink();
  });

  setInterval(() => {
    if (testimonials.length > 1) {
      moveTestimonials(1);
    }
  }, 5000);
}

init();
