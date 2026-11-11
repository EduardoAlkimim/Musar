-- Row Level Security: cada conexão só enxerga a escola do usuário autenticado.
-- A API abre a transação com: SET LOCAL app.school_id = '<uuid da escola do token>';
-- Sem essa variável, nenhuma linha aparece (falha fechada).
-- Aplicar depois de `prisma migrate deploy`. O papel da API não pode ser dono das tabelas nem ter BYPASSRLS.

ALTER TABLE "membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "membership"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "class" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "class"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollment" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "enrollment"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subject" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "subject"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "class_subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_subject" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "class_subject"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skill" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "skill"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "assessment"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "question"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "answer" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "answer"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "mastery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mastery" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "mastery"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alert" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "alert"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "tutoring_request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutoring_request" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "tutoring_request"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "tutoring_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutoring_session" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "tutoring_session"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "guardian_link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guardian_link" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "guardian_link"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "material"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "chunk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chunk" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "chunk"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "incentive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incentive" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "incentive"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

ALTER TABLE "access_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "access_log" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_isolada ON "access_log"
  USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);

-- A tabela "school" só mostra a própria escola.
ALTER TABLE "school" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school" FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_propria ON "school"
  USING (id = nullif(current_setting('app.school_id', true), '')::uuid);
