CREATE TABLE contacts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contact_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  email VARCHAR(255),
  is_sponsor BOOLEAN NOT NULL DEFAULT FALSE,
  is_volunteer BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE businesses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  attendance_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  notes TEXT
);

CREATE TABLE vendors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  vendor_type VARCHAR(255) NOT NULL,
  description TEXT,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  date_form_received TIMESTAMPTZ,
  booth_width NUMERIC(10, 2),
  booth_length NUMERIC(10, 2),
  payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (payment_amount >= 0),
  payment_detail VARCHAR(255),
  notes TEXT,
  CHECK (booth_width IS NULL OR booth_width >= 0),
  CHECK (booth_length IS NULL OR booth_length >= 0)
);

CREATE TABLE floats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  float_type VARCHAR(255) NOT NULL,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  float_form_received TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX businesses_contact_id_idx ON businesses(contact_id);
CREATE INDEX vendors_contact_id_idx ON vendors(contact_id);
CREATE INDEX vendors_business_id_idx ON vendors(business_id);
CREATE INDEX floats_contact_id_idx ON floats(contact_id);
CREATE INDEX floats_business_id_idx ON floats(business_id);
