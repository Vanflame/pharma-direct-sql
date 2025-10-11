// Supabase Configuration and Constants
// Migration from Firebase to Supabase for PHARMA DIRECT

export const supabaseConfig = {
    url: 'https://kazakphwdzsdlcpweles.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthemFrcGh3ZHpzZGxjcHdlbGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTc2MDIsImV4cCI6MjA3NTIzMzYwMn0.X7N5DU1TnFvdKfpqKXyc-8qJlk-rLkHcJXXWFKqZUog'
};

// Table names mapping from Firebase collections
export const TABLES = {
    users: 'users',
    products: 'products',
    orders: 'orders',
    pharmacies: 'pharmacies',
    settings: 'settings',
    addresses: 'addresses',
    order_items: 'order_items',
    categories: 'categories',
    transactions: 'transactions',
    withdrawal_requests: 'withdrawal_requests'
};

// Order stages (matching Firebase enum)
export const ORDER_STAGES = [
    'Pending',
    'Confirmed',
    'To Be Received',
    'Delivered',
    'Declined',
    'Cancelled'
];

// Payment methods (matching Firebase enum)
export const PAYMENT_METHODS = ['COD', 'Card', 'GCash', 'PayMaya'];

// Payment status (matching Firebase enum)
export const PAYMENT_STATUS = ['Pending', 'Confirmed', 'Failed', 'Refunded'];

// User roles
export const USER_ROLES = ['user', 'pharmacy', 'admin'];

// Currency formatting function (matching Firebase version)
export function formatCurrency(value) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

// Date formatting utilities (matching Firebase version)
export function safeDateConversion(timestamp) {
    try {
        if (!timestamp) {
            return new Date();
        }

        // Handle ISO date strings from Supabase
        if (typeof timestamp === 'string') {
            return new Date(timestamp);
        }

        // Handle Unix timestamps (numbers)
        if (typeof timestamp === 'number') {
            return new Date(timestamp);
        }

        // Handle regular Date objects
        if (timestamp instanceof Date) {
            return timestamp;
        }

        // Try to parse as a date string
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date provided, using current date:', timestamp);
            return new Date();
        }

        return date;
    } catch (error) {
        console.error('Error converting timestamp to date:', error, timestamp);
        return new Date();
    }
}

// Utility function to format dates consistently across the app
export function formatDate(timestamp, options = {}) {
    const date = safeDateConversion(timestamp);
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Utility function to format relative time (e.g., "2h ago", "3d ago")
export function formatRelativeTime(timestamp) {
    const date = safeDateConversion(timestamp);
    const now = new Date();
    const diffInMinutes = Math.abs(now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Professional error message handler (matching Firebase version)
export function getProfessionalErrorMessage(error) {
    // Handle Supabase errors
    if (error.code) {
        switch (error.code) {
            // Authentication errors
            case 'invalid_credentials':
            case 'wrong_password':
            case 'user_not_found':
                return 'Invalid email or password. Please check your credentials and try again.';

            case 'invalid_email':
                return 'Please enter a valid email address.';

            case 'user_disabled':
            case 'account_disabled':
                return 'Your account has been disabled by an administrator. Please contact support for assistance.';

            case 'too_many_requests':
                return 'Too many failed attempts. Please wait a moment before trying again.';

            case 'email_already_registered':
                return 'An account with this email already exists. Please use a different email or try logging in.';

            case 'weak_password':
                return 'Password is too weak. Please choose a stronger password with at least 6 characters.';

            // Database errors
            case 'PGRST301':
                return 'You do not have permission to perform this action. Please contact support if this persists.';

            case 'PGRST116':
                return 'Service is temporarily unavailable. Please try again in a few moments.';

            case 'PGRST301':
                return 'Please log in to continue.';

            case 'PGRST116':
                return 'The requested information was not found.';

            default:
                return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
        }
    }

    // Handle generic errors
    if (error.message) {
        // If it's already a user-friendly message, return it
        if (!error.message.includes('supabase') && !error.message.includes('PGRST')) {
            return error.message;
        }

        // Otherwise, provide a generic message
        return 'Something went wrong. Please try again.';
    }

    // Fallback for unknown errors
    return 'An unexpected error occurred. Please try again.';
}

// Utility function to show professional error messages
export function showError(message, elementId = 'error') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = getProfessionalErrorMessage(message);
        errorElement.classList.remove('hidden');
    } else {
        // Fallback to alert if no error element found
        alert(getProfessionalErrorMessage(message));
    }
}

// Utility function to show success messages
export function showSuccess(message, elementId = 'success') {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('hidden');
    } else {
        // Fallback to alert if no success element found
        alert(message);
    }
}

// Loading indicator utility (matching Firebase version)
export function setButtonLoading(button, isLoading, loadingText = 'Processing...', originalText = null) {
    if (!button) return;

    if (isLoading) {
        // Store original text if not provided
        if (!originalText) {
            originalText = button.textContent;
            button.dataset.originalText = originalText;
        }

        // Disable button and show loading state
        button.disabled = true;
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${loadingText}
        `;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        // Restore original state
        button.disabled = false;
        button.textContent = originalText || button.dataset.originalText || 'Button';
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// Utility function to show loading modal (matching Firebase version)
export function showLoadingModal(title = 'Processing...', message = 'Please wait while we process your request.') {
    // Remove existing loading modal if any
    const existingModal = document.getElementById('loading-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'loading-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <div class="flex justify-center mb-4">
                <svg class="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
            <p class="text-sm text-gray-600">${message}</p>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

// Utility function to hide loading modal
export function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.remove();
    }
}

// Simple form utilities (matching Firebase version)
export function getFormData(form) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
}

// Simple toast notification helper (non-blocking)
export function showToast(message, type = 'info', duration = 4000) {
    try {
        // Reuse existing container or create one
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.top = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.marginTop = '8px';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
        toast.style.color = '#fff';
        toast.style.fontSize = '14px';
        toast.style.maxWidth = '320px';

        // Simple color mapping
        const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
        toast.style.background = bg;

        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 300ms, transform 300ms';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            setTimeout(() => toast.remove(), 350);
        }, duration);
    } catch (err) {
        // Fallback
        console.log('Toast:', message);
    }
}
