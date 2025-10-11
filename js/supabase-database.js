// Supabase Database Operations Module
// Migration from Firebase Firestore to Supabase PostgreSQL for PHARMA DIRECT

import { supabase } from './supabase-auth.js';
import { TABLES, ORDER_STAGES, PAYMENT_METHODS, PAYMENT_STATUS, getProfessionalErrorMessage } from './supabase-config.js';

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Check and automatically unlock COD for eligible users
 * @param {string} userId - Database user ID
 * @returns {Promise<Object>} Result of COD unlock check
 */
export async function checkAutoUnlockCOD(userId) {
    try {
        console.log('🔓 Checking COD auto-unlock for user:', userId);

        // Get user's delivered orders (include grand_total when available)
        const { data: deliveredOrders, error } = await supabase
            .from(TABLES.orders)
            .select('total, grand_total, created_at')
            .eq('user_id', userId)
            .eq('stage', 'Delivered')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user orders for COD check:', error);
            return { success: false, error };
        }

        // By default count all delivered orders, but we'll later filter by min per-order amount
        // after loading settings.

        // Log basic info about fetched orders (detailed stats are logged after computation)
        console.log('📊 COD eligibility fetched delivered orders count:', (deliveredOrders || []).length);

        // Get COD unlock criteria from settings (include single-order min amount)
        const { data: codSettings } = await supabase
            .from(TABLES.settings)
            .select('*')
            .in('key', ['cod_min_orders', 'cod_min_spend', 'cod_min_order_amount']);

        let minOrders = 3;
        let minSpend = 1000;
        let minOrderAmount = 0; // don't filter by default unless set explicitly

        if (codSettings) {
            codSettings.forEach(setting => {
                if (setting.key === 'cod_min_orders') {
                    minOrders = parseInt(setting.value) || 3;
                } else if (setting.key === 'cod_min_spend') {
                    minSpend = parseInt(setting.value) || 1000;
                } else if (setting.key === 'cod_min_order_amount') {
                    minOrderAmount = parseFloat(setting.value) || 0;
                }
            });
        }

        // If a per-order minimum is configured, only consider delivered orders whose
        // total (prefer grand_total when present) meets or exceeds that amount.
        const eligibleDelivered = (deliveredOrders || []).filter(order => {
            const orderTotal = parseFloat(order.grand_total || order.total || 0);
            if (minOrderAmount && minOrderAmount > 0) {
                return orderTotal >= minOrderAmount;
            }
            return true;
        });

        const successfulOrders = eligibleDelivered.length || 0;
        const totalSpent = eligibleDelivered.reduce((sum, order) => sum + parseFloat(order.grand_total || order.total || 0), 0) || 0;

        // Detailed computed stats for debugging
        console.log('📊 COD eligibility computed stats:', { userId, successfulOrders, totalSpent, minOrders, minSpend, minOrderAmount });

        // COD unlock criteria:
        // - If both minOrders and minSpend are configured (>0), require BOTH to be satisfied.
        // - Otherwise, if only one is configured (>0), allow that one to unlock COD (OR behavior).
        let shouldUnlock = false;
        const hasMinOrders = !!(minOrders && minOrders > 0);
        const hasMinSpend = !!(minSpend && minSpend > 0);

        if (hasMinOrders && hasMinSpend) {
            shouldUnlock = successfulOrders >= minOrders && totalSpent >= minSpend;
        } else {
            shouldUnlock = (hasMinOrders && successfulOrders >= minOrders) || (hasMinSpend && totalSpent >= minSpend);
        }

        console.log('📊 COD unlock decision:', { userId, hasMinOrders, hasMinSpend, minOrders, minSpend, successfulOrders, totalSpent, shouldUnlock });

        if (shouldUnlock) {
            // Check if user is already unlocked
            const { data: userData, error: userError } = await supabase
                .from(TABLES.users)
                .select('cod_unlocked')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error('Error checking user COD status:', userError);
                return { success: false, error: userError };
            }

            if (!userData.cod_unlocked) {
                // Unlock COD for user
                const { error: updateError } = await supabase
                    .from(TABLES.users)
                    .update({ cod_unlocked: true })
                    .eq('id', userId);

                if (updateError) {
                    console.error('Error unlocking COD:', updateError);
                    return { success: false, error: updateError };
                }

                console.log('✅ COD automatically unlocked for user:', userId);
                return {
                    success: true,
                    unlocked: true,
                    reason: successfulOrders >= minOrders ? `${minOrders}+ successful orders` : `₱${minSpend}+ total spent`,
                    stats: { successfulOrders, totalSpent }
                };
            }
        }

        return {
            success: true,
            unlocked: false,
            stats: { successfulOrders, totalSpent },
            requirements: {
                minOrders: minOrders,
                minSpent: minSpend,
                minOrderAmount: minOrderAmount,
                currentOrders: successfulOrders,
                currentSpent: totalSpent
            }
        };

    } catch (error) {
        console.error('Error in checkAutoUnlockCOD:', error);
        return { success: false, error };
    }
}

/**
 * Transform product data from snake_case to camelCase for compatibility with existing templates
 * @param {Object|Array} data - Product data from database
 * @returns {Object|Array} Transformed product data
 */
function transformProductData(data) {
    if (Array.isArray(data)) {
        return data.map(product => ({
            ...product,
            imageURL: product.image_url,
            categoryId: product.category_id,
            pharmacyId: product.pharmacy_id,
            createdAt: product.created_at,
            updatedAt: product.updated_at
        }));
    } else if (data) {
        return {
            ...data,
            imageURL: data.image_url,
            categoryId: data.category_id,
            pharmacyId: data.pharmacy_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
    return data;
}

// =============================================
// PRODUCT OPERATIONS
// =============================================

/**
 * Get featured products (equivalent to Firebase query with where and limit)
 * @param {number} limit - Maximum number of products to return
 * @returns {Promise<Array>} Array of featured products
 */
export async function getFeaturedProducts(limit = 8) {
    try {
        console.log('📦 getFeaturedProducts: Fetching featured products');

        const { data, error } = await supabase
            .from(TABLES.products)
            .select('*')
            .eq('featured', true)
            .eq('disabled', false)
            .gt('stock', 0)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ getFeaturedProducts: Error:', error);
            throw error;
        }

        console.log('✅ getFeaturedProducts: Found', data?.length || 0, 'featured products');
        return transformProductData(data || []);
    } catch (error) {
        console.error('❌ getFeaturedProducts: Exception:', error);
        throw error;
    }
}

/**
 * Get products by category (equivalent to Firebase query with where and orderBy)
 * @param {string} categoryName - Category name to filter by
 * @returns {Promise<Array>} Array of products in category
 */
export async function getProductsByCategory(categoryName) {
    try {
        console.log('📦 getProductsByCategory: Fetching products for category:', categoryName);

        const { data, error } = await supabase
            .from(TABLES.products)
            .select('*')
            .eq('category', categoryName)
            .eq('disabled', false)
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ getProductsByCategory: Error:', error);
            throw error;
        }

        console.log('✅ getProductsByCategory: Found', data?.length || 0, 'products');
        return transformProductData(data || []);
    } catch (error) {
        console.error('❌ getProductsByCategory: Exception:', error);
        throw error;
    }
}

/**
 * Get product by ID (equivalent to Firebase getDoc)
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product data or null
 */
export async function getProductById(productId) {
    try {
        console.log('📦 getProductById: Fetching product:', productId);

        const { data, error } = await supabase
            .from(TABLES.products)
            .select(`
                *,
                categories!inner(name),
                pharmacies!inner(name, approved, disabled)
            `)
            .eq('id', productId)
            .eq('disabled', false)
            .eq('pharmacies.approved', true)
            .eq('pharmacies.disabled', false)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                console.log('📦 getProductById: Product not found');
                return null;
            }
            console.error('❌ getProductById: Error:', error);
            throw error;
        }

        console.log('✅ getProductById: Product found');
        return transformProductData(data);
    } catch (error) {
        console.error('❌ getProductById: Exception:', error);
        throw error;
    }
}

/**
 * Get products by pharmacy (equivalent to Firebase query with where)
 * @param {string} pharmacyId - Pharmacy ID
 * @returns {Promise<Array>} Array of products
 */
export async function getProductsByPharmacy(pharmacyId) {
    try {
        console.log('📦 getProductsByPharmacy: Fetching products for pharmacy:', pharmacyId);

        const { data, error } = await supabase
            .from(TABLES.products)
            .select(`
                *,
                categories(name)
            `)
            .eq('pharmacy_id', pharmacyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ getProductsByPharmacy: Error:', error);
            throw error;
        }

        console.log('✅ getProductsByPharmacy: Found', data?.length || 0, 'products');
        return transformProductData(data || []);
    } catch (error) {
        console.error('❌ getProductsByPharmacy: Exception:', error);
        throw error;
    }
}

/**
 * Add new product (equivalent to Firebase addDoc)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product data
 */
export async function addProduct(productData) {
    try {
        console.log('📦 addProduct: Adding new product:', productData.name);

        const { data, error } = await supabase
            .from(TABLES.products)
            .insert([productData])
            .select()
            .single();

        if (error) {
            console.error('❌ addProduct: Error:', error);
            throw error;
        }

        console.log('✅ addProduct: Product created with ID:', data.id);
        return transformProductData(data);
    } catch (error) {
        console.error('❌ addProduct: Exception:', error);
        throw error;
    }
}

/**
 * Update product (equivalent to Firebase updateDoc)
 * @param {string} productId - Product ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated product data
 */
export async function updateProduct(productId, updates) {
    try {
        console.log('📦 updateProduct: Updating product:', productId);

        const { data, error } = await supabase
            .from(TABLES.products)
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            console.error('❌ updateProduct: Error:', error);
            throw error;
        }

        console.log('✅ updateProduct: Product updated');
        return transformProductData(data);
    } catch (error) {
        console.error('❌ updateProduct: Exception:', error);
        throw error;
    }
}

/**
 * Delete product (equivalent to Firebase deleteDoc)
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId) {
    try {
        console.log('📦 deleteProduct: Deleting product:', productId);

        const { error } = await supabase
            .from(TABLES.products)
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('❌ deleteProduct: Error:', error);
            throw error;
        }

        console.log('✅ deleteProduct: Product deleted');
    } catch (error) {
        console.error('❌ deleteProduct: Exception:', error);
        throw error;
    }
}

// =============================================
// ORDER OPERATIONS
// =============================================

/**
 * Create new order (equivalent to Firebase addDoc with nested items)
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order data
 */
export async function createOrder(orderData) {
    try {
        console.log('🛒 createOrder: Creating new order');

        // Start a transaction-like operation
        const { data: order, error: orderError } = await supabase
            .from(TABLES.orders)
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            console.error('❌ createOrder: Error creating order:', orderError);
            throw orderError;
        }

        console.log('✅ createOrder: Order created with ID:', order.id);
        return order;
    } catch (error) {
        console.error('❌ createOrder: Exception:', error);
        throw error;
    }
}

/**
 * Add order items (equivalent to Firebase nested array handling)
 * @param {Array} orderItems - Array of order items
 * @returns {Promise<Array>} Created order items
 */
export async function addOrderItems(orderItems) {
    try {
        console.log('🛒 addOrderItems: Adding', orderItems.length, 'order items');

        const { data, error } = await supabase
            .from(TABLES.order_items)
            .insert(orderItems)
            .select();

        if (error) {
            console.error('❌ addOrderItems: Error:', error);
            throw error;
        }

        console.log('✅ addOrderItems: Order items created');
        return data || [];
    } catch (error) {
        console.error('❌ addOrderItems: Exception:', error);
        throw error;
    }
}

/**
 * Get orders by user (equivalent to Firebase query with where)
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of orders to return
 * @returns {Promise<Array>} Array of user orders
 */
export async function getOrdersByUser(userId, limit = null) {
    try {
        console.log('🛒 getOrdersByUser: Fetching orders for user:', userId);

        let query = supabase
            .from(TABLES.orders)
            .select(`
                *,
                order_items(
                    *,
                    products(name, image_url)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ getOrdersByUser: Error:', error);
            throw error;
        }

        console.log('✅ getOrdersByUser: Found', data?.length || 0, 'orders');
        return data || [];
    } catch (error) {
        console.error('❌ getOrdersByUser: Exception:', error);
        throw error;
    }
}

/**
 * Get orders by pharmacy (equivalent to Firebase complex query with joins)
 * @param {string} pharmacyId - Pharmacy ID
 * @returns {Promise<Array>} Array of pharmacy orders
 */
export async function getOrdersByPharmacy(pharmacyId) {
    try {
        console.log('🛒 getOrdersByPharmacy: Fetching orders for pharmacy:', pharmacyId);

        // First get products for this pharmacy
        const { data: products, error: productsError } = await supabase
            .from(TABLES.products)
            .select('id')
            .eq('pharmacy_id', pharmacyId);

        if (productsError) {
            console.error('❌ getOrdersByPharmacy: Error fetching products:', productsError);
            throw productsError;
        }

        const productIds = products?.map(p => p.id) || [];

        if (productIds.length === 0) {
            console.log('✅ getOrdersByPharmacy: No products found, returning empty array');
            return [];
        }

        // Get orders that contain items from this pharmacy
        const { data, error } = await supabase
            .from(TABLES.orders)
            .select(`
                *,
                order_items!inner(
                    *,
                    products!inner(id)
                )
            `)
            .in('order_items.product_id', productIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ getOrdersByPharmacy: Error:', error);
            throw error;
        }

        // Filter to only include orders that actually have items from this pharmacy
        const filteredOrders = data?.filter(order => {
            return order.order_items.some(item => productIds.includes(item.product_id));
        }) || [];

        console.log('✅ getOrdersByPharmacy: Found', filteredOrders.length, 'orders');
        return filteredOrders;
    } catch (error) {
        console.error('❌ getOrdersByPharmacy: Exception:', error);
        throw error;
    }
}

/**
 * Update order stage (equivalent to Firebase updateDoc)
 * @param {string} orderId - Order ID
 * @param {string} stage - New order stage
 * @param {Object} additionalUpdates - Additional fields to update
 * @returns {Promise<Object>} Updated order data
 */
export async function updateOrderStage(orderId, stage, additionalUpdates = {}) {
    try {
        console.log('🛒 updateOrderStage: Updating order', orderId, 'to stage:', stage);

        const updateData = {
            stage,
            updated_at: new Date().toISOString(),
            ...additionalUpdates
        };

        const { data, error } = await supabase
            .from(TABLES.orders)
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('❌ updateOrderStage: Error:', error);
            throw error;
        }

        console.log('✅ updateOrderStage: Order updated');

        // If the order was moved to Delivered, run COD auto-unlock check for the user
        try {
            if (stage === 'Delivered' && data && data.user_id) {
                console.log('🔁 Order moved to Delivered — running COD auto-unlock check for user:', data.user_id);
                // Importing the function locally to avoid circular import issues in some bundlers/environments
                if (typeof checkAutoUnlockCOD === 'function') {
                    await checkAutoUnlockCOD(data.user_id);
                } else {
                    // dynamic import as a fallback
                    const mod = await import('./supabase-database.js');
                    if (mod && typeof mod.checkAutoUnlockCOD === 'function') {
                        await mod.checkAutoUnlockCOD(data.user_id);
                    }
                }
            }
        } catch (e) {
            console.error('Error running COD auto-unlock after order update:', e);
        }

        return data;
    } catch (error) {
        console.error('❌ updateOrderStage: Exception:', error);
        throw error;
    }
}

// =============================================
// ADDRESS OPERATIONS
// =============================================

/**
 * Get addresses by user (equivalent to Firebase query with where)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user addresses
 */
export async function getAddressesByUser(userId) {
    try {
        console.log('📍 getAddressesByUser: Fetching addresses for user:', userId);

        const { data, error } = await supabase
            .from(TABLES.addresses)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ getAddressesByUser: Error:', error);
            throw error;
        }

        console.log('✅ getAddressesByUser: Found', data?.length || 0, 'addresses');
        return data || [];
    } catch (error) {
        console.error('❌ getAddressesByUser: Exception:', error);
        throw error;
    }
}

/**
 * Add new address (equivalent to Firebase addDoc)
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address data
 */
export async function addAddress(addressData) {
    try {
        console.log('📍 addAddress: Adding new address');

        const { data, error } = await supabase
            .from(TABLES.addresses)
            .insert([addressData])
            .select()
            .single();

        if (error) {
            console.error('❌ addAddress: Error:', error);
            throw error;
        }

        console.log('✅ addAddress: Address created with ID:', data.id);
        return data;
    } catch (error) {
        console.error('❌ addAddress: Exception:', error);
        throw error;
    }
}

/**
 * Update address (equivalent to Firebase updateDoc)
 * @param {string} addressId - Address ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated address data
 */
export async function updateAddress(addressId, updates) {
    try {
        console.log('📍 updateAddress: Updating address:', addressId);

        const { data, error } = await supabase
            .from(TABLES.addresses)
            .update(updates)
            .eq('id', addressId)
            .select()
            .single();

        if (error) {
            console.error('❌ updateAddress: Error:', error);
            throw error;
        }

        console.log('✅ updateAddress: Address updated');
        return data;
    } catch (error) {
        console.error('❌ updateAddress: Exception:', error);
        throw error;
    }
}

/**
 * Delete address (equivalent to Firebase deleteDoc)
 * @param {string} addressId - Address ID
 * @returns {Promise<void>}
 */
export async function deleteAddress(addressId) {
    try {
        console.log('📍 deleteAddress: Deleting address:', addressId);

        const { error } = await supabase
            .from(TABLES.addresses)
            .delete()
            .eq('id', addressId);

        if (error) {
            console.error('❌ deleteAddress: Error:', error);
            throw error;
        }

        console.log('✅ deleteAddress: Address deleted');
    } catch (error) {
        console.error('❌ deleteAddress: Exception:', error);
        throw error;
    }
}

// =============================================
// PHARMACY OPERATIONS
// =============================================

/**
 * Get pharmacy by user ID (equivalent to Firebase getDoc)
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Pharmacy data or null
 */
export async function getPharmacyByUserId(userId) {
    try {
        console.log('🏥 getPharmacyByUserId: Fetching pharmacy for user:', userId);

        const { data, error } = await supabase
            .from(TABLES.pharmacies)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                console.log('🏥 getPharmacyByUserId: Pharmacy not found');
                return null;
            }
            console.error('❌ getPharmacyByUserId: Error:', error);
            throw error;
        }

        console.log('✅ getPharmacyByUserId: Pharmacy found');
        return data;
    } catch (error) {
        console.error('❌ getPharmacyByUserId: Exception:', error);
        throw error;
    }
}

/**
 * Update pharmacy wallet (equivalent to Firebase updateDoc)
 * @param {string} pharmacyId - Pharmacy ID
 * @param {Object} walletUpdates - Wallet update data
 * @returns {Promise<Object>} Updated pharmacy data
 */
export async function updatePharmacyWallet(pharmacyId, walletUpdates) {
    try {
        console.log('🏥 updatePharmacyWallet: Updating wallet for pharmacy:', pharmacyId);

        const { data, error } = await supabase
            .from(TABLES.pharmacies)
            .update({
                ...walletUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('id', pharmacyId)
            .select()
            .single();

        if (error) {
            console.error('❌ updatePharmacyWallet: Error:', error);
            throw error;
        }

        console.log('✅ updatePharmacyWallet: Pharmacy wallet updated');
        return data;
    } catch (error) {
        console.error('❌ updatePharmacyWallet: Exception:', error);
        throw error;
    }
}

// =============================================
// SETTINGS OPERATIONS
// =============================================

/**
 * Get system settings (equivalent to Firebase getDocs with key-value pairs)
 * @returns {Promise<Object>} Settings object with key-value pairs
 */
export async function getSettings() {
    try {
        console.log('⚙️ getSettings: Fetching system settings');

        const { data, error } = await supabase
            .from(TABLES.settings)
            .select('key, value');

        if (error) {
            console.error('❌ getSettings: Error:', error);
            throw error;
        }

        // Convert array to object
        const settings = {};
        data?.forEach(setting => {
            settings[setting.key] = setting.value;
        });

        console.log('✅ getSettings: Settings loaded');
        return settings;
    } catch (error) {
        console.error('❌ getSettings: Exception:', error);
        throw error;
    }
}

/**
 * Update setting (equivalent to Firebase updateDoc)
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @returns {Promise<Object>} Updated setting data
 */
export async function updateSetting(key, value) {
    try {
        console.log('⚙️ updateSetting: Updating setting:', key);

        const { data, error } = await supabase
            .from(TABLES.settings)
            .update({
                value,
                updated_at: new Date().toISOString()
            })
            .eq('key', key)
            .select()
            .single();

        if (error) {
            console.error('❌ updateSetting: Error:', error);
            throw error;
        }

        console.log('✅ updateSetting: Setting updated');
        return data;
    } catch (error) {
        console.error('❌ updateSetting: Exception:', error);
        throw error;
    }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to order changes (equivalent to Firebase onSnapshot)
 * @param {string} userId - User ID to filter orders
 * @param {Function} callback - Callback function for updates
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribeToUserOrders(userId, callback) {
    console.log('🔄 subscribeToUserOrders: Setting up subscription for user:', userId);

    const subscription = supabase
        .channel('user-orders')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: TABLES.orders,
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            console.log('🔄 User order change:', payload);
            callback(payload);
        })
        .subscribe();

    return {
        unsubscribe: () => {
            console.log('🔄 subscribeToUserOrders: Unsubscribing');
            subscription.unsubscribe();
        }
    };
}

/**
 * Subscribe to pharmacy orders (equivalent to Firebase onSnapshot with complex filtering)
 * @param {string} pharmacyId - Pharmacy ID
 * @param {Function} callback - Callback function for updates
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribeToPharmacyOrders(pharmacyId, callback) {
    console.log('🔄 subscribeToPharmacyOrders: Setting up subscription for pharmacy:', pharmacyId);

    // Note: This is a simplified version. For complex filtering like Firebase,
    // you might need to use database triggers or functions.
    const subscription = supabase
        .channel('pharmacy-orders')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: TABLES.orders
        }, async (payload) => {
            // Check if this order contains items from this pharmacy
            const { data: orderItems } = await supabase
                .from(TABLES.order_items)
                .select(`
                    *,
                    products!inner(pharmacy_id)
                `)
                .eq('order_id', payload.new.id)
                .eq('products.pharmacy_id', pharmacyId);

            if (orderItems && orderItems.length > 0) {
                console.log('🔄 Pharmacy order change:', payload);
                callback(payload);
            }
        })
        .subscribe();

    return {
        unsubscribe: () => {
            console.log('🔄 subscribeToPharmacyOrders: Unsubscribing');
            subscription.unsubscribe();
        }
    };
}

// Export the Supabase client for direct use if needed
export { supabase };
