ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE floats ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
REVOKE ALL ON TABLE contacts, businesses, vendors, floats FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contacts, businesses, vendors, floats TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contacts_id_seq, businesses_id_seq, vendors_id_seq, floats_id_seq TO authenticated;

CREATE POLICY contacts_authenticated_access ON contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY businesses_authenticated_access ON businesses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY vendors_authenticated_access ON vendors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY floats_authenticated_access ON floats
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE VIEW business_resource_rows WITH (security_invoker = true) AS
  SELECT b.*, c.contact_name
  FROM businesses b
  JOIN contacts c ON c.id = b.contact_id;

CREATE VIEW vendor_resource_rows WITH (security_invoker = true) AS
  SELECT v.*, c.contact_name, b.business_name
  FROM vendors v
  JOIN contacts c ON c.id = v.contact_id
  JOIN businesses b ON b.id = v.business_id;

CREATE VIEW float_resource_rows WITH (security_invoker = true) AS
  SELECT f.*, c.contact_name, b.business_name
  FROM floats f
  JOIN contacts c ON c.id = f.contact_id
  JOIN businesses b ON b.id = f.business_id;

REVOKE ALL ON TABLE business_resource_rows, vendor_resource_rows, float_resource_rows FROM anon;
GRANT SELECT ON TABLE business_resource_rows, vendor_resource_rows, float_resource_rows TO authenticated;
