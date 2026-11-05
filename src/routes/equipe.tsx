import { createFileRoute } from "@tanstack/react-router";
import { students, teachers, type TeamMember } from "@/lib/team";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Alerta Civil Inteligente" },
      {
        name: "description",
        content:
          "Conheça os alunos e professores responsáveis pelo Alerta Civil Inteligente, em Paranaguá.",
      },
    ],
  }),
  component: TeamPage,
});

function MemberCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {member.photo ? (
        <img
          src={`${import.meta.env.BASE_URL}${member.photo}`}
          alt={`Foto de ${member.name}`}
          className="aspect-[3/4] w-full object-cover object-[50%_35%]"
          loading="lazy"
        />
      ) : (
        <div
          className="flex aspect-[3/4] items-center justify-center bg-navy-deep"
          aria-hidden="true"
        >
          <span className="flex size-24 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-display text-3xl font-bold text-primary">
            {initials}
          </span>
        </div>
      )}
      <div className="space-y-1 p-5">
        <h3 className="font-display text-xl font-bold">{member.name}</h3>
        {member.role && <p className="font-semibold text-primary">{member.role}</p>}
        {member.grade && <p className="text-sm text-muted-foreground">{member.grade}</p>}
      </div>
    </article>
  );
}

function TeamPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:py-12">
      <header className="flex max-w-4xl flex-col items-start gap-6 sm:flex-row sm:items-center">
        <img
          src={`${import.meta.env.BASE_URL}equipe/logo-iee.png`}
          alt="Logo do Instituto Estadual de Educação Dr. Caetano Munhoz da Rocha — Paranaguá"
          width={144}
          height={144}
          className="size-28 shrink-0 rounded-full bg-white object-contain p-1 md:size-36"
        />
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Alerta Civil Inteligente
          </p>
          <h1 className="font-display text-4xl font-black md:text-5xl">Nossa equipe</h1>
          <p className="text-lg text-muted-foreground">
            Instituto Estadual de Educação Dr. Caetano Munhoz da Rocha — Paranaguá.
          </p>
          <p className="text-muted-foreground">
            Estudantes dos cursos técnicos integrados ao ensino médio, com orientação de seus
            professores, desenvolvendo tecnologia para o cuidado com a comunidade.
          </p>
        </div>
      </header>
      <section className="space-y-4" aria-labelledby="orientacao-title">
        <h2 id="orientacao-title" className="text-2xl font-bold">
          Orientação
        </h2>
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          {teachers.map((member) => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="estudantes-title">
        <h2 id="estudantes-title" className="text-2xl font-bold">
          Estudantes
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((member) => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>
    </div>
  );
}
