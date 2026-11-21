## Workflow de issues em paralelo (Maestri + maestri-kit)

- Cada issue roda num floor do Maestri (worktree própria, branch `feature/issue-N` saindo de `develop`), com portas e containers isolados em `.wt.env`. Nunca fixe porta, URL de API ou credencial no código.
- Config do projeto: `.claude/workflow.config`. Skills globais: `maestro-ondas` (Ground) e `resolver-issue` (um por floor).
- App do floor: `kit-app start|stop|status|urls|test|logs <SERVIÇO>`.
- PR sempre para `develop`. Nunca push em `main`/`master`/`develop`, nunca `--force`, nunca merge.
- Migrations com versão em timestamp, nunca sequencial (vários floors criam migrations ao mesmo tempo).
- O Lorenzo só manda começar, testa (nota "Testes") e mergeia. Conflitos e atualização com a base são dos agentes.
- Resolvers podem ser Claude Code ou Codex (modo economia). Estas regras valem para os dois.
- Pergunte antes de assumir quando a issue for ambígua.

### Commits e PRs
- Nunca adicione `Co-Authored-By` (Claude, Codex, ChatGPT), "Generated with Claude Code", link de sessão ou qualquer atribuição de IA. O único autor é o Lorenzo.

### Usuários de teste
Ainda não há autenticação nem entidade de usuário. Por ora só há dados de exemplo (perfil `dev`, `db/seed-dev`): salas e profissionais (`@exemplo.test`), sem login. A issue que introduzir auth deve criar um seed de dev (migration Flyway em `db/migration`, só no perfil de dev) com um usuário por perfil e senhas fictícias, e documentar aqui login/senha de cada um.

### Invariantes
<!-- o que nunca pode quebrar -->

### Armadilhas
<!-- traga para cá as melhores linhas da nota "Lições" -->
