# Como foi desenvolvido

O projeto foi quebrado em issues pequenas do GitHub e resolvido em ondas paralelas: as issues sem dependência entre si rodavam ao mesmo tempo, cada uma na sua branch (`feature/issue-N`, a partir de `develop`) e com banco e portas próprios, para não haver conflito.

O fluxo de cada issue:

1. **Spec primeiro.** Regras de negócio e critérios de aceite escritos em [`docs/specs`](specs) (a partir de um template) antes do código.
2. **Implementação com testes**, no menor escopo que atende a issue.
3. **Revisão do código** e **teste manual** da funcionalidade rodando (API com `curl`, telas abertas ao lado do mockup em [`docs/design`](design/direcao-a), no desktop e no celular) antes de abrir o PR.
4. **PR para `develop`** com resumo e casos testados; merge só depois da validação.

```mermaid
flowchart LR
    subgraph onda["Onda: issues sem dependência rodam em paralelo"]
        direction TB
        I1[Issue A<br/>branch feature/issue-A]
        I2[Issue B<br/>branch feature/issue-B]
        I3[Issue C<br/>branch feature/issue-C]
    end
    onda --> F
    subgraph F["Fluxo de cada issue"]
        direction LR
        SP[Spec em docs/specs] --> IM[Implementação e testes] --> RV[Revisão do código] --> TM[Teste manual] --> PR[PR para develop] --> MG[Merge]
    end
    MG --> N[Próxima onda]
```

Agentes de IA foram usados como ferramenta de implementação e revisão dentro desse processo. As decisões de produto, as specs e a validação final são humanas, e os commits e PRs são descritivos, sem atribuição de autoria a ferramentas.
