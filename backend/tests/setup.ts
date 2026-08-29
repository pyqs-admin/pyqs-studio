process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:password@localhost:5432/pyqs_content_studio_test';
process.env.SUPABASE_URL ??= 'https://studio-test.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_test_key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'sb_secret_test_key';
