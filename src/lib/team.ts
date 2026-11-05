export interface TeamMember {
  name: string;
  role?: string;
  grade?: string;
  photo?: string;
}

// Cadastre somente fotos e dados enviados pela equipe. As fotos vão em
// public/equipe/; photo recebe "equipe/nome.jpg". grade recebe a série informada.
export const teachers: TeamMember[] = [
  { name: "Erick", role: "Orientador", photo: "equipe/erick.jpeg" },
  { name: "Anelise", role: "Coorientadora", photo: "equipe/anelise.jpeg" },
];
export const students: TeamMember[] = [
  { name: "Cristoffer", grade: "1ºC Desenvolvimento de Sistemas", photo: "equipe/cristoffer.jpeg" },
  { name: "Daniel", grade: "1ºA Desenvolvimento de Sistemas", photo: "equipe/daniel.jpeg" },
  { name: "Beatriz", grade: "1ºA Desenvolvimento de Sistemas", photo: "equipe/beatriz.jpeg" },
  { name: "Rafaela", grade: "1ºA Desenvolvimento de Sistemas", photo: "equipe/rafaela.jpeg" },
  { name: "João Vitor", grade: "1ºC Desenvolvimento de Sistemas", photo: "equipe/joao-vitor.jpeg" },
  { name: "Fernando", grade: "2º A Administração", photo: "equipe/fernando.jpeg" },
];
