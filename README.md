# Alerta Civil Inteligente

Aplicação de monitoramento meteorológico escolar de Paranaguá, construída com React, TypeScript, TanStack Start, Vite e Tailwind CSS.

## Onde está o HTML?

Este projeto gera o HTML a partir dos componentes React. Não existe um `index.html` para abrir com duplo clique ou Live Server.

| O que editar                                        | Arquivo                                  |
| --------------------------------------------------- | ---------------------------------------- |
| Estrutura HTML, cabeçalho da página e layout global | `src/routes/__root.tsx`                  |
| Página inicial / painel                             | `src/routes/index.tsx`                   |
| Menu e marca                                        | `src/components/site-header.tsx`         |
| Cores, fontes e estilos                             | `src/styles.css`                         |
| Imagens                                             | `src/assets/` e `public/`                |
| Regras de alerta                                    | `src/lib/alerts.ts`                      |
| Simulação e armazenamento local                     | `src/lib/station-store.ts`               |
| API do assistente                                   | `src/routes/api/chat.ts` e `src/lib/ai/` |

## Executar no VS Code

Abra esta pasta no VS Code e use o terminal integrado. Instale uma versão LTS recente do Node.js (22.12 ou superior) com npm, ou use Bun.

O projeto usa npm e inclui `package-lock.json`, que fixa as versões verificadas. No terminal:

```sh
npm ci
npm run dev
```

Abra no navegador o endereço local mostrado pelo Vite. Mantenha o terminal aberto; use Ctrl+C para parar. Não use a extensão Live Server para este projeto.

## Páginas e funcionamento

- `/`: painel de sensores e alertas.
- `/brasil`: consulta de clima pelo Open-Meteo; depende de internet.
- `/historico`: histórico salvo neste navegador.
- `/admin`: configuração e cenários do simulador, como chuva e vento.
- `/assistente`: conversas com a Gota; depende da configuração de IA.
- `/voz`: conversa por voz; depende de IA, microfone e suporte a WebSocket no servidor.

Os sensores são simulados. As alterações de administração e o histórico ficam no localStorage de cada navegador: não há autenticação, banco compartilhado ou estação Arduino conectada. A página de administração é uma ferramenta de demonstração local.

## Configurar a IA (opcional)

Copie `.env.example` para `.env` e configure `LOVABLE_API_KEY` no servidor, com uma chave válida autorizada para o gateway Lovable. Reinicie o servidor após configurar. Sem essa chave, as telas e a simulação funcionam, mas o chat e a voz não conseguem responder.

Nunca coloque a chave em componentes React, em variáveis `VITE_*` ou no GitHub. O `.env` está ignorado pelo Git. Na hospedagem, configure a variável no painel de segredos do servidor.

## Imagens

O arquivo original `src/assets/logo-instituto.png.asset.json` contém apenas metadados de uma imagem hospedada no ambiente Lovable; o PNG do instituto não veio nesta pasta. O cabeçalho usa um ícone de escudo enquanto essa imagem não está disponível. A imagem da assistente está em `src/assets/agente-alerta.png`.

## Verificar e gerar a versão de produção

```sh
npm test
npm run typecheck
npm run build
```

O build preserva o servidor Nitro e prepara `dist/server` e `dist/client` para a hospedagem. A configuração de hospedagem fica em `.openai/hosting.json`. O `.npmrc` mantém a resolução de dependências usada na versão verificada.

Este é um aplicativo com renderização no servidor e rotas de API. GitHub guarda o código; GitHub Pages sozinho não executa o chat, as funções de clima e o relay de voz. A hospedagem precisa suportar o resultado do build TanStack/Nitro e, para voz, conexões WebSocket persistentes. Não publique apenas uma pasta de arquivos estáticos esperando essas funções.

## Projeto original

[Editar no Lovable](https://lovable.dev/projects/598ad021-faf9-43ba-9f97-a9c0c5a3c84e).

Esta cópia é independente do Lovable do aluno. O código está em https://github.com/projdsiee-2026/civialerta. `src/routeTree.gen.ts` é gerado automaticamente; não o edite manualmente.
