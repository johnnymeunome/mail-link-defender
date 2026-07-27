# Política de privacidade

Última atualização: 26 de julho de 2026.

## Resumo

O Mail Link Defender processa links localmente no navegador para detectar sinais de phishing. A extensão não possui servidor, conta, publicidade, telemetria ou analytics.

## Dados acessados

Quando a proteção está ativa no Gmail ou o usuário solicita uma análise manual, a extensão pode processar:

- endereços dos hyperlinks exibidos;
- texto visível associado a esses hyperlinks;
- domínio da página atual.

Esse acesso existe exclusivamente para identificar possíveis falsificações, explicar o destino real e apresentar alertas antes do clique.

## Coleta, transmissão e compartilhamento

O Mail Link Defender não transmite, vende ou compartilha:

- conteúdo de e-mails;
- URLs analisadas;
- histórico de navegação;
- dados pessoais;
- resultados das análises.

Não existe comunicação com servidores do desenvolvedor ou de terceiros. Todo o processamento da análise acontece no dispositivo do usuário.

## Armazenamento e retenção

A preferência de ativação da proteção do Gmail é mantida localmente pelo Chrome até ser alterada pelo usuário ou até a extensão ser removida.

Resultados solicitados pelo menu de contexto são mantidos apenas na sessão do navegador e removidos depois de exibidos. A extensão não cria histórico das análises.

## Permissões

- `activeTab`: análise manual da aba após uma ação explícita do usuário.
- `scripting`: execução local do scanner na aba autorizada.
- `contextMenus`: análise de um hyperlink pelo menu de contexto.
- `storage`: preferência local de proteção e passagem temporária de resultados da sessão.
- acesso a `mail.google.com`: proteção automática dos links exibidos no Gmail; pode ser desativada no popup.

## Uso limitado

O uso das informações acessadas pela extensão é limitado à função declarada de proteção contra phishing. Os dados não são usados para publicidade, definição de crédito, venda, transferência a corretores de dados ou leitura humana.

O uso de informações pelo Mail Link Defender seguirá a Política de Dados do Usuário da Chrome Web Store, incluindo os requisitos de Uso Limitado.

## Controle do usuário

O usuário pode pausar a proteção automática pelo popup. A remoção da extensão apaga as preferências locais mantidas pelo Chrome.

## Contato

Dúvidas e solicitações podem ser enviadas pela página pública de suporte:

https://github.com/johnnymeunome/mail-link-defender/issues
