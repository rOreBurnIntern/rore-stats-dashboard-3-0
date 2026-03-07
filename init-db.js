const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vglfprzogehixuhkshwj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbGZwcnpvZ2VoaXh1aGtzaHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTc2MSwiZXhwIjoyMDg4NDQ3NzYxfQ.6Xoe_OIxH3QwsaV_Q7laxeti9rqaZ1nIvGbYzT6eJxM';

const supabase = createClient(supabaseUrl, serviceKey);

async function initDB() {
  console.log('Creating round_history table...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS round_history (
        id SERIAL PRIMARY KEY,
        round_number INTEGER UNIQUE NOT NULL,
        block_number INTEGER,
        winner_take_all BOOLEAN,
        round_timestamp TIMESTAMPTZ,
        raw_payload JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  
  if (error) {
    console.log('Error creating table:', error.message);
    console.log('This is expected - the RPC might not exist');
  } else {
    console.log('Table created:', data);
  }
}

initDB();
