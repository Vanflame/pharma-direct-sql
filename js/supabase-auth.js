// Supabase Authentication Module
// Migration from Firebase Auth to Supabase Auth for PHARMA DIRECT

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { supabaseConfig, TABLES, USER_ROLES, getProfessionalErrorMessage, showError, showSuccess, setButtonLoading } from './supabase-config.js';

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

/**
 * Register a new user (equivalent to Firebase registerUser)
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.phone - User's phone number (optional)
 * @param {string} userData.role - User role (default: 'user')
 * @returns {Promise<Object>} Auth user object
 */
export async function registerUser({ name, email, password, phone, role = "user" }) {
    console.log('📝 registerUser: Starting registration for:', { email, role });
    
    try {
        // Step 1: Create user in Supabase Auth
        console.log('📝 registerUser: Creating user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    phone: phone || '',
                    role
                }
            }
        });

        if (authError) {
            console.error('❌ registerUser: Auth error:', authError);
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No user returned from signup');
        }

        console.log('📝 registerUser: User created in Auth, UID:', authData.user.id);

        // Step 2: Prepare user data for database (using minimal schema)
        const userData = {
            uid: authData.user.id,
            name,
            email,
            phone: phone || "",
            role,
            disabled: false,
            successful_orders: 0,
            total_spent: 0.00,
            cod_unlocked: role === "admin" ? true : false
            // Removed created_at as it doesn't exist in the database schema
        };

        // Step 3: Save user data to database
        console.log('📝 registerUser: Saving user data to database...');
        console.log('📝 registerUser: User data to insert:', userData);
        const { data: userDbData, error: userDbError } = await supabase
            .from(TABLES.users)
            .insert([userData])
            .select()
            .single();

        if (userDbError) {
            console.error('❌ registerUser: Database error:', userDbError);
            console.error('❌ registerUser: Full error details:', {
                code: userDbError.code,
                message: userDbError.message,
                details: userDbError.details,
                hint: userDbError.hint
            });
            
            // Clean up: Delete the Auth user since database failed
            console.log('📝 registerUser: Cleaning up failed registration - deleting Auth user...');
            try {
                await supabase.auth.admin.deleteUser(authData.user.id);
                console.log('📝 registerUser: User deleted from Auth successfully');
            } catch (deleteError) {
                console.error('❌ registerUser: Failed to delete user from Auth:', deleteError);
                // If deletion fails, ensure sign-out
                try { 
                    await supabase.auth.signOut(); 
                    console.log('📝 registerUser: User signed out as fallback');
                } catch (signOutError) {
                    console.error('❌ registerUser: Failed to sign out user:', signOutError);
                }
            }
            
            throw userDbError;
        }

        console.log('📝 registerUser: User data saved to database successfully');

        // Step 4: If pharmacy, also create pharmacy document
        if (role === "pharmacy") {
            console.log('📝 registerUser: Creating pharmacy document...');
            const pharmacyData = {
                user_id: userDbData.id, // Use the database user ID, not the auth UID
                name,
                email,
                phone: phone || "",
                approved: false,
                disabled: false,
                total_orders: 0,
                wallet_balance: 0.00,
                pending_balance: 0.00
                // Removed created_at as it might not exist in the database schema
            };

            const { error: pharmacyError } = await supabase
                .from(TABLES.pharmacies)
                .insert([pharmacyData]);

            if (pharmacyError) {
                console.error('❌ registerUser: Pharmacy creation error:', pharmacyError);
                // Don't throw here, user is already created successfully
            } else {
                console.log('📝 registerUser: Pharmacy document created successfully');
            }
        }

        // Step 5: Save to localStorage
        try {
            localStorage.setItem('uid', authData.user.id);
            localStorage.setItem('role', role);
            console.log('📝 registerUser: Data saved to localStorage');
        } catch (localError) {
            console.warn('📝 registerUser: Failed to save to localStorage:', localError);
        }

        console.log('📝 registerUser: Registration completed successfully');
        return authData.user;

    } catch (error) {
        console.error('❌ registerUser: Registration failed:', error);
        console.error('❌ registerUser: Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });

        // Clear localStorage
        try {
            localStorage.removeItem('uid');
            localStorage.removeItem('role');
            console.log('📝 registerUser: Cleared localStorage');
        } catch (localError) {
            console.warn('📝 registerUser: Failed to clear localStorage:', localError);
        }

        throw error;
    }
}

/**
 * Login user (equivalent to Firebase loginUser)
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Auth user object
 */
export async function loginUser({ email, password }) {
    console.log('🔐 loginUser: Starting login for:', email);
    
    try {
        // Step 1: Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('❌ loginUser: Auth error:', authError);
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No user returned from login');
        }

        console.log('🔐 loginUser: User authenticated, UID:', authData.user.id);

        // Step 2: Fetch full user document to check if account is disabled
        const userDoc = await fetchUserDoc(authData.user.id);
        console.log('🔐 loginUser: Fetched user document:', userDoc);

        // Check if account is disabled
        console.log('🔐 loginUser: Checking if account is disabled:', userDoc?.disabled);
        if (userDoc && userDoc.disabled === true) {
            console.log('🚫 loginUser: Account is disabled - redirecting to disabled page');
            // Sign out the user immediately
            await supabase.auth.signOut();
            console.log('🚫 loginUser: User signed out successfully');
            // Redirect to disabled page
            window.location.href = '../disabled/';
            return; // Don't proceed with normal login
        }

        console.log('✅ loginUser: Account is enabled, proceeding with login');

        const role = userDoc?.role || 'user';
        console.log('🔐 loginUser: User role:', role);
        
        // Save to localStorage
        localStorage.setItem('uid', authData.user.id);
        localStorage.setItem('role', role);
        console.log('🔐 loginUser: Stored role in localStorage:', role);
        
        return authData.user;

    } catch (error) {
        console.error('❌ loginUser: Login failed:', error);
        // Sign out the user if we can't get their role or account is disabled
        try {
            await supabase.auth.signOut();
        } catch (signOutError) {
            console.error('❌ loginUser: Failed to sign out user:', signOutError);
        }
        throw error;
    }
}

/**
 * Fetch user role from database (equivalent to Firebase fetchUserRole)
 * @param {string} uid - User ID
 * @returns {Promise<string>} User role
 */
export async function fetchUserRole(uid) {
    if (!uid) {
        console.log('🔍 fetchUserRole: No UID provided');
        return 'user'; // Default role
    }

    console.log('🔍 fetchUserRole: Fetching role for uid:', uid);
    
    try {
        const { data, error } = await supabase
            .from(TABLES.users)
            .select('role')
            .eq('uid', uid)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found with this uid - check if user exists with different uid
                console.log('🔍 fetchUserRole: User not found with this uid, checking by email');
                
                // Try to get user info from auth
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    try {
                        // Check if user exists with this email but different uid
                        const { data: existingUser, error: emailError } = await supabase
                            .from(TABLES.users)
                            .select('role, uid')
                            .eq('email', authUser.email)
                            .single();
                        
                        if (!emailError && existingUser) {
                            // User exists with different uid - update the uid to match current auth user
                            console.log('🔍 fetchUserRole: Found user with different uid, updating uid');
                            const { error: updateError } = await supabase
                                .from(TABLES.users)
                                .update({ uid: authUser.id })
                                .eq('email', authUser.email);
                            
                            if (updateError) {
                                console.error('❌ fetchUserRole: Error updating uid:', updateError);
                                return existingUser.role || 'user';
                            } else {
                                console.log('✅ fetchUserRole: Updated uid successfully');
                                return existingUser.role || 'user';
                            }
                        } else {
                            // User doesn't exist at all - create new user record
                            console.log('🔍 fetchUserRole: User not found, creating new user record');
                            const { error: insertError } = await supabase
                                .from(TABLES.users)
                                .insert({
                                    uid: authUser.id,
                                    name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                                    email: authUser.email,
                                    role: 'user',
                                    disabled: false,
                                    successful_orders: 0,
                                    total_spent: 0,
                                    cod_unlocked: false
                                });
                            
                            if (insertError) {
                                console.error('❌ fetchUserRole: Error creating user record:', insertError);
                            } else {
                                console.log('✅ fetchUserRole: Created user record successfully');
                            }
                        }
                    } catch (createError) {
                        console.error('❌ fetchUserRole: Exception handling user record:', createError);
                    }
                }
            } else {
                console.error('❌ fetchUserRole: Error fetching role:', error);
            }
            return 'user'; // Default role
        }

        const role = data?.role || 'user';
        console.log('🔍 fetchUserRole: Role found:', role);
        return role;

    } catch (error) {
        console.error('❌ fetchUserRole: Exception:', error);
        return 'user'; // Default role
    }
}

/**
 * Fetch complete user document (equivalent to Firebase fetchUserDoc)
 * Automatically creates user record if it doesn't exist
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User document or null
 */
export async function fetchUserDoc(uid) {
    console.log('🔍 fetchUserDoc: Fetching document for uid:', uid);
    
    try {
        const { data, error } = await supabase
            .from(TABLES.users)
            .select('*')
            .eq('uid', uid)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                console.log('🔍 fetchUserDoc: Document does not exist, attempting to create...');
                
                // Get user data from auth
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user || user.id !== uid) {
                    console.error('❌ fetchUserDoc: Cannot get auth user data:', authError);
                    return null;
                }

                // Create user record with data from auth
                const userData = {
                    uid: user.id,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    phone: user.user_metadata?.phone || '',
                    role: user.user_metadata?.role || 'user',
                    disabled: false,
                    successful_orders: 0,
                    total_spent: 0.00,
                    cod_unlocked: false
                };

                console.log('🔍 fetchUserDoc: Creating user record:', userData);
                const { data: newUserData, error: insertError } = await supabase
                    .from(TABLES.users)
                    .insert([userData])
                    .select()
                    .single();

                if (insertError) {
                    console.error('❌ fetchUserDoc: Failed to create user record:', insertError);
                    return null;
                }

                console.log('✅ fetchUserDoc: User record created successfully:', newUserData);
                return newUserData;
            }
            console.error('❌ fetchUserDoc: Error:', error);
            return null;
        }

        console.log('🔍 fetchUserDoc: Document data:', data);
        return data;

    } catch (error) {
        console.error('❌ fetchUserDoc: Exception:', error);
        return null;
    }
}

/**
 * Get database user ID from auth UID
 * @param {string} uid - Auth user ID
 * @returns {Promise<string|null>} Database user ID or null
 */
export async function getUserIdFromUid(uid) {
    console.log('🔍 getUserIdFromUid: Getting database ID for auth UID:', uid);
    
    try {
        const { data, error } = await supabase
            .from(TABLES.users)
            .select('id')
            .eq('uid', uid)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                console.log('🔍 getUserIdFromUid: User not found, attempting to create...');
                
                // Get user data from auth
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user || user.id !== uid) {
                    console.error('❌ getUserIdFromUid: Cannot get auth user data:', authError);
                    return null;
                }

                // Create user record with data from auth
                const userData = {
                    uid: user.id,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    phone: user.user_metadata?.phone || '',
                    role: user.user_metadata?.role || 'user',
                    disabled: false,
                    successful_orders: 0,
                    total_spent: 0.00,
                    cod_unlocked: false
                };

                console.log('🔍 getUserIdFromUid: Creating user record:', userData);
                const { data: newUserData, error: insertError } = await supabase
                    .from(TABLES.users)
                    .insert([userData])
                    .select('id')
                    .single();

                if (insertError) {
                    console.error('❌ getUserIdFromUid: Failed to create user record:', insertError);
                    return null;
                }

                console.log('✅ getUserIdFromUid: User record created successfully, ID:', newUserData.id);
                return newUserData.id;
            }
            console.error('❌ getUserIdFromUid: Error:', error);
            return null;
        }

        console.log('🔍 getUserIdFromUid: Found database ID:', data.id);
        return data.id;

    } catch (error) {
        console.error('❌ getUserIdFromUid: Exception:', error);
        return null;
    }
}

/**
 * Logout user (equivalent to Firebase logout)
 * @returns {Promise<void>}
 */
export function logout() {
    console.log('🚪 logout: Starting logout process');
    
    try { 
        localStorage.removeItem('uid'); 
        localStorage.removeItem('role'); 
        // Clear redirecting flag
        delete window.redirecting;
        
        // Clear auth manager state
        if (window.authManager) {
            window.authManager.reset();
            console.log('🚪 Logout: Reset auth manager state');
        }
    } catch (error) {
        console.warn('🚪 Logout: Error clearing localStorage:', error);
    }
    
    return supabase.auth.signOut().then(() => {
        console.log('🚪 Logout successful');
        
        // Don't redirect if we're on the disabled page
        if (window.location.pathname.includes('/disabled/')) {
            console.log('🚫 On disabled page, not redirecting to login');
            return;
        }
        
        console.log('🔄 Redirecting to login');
        // Redirect to login page after successful logout
        const isInSubfolder = window.location.pathname.includes('/admin/') || 
                             window.location.pathname.includes('/pharmacy/') || 
                             window.location.pathname.includes('/user-dashboard/') || 
                             window.location.pathname.includes('/categories/') || 
                             window.location.pathname.includes('/track/') || 
                             window.location.pathname.includes('/cart/') || 
                             window.location.pathname.includes('/addresses/') || 
                             window.location.pathname.includes('/pay/') || 
                             window.location.pathname.includes('/product/');
        const basePath = isInSubfolder ? "../" : "";
        window.location.href = `${basePath}login/`;
    }).catch((error) => {
        console.error('❌ Logout error:', error);
        
        // Don't redirect if we're on the disabled page
        if (window.location.pathname.includes('/disabled/')) {
            console.log('🚫 On disabled page, not redirecting to login');
            return;
        }
        
        // Still redirect even if there's an error
        const isInSubfolder = window.location.pathname.includes('/admin/') || 
                             window.location.pathname.includes('/pharmacy/') || 
                             window.location.pathname.includes('/user-dashboard/') || 
                             window.location.pathname.includes('/categories/') || 
                             window.location.pathname.includes('/track/') || 
                             window.location.pathname.includes('/cart/') || 
                             window.location.pathname.includes('/addresses/') || 
                             window.location.pathname.includes('/pay/') || 
                             window.location.pathname.includes('/product/');
        const basePath = isInSubfolder ? "../" : "";
        window.location.href = `${basePath}login/`;
    });
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('❌ getCurrentUser: Error:', error);
            return null;
        }
        return user;
    } catch (error) {
        console.error('❌ getCurrentUser: Exception:', error);
        return null;
    }
}

/**
 * Listen to auth state changes (equivalent to Firebase onAuthStateChanged)
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export function onAuthStateChanged(callback) {
    console.log('🔐 onAuthStateChanged: Setting up auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user');
        callback(session?.user || null);
    });

    return {
        unsubscribe: () => {
            console.log('🔐 onAuthStateChanged: Unsubscribing from auth listener');
            subscription.unsubscribe();
        }
    };
}

/**
 * Update user profile (equivalent to Firebase updateProfile)
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user data
 */
export async function updateProfile(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) {
            console.error('❌ updateProfile: Error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('❌ updateProfile: Exception:', error);
        throw error;
    }
}

/**
 * Reset password (equivalent to Firebase sendPasswordResetEmail)
 * @param {string} email - User's email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            console.error('❌ resetPassword: Error:', error);
            throw error;
        }

        console.log('✅ resetPassword: Password reset email sent');
    } catch (error) {
        console.error('❌ resetPassword: Exception:', error);
        throw error;
    }
}

// Export the Supabase client for direct use if needed
export { supabase };
