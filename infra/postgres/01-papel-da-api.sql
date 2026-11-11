-- Papel usado pela API: não é dono das tabelas e não ignora RLS.
-- Migrações e seed rodam com o superusuário "escola".
CREATE ROLE escola_app LOGIN PASSWORD 'escola_app' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE escola TO escola_app;
GRANT USAGE ON SCHEMA public TO escola_app;
ALTER DEFAULT PRIVILEGES FOR ROLE escola IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO escola_app;
ALTER DEFAULT PRIVILEGES FOR ROLE escola IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO escola_app;
