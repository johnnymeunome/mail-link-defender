# Contribuindo

Obrigado pelo interesse no Mail Link Defender.

## Ambiente local

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Princípios do projeto

- prefira regras explicáveis a classificações opacas;
- nunca descreva um link como garantidamente seguro;
- minimize permissões e processamento externo;
- preserve parâmetros funcionais ao limpar URLs;
- adicione testes para todo novo sinal de risco;
- trate domínios internacionalizados legítimos com cuidado.

## Pull requests

1. Crie uma branch pequena e focada.
2. Inclua testes para mudanças no analisador.
3. Execute teste, typecheck e build.
4. Explique os falsos positivos considerados.
5. Não inclua URLs maliciosas ativas em fixtures; use domínios reservados como `.test` e `example.com`.

## Novas marcas protegidas

Uma marca só deve entrar na lista local quando houver domínio oficial confirmado e risco razoável de imitação. Inclua casos legítimos próximos para evitar alertas indevidos.
