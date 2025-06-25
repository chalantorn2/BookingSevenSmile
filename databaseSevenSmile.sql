create table public.information (
  id bigint generated always as identity not null,
  category character varying not null,
  value character varying not null,
  description text null,
  active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone character varying(50) null,
  constraint information_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_information_value_per_category on public.information using btree (category, value) TABLESPACE pg_default;

create table public.information (
  id bigint generated always as identity not null,
  category character varying not null,
  value character varying not null,
  description text null,
  active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone character varying(50) null,
  constraint information_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_information_value_per_category on public.information using btree (category, value) TABLESPACE pg_default;

create table public.information (
  id bigint generated always as identity not null,
  category character varying not null,
  value character varying not null,
  description text null,
  active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone character varying(50) null,
  constraint information_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_information_value_per_category on public.information using btree (category, value) TABLESPACE pg_default;

create table public.orders (
  id bigserial not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  agent_name character varying(255) null,
  start_date date null,
  end_date date null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  reference_id character varying null,
  pax character varying null,
  note text null,
  completed boolean null default false,
  pax_adt integer null default 0,
  pax_chd integer null default 0,
  pax_inf integer null default 0,
  agent_id integer null,
  constraint orders_pkey primary key (id),
  constraint fk_orders_agent foreign KEY (agent_id) references information (id)
) TABLESPACE pg_default;

create trigger trigger_update_orders BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();

create table public.orders (
  id bigserial not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  agent_name character varying(255) null,
  start_date date null,
  end_date date null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  reference_id character varying null,
  pax character varying null,
  note text null,
  completed boolean null default false,
  pax_adt integer null default 0,
  pax_chd integer null default 0,
  pax_inf integer null default 0,
  agent_id integer null,
  constraint orders_pkey primary key (id),
  constraint fk_orders_agent foreign KEY (agent_id) references information (id)
) TABLESPACE pg_default;

create trigger trigger_update_orders BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();

create table public.sequences (
  id uuid not null default extensions.uuid_generate_v4 (),
  key character varying not null,
  value integer not null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sequences_pkey primary key (id),
  constraint sequences_key_key unique (key)
) TABLESPACE pg_default;

create table public.tour_bookings (
  id bigserial not null,
  order_id bigint not null,
  tour_date date not null,
  tour_detail text null,
  pax character varying null,
  status character varying(50) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  tour_hotel text null,
  tour_room_no character varying null,
  tour_pickup_time character varying null,
  send_to character varying null,
  tour_type character varying null,
  tour_contact_no character varying null,
  note text null,
  reference_id character varying(50) null,
  cost_price numeric null,
  selling_price numeric null,
  payment_status character varying null default 'not_paid'::character varying,
  payment_date timestamp without time zone null,
  payment_note text null,
  voucher_created boolean null default false,
  pax_adt integer null default 0,
  pax_chd integer null default 0,
  pax_inf integer null default 0,
  constraint tour_bookings_pkey primary key (id),
  constraint tour_bookings_order_id_fkey foreign KEY (order_id) references orders (id) on update CASCADE on delete CASCADE,
  constraint tour_bookings_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'booked'::character varying,
            'completed'::character varying,
            'in_progress'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trigger_update_tour_bookings BEFORE
update on tour_bookings for EACH row
execute FUNCTION update_updated_at_column ();

create table public.transfer_bookings (
  id bigserial not null,
  order_id bigint not null,
  transfer_date date not null,
  transfer_time character varying(50) null,
  pickup_location text null,
  drop_location text null,
  pax character varying null,
  transfer_detail text null,
  status character varying(50) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  transfer_flight character varying null,
  send_to character varying null,
  car_model character varying null,
  phone_number character varying null,
  transfer_type character varying null,
  transfer_ftime character varying null,
  note text null,
  reference_id character varying(50) null,
  cost_price numeric null,
  selling_price numeric null,
  payment_status character varying null default 'not_paid'::character varying,
  payment_date timestamp without time zone null,
  payment_note text null,
  voucher_created boolean null default false,
  pax_adt integer null default 0,
  pax_chd integer null default 0,
  pax_inf integer null default 0,
  driver_name character varying(255) null,
  license_plate character varying(255) null,
  constraint transfer_bookings_pkey primary key (id),
  constraint transfer_bookings_order_id_fkey foreign KEY (order_id) references orders (id) on update CASCADE on delete CASCADE,
  constraint transfer_bookings_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'booked'::character varying,
            'completed'::character varying,
            'in_progress'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trigger_update_transfer_bookings BEFORE
update on transfer_bookings for EACH row
execute FUNCTION update_updated_at_column ();

create table public.users (
  id bigserial not null,
  username character varying(50) not null,
  password_hash text not null,
  fullname character varying(100) null,
  role character varying(20) not null default 'user'::character varying,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;