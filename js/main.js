const API = 'https://wild-tours.onrender.com/api';

// restore user if missing (IMPORTANT FOR GOOGLE LOGIN)
async function hydrateUser() {
  const token = localStorage.getItem('wr_token');
  const user = localStorage.getItem('wr_user');

  if (token && !user) {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.user) {
        localStorage.setItem('wr_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to hydrate user', e);
    }
  }
}

function logout(){ localStorage.removeItem('wr_token'); localStorage.removeItem('wr_user'); updateNavForAuth(); window.location.href='login.html'; }
function confirmLogout(){ if(confirm('Are you sure you want to log out?')) logout(); }

/* ===== AUTH NAV UPDATE ===== */
function updateNavForAuth() {
  const navActions = document.querySelector('.nav-actions');

  if (!navActions) return;

  const token = localStorage.getItem('wr_token');
  const userRaw = localStorage.getItem('wr_user');

  if (!token || !userRaw) {
    navActions.innerHTML = ''; // reset UI
    return;
  }

  try {
    const user = JSON.parse(userRaw);
    const firstName = user.firstName || user.name?.split(' ')[0] || 'Traveler';

    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' :
      hour < 17 ? 'Good afternoon' :
      'Good evening';

    navActions.innerHTML = `
      <span style="font-weight:600; color:#2d7a3a;">
        ${greeting}, ${firstName} 👋
      </span>
      <a href="my-portal.html" class="btn btn-outline-dark btn-sm" style="margin-left:10px;">My Portal</a>
      <a onclick="confirmLogout()" class="btn btn-outline-dark btn-sm" style="margin-left:12px; cursor:pointer;">
        Logout
      </a>
    `;
  } catch (e) {
    localStorage.removeItem('wr_user');
    localStorage.removeItem('wr_token');
  }
}




/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ===== MOBILE MENU ===== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

if (hamburger) {
  hamburger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
  });
}

/* ===== SEARCH TABS ===== */
document.querySelectorAll('.search-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

/* ===== FILTER CHIPS ===== */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const group = chip.closest('.filter-chips');
    if (group) {
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    }
    chip.classList.add('active');
  });
});

/* ===== FAQ ACCORDION ===== */
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');
    
    document.querySelectorAll('.faq-item').forEach(faq => {
      faq.classList.remove('open');
      faq.querySelector('.faq-answer').style.maxHeight = '0';
    });
    
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ===== MODAL ===== */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

/* ===== TOAST ===== */
function showToast(message, icon = '✅') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ===== BOOKING FORM ===== */





const bookingForms = document.querySelectorAll('.booking-form');

bookingForms.forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('wr_token');
    if (!token) {
      showToast('Please login first', '⚠️');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      const formData = new FormData(form);
      const paymentMethod = formData.get('paymentMethod'); // 'paypal', 'mpesa', 'bank_transfer'

      // ── STEP 1: Create the booking ──────────────────────────
      const bookingPayload = {
        tourId: formData.get('tourId'),
        startDate: formData.get('startDate'),
        numberOfTravelers: Number(formData.get('numberOfTravelers')),
        paymentMethod,
        specialRequests: formData.get('specialRequests'),
        travelers: [{
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
        }]
      };

      const bookingRes = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok) {
        showToast(bookingData.message || 'Booking failed', '❌');
        return;
      }

      // Normalise the booking object — handle various response shapes
      const booking = bookingData.booking || bookingData.data?.booking || bookingData.data || bookingData;
      const bookingId = booking._id;
      const depositAmount = booking.depositAmount || Math.round((booking.totalAmount || 0) * 0.2);

      // ── STEP 2: Initiate payment ────────────────────────────
      if (paymentMethod === 'paypal') {
        const ppRes = await fetch(`${API}/payments/paypal/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId,
            amount: depositAmount,
            currency: 'USD'
          })
        });

        const ppData = await ppRes.json();
        if (!ppRes.ok || !ppData.approveUrl) {
          showToast(ppData.message || 'PayPal order creation failed', '❌');
          return;
        }

        // Redirect user to PayPal — capture happens on return via /paypal/capture
        closeModal('bookingModal');
        showToast('Redirecting to PayPal…', '💳');
        setTimeout(() => { window.location.href = ppData.approveUrl; }, 1000);

      } else if (paymentMethod === 'mpesa') {
        const phone = formData.get('mpesaPhone');
        if (!phone) {
          showToast('Please enter your M-Pesa phone number', '⚠️');
          return;
        }

        const mpRes = await fetch(`${API}/payments/mpesa/stk-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phone, amount: depositAmount, bookingId })
        });

        const mpData = await mpRes.json();
        if (!mpRes.ok) {
          showToast(mpData.message || 'M-Pesa push failed', '❌');
          return;
        }

        closeModal('bookingModal');
        showToast('STK Push sent! Check your phone and enter your M-Pesa PIN.', '📱');

        // Optional: poll for status after 15 s
        if (mpData.checkoutRequestId) {
          setTimeout(() => pollMpesaStatus(mpData.checkoutRequestId, token), 15000);
        }

      } else {
  // Bank transfer — upload receipt if provided
  const receiptFile = form.querySelector('[name="bankReceipt"]')?.files?.[0];

  if (!receiptFile) {
    showToast('Please upload your bank transfer receipt to complete the booking.', '⚠️');
    btn.textContent = originalText;
    btn.disabled = false;
    return;
  }

  if (receiptFile.size > 5 * 1024 * 1024) {
    showToast('Receipt file must be under 5MB.', '⚠️');
    btn.textContent = originalText;
    btn.disabled = false;
    return;
  }

  const formPayload = new FormData();
  formPayload.append('proof', receiptFile);        // ← was 'receipt', must be 'proof'
  formPayload.append('amount', depositAmount);
  formPayload.append('bankName', formData.get('bankName') || '');
  formPayload.append('bankReference', formData.get('bankReference') || '');

  const uploadRes = await fetch(`${API}/bookings/${bookingId}/upload-proof`, {  // ← correct endpoint
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formPayload
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    showToast(uploadData.message || 'Receipt upload failed', '❌');
    return;
  }

  closeModal('bookingModal');
  showToast('Booking saved! Your receipt has been submitted for admin verification.', '🏦');
}

}catch (err) {
      console.error('Booking/payment error:', err);
      showToast('Network error. Please try again.', '⚠️');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});

// ── M-Pesa status poll (optional UX improvement) ──────────
async function pollMpesaStatus(checkoutRequestId, token) {
  try {
    const res = await fetch(`${API}/payments/mpesa/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ checkoutRequestId })
    });
    const data = await res.json();
    // ResultCode 0 = success, 1032 = cancelled by user
    if (data?.data?.ResultCode === 0) {
      showToast('M-Pesa payment confirmed! ✅', '✅');
    } else if (data?.data?.ResultCode === 1032) {
      showToast('M-Pesa payment was cancelled.', '❌');
    }
  } catch (_) { /* non-critical */ }
}





/* ===== VOLUNTEER FORM ===== */
const volunteerForms = document.querySelectorAll('.volunteer-form');
volunteerForms.forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    try {
      const formData = new FormData(form);

      const payload = {
  program: formData.get('program'),

  personalInfo: {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    nationality: formData.get('nationality')
  },

  emergencyContact: {
    name: formData.get('emergencyName'),
    phone: formData.get('emergencyPhone')
  },

  programDetails: {
    startDate: formData.get('startDate'),
    duration: formData.get('duration')
  },

  skills: formData.get('skills')?.split(',') || [],
  experience: formData.get('experience'),
  motivation: formData.get('motivation'),
  languages: formData.get('languages')?.split(',') || [],
  medicalConditions: formData.get('medicalConditions'),
  dietaryRequirements: formData.get('dietaryRequirements'),
  hasPassport: formData.get('hasPassport') === 'on'
};


      if (!localStorage.getItem('wr_token')) {
  showToast('Please login first', '⚠️');
  btn.textContent = 'Submit Application';
  btn.disabled = false;
  return;
}


      const res = await fetch(`${API}/volunteer/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wr_token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Application submitted successfully! We will contact you within 48 hours.');
        form.reset();
      } else {
        showToast(data.message || 'Submission failed', '❌');
      }

    } catch (err) {
      showToast('Network error. Please try again.', '⚠️');
    }

    btn.textContent = 'Submit Application';
    btn.disabled = false;
  });
});

/* ===== CONTACT FORM ===== */

/* ===== CONTACT FORM (contact.html) ===== */

const API2 = 'https://wild-tours.onrender.com'; 

const contactFormEl = document.getElementById('contactForm');

if (contactFormEl) {
  // Grab the active subject tab value
  function getActiveSubject() {
    const active = document.querySelector('.subject-tab.active');
    return active ? active.dataset.subject : 'general';
  }

  // Override the inline onclick so the real handler runs
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    // Remove inline onclick to avoid double-firing
    submitBtn.removeAttribute('onclick');
    submitBtn.addEventListener('click', handleContactSubmit);
  }

  async function handleContactSubmit() {
    const firstName  = document.getElementById('firstName')?.value.trim();
    const lastName   = document.getElementById('lastName')?.value.trim();
    const email      = document.getElementById('email')?.value.trim();
    const phone      = document.getElementById('phone')?.value.trim();
    const nationality= document.getElementById('nationality')?.value;
    const dates      = document.getElementById('dates')?.value.trim();
    const groupSize  = document.getElementById('groupSize')?.value;
    const budget     = document.getElementById('budget')?.value;
    const message    = document.getElementById('message')?.value.trim();
    const source     = document.getElementById('source')?.value;
    const privacy    = document.getElementById('privacy')?.checked;

    // Client-side validation
    if (!firstName || !email || !message) {
      showToast('⚠️ Please fill in your name, email and message.');
      return;
    }
    if (!privacy) {
      showToast('⚠️ Please accept the privacy policy to continue.');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API2}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          nationality,
          dates,
          groupSize,
          budget,
          message,
          subject: getActiveSubject(),
          source,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Show the built-in success state in the HTML
        contactFormEl.style.display = 'none';
        const successEl = document.getElementById('formSuccess');
        if (successEl) successEl.classList.add('show');
      } else {
        showToast(`❌ ${data.message || 'Failed to send. Please try again.'}`);
        submitBtn.textContent = 'Send Message →';
        submitBtn.disabled = false;
      }

    } catch (err) {
      console.error('[Contact submit error]', err);
      showToast('⚠️ Network error. Please check your connection and try again.');
      submitBtn.textContent = 'Send Message →';
      submitBtn.disabled = false;
    }
  }
}

/* ===== NEWSLETTER ===== */
const newsletterForms = document.querySelectorAll('.newsletter-form');
newsletterForms.forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value.trim();

    if (!email) {
      showToast('⚠️ Please enter your email address.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    const originalText = btn?.textContent;
    if (btn) { btn.textContent = 'Subscribing…'; btn.disabled = true; }

    try {
      const res = await fetch(`${API2}/api/contact/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('💚 Welcome aboard! Check your inbox for a confirmation email.');
        form.reset();
      } else {
        showToast(`❌ ${data.message || 'Subscription failed. Please try again.'}`);
      }

    } catch (err) {
      console.error('[Newsletter error]', err);
      showToast('⚠️ Network error. Please try again.');
    }

    if (btn) { btn.textContent = originalText; btn.disabled = false; }
  });
});

/* ===== PAYMENT METHOD SELECTION ===== */
document.querySelectorAll('.payment-method').forEach(method => {
  method.addEventListener('click', () => {
    method.closest('.payment-methods').querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    method.classList.add('active');
    const name = method.dataset.method;
    const details = {
      paypal: 'paypalDetails',
      mpesa: 'mpesaDetails',
      bank: 'bankDetails'
    };
    Object.values(details).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    if (name && details[name]) {
      const el = document.getElementById(details[name]);
      if (el) el.style.display = 'block';
    }
  });
});

/* ===== COUNTER ANIMATION ===== */
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
    }, 25);
  });
}

const statsSection = document.querySelector('.stats-strip');
if (statsSection) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(statsSection);
}

/* ===== SCROLL REVEAL ===== */
const revealElements = document.querySelectorAll('.tour-card, .feature-card, .testimonial-card, .volunteer-card, .blog-card, .team-card');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

/* ===== ACTIVE NAV LINK ===== */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
  }
});

/* ===== GALLERY LIGHTBOX ===== */
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (img) {
      const lightbox = document.createElement('div');
      lightbox.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:4000;display:flex;align-items:center;justify-content:center;cursor:pointer;';
      const i = document.createElement('img');
      i.src = img.src;
      i.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;';
      lightbox.appendChild(i);
      lightbox.addEventListener('click', () => lightbox.remove());
      document.body.appendChild(lightbox);
    }
  });
});


console.log(localStorage.getItem('wr_token'));

document.addEventListener('DOMContentLoaded', async () => {
  await hydrateUser();
  updateNavForAuth();
});