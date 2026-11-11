-- Row Level Security: cada conexão só enxerga a escola do usuário autenticado.
-- A API abre cada transação com:
--   select set_config('app.user_id', '<uuid do usuário>', true);
--   select set_config('app.school_id', '<uuid da escola escolhida>', true);
-- Sem essas variáveis, nenhuma linha aparece (falha fechada).
-- O papel escola_app (usado pela API) não é dono das tabelas nem tem BYPASSRLS.
-- Idempotente: pode rodar de novo depois de cada migração.

CREATE OR REPLACE FUNCTION app_school() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.school_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app_user() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

ALTER TABLE "class" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "class";
CREATE POLICY escola_isolada ON "class" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "enrollment";
CREATE POLICY escola_isolada ON "enrollment" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subject" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "subject";
CREATE POLICY escola_isolada ON "subject" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "class_subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_subject" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "class_subject";
CREATE POLICY escola_isolada ON "class_subject" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skill" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "skill";
CREATE POLICY escola_isolada ON "skill" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "assessment";
CREATE POLICY escola_isolada ON "assessment" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "question";
CREATE POLICY escola_isolada ON "question" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "answer" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "answer";
CREATE POLICY escola_isolada ON "answer" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "mastery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mastery" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "mastery";
CREATE POLICY escola_isolada ON "mastery" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alert" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "alert";
CREATE POLICY escola_isolada ON "alert" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "tutoring_request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutoring_request" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "tutoring_request";
CREATE POLICY escola_isolada ON "tutoring_request" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "tutoring_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutoring_session" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "tutoring_session";
CREATE POLICY escola_isolada ON "tutoring_session" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "guardian_link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guardian_link" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "guardian_link";
CREATE POLICY escola_isolada ON "guardian_link" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "material";
CREATE POLICY escola_isolada ON "material" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "chunk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chunk" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "chunk";
CREATE POLICY escola_isolada ON "chunk" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "incentive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incentive" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "incentive";
CREATE POLICY escola_isolada ON "incentive" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "access_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "access_log" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "access_log";
CREATE POLICY escola_isolada ON "access_log" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "tutor_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutor_profile" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "tutor_profile";
CREATE POLICY escola_isolada ON "tutor_profile" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "attendance";
CREATE POLICY escola_isolada ON "attendance" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

ALTER TABLE "message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "message";
CREATE POLICY escola_isolada ON "message" USING (school_id = app_school()) WITH CHECK (school_id = app_school());

-- Vínculos: a pessoa vê os próprios (para escolher a escola) e os da escola ativa.
ALTER TABLE "membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_isolada ON "membership";
CREATE POLICY escola_isolada ON "membership" USING (school_id = app_school() OR user_id = app_user()) WITH CHECK (school_id = app_school());

-- Escola: só as escolas em que a pessoa tem vínculo.
ALTER TABLE "school" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escola_propria ON "school";
CREATE POLICY escola_propria ON "school" USING (id = app_school() OR id IN (SELECT school_id FROM "membership" WHERE user_id = app_user()));

-- Identidade global: a API lê e cria usuários (login e importação); sem dado escolar nesta tabela.
GRANT USAGE ON SCHEMA public TO escola_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO escola_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO escola_app;
