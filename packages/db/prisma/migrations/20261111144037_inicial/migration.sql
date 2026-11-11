-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ALUNO', 'PROFESSOR', 'PROFESSOR_REFORCO', 'COORDENADOR', 'RESPONSAVEL', 'ADMIN');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "TipoAvaliacao" AS ENUM ('PROVA', 'SIMULADO', 'TAREFA', 'MINI_AVALIACAO');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('ABERTO', 'ENCAMINHADO', 'RESOLVIDO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "StatusReforco" AS ENUM ('AGUARDANDO_RESPONSAVEL', 'APROVADO', 'RECUSADO', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "school" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "plano" TEXT NOT NULL DEFAULT 'piloto',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "keycloak_id" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "data_nascimento" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "papeis" "Papel"[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "turno" "Turno" NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subject" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,

    CONSTRAINT "class_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "nome_curto" TEXT NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_subject_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "tipo" "TipoAvaliacao" NOT NULL,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativas" TEXT[],
    "gabarito" INTEGER NOT NULL,
    "skill_id" UUID NOT NULL,
    "distratores" JSONB,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "marcada" INTEGER,
    "tempo_seg" INTEGER,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery" (
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "nivel" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastery_pkey" PRIMARY KEY ("student_id","skill_id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "frase" TEXT NOT NULL,
    "motivos" JSONB NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'ABERTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_request" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "pedido_por" UUID NOT NULL,
    "plano" JSONB NOT NULL,
    "status" "StatusReforco" NOT NULL DEFAULT 'AGUARDANDO_RESPONSAVEL',
    "aprovado_por" UUID,
    "aprovado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutoring_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_session" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "modo" TEXT NOT NULL,
    "registro" TEXT,

    CONSTRAINT "tutoring_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_link" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "consentimento_em" TIMESTAMP(3),
    "versao_termo" TEXT,

    CONSTRAINT "guardian_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_subject_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "arquivo_s3" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunk" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "pagina" INTEGER,
    "embedding" vector(1024),

    CONSTRAINT "chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentive" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "meta" TEXT NOT NULL,
    "premio" TEXT NOT NULL,
    "alvo_tipo" TEXT NOT NULL,
    "alvo_id" UUID NOT NULL,

    CONSTRAINT "incentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log" (
    "id" BIGSERIAL NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "student_id" UUID,
    "acao" TEXT NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_profile" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "especialidades" TEXT[],
    "horarios" TEXT[],
    "modo" TEXT NOT NULL DEFAULT 'presencial',
    "historico" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "tutor_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "lida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_slug_key" ON "school"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_keycloak_id_key" ON "user"("keycloak_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "membership_user_id_idx" ON "membership"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_school_id_user_id_key" ON "membership"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_school_id_nome_ano_letivo_key" ON "class"("school_id", "nome", "ano_letivo");

-- CreateIndex
CREATE INDEX "enrollment_school_id_student_id_idx" ON "enrollment"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_class_id_student_id_key" ON "enrollment"("class_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_school_id_nome_key" ON "subject"("school_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "class_subject_class_id_subject_id_key" ON "class_subject"("class_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_school_id_codigo_key" ON "skill"("school_id", "codigo");

-- CreateIndex
CREATE INDEX "assessment_school_id_class_subject_id_data_idx" ON "assessment"("school_id", "class_subject_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "question_assessment_id_numero_key" ON "question"("assessment_id", "numero");

-- CreateIndex
CREATE INDEX "answer_school_id_student_id_idx" ON "answer"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "answer_question_id_student_id_key" ON "answer"("question_id", "student_id");

-- CreateIndex
CREATE INDEX "mastery_school_id_skill_id_idx" ON "mastery"("school_id", "skill_id");

-- CreateIndex
CREATE INDEX "alert_school_id_status_idx" ON "alert"("school_id", "status");

-- CreateIndex
CREATE INDEX "tutoring_request_school_id_tutor_id_status_idx" ON "tutoring_request"("school_id", "tutor_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_link_guardian_id_student_id_key" ON "guardian_link"("guardian_id", "student_id");

-- CreateIndex
CREATE INDEX "chunk_school_id_material_id_idx" ON "chunk"("school_id", "material_id");

-- CreateIndex
CREATE INDEX "access_log_school_id_student_id_em_idx" ON "access_log"("school_id", "student_id", "em");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_profile_school_id_user_id_key" ON "tutor_profile"("school_id", "user_id");

-- CreateIndex
CREATE INDEX "attendance_school_id_student_id_data_idx" ON "attendance"("school_id", "student_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_class_id_student_id_data_key" ON "attendance"("class_id", "student_id", "data");

-- CreateIndex
CREATE INDEX "message_school_id_to_user_id_created_at_idx" ON "message"("school_id", "to_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_request" ADD CONSTRAINT "tutoring_request_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_session" ADD CONSTRAINT "tutoring_session_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tutoring_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
