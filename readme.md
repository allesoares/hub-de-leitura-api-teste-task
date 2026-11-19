# Testes da API do catálogo de livros

Usei o Cypress para testar a API REST do Hub de Leitura, passando pelas operações de consulta, cadastro, atualização e exclusão de livros. Além do status HTTP, conferi o conteúdo das respostas, os filtros, a paginação e a persistência dos dados.

**Tecnologias:** Cypress, JavaScript e cypress-plugin-api.

## O que foi implementado

Os seis cenários do exercício estão em [exercicio.cy.js](cypress/e2e/exercicio.cy.js):

| Operação | Verificação principal |
| --- | --- |
| Listar livros | Filtros por categoria e autor, paginação e ordenação |
| Consultar um livro | Dados completos do livro esperado |
| Cadastrar | Status 201 e consulta do livro criado |
| Enviar dados inválidos | Status 400 e mensagem do campo rejeitado |
| Atualizar | Alterações persistidas no livro criado pelo teste |
| Excluir | Remoção do livro criado pelo teste |

Os [comandos customizados](cypress/support/commands.js) cuidam da autenticação e de operações reutilizadas. Os testes removem os livros que criam. O arquivo `usuarios.cy.js` mantém os exemplos de usuários fornecidos na aula.

## Como executar

Tenha Node.js e npm instalados. Inicie a [API do Hub de Leitura](https://github.com/allesoares/hub-de-leitura-api), conforme o README dela, em `http://localhost:3000`. A configuração dos testes usa a base `http://localhost:3000/api/`.

Na pasta deste projeto:

```powershell
npm ci
npx cypress run --spec "cypress/e2e/exercicio.cy.js"
```

Para executar todos os arquivos, use `npm test`. Para abrir a interface, use `npx cypress open`.

Os cenários dependem da conta administrativa de demonstração e do catálogo de aula. Confira os dados esperados em [livroConsulta.json](cypress/fixtures/livroConsulta.json) e [filtrosLivros.json](cypress/fixtures/filtrosLivros.json): a consulta usa o livro de ID 1, e a paginação exige pelo menos dois livros que atendam aos filtros. Se a base estiver diferente, ajuste o ambiente de teste ou as fixtures antes de executar.

## Referência no Postman

A [collection do catálogo de livros](https://github.com/allesoares/hub-de-leitura-api/blob/main/postman/Hub-de-Leitura-Catalogo-Livros.postman_collection.json) reúne as requisições usadas como referência para os testes manuais.

## Contexto

Exercício desenvolvido por Alexandre Soares durante o curso da EBAC, com a aplicação e os exemplos fornecidos nas aulas.

[Voltar ao portfólio](https://github.com/allesoares/qa-portfolio)
