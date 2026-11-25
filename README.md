# Crachá: controle de acesso

Trabalho prático em grupo da disciplina **Mobile Applications** do MBA em Engenharia de Software (Faculdade Impacta), orientado pelo Prof. Dr. Uedson Reis.

## Integrantes

- Matheus Mendes
- Nicoli Ferreira

## Sobre o projeto

Implementamos a **Opção 2** do enunciado: um app de controle de acesso com três telas.

1. **Login**
2. **Listagem de usuários**
3. **Cadastro e atualização de usuário**

Os dados ficam só no aparelho, gravados com o [AsyncStorage](https://react-native-async-storage.github.io/async-storage/docs/usage). A interface segue a metáfora de um crachá corporativo: o login é um crachá em branco, e a lista mostra o crachá de quem está conectado.

Além do pedido no enunciado, o app tem:

- primeiro acesso: quando não há nenhum usuário, o login oferece "Criar primeiro usuário";
- exclusão de usuários, com confirmação e sem permitir excluir a si mesmo;
- bloqueio progressivo depois de 5 tentativas erradas (30 s, dobrando até 5 min);
- sessão que expira por inatividade, com aviso antes;
- tela de erro quando os dados salvos estão danificados, com reset confirmado ao digitar `APAGAR`;
- temas claro e escuro e suporte a TalkBack.

## Tecnologias

- [Expo](https://docs.expo.dev/) SDK 58, React Native 0.88 e TypeScript 6
- [React Navigation](https://reactnavigation.org/docs/getting-started/) (native-stack), no padrão de fluxo de autenticação
- [AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [expo-crypto](https://docs.expo.dev/versions/latest/sdk/crypto/) para o hash das senhas
- Jest com o preset `jest-expo`

## Como executar

Pré-requisitos: Node.js LTS e o app **Expo Go** num celular Android (ou um emulador do Android Studio).

```bash
npm install
npx expo start
```

Leia o QR code com o Expo Go, ou pressione `a` para abrir no emulador.

No modo de desenvolvimento, a sessão expira em 30 segundos sem uso, com aviso nos últimos 10 segundos, para facilitar a demonstração. No build de produção, os tempos são 5 minutos e 60 segundos.

## Como testar

```bash
npm test               # testes com cobertura
npx tsc --noEmit       # checagem de tipos
npm run lint           # lint (console.* é proibido em src/)
npm audit --omit=dev   # vulnerabilidades das dependências de produção
```

As regras de negócio ficam fora das telas, em `src/domain`, `src/services` e `src/session`. O `npm test` falha se a cobertura dessas pastas ficar abaixo de 90%. Hoje são 255 testes, com 100% de cobertura em `domain` e `services` e 98,7% em `session`.

Os testes usam um AsyncStorage em memória e o `node:crypto` no lugar do `expo-crypto`. As telas não têm testes automáticos; elas são verificadas pelo roteiro abaixo.

## Roteiro de demonstração

Rode no modo de desenvolvimento, a partir de uma instalação limpa. O roteiro completo, com acessibilidade, temas, a tela de erro de dados e a lista de screenshots, está no [guia de testes](GUIA-DE-TESTES.md).

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o app pela primeira vez | Crachá de login com "Criar primeiro usuário" |
| 2 | Criar "Matheus Mendes", login `Matheus`, senha `senha123` | Entra direto; a lista mostra "Olá, Matheus", "1 usuário cadastrado" e a marca "você" |
| 3 | Adicionar "Nicoli Ferreira" (`nicoli.f`); tentar outro usuário com o login ` MATHEUS ` | Nicoli é salva; o repetido mostra "Este login já está em uso." |
| 4 | Editar Nicoli com a senha em branco e salvar; entrar como ela | A senha antiga continua valendo |
| 5 | Abrir o próprio cadastro | Não há botão "Excluir" |
| 6 | Excluir Nicoli e confirmar | Ela some da lista; aparece "Usuário excluído" |
| 7 | Sair e errar a senha 5 vezes | A 6ª tentativa mostra "Muitas tentativas. Tente novamente em 30 segundos."; o mesmo vale para um login que não existe |
| 8 | Entrar e não tocar em nada | O aviso aparece por volta dos 20 s; "Continuar conectado" reinicia a contagem; sem resposta, volta ao login com o aviso de expiração |
| 9 | Alterar um campo do formulário e apertar Voltar | "Descartar alterações?" |
| 10 | Mandar o app para segundo plano e voltar depois do prazo | Login com o aviso de expiração |
| 11 | Depois de sair, apertar Voltar | O app fecha ou fica no login; nenhuma tela protegida aparece |
| 12 | Ligar o TalkBack, fonte no máximo, nos dois temas | Todo controle é anunciado, nada é cortado e os dois temas ficam legíveis |

A tela de erro de dados aparece só quando o conteúdo da chave `users@v1` não pode ser lido. Esse caso é coberto pelos testes automáticos (`storage`, `user.repo` e `resetAppData`). Para vê-lo no aparelho, siga a seção 4 do [guia de testes](GUIA-DE-TESTES.md); o app não tem menu de depuração.

## Decisões e limitações

- **Hash das senhas:** SHA-256 com um salt aleatório por usuário, via `expo-crypto`. bcrypt e argon2 seriam mais fortes, mas exigem módulo nativo (fora do Expo Go) ou são lentos demais em JavaScript. A senha nunca é gravada em texto puro, e um salt novo é gerado a cada troca.
- **Login sem pistas:** um login inexistente e uma senha errada recebem a mesma mensagem e gastam o mesmo cálculo de hash, e o bloqueio também vale para logins inexistentes. Assim não dá para descobrir quais logins existem.
- **Só dados locais:** não há servidor nem sincronização. Os dados ficam fora do backup do Android (`allowBackup: false`). Num aparelho com root, o armazenamento pode ser lido; o salt e o mínimo de dados reduzem esse risco, mas não o eliminam.
- **Sessão por inatividade:** a sessão vence depois de 5 minutos sem toque nem troca de tela. A última atividade é gravada no máximo a cada 15 segundos e ao ir para segundo plano; depois de um travamento, a sessão pode parecer até 15 segundos menos ociosa do que estava.
- **Falha fechada:** dados ilegíveis nunca são tratados como "sem usuários", o que reabriria o primeiro acesso. O app mostra a tela de erro, e a única saída é apagar tudo.
- **Riscos aceitos:**
  - todos os usuários conectados têm as mesmas permissões, então qualquer um pode trocar a senha de outro;
  - quem estiver com o aparelho pode bloquear um login conhecido por até 5 minutos errando a senha;
  - quem estiver com o aparelho pode usar "Apagar dados e recomeçar" na tela de erro, o que equivale ao "Limpar dados" do próprio Android.
- **Fora do escopo:** papéis e permissões, recuperação de senha, busca e paginação, biometria, armazenamento criptografado, bloqueio de prints, versão web e testes automáticos de interface.
- **Plataforma:** o alvo é Android. O iOS não foi verificado.

## Checklist de acessibilidade

Meta: WCAG 2.2 AA.

- [x] Temas claro e escuro completos, seguindo o aparelho.
- [x] Contraste de texto de pelo menos 4,5:1 e de componentes de pelo menos 3:1 nos dois temas, verificado por teste automático (veja a tabela abaixo).
- [x] Áreas de toque de pelo menos 48 × 48 dp.
- [x] Todo controle tem nome e papel acessíveis; as ações só com ícone ("Adicionar usuário", "Sair", "Mostrar senha") têm rótulo.
- [x] Campos com rótulo sempre visível. Erros e avisos aparecem em texto, com ícone, não só pela cor.
- [x] Erros de formulário levam o foco ao primeiro campo com problema e são anunciados.
- [x] Avisos (login inválido, bloqueio, sessão expirando, sessão expirada, "Usuário salvo", erro de dados) são anunciados uma vez, sem repetir a cada segundo.
- [x] Cada linha da lista é lida como um item só: nome, login e "você", quando for o caso.
- [x] Partes decorativas do crachá (presilha, código de barras, prévia, mini crachá) ficam ocultas do TalkBack.
- [x] O crachá se reorganiza na vertical com fonte grande, e nomes longos quebram linha em vez de serem cortados.
- [x] Transições desligadas quando o aparelho pede para reduzir movimento.
- [ ] Verificação no aparelho com TalkBack, fonte em 200% e os dois temas (passo 12 do roteiro).

### Contraste medido

Razões calculadas a partir de `src/theme/tokens.ts`, com a fórmula de luminância relativa da WCAG 2.x. O teste `__tests__/theme/contrast.test.ts` falha se algum par ficar abaixo da meta.

| Par | Cores (claro / escuro) | Claro | Escuro | Meta |
|---|---|---|---|---|
| Texto principal na tela (`onBackground` / `background`) | #1A1C1E em #E8EDF3 / #E2E2E6 em #0F141A | 14,52:1 | 14,32:1 | 4,5:1 |
| Texto em linhas e campos (`onSurface` / `surface`) | #1A1C1E em #FFFFFF / #E2E2E6 em #1A2027 | 17,09:1 | 12,70:1 | 4,5:1 |
| Texto secundário em linhas e campos (`onSurfaceVariant` / `surface`) | #44474E em #FFFFFF / #C4C6D0 em #1A2027 | 9,30:1 | 9,64:1 | 4,5:1 |
| Texto secundário na tela (`onSurfaceVariant` / `background`) | #44474E em #E8EDF3 / #C4C6D0 em #0F141A | 7,90:1 | 10,87:1 | 4,5:1 |
| Texto em diálogos (`onSurface` / `surfaceContainer`) | #1A1C1E em #F3F5F9 / #E2E2E6 em #222A33 | 15,66:1 | 11,23:1 | 4,5:1 |
| Texto secundário em diálogos (`onSurfaceVariant` / `surfaceContainer`) | #44474E em #F3F5F9 / #C4C6D0 em #222A33 | 8,52:1 | 8,52:1 | 4,5:1 |
| Ação de diálogo (`primary` / `surfaceContainer`) | #0B3D91 em #F3F5F9 / #ADC6FF em #222A33 | 9,20:1 | 8,50:1 | 4,5:1 |
| Ação destrutiva de diálogo (`error` / `surfaceContainer`) | #BA1A1A em #F3F5F9 / #FFB4AB em #222A33 | 5,92:1 | 8,55:1 | 4,5:1 |
| Nome no crachá (`onSurface` / `badgeCard`) | #1A1C1E em #FFFFFF / #E2E2E6 em #222A33 | 17,09:1 | 11,23:1 | 4,5:1 |
| Login e contagem no crachá (`onSurfaceVariant` / `badgeCard`) | #44474E em #FFFFFF / #C4C6D0 em #222A33 | 9,30:1 | 8,52:1 | 4,5:1 |
| Validade da sessão no crachá (`primary` / `badgeCard`) | #0B3D91 em #FFFFFF / #ADC6FF em #222A33 | 10,04:1 | 8,50:1 | 4,5:1 |
| Título na faixa do crachá (`onBadgeBand` / `badgeBand`) | #FFFFFF em #0B3D91 / #FFFFFF em #3D6FD1 | 10,04:1 | 4,78:1 | 4,5:1 |
| Botão principal (`onPrimary` / `primary`) | #FFFFFF em #0B3D91 / #002E69 em #ADC6FF | 10,04:1 | 7,71:1 | 4,5:1 |
| Botão de texto e links (`primary` / `background`) | #0B3D91 em #E8EDF3 / #ADC6FF em #0F141A | 8,53:1 | 10,83:1 | 4,5:1 |
| Marca "você" (`onPrimaryContainer` / `primaryContainer`) | #001A41 em #D8E2FF / #D8E2FF em #1E4A99 | 13,27:1 | 6,51:1 | 4,5:1 |
| Erro de campo (`error` / `background`) | #BA1A1A em #E8EDF3 / #FFB4AB em #0F141A | 5,49:1 | 10,89:1 | 4,5:1 |
| Erro de login e botão destrutivo (`onErrorContainer` / `errorContainer`) | #410002 em #FFDAD6 / #FFDAD6 em #93000A | 13,26:1 | 7,24:1 | 4,5:1 |
| Snackbar e aviso de expiração (`inverseOnSurface` / `inverseSurface`) | #F1F0F4 em #2F3033 / #2F3033 em #E2E2E6 | 11,63:1 | 10,21:1 | 4,5:1 |
| Borda de campo (`outline` / `surface`) | #6F737C em #FFFFFF / #8E9099 em #1A2027 | 4,75:1 | 5,16:1 | 3:1 |
| Contorno de foco (`focus` / `surface`) | #0B3D91 em #FFFFFF / #ADC6FF em #1A2027 | 10,04:1 | 9,61:1 | 3:1 |
| Contorno de foco em linha pressionada (`focus` / `surfaceContainer`) | #0B3D91 em #F3F5F9 / #ADC6FF em #222A33 | 9,20:1 | 8,50:1 | 3:1 |
| Faixa do crachá sobre o fundo (`badgeBand` / `background`) | #0B3D91 em #E8EDF3 / #3D6FD1 em #0F141A | 8,53:1 | 3,87:1 | 3:1 |

## Screenshots

As capturas das telas nos temas claro e escuro vão ficar em [`screenshots/`](screenshots/).

## Entrega

Prazo: **03/12/2026**, pelo repositório de código.
