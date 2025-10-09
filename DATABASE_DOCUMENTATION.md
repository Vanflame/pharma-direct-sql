# Pharma Direct Database Documentation
**IM2 Project - Database Schema Design**

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Primary Keys Explained](#primary-keys-explained)
3. [Foreign Keys & Relationships](#foreign-keys--relationships)
4. [Entity Relationship Diagram (Text)](#entity-relationship-diagram-text)
5. [Data Types Used](#data-types-used)
6. [Constraints & Validations](#constraints--validations)
7. [Database Design Patterns](#database-design-patterns)
8. [Table Details](#table-details)

---

## 🎯 Project Overview

**Pharma Direct** is a multi-vendor pharmacy e-commerce platform that connects customers with multiple pharmacies. The database is designed to handle:
- User authentication and role management
- Multi-pharmacy vendor system
- Product catalog with categories
- Order processing and tracking
- Payment and financial transactions
- Pharmacy wallet and withdrawal system

**Database Management System**: PostgreSQL (Supabase)

---

## 🔑 Primary Keys Explained

### What is a Primary Key?

A **primary key** is a unique identifier for each record in a table. It ensures that:
- Every row has a unique identity
- No two rows can have the same primary key value
- The value cannot be NULL (empty)

### Primary Key Strategy Used

All tables in this project use **UUID (Universally Unique Identifier)** as primary keys:

```sql
id uuid NOT NULL DEFAULT uuid_generate_v4()
```

**Why UUID instead of auto-incrementing integers?**

| Feature | UUID | Auto-increment (1,2,3...) |
|---------|------|---------------------------|
| **Security** | ✅ Cannot guess other IDs | ❌ Easy to guess (user/1, user/2) |
| **Uniqueness** | ✅ Globally unique across servers | ❌ Only unique per table |
| **Distributed Systems** | ✅ Can generate offline | ❌ Needs database coordination |
| **Scalability** | ✅ No central coordination needed | ❌ Can become bottleneck |

### Primary Keys in Each Table

1. **users** → `id` (UUID)
2. **pharmacies** → `id` (UUID)
3. **products** → `id` (UUID)
4. **categories** → `id` (UUID)
5. **orders** → `id` (UUID)
6. **order_items** → `id` (UUID)
7. **addresses** → `id` (UUID)
8. **transactions** → `id` (UUID)
9. **withdrawal_requests** → `id` (UUID)
10. **settings** → `id` (UUID)

---

## 🔗 Foreign Keys & Relationships

### What is a Foreign Key?

A **foreign key** is a column that creates a link between two tables. It references the primary key of another table, establishing a relationship.

**Benefits:**
- **Data Integrity**: Prevents orphaned records (e.g., order without a user)
- **Referential Integrity**: Ensures related data exists
- **Cascading Actions**: Automatic updates/deletes

---

## 🗂️ Entity Relationship Diagram (Text)

```
┌─────────────┐
│    USERS    │ (Base authentication table)
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       │ (1:1)                                │ (1:many)
       ▼                                      ▼
┌──────────────┐                      ┌──────────────┐
│  PHARMACIES  │                      │   ADDRESSES  │
└──────┬───────┘                      └──────────────┘
       │
       │ (1:many)                     ┌──────────────┐
       ├──────────────────────────────┤  CATEGORIES  │
       │                              └──────┬───────┘
       │                                     │ (1:many)
       ▼                                     ▼
┌──────────────┐                      ┌──────────────┐
│  PRODUCTS    │◄─────────────────────┤   (linked)   │
└──────┬───────┘                      └──────────────┘
       │
       │ (1:many)
       ▼
┌──────────────┐       ┌──────────────┐
│ ORDER_ITEMS  │──────►│    ORDERS    │
└──────────────┘       └──────┬───────┘
       ▲                      │
       │                      │ (1:1 optional)
       │                      ▼
       │               ┌──────────────┐
       └───────────────┤ TRANSACTIONS │
                       └──────┬───────┘
                              │
                              ▼
                       ┌────────────────────┐
                       │ WITHDRAWAL_REQUESTS│
                       └────────────────────┘
```

---

## 🔗 Detailed Relationship Breakdown

### 1. Users → Pharmacies (One-to-One)

```sql
-- In pharmacies table:
user_id uuid NOT NULL UNIQUE,
CONSTRAINT pharmacies_user_id_fkey FOREIGN KEY (user_id) 
  REFERENCES public.users(id)
```

**Relationship**: Each pharmacy account is linked to exactly one user account.

**Why?** 
- Pharmacy owners need a user account to login
- `UNIQUE` constraint ensures one pharmacy per user
- Separates authentication (users) from business data (pharmacies)

---

### 2. Users → Addresses (One-to-Many)

```sql
-- In addresses table:
user_id uuid NOT NULL,
CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) 
  REFERENCES public.users(id)
```

**Relationship**: One user can have multiple delivery addresses.

**Example:**
- User "John Doe" has:
  - Home address
  - Office address
  - Parents' house address

---

### 3. Users → Orders (One-to-Many)

```sql
-- In orders table:
user_id uuid NOT NULL,
CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) 
  REFERENCES public.users(id)
```

**Relationship**: One user can place multiple orders.

**Purpose**: Track all purchases made by each customer.

---

### 4. Pharmacies → Products (One-to-Many)

```sql
-- In products table:
pharmacy_id uuid NOT NULL,
CONSTRAINT products_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) 
  REFERENCES public.pharmacies(id)
```

**Relationship**: Each pharmacy can sell many products.

**Example:**
- Mercury Drug sells: Biogesic, Neozep, Vitamin C
- Watsons sells: Ibuprofen, Face masks, Thermometer

---

### 5. Categories → Products (One-to-Many)

```sql
-- In products table:
category_id uuid NOT NULL,
CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) 
  REFERENCES public.categories(id)
```

**Relationship**: Each product belongs to one category.

**Example Categories:**
- Pain Relief → Biogesic, Ibuprofen
- Antibiotics → Amoxicillin, Azithromycin
- Vitamins → Vitamin C, Multivitamins

---

### 6. Orders → Order Items (One-to-Many)

```sql
-- In order_items table:
order_id uuid NOT NULL,
CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
  REFERENCES public.orders(id)
```

**Relationship**: One order contains multiple items.

**Example Order:**
```
Order #12345
├─ Item 1: Biogesic 500mg × 2 boxes
├─ Item 2: Neozep Forte × 1 box
└─ Item 3: Vitamin C 1000mg × 3 bottles
```

---

### 7. Products → Order Items (One-to-Many, Optional)

```sql
-- In order_items table:
product_id uuid,  -- Can be NULL
CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) 
  REFERENCES public.products(id)
```

**Relationship**: Order items reference products, but product can be deleted.

**Why nullable?**
- Products might be deleted from catalog after order is placed
- Order history must be preserved even if product no longer exists
- Product name and price are stored directly in order_items

---

### 8. Pharmacies → Transactions (One-to-Many)

```sql
-- In transactions table:
pharmacy_id uuid NOT NULL,
CONSTRAINT transactions_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) 
  REFERENCES public.pharmacies(id)
```

**Relationship**: Each pharmacy has many transactions (credits, withdrawals, refunds).

**Purpose**: Complete financial audit trail for each pharmacy's wallet.

---

### 9. Pharmacies → Withdrawal Requests (One-to-Many)

```sql
-- In withdrawal_requests table:
pharmacy_id uuid NOT NULL,
CONSTRAINT withdrawal_requests_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) 
  REFERENCES public.pharmacies(id)
```

**Relationship**: Pharmacies can make multiple withdrawal requests.

**Workflow:**
1. Pharmacy requests withdrawal from wallet balance
2. Admin reviews request
3. Payment is processed

---

### 10. Users → Withdrawal Requests (One-to-Many, Optional)

```sql
-- In withdrawal_requests table:
reviewed_by uuid,
CONSTRAINT withdrawal_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) 
  REFERENCES public.users(id)
```

**Relationship**: Admin users review withdrawal requests.

**Purpose**: Audit trail of who approved/rejected withdrawals.

---

## 📊 Data Types Used

### UUID (Universally Unique Identifier)
```sql
id uuid NOT NULL DEFAULT uuid_generate_v4()
```
- **Purpose**: Primary keys and foreign keys
- **Format**: `550e8400-e29b-41d4-a716-446655440000`
- **Generation**: Automatic via database function

### CHARACTER VARYING (VARCHAR)
```sql
name character varying NOT NULL
email character varying NOT NULL UNIQUE
```
- **Purpose**: Text with variable length (names, emails, short text)
- **Advantage**: Saves storage space compared to fixed-length CHAR

### TEXT
```sql
description text
address text NOT NULL
```
- **Purpose**: Long text content (descriptions, addresses, notes)
- **No length limit**: Can store very long content

### NUMERIC
```sql
price numeric NOT NULL CHECK (price > 0::numeric)
wallet_balance numeric DEFAULT 0.00
```
- **Purpose**: Monetary values and precise decimals
- **Why not FLOAT?** Avoids rounding errors in financial calculations
- **Example**: 99.99 stays exactly 99.99 (not 99.98999...)

### INTEGER
```sql
stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0)
quantity integer NOT NULL CHECK (quantity > 0)
```
- **Purpose**: Whole numbers (counts, quantities)
- **Range**: -2,147,483,648 to 2,147,483,647

### BOOLEAN
```sql
approved boolean DEFAULT false
disabled boolean DEFAULT false
cod boolean DEFAULT false
```
- **Purpose**: True/false flags
- **Values**: `TRUE`, `FALSE`, `NULL`

### TIMESTAMP WITH TIME ZONE
```sql
created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
updated_at timestamp with time zone DEFAULT now()
```
- **Purpose**: Date and time with timezone awareness
- **Advantage**: Handles different timezones automatically
- **Format**: `2024-10-09 14:30:00+08:00`

### JSONB
```sql
account_details jsonb NOT NULL
products jsonb
```
- **Purpose**: Flexible structured data (key-value pairs, arrays, nested objects)
- **Example**: `{"bank_name": "BPI", "account_number": "123456"}`
- **Why 'B'?** Binary format = faster queries than regular JSON

### USER-DEFINED TYPES (ENUMS)
```sql
payment_method USER-DEFINED NOT NULL
payment_status USER-DEFINED DEFAULT 'Pending'::payment_status
stage USER-DEFINED DEFAULT 'Pending'::order_stage
```
- **Purpose**: Predefined set of allowed values
- **Examples**:
  - `payment_status`: Pending, Paid, Failed
  - `order_stage`: Pending, Processing, Shipped, Delivered, Cancelled

---

## ✅ Constraints & Validations

### 1. NOT NULL Constraint
```sql
name character varying NOT NULL
```
**Ensures**: Field must have a value (cannot be empty).

### 2. UNIQUE Constraint
```sql
email character varying NOT NULL UNIQUE
user_id uuid NOT NULL UNIQUE
```
**Ensures**: No duplicate values allowed in this column.

### 3. CHECK Constraint
```sql
price numeric NOT NULL CHECK (price > 0::numeric)
stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0)
discount numeric DEFAULT 0 CHECK (discount >= 0 AND discount <= 100)
```
**Ensures**: Values meet specific conditions:
- Prices must be positive
- Stock cannot be negative
- Discount must be between 0% and 100%

### 4. DEFAULT Values
```sql
created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
approved boolean DEFAULT false
wallet_balance numeric DEFAULT 0.00
```
**Purpose**: Automatic value if none provided during insert.

### 5. Foreign Key Constraints
```sql
CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) 
  REFERENCES public.users(id)
```
**Ensures**: Referenced record exists in parent table.

---

## 🎨 Database Design Patterns Used

### 1. **Soft Delete Pattern**
Instead of permanently deleting records, use a flag:
```sql
disabled boolean DEFAULT false
```

**Tables using this**: `users`, `pharmacies`, `products`

**Benefits:**
- Preserve historical data
- Can restore accidentally deleted items
- Maintain referential integrity
- Audit trail remains intact

---

### 2. **Audit Trail Pattern**
Track when records are created and modified:
```sql
created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
```

**All tables include these timestamps.**

**Benefits:**
- Know when data was added
- Track last modification time
- Debug data issues
- Compliance and reporting

---

### 3. **Denormalization for Performance**
Store duplicate data to avoid joins:
```sql
-- In order_items:
product_name character varying NOT NULL,  -- Copied from products
price numeric NOT NULL,                    -- Copied from products
```

**Why?**
- Products may change price after order is placed
- Products may be deleted from catalog
- Order history must show exact purchase details
- Faster queries (no need to join products table)

---

### 4. **Wallet/Balance Pattern**
Track pharmacy earnings:
```sql
wallet_balance numeric DEFAULT 0.00,    -- Available for withdrawal
pending_balance numeric DEFAULT 0.00    -- From undelivered orders
```

**Flow:**
1. Order placed → Amount goes to `pending_balance`
2. Order delivered → Amount moves to `wallet_balance`
3. Withdrawal approved → Subtract from `wallet_balance`

---

### 5. **Transaction Ledger Pattern**
Complete financial history:
```sql
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY,
  pharmacy_id uuid NOT NULL,
  amount numeric NOT NULL,
  commission numeric DEFAULT 0,
  type character varying NOT NULL,
  status character varying DEFAULT 'completed',
  ...
)
```

**Every financial event is recorded:**
- COD payments
- Card payments
- Withdrawals
- Refunds

**Benefits:**
- Audit compliance
- Dispute resolution
- Financial reporting
- Balance reconciliation

---

### 6. **Flexible Schema with JSONB**
Store varying data structures:
```sql
account_details jsonb NOT NULL
```

**Different payment methods need different info:**
```json
// Bank Transfer
{"bank_name": "BPI", "account_number": "123456", "account_name": "John Doe"}

// GCash
{"mobile_number": "09171234567", "account_name": "John Doe"}

// PayMaya
{"mobile_number": "09181234567", "email": "john@example.com"}
```

---

## 📚 Table Details

### Users Table
**Purpose**: Central authentication and user management

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `uid` | varchar | Auth provider identifier (unique) |
| `name` | varchar | User's full name |
| `email` | varchar | Email address (unique) |
| `phone` | varchar | Contact number |
| `role` | varchar | user / pharmacy / admin |
| `disabled` | boolean | Account status |
| `successful_orders` | integer | Completed order count |
| `total_spent` | numeric | Lifetime spending |
| `cod_unlocked` | boolean | Cash on Delivery eligibility |

**Relationships:**
- → Pharmacies (1:1)
- → Orders (1:many)
- → Addresses (1:many)

---

### Pharmacies Table
**Purpose**: Pharmacy vendor accounts and financial management

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → users (unique) |
| `name` | varchar | Business name |
| `email` | varchar | Business email |
| `phone` | varchar | Business phone |
| `approved` | boolean | Admin approval status |
| `disabled` | boolean | Account status |
| `total_orders` | integer | Order count |
| `wallet_balance` | numeric | Available funds |
| `pending_balance` | numeric | Funds from pending orders |

**Relationships:**
- ← Users (1:1)
- → Products (1:many)
- → Transactions (1:many)
- → Withdrawal Requests (1:many)

---

### Products Table
**Purpose**: Product catalog

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | varchar | Product name |
| `price` | numeric | Base price (must be > 0) |
| `stock` | integer | Available quantity |
| `category_id` | uuid | Foreign key → categories |
| `pharmacy_id` | uuid | Foreign key → pharmacies |
| `image_url` | text | Product image link |
| `description` | text | Product details |
| `featured` | boolean | Show on homepage |
| `prescription` | boolean | Requires prescription |
| `discount` | numeric | Discount % (0-100) |
| `disabled` | boolean | Product status |

**Relationships:**
- ← Pharmacies (many:1)
- ← Categories (many:1)
- → Order Items (1:many, optional)

---

### Categories Table
**Purpose**: Product categorization

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | varchar | Category name (unique) |
| `description` | text | Category details |

**Relationships:**
- → Products (1:many)

---

### Orders Table
**Purpose**: Customer orders

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → users |
| `total` | numeric | Items subtotal |
| `delivery_fee` | numeric | Shipping cost |
| `grand_total` | numeric | Final amount |
| `payment_method` | enum | Payment type |
| `payment_status` | enum | Payment state |
| `payment_info` | text | Transaction reference |
| `cod` | boolean | Cash on delivery |
| `stage` | enum | Order status |
| `delivery_address` | text | Shipping address |
| `customer_name` | varchar | Recipient name |
| `customer_phone` | varchar | Contact number |
| `customer_email` | varchar | Contact email |

**Relationships:**
- ← Users (many:1)
- → Order Items (1:many)
- → Transactions (1:1, optional)

---

### Order Items Table
**Purpose**: Individual items in orders

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `order_id` | uuid | Foreign key → orders |
| `product_id` | uuid | Foreign key → products (nullable) |
| `product_name` | varchar | Snapshot of product name |
| `price` | numeric | Snapshot of price |
| `quantity` | integer | Items ordered |
| `subtotal` | numeric | price × quantity |

**Relationships:**
- ← Orders (many:1)
- ← Products (many:1, optional)

---

### Addresses Table
**Purpose**: User delivery addresses

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → users |
| `name` | varchar | Address label (e.g., "Home") |
| `address` | text | Full address |
| `is_default` | boolean | Default selection |

**Relationships:**
- ← Users (many:1)

---

### Transactions Table
**Purpose**: Financial transaction ledger

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `order_id` | uuid | Related order (optional) |
| `pharmacy_id` | uuid | Foreign key → pharmacies |
| `amount` | numeric | Transaction amount |
| `commission` | numeric | Platform fee |
| `type` | varchar | Transaction type |
| `status` | varchar | Transaction status |
| `description` | text | Transaction notes |
| `payment_method` | text | Payment type |
| `account_details` | jsonb | Payment info |

**Transaction Types:**
- `cod_payment_credit`: COD payment to pharmacy
- `card_payment_credit`: Online payment to pharmacy
- `withdrawal_request`: Withdrawal initiated
- `withdrawal_approved`: Withdrawal completed
- `withdrawal_rejected`: Withdrawal cancelled
- `refund`: Money returned

**Relationships:**
- ← Pharmacies (many:1)

---

### Withdrawal Requests Table
**Purpose**: Pharmacy payout requests

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `pharmacy_id` | uuid | Foreign key → pharmacies |
| `amount` | numeric | Withdrawal amount |
| `payment_method` | text | bank_transfer / gcash / paymaya / other |
| `account_details` | jsonb | Payment account info |
| `status` | text | pending / approved / rejected / completed |
| `requested_at` | timestamp | Request time |
| `reviewed_at` | timestamp | Review time |
| `reviewed_by` | uuid | Foreign key → users (admin) |
| `notes` | text | Admin notes |

**Relationships:**
- ← Pharmacies (many:1)
- ← Users (many:1, reviewer)

---

### Settings Table
**Purpose**: System configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `key` | varchar | Setting name (unique) |
| `value` | text | Setting value |
| `description` | text | Setting explanation |

**Example Settings:**
- `delivery_fee`: 50
- `commission_rate`: 10
- `cod_minimum_orders`: 3

---

## 🎓 Key Takeaways for IM2 Project

### 1. **Primary Keys = Unique Identity**
- Every table needs one
- UUIDs provide security and scalability

### 2. **Foreign Keys = Relationships**
- Connect related data across tables
- Maintain data integrity
- Enable complex queries

### 3. **Constraints = Data Quality**
- Prevent invalid data from entering system
- Enforce business rules at database level
- Reduce application-level validation

### 4. **Normalization vs Denormalization**
- **Normalization**: Avoid data duplication (categories, users)
- **Denormalization**: Strategic duplication for performance (order items)

### 5. **Design Patterns**
- Soft deletes preserve history
- Timestamps enable auditing
- JSONB provides flexibility
- Transaction ledgers track financial operations

---

## 📖 Glossary

**Primary Key**: Unique identifier for each row in a table.

**Foreign Key**: Column that references the primary key of another table.

**UUID**: 128-bit unique identifier, represented as 32 hexadecimal characters.

**JSONB**: PostgreSQL's binary JSON storage format.

**Constraint**: Database rule that limits what data can be entered.

**Referential Integrity**: Ensures relationships between tables remain valid.

**Soft Delete**: Marking records as deleted without removing them.

**Denormalization**: Strategically duplicating data to improve performance.

**Cascade**: Automatic action when parent record is modified/deleted.

---

**Project**: Pharma Direct - Multi-Vendor Pharmacy E-Commerce Platform  
**Course**: IM2 (Information Management 2)  
**Database**: PostgreSQL via Supabase  
**Date**: October 2025

---

*This documentation demonstrates understanding of relational database design, normalization principles, data integrity, and real-world application of database management concepts.*

