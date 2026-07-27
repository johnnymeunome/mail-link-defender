# Conteúdo final da Chrome Web Store

## Identificação

**Nome:** Mail Link Defender

**Idioma principal:** Português (Brasil)

**Resumo curto:** Analisa links no Gmail e alerta sobre domínios falsificados antes do clique.

## Descrição detalhada

O Mail Link Defender ajuda você a entender o destino real de um link antes de abrir a página.

No Gmail, a extensão verifica localmente os links visíveis e destaca sinais que merecem atenção, como caracteres Unicode confundíveis, domínios que imitam marcas conhecidas, texto diferente do destino real, subdomínios enganosos, endereços IP, conexões sem HTTPS, portas incomuns, encurtadores e redirecionamentos externos.

Quando um link apresenta alta suspeita, a navegação é interrompida por uma tela vermelha que mostra o domínio real e explica os motivos do alerta. Você pode voltar em segurança ou decidir continuar por conta própria.

Principais recursos:

- proteção automática no Gmail;
- verificação manual da página atual;
- análise individual pelo menu de contexto;
- detecção de imitações Unicode e Punycode;
- comparação entre texto exibido e destino real;
- remoção conservadora de parâmetros de rastreamento;
- motivos claros para cada classificação;
- processamento local, sem servidor, publicidade ou telemetria.

O Mail Link Defender identifica sinais de risco. Nenhuma análise garante que um site seja seguro ou fraudulento.

## Propósito único

Proteger usuários do Gmail contra links potencialmente falsificados, explicando o destino e interrompendo links de alta suspeita antes da navegação.

## Justificativas de permissões

### `https://mail.google.com/*`

Permite que a proteção automática examine somente os endereços e textos dos links visíveis no Gmail e apresente o aviso antes do clique. O acesso está limitado ao domínio do Gmail.

### `activeTab`

Autoriza a análise manual da aba atual somente depois que o usuário interage com o ícone da extensão.

### `scripting`

Permite iniciar o scanner local na aba atual quando o usuário solicita uma verificação manual.

### `contextMenus`

Adiciona a ação “Analisar link com Mail Link Defender” ao menu de contexto de hyperlinks.

### `storage`

Mantém localmente a preferência de ativação da proteção do Gmail e, durante a sessão, o resultado temporário solicitado pelo menu de contexto.

## Código remoto

**Declaração:** não utiliza código remoto. Todo JavaScript executado faz parte do pacote enviado à Chrome Web Store.

## Práticas de dados

A extensão processa localmente:

- endereços dos links;
- texto visível associado aos links;
- domínio da página atual.

Essas informações são usadas apenas para a função visível de proteção contra phishing. Não são transmitidas, vendidas, compartilhadas, usadas para publicidade ou armazenadas como histórico.

No formulário da loja, declarar de forma conservadora o tratamento local de **conteúdo de sites** e **atividade de navegação/URLs**, caso essas categorias sejam exibidas. A declaração deve deixar claro que o processamento é local e necessário para a função principal.

## URLs públicas

- **Página inicial:** https://github.com/johnnymeunome/mail-link-defender
- **Suporte:** https://github.com/johnnymeunome/mail-link-defender/issues
- **Política de privacidade:** https://github.com/johnnymeunome/mail-link-defender/blob/main/PRIVACY.md
- **Código-fonte:** https://github.com/johnnymeunome/mail-link-defender

## Materiais gráficos

- `portfolio/store-assets/icon-128.png`
- `portfolio/store-assets/01-link-analysis.png`
- `portfolio/store-assets/02-danger-warning.png`
- `portfolio/store-assets/03-popup-high-risk.png`
- `portfolio/store-assets/small-promo-440x280.png`
- `portfolio/store-assets/marquee-1400x560.png` — opcional

## Pacote

Usar o ZIP anexado à Release `v0.2.3`. O arquivo contém o `manifest.json` na raiz e não inclui código-fonte de desenvolvimento.
