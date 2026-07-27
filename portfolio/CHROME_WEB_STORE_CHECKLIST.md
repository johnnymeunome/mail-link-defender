# Checklist de publicação na Chrome Web Store

## 1. Conta do desenvolvedor — ação do proprietário

- [ ] Acessar https://chrome.google.com/webstore/devconsole
- [ ] Registrar a conta de desenvolvedor e concluir o pagamento único solicitado pelo Google.
- [ ] Aceitar o contrato e as políticas do programa.
- [ ] Verificar o e-mail de contato.
- [ ] Informar o nome público do publisher.
- [ ] Manter a verificação em duas etapas habilitada na conta Google.

## 2. Criar o item

- [ ] Selecionar **Add new item**.
- [ ] Baixar o ZIP da Release `v0.2.3`.
- [ ] Enviar `mail-link-defender-extension-v0.2.3.zip`.
- [ ] Confirmar que o painel reconheceu Manifest V3, versão 0.2.3 e ícone.

Release: https://github.com/johnnymeunome/mail-link-defender/releases/tag/v0.2.3

## 3. Store listing

- [ ] Copiar nome, resumo e descrição de `portfolio/STORE_LISTING.md`.
- [ ] Definir Português (Brasil) como idioma principal.
- [ ] Enviar `portfolio/store-assets/icon-128.png`.
- [ ] Enviar as três capturas 1280×800, na ordem numérica.
- [ ] Enviar `small-promo-440x280.png`.
- [ ] Enviar `marquee-1400x560.png` se desejar concorrer a maior destaque.
- [ ] Informar a URL da página inicial.
- [ ] Informar a URL de suporte.

## 4. Privacy practices

- [ ] Copiar o propósito único de `portfolio/STORE_LISTING.md`.
- [ ] Justificar cada permissão com os textos preparados.
- [ ] Declarar que não executa código remoto.
- [ ] Informar com precisão o processamento local de URLs e conteúdo de sites.
- [ ] Certificar conformidade com Uso Limitado.
- [ ] Informar a política pública: https://github.com/johnnymeunome/mail-link-defender/blob/main/PRIVACY.md

## 5. Distribuição e revisão

- [ ] Escolher visibilidade pública ou não listada.
- [ ] Selecionar as regiões de distribuição.
- [ ] Salvar todas as abas e resolver avisos do painel.
- [ ] Enviar para revisão.
- [ ] Não alterar código ou permissões enquanto a revisão estiver pendente, salvo para corrigir uma rejeição.

## 6. Verificação final antes do envio

- [ ] Instalação limpa usando exatamente o ZIP da Release.
- [ ] Proteção automática ativa após recarregar o Gmail.
- [ ] Links `mailto:` e `tel:` ignorados.
- [ ] Link Unicode de teste marcado como alta suspeita.
- [ ] Tela vermelha exibida antes da navegação.
- [ ] Botão “Voltar em segurança” fecha o bloqueio.
- [ ] Popup apresenta estados verde, âmbar e vermelho corretamente.
- [ ] Nenhum dado real ou pessoal aparece nas imagens da loja.
