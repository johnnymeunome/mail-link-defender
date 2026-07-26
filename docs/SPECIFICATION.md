# Especificação técnica — MVP 0.1

## Objetivo

Proteger o usuário antes do clique em hyperlinks exibidos em webmails autorizados, usando análise local e explicável da URL.

## Fluxos

### Proteção automática

1. O usuário abre o Gmail e habilita a proteção no popup.
2. A instalação solicita acesso somente a `mail.google.com`.
3. Um content script declarado no manifesto inicia em `document_start`.
4. O scanner observa os corpos de mensagens e analisa hyperlinks visíveis.
5. Links com atenção recebem contorno amarelo; links de alta suspeita recebem contorno vermelho.
6. Cliques de alta suspeita são interrompidos por uma confirmação explicável.

### Scanner manual

1. O usuário abre o popup em qualquer página HTTP(S).
2. `activeTab` concede acesso temporário.
3. O scanner é injetado e retorna um resumo dos links visíveis.

### Link individual

1. O usuário seleciona “Analisar link com Mail Link Defender” no menu de contexto.
2. O service worker analisa a URL localmente.
3. O popup mostra o domínio e os motivos.

## Componentes

- `analyzer/`: parser, Public Suffix List, Unicode, marcas, rastreamento e regras.
- `content/scanner.ts`: descoberta de links, decoração, MutationObserver e click guard.
- `popup/`: consentimento, scanner manual e resultado detalhado.
- `background/`: menu de contexto e ciclo de vida Manifest V3.

## Regras de alta suspeita

- esquema de URL inesperado ou executável;
- credenciais embutidas antes de `@`;
- texto visível contendo URL com domínio diferente do destino;
- domínio Unicode confundível com uma marca protegida;
- mistura de sistemas de escrita acompanhada de imitação de marca.

## Regras de atenção

- HTTP;
- IP no lugar do hostname;
- porta incomum;
- Punycode;
- mistura de sistemas de escrita sem marca correspondente;
- erro de digitação próximo de marca;
- marca em subdomínio ou token de domínio não oficial;
- encurtador conhecido;
- muitos níveis de subdomínio;
- URL muito longa ou excessivamente codificada;
- parâmetro de redirecionamento.

## Requisitos não funcionais

- zero requisições externas no MVP;
- nenhuma persistência de URLs analisadas;
- permissão de host restrita exclusivamente a `mail.google.com`;
- código executável integralmente empacotado;
- mensagens sem alegação de certeza;
- TypeScript estrito;
- build reprodutível por lockfile;
- testes unitários do analisador.

## Próxima versão

- adaptador específico do Outlook;
- conjunto ampliado e revisável de marcas;
- testes end-to-end em webmails;
- opção de verificar redirecionamentos com permissão de host solicitada em tempo de execução;
- internacionalização da interface.
