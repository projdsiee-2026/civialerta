# Alerta Civil Inteligente

Aplicação de monitoramento meteorológico escolar de Paranaguá, construída com React, TypeScript, TanStack Start, Vite e Tailwind CSS.

[**Acessar o site**](https://civialerta-projetos-ds.boomingecho4.chatgpt.site)

## Equipe

**Orientador:** ERICK  
**Coorientadora:** Anelise

**Alunos:**

- Cristoffer
- Daniel
- Beatriz
- Rafaela
- João Vitor
- Felipe

## Onde está o HTML?

O HTML é gerado pelos componentes React. Este projeto não usa um arquivo `index.html` para abrir com duplo clique ou Live Server.

| O que editar | Arquivo |
| --- | --- |
| Estrutura HTML e layout global | `src/routes/__root.tsx` |
| Página inicial / painel | `src/routes/index.tsx` |
| Menu e marca | `src/components/site-header.tsx` |
| Cores, fontes e estilos | `src/styles.css` |
| Imagens | `src/assets/` e `public/` |
| Regras de alerta | `src/lib/alerts.ts` |
| Simulação e armazenamento local | `src/lib/station-store.ts` |
| API do assistente | `src/routes/api/chat.ts` e `src/lib/ai/` |

## Executar no VS Code

Abra esta pasta no VS Code e use o terminal integrado. É necessário Node.js 22.12 ou superior e npm. As versões verificadas estão fixadas em `package-lock.json`.

```sh
npm ci
npm run dev
```

Abra o endereço local mostrado pelo Vite. Mantenha o terminal aberto; use Ctrl+C para parar. Não use Live Server para este projeto.

## Páginas e funcionamento

- `/`: painel de sensores e alertas.
- `/brasil`: clima pelo Open-Meteo; depende de internet.
- `/historico`: histórico salvo neste navegador.
- `/admin`: configuração e cenários do simulador, como chuva e vento.
- `/assistente`: conversas com a Gota; depende da configuração de IA.
- `/voz`: conversa por voz; depende de IA, microfone e WebSocket no servidor.

Os sensores são simulados. As configurações e o histórico ficam no localStorage de cada navegador. Não há autenticação, banco compartilhado ou estação Arduino conectada. A administração é uma ferramenta de demonstração local.

## Configurar a IA (opcional)

Copie `.env.example` para `.env` e configure `LOVABLE_API_KEY` no servidor, com uma chave válida autorizada para o gateway Lovable. Reinicie o servidor após configurar. Sem essa chave, o painel e a simulação funcionam, mas o chat e a voz não respondem.

Nunca coloque a chave em componentes React, em variáveis `VITE_*` ou no GitHub. O `.env` está ignorado pelo Git. Na hospedagem, use o painel de segredos do servidor.

## Imagens

O arquivo `src/assets/logo-instituto.png.asset.json` contém apenas metadados da imagem do instituto hospedada no Lovable. O PNG não veio na exportação; o cabeçalho usa um escudo provisório. A imagem da assistente está em `src/assets/agente-alerta.png`.

## Verificar e gerar a versão de produção

```sh
npm test
npm run typecheck
npm run build
```

O build preserva o servidor Nitro e prepara `dist/server` e `dist/client` para a hospedagem. A configuração fica em `.openai/hosting.json`. O `.npmrc` mantém a resolução de dependências usada na versão verificada. O GitHub Actions executa os testes, o TypeScript e o build.

Este aplicativo usa renderização no servidor e rotas de API. GitHub guarda o código; GitHub Pages sozinho não executa o chat, as funções de clima e o relay de voz. A hospedagem precisa suportar o resultado do build TanStack/Nitro e conexões WebSocket para voz.

## Projeto original

[Projeto original no Lovable](https://lovable.dev/projects/598ad021-faf9-43ba-9f97-a9c0c5a3c84e).

Esta cópia é independente do Lovable do aluno. [Repositório da equipe](https://github.com/projdsiee-2026/civialerta). O arquivo `src/routeTree.gen.ts` é gerado automaticamente; não o edite manualmente.
