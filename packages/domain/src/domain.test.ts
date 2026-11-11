import { describe, expect, it } from "vitest";
import { gradeAssessment, gradeStudent } from "./grading";
import { computeMastery, masteryBand } from "./mastery";
import { evaluateStudent, relativeDrop, summarizeAlerts } from "./detector";
import { matchTutors } from "./matching";
import type { Assessment, StudentAnswer, Tutor } from "./types";
import * as demo from "./demo";

const prova: Assessment = {
  id: "a1", title: "t", date: "2026-11-01", classId: "c", subject: "Mat",
  questions: [
    { id: "q1", number: 1, statement: "", options: ["a", "b", "c", "d"], correct: 0, skill: "S1", distractors: { 2: "confusão X" } },
    { id: "q2", number: 2, statement: "", options: ["a", "b", "c", "d"], correct: 1, skill: "S2" },
  ],
};

describe("correção determinística", () => {
  it("dá a mesma nota para as mesmas respostas", () => {
    const ans: StudentAnswer[] = [
      { studentId: "x", questionId: "q1", chosen: 0 },
      { studentId: "x", questionId: "q2", chosen: 3 },
    ];
    const r = gradeStudent(prova, "x", ans);
    expect(r.score).toBe(5);
    expect(r.bySkill).toEqual({ S1: { correct: 1, total: 1 }, S2: { correct: 0, total: 1 } });
    expect(r.wrongQuestionIds).toEqual(["q2"]);
    expect(gradeStudent(prova, "x", ans)).toEqual(r);
  });

  it("conta em branco como erro e aponta o distrator mais escolhido", () => {
    const ids = ["a", "b", "c", "d"];
    const ans: StudentAnswer[] = ids.flatMap((id, i) => [
      { studentId: id, questionId: "q1", chosen: i === 0 ? 0 : 2 },
      { studentId: id, questionId: "q2", chosen: null },
    ]);
    const rep = gradeAssessment(prova, ids, ans);
    const q1 = rep.questions[0]!;
    expect(q1.pctCorrect).toBe(0.25);
    expect(q1.topDistractor).toEqual({ option: 2, count: 3, meaning: "confusão X" });
    expect(q1.flags).toContain("todos-erram");
    expect(rep.questions[1]!.flags).toContain("muitos-em-branco");
  });
});

describe("domínio por habilidade", () => {
  it("pesa mais a evidência recente", () => {
    const m = computeMastery([
      { date: "2026-01-01", skill: "S", correct: 10, total: 10 },
      { date: "2026-02-01", skill: "S", correct: 0, total: 10 },
    ]);
    expect(m.S).toBe(60);
    expect(masteryBand(80)).toBe("consolidada");
    expect(masteryBand(undefined)).toBe("sem-dados");
  });
});

describe("detector proativo", () => {
  const ev = (pcts: number[]) => pcts.map((p, i) => ({ date: `2026-0${i + 1}-01`, skill: "EF06MA07", correct: p, total: 10 }));
  const skills = [{ code: "EF06MA07", shortName: "frações", subject: "Mat", description: "" }];

  it("calcula a queda relativa das 3 últimas atividades", () => {
    expect(relativeDrop(ev([8, 8, 8, 6, 5, 5]))).toBe(0.33);
    expect(relativeDrop(ev([8, 8]))).toBe(0);
  });

  it("abre alerta com motivos e sem rotular o aluno", () => {
    const [alert] = evaluateStudent({ studentId: "j", firstName: "João", evidence: ev([8, 8, 8, 5, 4, 3]), attendance: 0.8, missingTasks: 2 }, skills);
    expect(alert).toBeDefined();
    expect(alert!.headline).toBe("João precisa de apoio em frações");
    expect(alert!.reasons.length).toBeGreaterThan(1);
    expect(alert!.headline).not.toMatch(/fraco|ruim|mau/i);
  });

  it("não abre alerta só por frequência", () => {
    const alerts = evaluateStudent({ studentId: "j", firstName: "J", evidence: ev([8, 8, 8, 8, 8, 8]), attendance: 0.5, missingTasks: 5 }, skills);
    expect(alerts).toEqual([]);
  });

  it("resume em uma frase-decisão", () => {
    const s = summarizeAlerts([
      { studentId: "a", skill: "EF06MA07", score: 60, headline: "", reasons: [], mastery: 40, drop: 0.3 },
      { studentId: "b", skill: "EF06MA07", score: 70, headline: "", reasons: [], mastery: 40, drop: 0.3 },
    ], skills);
    expect(s?.sentence).toBe("2 alunos precisam de reforço em frações");
  });
});

describe("matching de reforço", () => {
  const tutors: Tutor[] = [
    { id: "1", name: "A", specialties: ["S"], slots: ["seg 14:00"], history: { S: { closed: 9, total: 10 } }, mode: "ambos" },
    { id: "2", name: "B", specialties: [], slots: ["seg 14:00"], history: {}, mode: "ambos" },
    { id: "3", name: "C", specialties: ["S"], slots: [], history: { S: { closed: 1, total: 1 } }, mode: "ambos" },
  ];
  it("ordena por especialidade, agenda e histórico e explica o porquê", () => {
    const m = matchTutors("S", "frações", tutors);
    expect(m.map((x) => x.tutor.id)).toEqual(["1", "3", "2"]);
    expect(m[0]!.reasons).toContain("Especialista em frações");
  });
});

describe("escola de demonstração", () => {
  it("gera a frase do topo do professor do 6º B", () => {
    expect(demo.DEMO_SUMMARY?.skill).toBe("EF06MA07");
    expect(demo.DEMO_SUMMARY?.count).toBe(4);
  });
  it("marca as questões 6 (ambígua) e 9 (todos erram)", () => {
    const byNum = new Map(demo.REPORT.questions.map((q) => [q.number, q.flags]));
    expect(byNum.get(9)).toContain("todos-erram");
    expect(byNum.get(6)).toContain("nao-discrimina");
  });
});
