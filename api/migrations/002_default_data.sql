-- Insert default system labels and configuration
-- Run after initial schema: psql -U bhamail -d bhamail -f 002_default_data.sql

-- Create default SMTP relay for local development
INSERT INTO smtp_relays (domain, host, port, use_tls, is_active) VALUES
('bhamail.local', 'mailhog', 1025, false, true);

-- Create default DKIM key placeholder (will be replaced by script)
INSERT INTO dkim_keys (domain, selector, private_key, public_key, is_active) VALUES
('bhamail.local', 'default', 'PLACEHOLDER_PRIVATE_KEY', 'PLACEHOLDER_PUBLIC_KEY', false);

-- Function to create default labels for a user
CREATE OR REPLACE FUNCTION create_default_labels(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO labels (user_id, name, color, is_system, sort_order) VALUES
    (user_uuid, 'Important', '#FFD700', true, 1),
    (user_uuid, 'Work', '#1E90FF', true, 2),
    (user_uuid, 'Personal', '#32CD32', true, 3),
    (user_uuid, 'Travel', '#FF6347', true, 4),
    (user_uuid, 'Receipts', '#9370DB', true, 5),
    (user_uuid, 'Finance', '#FF4500', true, 6);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create default labels for new users
CREATE OR REPLACE FUNCTION create_default_labels_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_labels(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default labels when user is created
CREATE TRIGGER trigger_create_default_labels
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_labels_trigger();