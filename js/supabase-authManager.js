// Clean Authentication Manager - Simple and Reliable
// Updated for Supabase
import { supabase } from "./supabase-auth.js";
import { TABLES } from "./supabase-config.js";

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.redirected = false; // Prevent multiple redirects
        this.initialized = false; // Prevent multiple initializations
        this.lastRedirectTime = 0; // Track last redirect time
        this.redirectCount = 0; // Track number of redirects to prevent infinite loops
        this.maxRedirects = 3; // Maximum allowed redirects
        this.setupAuthListener();
        this.checkExistingAuth();
    }

    async checkExistingAuth() {
        // Check if user is already authenticated when page loads
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            const cachedRole = localStorage.getItem('role');
            
            console.log('🔐 Checking existing auth - User:', user?.email || 'None', 'Cached role:', cachedRole);
            
            if (user && cachedRole) {
                console.log('🔐 User already authenticated, checking if account is disabled');
                this.currentUser = user;
                this.currentRole = cachedRole;
                
                // Check if account is disabled
                try {
                    const { data: userDoc, error: userError } = await supabase
                        .from(TABLES.users)
                        .select('*')
                        .eq('uid', user.id)
                        .single();
                    
                    if (userDoc) {
                        if (userDoc.disabled === true) {
                            console.log('🚫 Account is disabled during existing auth check, redirecting to disabled page');
                            await supabase.auth.signOut();
                            localStorage.removeItem('uid');
                            localStorage.removeItem('role');
                            this.currentUser = null;
                            this.currentRole = null;
                            // Redirect to disabled page
                            window.location.href = '../disabled/';
                            return;
                        }
                        
                        // Update role from database if different from cached
                        if (userDoc.role !== cachedRole) {
                            console.log('🔐 Role changed in database, updating from', cachedRole, 'to', userDoc.role);
                            this.currentRole = userDoc.role;
                            localStorage.setItem('role', userDoc.role);
                        }
                    } else {
                        console.warn('⚠️ User document not found during existing auth check');
                    }
                } catch (error) {
                    console.error('❌ Error checking user status during existing auth check:', error);
                }
            }
        } catch (error) {
            console.error('❌ Error checking existing auth:', error);
        }
    }

    setupAuthListener() {
        console.log('🔐 AuthManager: Setting up Supabase auth listener');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user');
            
            if (event === 'SIGNED_IN' && session?.user) {
                this.currentUser = session.user;
                
                // Get user role from database
                try {
                    const { data: userDoc, error } = await supabase
                        .from(TABLES.users)
                        .select('*')
                        .eq('uid', session.user.id)
                        .single();
                    
                    if (userDoc) {
                        this.currentRole = userDoc.role;
                        localStorage.setItem('uid', session.user.id);
                        localStorage.setItem('role', userDoc.role);
                        
                        // Check if account is disabled
                        if (userDoc.disabled === true) {
                            console.log('🚫 Account is disabled, redirecting to disabled page');
                            await supabase.auth.signOut();
                            this.currentUser = null;
                            this.currentRole = null;
                            window.location.href = '../disabled/';
                            return;
                        }
                        
                        console.log('🔐 User authenticated with role:', userDoc.role);
                        this.handleRedirect(userDoc.role);
                    }
                } catch (error) {
                    console.error('❌ Error fetching user data:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.currentRole = null;
                localStorage.removeItem('uid');
                localStorage.removeItem('role');
                console.log('🔐 User signed out');
            }
        });
        
        // Store subscription for cleanup
        this.authSubscription = subscription;
    }

    handleRedirect(role) {
        const now = Date.now();
        const timeSinceLastRedirect = now - this.lastRedirectTime;
        
        // Prevent rapid redirects (less than 1 second apart)
        if (timeSinceLastRedirect < 1000) {
            console.log('🔐 Redirect prevented: too soon after last redirect');
            return;
        }
        
        // Prevent infinite redirect loops
        if (this.redirectCount >= this.maxRedirects) {
            console.log('🔐 Redirect prevented: maximum redirect count reached');
            return;
        }
        
        // Check if we're already on the correct page
        const currentPath = window.location.pathname;
        let targetPath = '';
        
        switch (role) {
            case 'admin':
                targetPath = '/admin/';
                break;
            case 'pharmacy':
                targetPath = '/pharmacy/';
                break;
            case 'user':
                targetPath = '/';
                break;
            default:
                console.log('🔐 Unknown role, staying on current page');
                return;
        }
        
        // Check if we're already on the target path
        if (currentPath.includes(targetPath)) {
            console.log('🔐 Already on correct page for role:', role);
            return;
        }
        
        console.log('🔐 Redirecting to:', targetPath, 'for role:', role);
        this.lastRedirectTime = now;
        this.redirectCount++;
        
        // Redirect after a short delay to allow page to settle
        setTimeout(() => {
            window.location.href = targetPath;
        }, 100);
    }

    redirectByRole(role) {
        console.log('🔐 Manual redirect requested for role:', role);
        this.handleRedirect(role);
    }

    reset() {
        console.log('🔐 AuthManager: Resetting state');
        this.currentUser = null;
        this.currentRole = null;
        this.redirected = false;
        this.redirectCount = 0;
        this.lastRedirectTime = 0;
    }

    destroy() {
        console.log('🔐 AuthManager: Destroying and cleaning up');
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
        this.reset();
    }

    // Public methods for external access
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentRole;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.currentRole === 'admin';
    }

    isPharmacy() {
        return this.currentRole === 'pharmacy';
    }

    isUser() {
        return this.currentRole === 'user';
    }
}

// Create and export singleton instance
export const authManager = new AuthManager();

// Make it globally available for backward compatibility
window.authManager = authManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    authManager.destroy();
});
