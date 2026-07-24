// whatsapp-widget.js
(function() {
    'use strict';

    // 🔽 CHANGE THIS TO YOUR WHATSAPP NUMBER
    const WHATSAPP_NUMBER = '254794327798';
    const PRE_FILLED_MSG = 'Hello! I have a question about your services.';

    // Create HTML elements
    const widgetHTML = `
        <!-- Floating Button -->
        <button class="whatsapp-float" id="waFloatBtn" aria-label="Contact us on WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </button>

        <!-- Modal -->
        <div class="wa-modal-overlay" id="waModal">
            <div class="wa-modal-card">
                <button class="wa-modal-close" id="waModalClose" aria-label="Close modal">
                    <i class="fas fa-times"></i>
                </button>
                <div class="wa-modal-icon">
                    <i class="fab fa-whatsapp"></i>
                </div>
                <h3>Open WhatsApp?</h3>
                <p>
                    You'll be redirected to WhatsApp to chat with our support team.<br />
                    We're here to help!
                </p>
                <div class="wa-modal-actions">
                    <button class="wa-btn wa-btn-secondary" id="waModalCancel">
                        Cancel
                    </button>
                    <a class="wa-btn wa-btn-primary" id="waModalConfirm" href="#" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i> Continue
                    </a>
                </div>
            </div>
        </div>
    `;

    // Inject CSS
    const styles = `
        .whatsapp-float {
            position: fixed;
            bottom: 28px;
            right: 28px;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            background: #25d366;
            border-radius: 50%;
            box-shadow: 0 8px 28px rgba(37, 211, 102, 0.35);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
            border: none;
            color: white;
            font-size: 2.2rem;
        }
        .whatsapp-float:hover {
            transform: scale(1.07);
            box-shadow: 0 12px 36px rgba(37, 211, 102, 0.5);
        }
        .whatsapp-float::after {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 2px solid rgba(37, 211, 102, 0.3);
            animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.7; }
            70% { transform: scale(1.2); opacity: 0; }
            100% { transform: scale(1.3); opacity: 0; }
        }
        .wa-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(3px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1.5rem;
        }
        .wa-modal-overlay.active {
            display: flex;
        }
        .wa-modal-card {
            max-width: 420px;
            width: 100%;
            background: #ffffff;
            border-radius: 28px;
            padding: 2rem 1.8rem 1.8rem;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.25);
            text-align: center;
            position: relative;
        }
        .wa-modal-icon {
            font-size: 3.2rem;
            color: #25d366;
            margin-bottom: 0.25rem;
        }
        .wa-modal-card h3 {
            font-size: 1.6rem;
            font-weight: 700;
            color: #0b1a2b;
            margin: 0.4rem 0 0.2rem;
        }
        .wa-modal-card p {
            color: #3b4a5e;
            font-size: 0.98rem;
            line-height: 1.5;
            margin: 0.6rem 0 1.6rem;
        }
        .wa-modal-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
        }
        .wa-btn {
            flex: 1 1 auto;
            min-width: 110px;
            padding: 0.75rem 1.4rem;
            border-radius: 60px;
            font-weight: 600;
            font-size: 0.95rem;
            border: none;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.1s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            text-decoration: none;
        }
        .wa-btn-primary {
            background: #25d366;
            color: white;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }
        .wa-btn-primary:hover {
            background: #1ebe5a;
            transform: scale(1.02);
        }
        .wa-btn-secondary {
            background: #f0f2f5;
            color: #1f2a3a;
        }
        .wa-btn-secondary:hover {
            background: #e4e7ec;
        }
        .wa-modal-close {
            position: absolute;
            top: 14px;
            right: 18px;
            background: transparent;
            border: none;
            font-size: 1.6rem;
            color: #9aa6b5;
            cursor: pointer;
            line-height: 1;
            padding: 4px;
            transition: color 0.15s;
        }
        .wa-modal-close:hover {
            color: #1f2a3a;
        }
        @media (max-width: 480px) {
            .whatsapp-float {
                width: 56px;
                height: 56px;
                font-size: 1.9rem;
                bottom: 20px;
                right: 20px;
            }
            .wa-modal-card {
                padding: 1.6rem 1.2rem 1.4rem;
            }
            .wa-modal-card h3 {
                font-size: 1.3rem;
            }
            .wa-btn {
                min-width: 90px;
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }
        }
    `;

    // Append styles to head
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);

    // Append widget HTML
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container.firstElementChild);
    document.body.appendChild(container.lastElementChild);

    // Initialize functionality
    const floatBtn = document.getElementById('waFloatBtn');
    const modal = document.getElementById('waModal');
    const closeBtn = document.getElementById('waModalClose');
    const cancelBtn = document.getElementById('waModalCancel');
    const confirmLink = document.getElementById('waModalConfirm');

    const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PRE_FILLED_MSG)}`;
    confirmLink.href = WA_URL;

    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e) e.preventDefault();
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    floatBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(e);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal(e);
        }
    });

    confirmLink.addEventListener('click', function(e) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
})();