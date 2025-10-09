# 🏥 Pharma Direct - Complete Website Flow Analysis

## 🎯 System Overview

**Pharma Direct** is a multi-vendor e-pharmacy platform with 3 user roles:
- **👤 Customers** - Browse, order, and track medications
- **🏥 Pharmacies** - Manage inventory, process orders, handle finances  
- **👨‍💼 Admins** - Oversee system, approve pharmacies, manage withdrawals

---

## 🔐 User Roles & Access Levels

### 👤 Customer (user)
- **Pages:** Home, Cart, Product Details, User Dashboard, Track Orders, Addresses
- **Actions:** Browse products, add to cart, place orders, track orders, manage addresses
- **COD Access:** Must be enabled by admin (`cod_unlocked: true`)

### 🏥 Pharmacy (pharmacy) 
- **Pages:** Pharmacy Dashboard, Product Management, Order Management, Wallet
- **Actions:** Manage products, process orders, view earnings, request withdrawals
- **Restrictions:** Only see their own products/orders

### 👨‍💼 Admin (admin)
- **Pages:** Admin Dashboard, User Management, Pharmacy Management, Order Oversight
- **Actions:** Approve pharmacies, manage users, oversee all orders, approve withdrawals
- **Access:** Full system access

---

## 📱 Complete User Flow Chart

```
🏠 LANDING PAGE (index.html)
├─ 🔍 Browse Products (Featured, Categories, Search)
├─ 🛒 Add to Cart
├─ 👤 Authentication Check
│   ├─ ❌ Not Logged In → Login/Register
│   └─ ✅ Logged In → Role-Based Redirect
│       ├─ 👤 Customer → Stay on Home
│       ├─ 🏥 Pharmacy → Redirect to /pharmacy/
│       └─ 👨‍💼 Admin → Redirect to /admin/
│
├─ 🔐 LOGIN/REGISTER (/login/, /register/)
│   ├─ 📝 Registration Form
│   │   ├─ 👤 Customer Registration
│   │   ├─ 🏥 Pharmacy Registration (Pending Admin Approval)
│   │   └─ ✅ Success → Login Page
│   └─ 🔑 Login Form
│       ├─ ✅ Success → Role-Based Redirect
│       └─ ❌ Failed → Error Message
│
├─ 🛒 CART & CHECKOUT (/cart/)
│   ├─ 📋 Review Cart Items
│   ├─ 📍 Select Delivery Address
│   ├─ 💳 Choose Payment Method
│   │   ├─ 💳 Card → Redirect to Payment Portal
│   │   ├─ 📱 GCash → Redirect to Payment Portal  
│   │   ├─ 💜 PayMaya → Redirect to Payment Portal
│   │   └─ 💰 COD → Direct Order Placement (if enabled)
│   └─ ✅ Place Order
│       ├─ 📦 Order Created (stage: "Pending")
│       ├─ 📧 Order Items Created
│       └─ 🔄 Redirect Based on Payment Method
│
├─ 💳 PAYMENT PORTAL (/pay/)
│   ├─ 📋 Order Summary Display
│   ├─ 💳 Payment Processing (Card/GCash/PayMaya)
│   ├─ ✅ Payment Success
│   │   ├─ 💰 Credit Pharmacy Wallet (minus 5% commission)
│   │   ├─ 📝 Record Transaction
│   │   ├─ 🔄 Update Order (stage: "Confirmed", payment_status: "Confirmed")
│   │   └─ ✅ Redirect to Success Page
│   └─ ❌ Payment Failed → Retry/Error Handling
│
├─ 🏥 PHARMACY DASHBOARD (/pharmacy/)
│   ├─ 📊 Dashboard Overview
│   │   ├─ 📈 Sales Statistics
│   │   ├─ 💰 Wallet Balance
│   │   └─ 📦 Low Stock Alerts
│   │
│   ├─ 📦 PRODUCT MANAGEMENT
│   │   ├─ ➕ Add New Product
│   │   ├─ ✏️ Edit Product
│   │   ├─ 🗑️ Delete Product
│   │   └─ 📊 Stock Management
│   │
│   ├─ 📋 ORDER MANAGEMENT
│   │   ├─ 📥 Pending Orders
│   │   │   ├─ ✅ Confirm & Deduct Stock
│   │   │   │   ├─ 📉 Deduct Stock from Products
│   │   │   │   ├─ 🔄 Update Order (stage: "Confirmed")
│   │   │   │   └─ ❌ No Wallet Credit (customer hasn't paid yet)
│   │   │   └─ ❌ Decline Order
│   │   │       └─ 🔄 Update Order (stage: "Declined")
│   │   │
│   │   ├─ 📦 Confirmed Orders
│   │   │   └─ 🚚 Mark as Shipped
│   │   │       └─ 🔄 Update Order (stage: "To Be Received")
│   │   │
│   │   ├─ 🚚 To Be Received Orders
│   │   │   └─ ✅ Mark as Delivered
│   │   │       ├─ 🔄 Update Order (stage: "Delivered")
│   │   │       └─ 💰 IF COD: Credit Wallet (minus 5% commission)
│   │   │
│   │   └─ ✅ Delivered Orders (View Only)
│   │
│   └─ 💰 WALLET MANAGEMENT
│       ├─ 💳 View Balance & Transactions
│       ├─ 💸 Request Withdrawal
│       └─ 📊 Transaction History
│
├─ 👨‍💼 ADMIN DASHBOARD (/admin/)
│   ├─ 📊 System Overview
│   │   ├─ 👥 Total Users
│   │   ├─ 🏥 Total Pharmacies
│   │   ├─ 📦 Total Orders
│   │   └─ 💰 Total Revenue
│   │
│   ├─ 👥 USER MANAGEMENT
│   │   ├─ 👤 View All Users
│   │   ├─ 🔓 Enable/Disable COD Access
│   │   └─ 🗑️ Disable Users
│   │
│   ├─ 🏥 PHARMACY MANAGEMENT
│   │   ├─ ✅ Approve Pending Pharmacies
│   │   ├─ 🔓 Enable/Disable Pharmacies
│   │   └─ 📊 View Pharmacy Statistics
│   │
│   ├─ 📋 ORDER OVERSIGHT
│   │   ├─ 👁️ View All Orders (All Pharmacies)
│   │   ├─ 🔄 Update Order Status
│   │   └─ 💰 IF COD: Credit Pharmacy Wallet on Delivery
│   │
│   └─ 💰 WITHDRAWAL MANAGEMENT
│       ├─ 📋 Review Withdrawal Requests
│       ├─ ✅ Approve Withdrawals
│       ├─ ❌ Reject Withdrawals
│       └─ 💸 Process Payments
│
├─ 👤 USER DASHBOARD (/user-dashboard/)
│   ├─ 📋 Order History
│   ├─ 📍 Manage Addresses
│   ├─ 👤 Profile Settings
│   └─ 💰 COD Status (if enabled)
│
├─ 📍 ADDRESS MANAGEMENT (/addresses/)
│   ├─ ➕ Add New Address
│   ├─ ✏️ Edit Address
│   ├─ 🗑️ Delete Address
│   └─ ⭐ Set Default Address
│
├─ 📦 PRODUCT DETAILS (/product/)
│   ├─ 🖼️ Product Images
│   ├─ 📝 Product Description
│   ├─ 💰 Price & Stock
│   ├─ 🛒 Add to Cart
│   └─ 🏥 Pharmacy Information
│
├─ 📂 CATEGORIES (/categories/)
│   ├─ 📋 Browse by Category
│   ├─ 🔍 Category Search
│   └─ 🛒 Add Products to Cart
│
└─ 📍 ORDER TRACKING (/track/)
    ├─ 🔍 Enter Order ID
    ├─ 📋 View Order Details
    ├─ 📊 Order Status Timeline
    └─ 📞 Contact Information
```

---

## 💰 Payment Flow Details

### 💳 Card/GCash/PayMaya Orders:
```
1. Customer selects payment method → Cart
2. Place order → Order created (stage: "Pending")
3. Redirect to /pay/ → Payment portal
4. Process payment → Payment success
5. 💰 Credit pharmacy wallet IMMEDIATELY (minus 5% commission)
6. Update order (stage: "Confirmed", payment_status: "Confirmed")
7. Pharmacy confirms → Stock deducted, stage: "Confirmed"
8. Pharmacy ships → stage: "To Be Received"  
9. Pharmacy delivers → stage: "Delivered" (NO additional credit)
```

### 💰 COD Orders:
```
1. Customer selects COD → Cart (if enabled)
2. Place order → Order created (stage: "Pending", cod: true)
3. NO payment portal redirect
4. Pharmacy confirms → Stock deducted, stage: "Confirmed" (NO wallet credit)
5. Pharmacy ships → stage: "To Be Received"
6. Pharmacy delivers → stage: "Delivered"
7. 💰 Credit pharmacy wallet NOW (minus 5% commission) - Customer paid cash to rider
```

---

## 🔄 Order Status Flow

```
📋 Pending
├─ ✅ Confirm & Deduct Stock → 📦 Confirmed
├─ ❌ Decline Order → ❌ Declined
└─ 🚫 Cancel Order → 🚫 Cancelled

📦 Confirmed
└─ 🚚 Mark as Shipped → 🚚 To Be Received

🚚 To Be Received  
└─ ✅ Mark as Delivered → ✅ Delivered

✅ Delivered (Final State)
❌ Declined (Final State)
🚫 Cancelled (Final State)
```

---

## 🛡️ Security Features

### 🔐 Authentication & Authorization
- **Supabase Auth** with email/password
- **Role-based access control** (user/pharmacy/admin)
- **Row Level Security (RLS)** on all tables
- **JWT tokens** for session management

### 🔒 Data Protection
- **RLS Policies** prevent cross-pharmacy data access
- **Input validation** on all forms
- **SQL injection protection** via Supabase
- **XSS protection** with proper output encoding

### 💰 Financial Security
- **Transaction logging** for audit trails
- **Commission calculation** (5% platform fee)
- **Withdrawal approval workflow**
- **Balance validation** before transactions

---

## 📊 Key Features by Role

### 👤 Customer Features:
- ✅ Product browsing & search
- ✅ Shopping cart management
- ✅ Multiple payment methods (Card/GCash/PayMaya/COD)
- ✅ Order tracking & history
- ✅ Address management
- ✅ COD eligibility (admin-controlled)

### 🏥 Pharmacy Features:
- ✅ Product inventory management
- ✅ Order processing workflow
- ✅ Real-time stock updates
- ✅ Wallet & earnings tracking
- ✅ Withdrawal requests
- ✅ Sales analytics

### 👨‍💼 Admin Features:
- ✅ User & pharmacy management
- ✅ Order oversight (all pharmacies)
- ✅ Withdrawal approval system
- ✅ COD access control
- ✅ System analytics
- ✅ Financial oversight

---

## 🎯 Business Logic Summary

1. **Multi-vendor marketplace** - Multiple pharmacies sell through one platform
2. **Commission-based revenue** - 5% fee on all transactions
3. **COD system** - Admin-controlled cash-on-delivery access
4. **Real-time updates** - Live inventory and order status changes
5. **Financial management** - Wallet system with withdrawal requests
6. **Role-based access** - Secure separation of customer/pharmacy/admin data

---

**This comprehensive flow covers every aspect of the Pharma Direct platform!** 🎉
