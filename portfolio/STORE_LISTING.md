# Rascunho da Chrome Web Store

## Nome

Mail Link Defender

## Resumo curto

Analisa links no Gmail e alerta sobre domínios falsificados antes do clique.

## Descrição

O Mail Link Defender ajuda você a entender o destino real de um hyperlink antes de abrir a página.

Ao usar o Gmail, a extensão analisa localmente os links visíveis e destaca características que merecem atenção, incluindo:

- caracteres Unicode parecidos com letras comuns;
- domínios que imitam marcas conhecidas;
- texto exibido diferente do destino real;
- subdomínios enganosos;
- endereços IP, HTTP e portas incomuns;
- encurtadores e parâmetros de redirecionamento.

Links de alta suspeita são interrompidos por uma tela explicativa. O usuário pode voltar ou decidir abrir o endereço mesmo assim.

Todo o processamento do MVP acontece no navegador. URLs e conteúdo de e-mails não são enviados ou armazenados.

O resultado indica sinais de risco e não garante que um site seja seguro ou fraudulento.

## Propósito único

Proteger usuários contra links potencialmente falsificados em webmail antes da navegação.

## Justificativas de permissões

### Acesso a mail.google.com

Necessário para examinar localmente os hyperlinks exibidos no corpo das mensagens e apresentar o alerta antes do clique.

### activeTab

Permite a análise manual da página atual após o usuário clicar no ícone da extensão.

### scripting

Permite executar o scanner manual na aba escolhida pelo usuário.

### contextMenus

Adiciona a ação “Analisar link com Mail Link Defender” ao menu de contexto de hyperlinks.

### storage

Armazena apenas a preferência local de ativação da proteção e resultados temporários da sessão.

## Privacidade declarada

- não vende dados;
- não usa dados para publicidade;
- não transmite URLs ou conteúdo de mensagens;
- não possui analytics ou telemetria;
- não usa código hospedado remotamente.

## Pendências antes da submissão

- adicionar contato público do desenvolvedor;
- publicar a política de privacidade em uma URL pública;
- confirmar disponibilidade do nome;
- revisar screenshots e descrição final;
- realizar teste em uma instalação limpa do Chrome.
