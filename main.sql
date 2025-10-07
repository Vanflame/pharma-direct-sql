-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  address text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid,
  product_name character varying NOT NULL,
  price numeric NOT NULL CHECK (price > 0::numeric),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL CHECK (subtotal > 0::numeric),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  total numeric NOT NULL CHECK (total > 0::numeric),
  delivery_fee numeric DEFAULT 0.00,
  grand_total numeric NOT NULL CHECK (grand_total > 0::numeric),
  payment_method USER-DEFINED NOT NULL,
  payment_status USER-DEFINED DEFAULT 'Pending'::payment_status,
  payment_info text,
  cod boolean DEFAULT false,
  stage USER-DEFINED DEFAULT 'Pending'::order_stage,
  delivery_address text NOT NULL,
  customer_name character varying NOT NULL,
  customer_phone character varying,
  customer_email character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pharmacies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name character varying NOT NULL,
  email character varying,
  phone character varying,
  approved boolean DEFAULT false,
  disabled boolean DEFAULT false,
  total_orders integer DEFAULT 0,
  wallet_balance numeric DEFAULT 0.00,
  pending_balance numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  walletbalance numeric DEFAULT 0,
  totalorders integer DEFAULT 0,
  products jsonb,
  updatedat timestamp with time zone,
  pendingbalance numeric DEFAULT 0,
  CONSTRAINT pharmacies_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  price numeric NOT NULL CHECK (price > 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id uuid NOT NULL,
  image_url text,
  description text,
  featured boolean DEFAULT false,
  prescription boolean DEFAULT false,
  pharmacy_id uuid NOT NULL,
  disabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key character varying NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  uid character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['user'::character varying, 'pharmacy'::character varying, 'admin'::character varying]::text[])),
  disabled boolean DEFAULT false,
  successful_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  cod_unlocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);