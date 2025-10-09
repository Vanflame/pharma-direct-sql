# 🏥 Pharma Direct - Visual Flow Chart

## 🎯 Complete System Flow (ASCII Art)

```
                    🏠 PHARMA DIRECT PLATFORM
                           (Multi-Vendor E-Pharmacy)
                                    
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🏠 LANDING PAGE                                   │
│                              (index.html)                                   │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🔍 PRODUCT BROWSING                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Featured  │  │ Categories  │  │   Search    │  │  Product    │        │
│  │  Products   │  │   Browse    │  │   Filter    │  │  Details    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🛒 ADD TO CART                                    │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🔐 AUTHENTICATION CHECK                             │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Not Logged    │    │   Logged In     │    │   Role-Based    │        │
│  │      In         │    │                 │    │    Redirect     │        │
│  │                 │    │                 │    │                 │        │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │        │
│  │  │  Login/   │  │    │  │  Check    │  │    │  │ Customer  │  │        │
│  │  │ Register  │  │    │  │   Role    │  │    │  │ → Home    │  │        │
│  │  └───────────┘  │    │  └───────────┘  │    │  │           │  │        │
│  └─────────────────┘    └─────────────────┘    │  │ Pharmacy  │  │        │
│                                                │  │ → /pharmacy│  │        │
│                                                │  │           │  │        │
│                                                │  │ Admin     │  │        │
│                                                │  │ → /admin  │  │        │
│                                                │  └───────────┘  │        │
│                                                └─────────────────┘        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🛒 CART & CHECKOUT                                  │
│                              (/cart/)                                      │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Review Cart │  │ Select Addr │  │ Payment     │  │ Place Order │        │
│  │   Items     │  │    -ess     │  │ Method      │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  Payment Methods:                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │   💳    │  │   📱    │  │   💜    │  │   💰    │                        │
│  │  Card   │  │ GCash   │  │PayMaya  │  │  COD    │                        │
│  │         │  │         │  │         │  │(if enabled)│                    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        💳 PAYMENT FLOW                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Card/GCash/PayMaya Orders                        │   │
│  │                                                                     │   │
│  │  Order Created → Redirect to /pay/ → Process Payment → Success     │   │
│  │       ↓                ↓                ↓              ↓           │   │
│  │  (stage: Pending)  Payment Portal   Credit Wallet   Order Confirmed│   │
│  │                    (QR Code)        (minus 5%)     (stage: Confirmed)│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        COD Orders                                   │   │
│  │                                                                     │   │
│  │  Order Created → NO Payment Portal → Customer pays on delivery      │   │
│  │       ↓                ↓                    ↓                      │   │
│  │  (stage: Pending)   Direct Order      Credit Wallet on Delivery    │   │
│  │  (cod: true)        Placement         (minus 5%)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🏥 PHARMACY DASHBOARD                               │
│                              (/pharmacy/)                                 │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Dashboard   │  │  Products   │  │   Orders    │  │   Wallet   │        │
│  │ Overview    │  │Management  │  │Management   │  │Management  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  Order Processing Flow:                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   📋        │    │   📦        │    │   🚚        │    │   ✅        │  │
│  │  Pending    │───▶│ Confirmed   │───▶│To Be Received│───▶│ Delivered   │  │
│  │             │    │             │    │             │    │             │  │
│  │Confirm &    │    │Mark as      │    │Mark as      │    │COD: Credit  │  │
│  │Deduct Stock │    │Shipped      │    │Delivered    │    │Wallet       │  │
│  │             │    │             │    │             │    │             │  │
│  │Decline      │    │             │    │             │    │             │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        👨‍💼 ADMIN DASHBOARD                                │
│                              (/admin/)                                     │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   System    │  │    User     │  │  Pharmacy   │  │  Order      │        │
│  │  Overview   │  │Management   │  │Management   │  │ Oversight  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐                                        │
│  │Withdrawal   │  │COD Access   │                                        │
│  │Management   │  │Control      │                                        │
│  └─────────────┘  └─────────────┘                                        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        👤 USER DASHBOARD                                   │
│                            (/user-dashboard/)                              │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Order    │  │  Addresses  │  │   Profile   │  │COD Status   │        │
│  │  History   │  │Management  │  │  Settings   │  │(if enabled)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        📍 ORDER TRACKING                                  │
│                              (/track/)                                     │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Enter Order │  │ View Order  │  │Order Status │  │  Contact    │        │
│  │     ID      │  │   Details   │  │ Timeline    │  │Information  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        🔄 ORDER STATUS FLOW                               │
│                                                                             │
│  📋 Pending ──┬── ✅ Confirm & Deduct Stock ──▶ 📦 Confirmed              │
│               │                                                             │
│               ├── ❌ Decline Order ──────────▶ ❌ Declined                 │
│               │                                                             │
│               └── 🚫 Cancel Order ───────────▶ 🚫 Cancelled                │
│                                                                             │
│  📦 Confirmed ──▶ 🚚 Mark as Shipped ──▶ 🚚 To Be Received                │
│                                                                             │
│  🚚 To Be Received ──▶ ✅ Mark as Delivered ──▶ ✅ Delivered               │
│                                                                             │
│  💰 COD Credit: Only happens at "Mark as Delivered" step                  │
│  💳 Card/GCash/PayMaya: Credited immediately at payment portal             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        💰 FINANCIAL FLOW                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Commission System (5% Platform Fee)             │   │
│  │                                                                     │   │
│  │  Order Total: ₱1,000                                               │   │
│  │  Commission: ₱50 (5%)                                              │   │
│  │  Pharmacy Gets: ₱950                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Wallet System                                    │   │
│  │                                                                     │   │
│  │  wallet_balance: Available funds                                   │   │
│  │  pending_balance: Funds in withdrawal requests                     │   │
│  │                                                                     │   │
│  │  Withdrawal Flow:                                                   │   │
│  │  Request → Admin Review → Approve/Reject → Process Payment         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        🛡️ SECURITY FEATURES                               │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Supabase  │  │   Row Level │  │   Role-Based│  │   JWT       │        │
│  │    Auth     │  │  Security   │  │    Access   │  │   Tokens   │        │
│  │             │  │   (RLS)     │  │   Control   │  │            │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Input     │  │   SQL       │  │    XSS      │  │Transaction │        │
│  │ Validation  │  │Injection    │  │Protection  │  │  Logging   │        │
│  │             │  │Protection  │  │            │  │            │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Business Logic Points

1. **Multi-vendor marketplace** - Multiple pharmacies sell through one platform
2. **Commission-based revenue** - 5% fee on all transactions  
3. **COD system** - Admin-controlled cash-on-delivery access
4. **Real-time updates** - Live inventory and order status changes
5. **Financial management** - Wallet system with withdrawal requests
6. **Role-based access** - Secure separation of customer/pharmacy/admin data
7. **Payment timing** - Card/GCash/PayMaya credited immediately, COD credited on delivery
8. **Stock management** - Real-time stock deduction on order confirmation
9. **Order lifecycle** - Pending → Confirmed → To Be Received → Delivered
10. **Security** - RLS policies prevent cross-pharmacy data access

---

**This visual flowchart shows every detail of the Pharma Direct platform!** 🎉
