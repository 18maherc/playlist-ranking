// modalManager.js

function openModal(title, content) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = overlay.querySelector('.modal-header h2');
    const modalContent = overlay.querySelector('.modal-content');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    overlay.hidden = false;
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.hidden = true;
}

function showError(message) {
    let errorElement = document.getElementById('modal-error');
    if (!errorElement) {
        // Create error element if it doesn't exist
        errorElement = document.createElement('div');
        errorElement.id = 'modal-error';
        errorElement.style.cssText = 'color: red; font-size: 0.875rem; margin-top: 0.5rem; display: none;';
        
        // Add to modal content
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.appendChild(errorElement);
        }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    const errorElement = document.getElementById('modal-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}


// Set up event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = overlay.querySelector('.modal-close');
    
    // Close on X button click
    closeBtn.addEventListener('click', closeModal);
    
    // Close on overlay click (but not modal content click)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) {
            closeModal();
        }
    });
    
    // Test modal button
    const testModalBtn = document.getElementById('testModal');
    if (testModalBtn) {
        testModalBtn.addEventListener('click', () => {
            openModal('Test Modal', '<p>This is a test modal to demonstrate the pop-up functionality!</p><p>You can close it by clicking the X, pressing Escape, or clicking outside the modal.</p>');
        });
    }
});