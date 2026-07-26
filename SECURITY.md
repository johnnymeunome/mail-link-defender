# Segurança

## Escopo de proteção

O Mail Link Defender identifica características locais de URLs e diferenças entre texto e destino. Ele não substitui Safe Browsing, antivírus, autenticação multifator ou treinamento de segurança.

## Limitações conhecidas

A extensão pode não detectar:

- páginas legítimas comprometidas;
- domínios novos sem características incomuns;
- conteúdo malicioso carregado apenas após a navegação;
- redirecionamentos executados remotamente ou por JavaScript;
- golpes sem hyperlinks.

Um resultado sem indícios nunca deve ser interpretado como garantia de legitimidade.

## Relato de vulnerabilidades

Não publique detalhes exploráveis em uma issue pública. Antes da publicação do projeto, configure um endereço de contato ou o recurso de private vulnerability reporting do GitHub.

## Dependências

O projeto mantém poucas dependências de produção, não executa código remoto e deve passar por `npm audit`, revisão do lockfile e testes antes de cada release.
