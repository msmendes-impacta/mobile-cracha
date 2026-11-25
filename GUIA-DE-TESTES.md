# Guia de testes do Crachá

Este guia junta os testes automáticos e o roteiro manual no celular. Os testes automáticos rodam no computador em menos de um minuto. O roteiro manual leva cerca de 30 minutos num Android com o Expo Go.

## 1. Testes automáticos

Na raiz do projeto, depois do `npm install`:

```bash
npm test               # 255 testes, com relatório de cobertura
npx tsc --noEmit       # checagem de tipos
npx expo lint .        # lint do projeto inteiro
npm audit --omit=dev   # vulnerabilidades das dependências de produção
```

O que esperar:

- `npm test` termina com todos os testes passando. Na tabela de cobertura, as linhas `domain`, `services` e `session` precisam estar em 90% ou mais; abaixo disso, o comando falha.
- `tsc` e lint terminam sem nenhuma mensagem de erro.
- `npm audit` mostra 3 vulnerabilidades **moderadas** dentro do próprio Expo (`minimatch`). Elas são conhecidas e foram aceitas, porque a correção exigiria voltar para o SDK 52. Não pode aparecer nenhuma alta (high) ou crítica (critical).

O relatório detalhado de cobertura fica em `coverage/lcov-report/index.html`.

Os testes cobrem as regras de negócio: validação de usuário, hash de senha, bloqueio por tentativas, expiração da sessão, leitura de dados corrompidos, reset e contraste das cores. As telas são verificadas pelo roteiro abaixo.

## 2. Preparar o celular

1. Instale o **Expo Go** pela Play Store.
2. No computador, rode `npx expo start` e leia o QR code com o Expo Go. O celular e o computador precisam estar na mesma rede Wi-Fi.
3. Para começar do zero, limpe os dados do Expo Go: Configurações > Apps > Expo Go > Armazenamento > Limpar dados. Depois, leia o QR code de novo. Recarregar o app ("Reload" no menu do Expo Go) não apaga os dados.

Pelo Expo Go, o app roda no **modo de desenvolvimento**, com tempos curtos para a demonstração: a sessão expira em **30 segundos** sem uso, e o aviso aparece nos **últimos 10 segundos**. No build de produção, são 5 minutos e 60 segundos.

Durante o roteiro, anote o que der diferente do esperado: número do passo, o que aconteceu e, se der, um print.

## 3. Roteiro principal

### 3.1 Primeiro acesso e lista

- [x] **1.** Abra o app pela primeira vez. O crachá mostra "Nenhum usuário cadastrado" e o botão "Criar primeiro usuário", sem os campos de login.
- [x] **2.** Toque em "Criar primeiro usuário" e cadastre "Matheus Mendes", login `Matheus`, senha `senha123`. O app entra direto. A lista mostra o crachá "Olá, Matheus", "1 usuário cadastrado", a validade da sessão e a sua linha com a marca "você". Abaixo, a dica para cadastrar outra pessoa mostra o mesmo ícone do botão do cabeçalho. Segure o dedo sobre um ícone do cabeçalho: aparece o nome da ação ("Adicionar usuário" ou "Sair").

### 3.2 Cadastro e edição

- [x] **2b.** Ao cadastrar, preencha os quatro campos só pelo teclado (botão "próximo"), sem tocar na tela, por mais de 30 segundos. O aviso de sessão **não** aparece enquanto você digita.
- [x] **3.** Toque em "Adicionar usuário" (ícone no cabeçalho) e cadastre "Nicoli Ferreira", login `nicoli.f`, senha `outra123`. Volta para a lista com "Usuário salvo".
- [x] **4.** Tente cadastrar mais alguém com o login ` MATHEUS ` (com espaços e em maiúsculas). Aparece "Este login já está em uso." no campo de login.
- [x] **5.** Abra Nicoli, troque o nome, deixe a senha em branco e salve. Saia e entre como `nicoli.f` / `outra123`: a senha antiga continua valendo.
- [x] **6.** Num formulário, altere um campo e toque na seta de voltar, ou use o Voltar do sistema. Aparece "Descartar alterações?", com "Descartar" e "Continuar editando".

### 3.3 Exclusão

- [x] **7.** Abra o seu próprio cadastro. Não há botão "Excluir".
- [x] **8.** Abra o cadastro de outra pessoa e toque em "Excluir". O diálogo pergunta "Excluir <nome>?". Confirme: a pessoa some da lista e aparece "Usuário excluído".

### 3.4 Login e bloqueio

- [x] **9.** Saia ("Sair" no cabeçalho). Aperte o Voltar do sistema: o app fecha ou continua no login, e nenhuma tela de dentro aparece.
- [x] **10.** Erre a senha 5 vezes. Na 6ª tentativa aparece "Muitas tentativas. Tente novamente em 30 segundos.", o botão "Entrar" fica desabilitado e a contagem diminui até zero.
- [x] **11.** Repita com um login que não existe. O comportamento é o mesmo, com a mesma mensagem de erro, para não revelar quais logins existem.

### 3.5 Sessão por inatividade

- [x] **12.** Entre e não toque em nada. Por volta dos 20 segundos aparece "Você ainda está aí?", com a contagem "Sua sessão vai expirar em N segundos.".
- [x] **13.** Toque em "Continuar conectado". O aviso fecha e o prazo de 30 segundos recomeça: o aviso só volta depois de mais 20 segundos sem uso.
- [x] **14.** Deixe o aviso chegar a zero sem tocar. O app volta ao login com a faixa "Sua sessão expirou por inatividade. Entre novamente.".
- [x] **15.** Entre, mande o app para segundo plano (botão Início) e volte depois de mais de 30 segundos. O app mostra o login com o mesmo aviso.
- [x] **16.** Feche o app por completo e abra de novo depois do prazo. Ele vai para o login sem a faixa de aviso.

## 4. Tela de erro de dados

Essa tela só aparece quando os usuários salvos não podem ser lidos. Para simular, é preciso corromper a chave `users@v1` por um momento.

### 4.1 Corromper os dados (temporário, não commitar)

1. Em `index.ts`, logo depois dos imports, acrescente:

   ```ts
   import AsyncStorage from '@react-native-async-storage/async-storage';
   void AsyncStorage.setItem('users@v1', '{');
   ```

2. Salve o arquivo e espere o app recarregar.
3. **Apague as duas linhas** e salve de novo.
4. Recarregue mais uma vez: no terminal do `npx expo start`, aperte `r`.

Os dados continuam corrompidos depois de tirar as linhas. Isso é proposital: assim o reset pode ser testado sem que o código volte a estragar os dados a cada recarga.

### 4.2 Verificar a tela e o reset

- [x] **17.** Aparece a tela "Não foi possível ler os dados", com o botão "Apagar dados e recomeçar". Não aparece "Criar primeiro usuário", e o Voltar do sistema não leva a outra tela.
- [x] **18.** Toque em "Apagar dados e recomeçar". O diálogo "Apagar todos os dados?" abre com o campo "Digite APAGAR para confirmar". O botão "Apagar" fica desabilitado com `apagar`, `APAGA` ou qualquer outra coisa diferente de `APAGAR`.
- [x] **19.** Toque em "Cancelar". O diálogo fecha e a tela de erro continua. Abra de novo: o campo vem vazio.
- [x] **20.** Digite `APAGAR` e confirme. O app volta ao login com "Criar primeiro usuário".

Antes de commitar, confira com `git diff index.ts` que as linhas do passo 4.1 saíram.

## 5. Acessibilidade e temas

Configurações do Android (os nomes variam um pouco entre fabricantes):

- **TalkBack:** Configurações > Acessibilidade > TalkBack. Dá para criar um atalho segurando os dois botões de volume.
- **Fonte grande:** Configurações > Tela > Tamanho da fonte, no máximo. Em alguns aparelhos, aumente também o "Zoom da tela".
- **Tema escuro:** pelo atalho "Tema escuro" nas configurações rápidas, ou em Configurações > Tela.
- **Reduzir movimento:** Configurações > Acessibilidade > Remover animações.

### 5.1 TalkBack

Percorra todas as telas e diálogos arrastando o dedo para a direita.

- [x] **21.** Todo botão é lido com nome e função, inclusive os que só têm ícone: "Adicionar usuário", "Sair", "Mostrar senha".
- [x] **22.** Cada campo é lido uma vez só, com o rótulo. Quando tem erro, ele é lido junto ("Login, erro: Informe o login.").
- [x] **23.** Cada linha da lista é lida como um item só, por exemplo "Matheus Mendes (você), login matheus", seguida da dica de toque duplo para editar.
- [x] **24.** O crachá da lista é lido como "Matheus Mendes, login matheus, 1 usuário cadastrado, sessão válida por…", com o número de usuários do momento. A presilha, o código de barras e o mini crachá não são lidos.
- [x] **25.** Ao salvar um formulário com erro, o foco vai para o primeiro campo errado e o erro é anunciado.
- [x] **26.** Login inválido, bloqueio, aviso de sessão, sessão expirada, "Usuário salvo", "Usuário excluído" e a tela de erro de dados são anunciados **uma vez**. A contagem do bloqueio e a do aviso de sessão **não** são lidas a cada segundo.

### 5.2 Fonte em 200% e temas

Repita uma volta rápida pelas telas com a fonte no máximo, primeiro no tema claro e depois no escuro.

- [x] **27.** Nenhum texto fica cortado ou sobreposto. O crachá da lista passa a ficar empilhado na vertical.
- [x] **28.** Um nome longo (por exemplo, um de 80 caracteres) quebra em várias linhas na lista e não termina em "…". Um login longo pode terminar em "…".
- [x] **29.** Os dois temas ficam legíveis em todas as telas, inclusive nos diálogos, no snackbar e na tela de erro.
- [x] **30.** Com "Remover animações" ligado, a troca de telas acontece sem animação.

## 6. Screenshots

Tire um print de cada tela nos dois temas, segurando Liga/Desliga + Volume para baixo. Salve em `screenshots/` com o nome `<tela>-claro.jpeg` ou `<tela>-escuro.jpeg`.

| Tela ou estado | Nome do arquivo |
|---|---|
| Login com "Criar primeiro usuário" | `login-primeiro-acesso` |
| Login com erro de senha | `login-erro` |
| Login bloqueado | `login-bloqueado` |
| Login com aviso de sessão expirada | `login-sessao-expirada` |
| Lista de usuários | `lista` |
| Novo usuário | `novo-usuario` |
| Editar usuário, com o botão "Excluir" | `editar-usuario` |
| Confirmação de exclusão | `excluir-confirmacao` |
| "Descartar alterações?" | `descartar-alteracoes` |
| Aviso "Você ainda está aí?" | `aviso-sessao` |
| Tela de erro de dados | `erro-dados` |
| Confirmação com `APAGAR` | `erro-dados-apagar` |

Depois dos prints, a seção "Screenshots" do README pode mostrar alguns deles.

**Roteiro concluído em 24/11/2026**, num Android com o Expo Go. As capturas feitas estão em [`screenshots/`](screenshots/) e aparecem no README.

## 7. Depois do roteiro

- Se tudo passou, marque T060, T061, T062 e T063 como concluídas em `specs/001-access-control/tasks.md` e o último item do checklist de acessibilidade no README.
- Se algo falhou, anote o número do passo e o que aconteceu, para corrigir antes da entrega (03/12/2026).
