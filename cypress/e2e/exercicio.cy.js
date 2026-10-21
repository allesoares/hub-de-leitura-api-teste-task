/// <reference types="cypress" />

describe('Testes da Funcionalidade Catálogo de Livros', () => {

    let token
    let livroId

    beforeEach(() => {
        livroId = undefined
        cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
            token = tkn
        })
    })

    // Remover apenas o livro criado pelo teste, mesmo se alguma validação falhar.
    afterEach(() => {
        if (livroId) {
            cy.api({
                method: 'DELETE',
                url: 'books/' + livroId,
                headers: { Authorization: token }
            }).should(response => {
                expect(response.status).to.equal(200)
            })
        }
    })

    // Objetivo: Verificar que a API retorna lista de livros com paginação e filtros funcionando
    // Validar que filtros por categoria e autores funcionam corretamente
    it('GET - Deve listar livros com filtros e paginação', () => {
        cy.fixture('filtrosLivros').then(filtros => {
            let primeiroLivroId

            // Buscar a primeira página, com apenas um livro.
            cy.api({
                method: 'GET',
                url: 'books',
                qs: {
                    category: filtros.category,
                    author: filtros.author,
                    page: 1,
                    limit: 1,
                    orderBy: 'title',
                    order: 'ASC'
                }
            }).should(response => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('application/json')
                expect(response.body.books).to.be.an('array').with.length(1)
                expect(response.body.books[0].category).to.equal(filtros.category)
                expect(response.body.books[0].author).to.equal(filtros.author)
                expect(response.body.pagination.currentPage).to.equal(1)
                expect(response.body.pagination.limit).to.equal(1)
                expect(response.body.pagination.showing).to.equal(1)
                expect(response.body.pagination.total).to.be.at.least(2)
                expect(response.body.pagination.hasNext).to.equal(true)
                expect(response.body.pagination.hasPrev).to.equal(false)
            }).then(response => {
                primeiroLivroId = response.body.books[0].id
            })

            // A segunda página deve trazer outro livro com os mesmos filtros.
            cy.api({
                method: 'GET',
                url: 'books',
                qs: {
                    category: filtros.category,
                    author: filtros.author,
                    page: 2,
                    limit: 1,
                    orderBy: 'title',
                    order: 'ASC'
                }
            }).should(response => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('application/json')
                expect(response.body.books).to.be.an('array').with.length(1)
                expect(response.body.books[0].category).to.equal(filtros.category)
                expect(response.body.books[0].author).to.equal(filtros.author)
                expect(response.body.books[0].id).not.to.equal(primeiroLivroId)
                expect(response.body.pagination.currentPage).to.equal(2)
                expect(response.body.pagination.limit).to.equal(1)
                expect(response.body.pagination.showing).to.equal(1)
                expect(response.body.pagination.hasPrev).to.equal(true)
            })
        })
    });

    // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
    // Verificar que todos os campos do livro são retornados corretamente
    it('GET - Deve obter detalhes de um livro específico', () => {
        cy.fixture('livroConsulta').then(livro => {
            cy.api({
                method: 'GET',
                url: 'books/' + livro.id
            }).should(response => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('application/json')

                // Conferir se os dados pertencem ao livro consultado.
                expect(response.body.book.id).to.equal(livro.id)
                expect(response.body.book.title).to.equal(livro.title)
                expect(response.body.book.author).to.equal(livro.author)
                expect(response.body.book.category).to.equal(livro.category)
                expect(response.body.book.isbn).to.equal(livro.isbn)
                expect(response.body.book.editor).to.equal(livro.editor)
                expect(response.body.book.language).to.equal(livro.language)
                expect(response.body.book.publication_year).to.equal(livro.publication_year)
                expect(response.body.book.pages).to.equal(livro.pages)
                expect(response.body.book.format).to.equal(livro.format)
                expect(response.body.book.cover_image).to.equal(livro.cover_image)

            })
        })
    });

    // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
    // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
    it('POST - Deve cadastrar um novo livro com sucesso', () => {
        cy.fixture('livro').then(livro => {
            const titulo = livro.title + ' ' + Date.now()

            cy.cadastrarLivro(
                titulo, livro.author, livro.description, livro.category,
                livro.isbn, livro.editor, livro.language, livro.publication_year,
                livro.pages, livro.format, livro.total_copies, livro.available_copies,
                livro.cover_image, token
            ).then(response => {
                // Guardar id pra limpeza no afterEach
                livroId = response.body.book.id
            }).should(response => {
                expect(response.status).to.equal(201)
                expect(response.headers['content-type']).to.include('application/json')
                expect(response.body).to.have.property('message', 'Livro criado com sucesso.')
                expect(response.body).to.have.property('book').that.is.an('object')
                expect(response.body.book.id).to.be.a('number').and.be.above(0)
                expect(response.body.book.title).to.equal(titulo)
                expect(response.body.book.author).to.equal(livro.author)
                expect(response.body.book.category).to.equal(livro.category)
                expect(response.body.book.total_copies).to.equal(livro.total_copies)
                expect(response.body.book.available_copies).to.equal(livro.available_copies)
                expect(response.body.book.created_at).to.be.a('string').and.not.be.empty
            }).then(() => {
                // Confirmar livro salvo
                cy.api({
                    method: 'GET',
                    url: 'books/' + livroId
                }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.book.id).to.equal(livroId)
                    expect(response.body.book.title).to.equal(titulo)
                    expect(response.body.book.author).to.equal(livro.author)
                    expect(response.body.book.description).to.equal(livro.description)
                    expect(response.body.book.pages).to.equal(livro.pages)
                })
            })
        })
    });

    // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
    // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
    it('POST -  Deve rejeitar livro com dados inválidos', () => {
        cy.fixture('livro').then(livro => {
            cy.api({
                method: 'POST',
                url: 'books',
                headers: { Authorization: token },
                body: {
                    title: '',
                    author: livro.author
                },
                failOnStatusCode: false
            }).then(response => {
                if (response.body.book) {
                    livroId = response.body.book.id
                }
            }).should(response => {
                expect(response.status).to.equal(400)
                expect(response.headers['content-type']).to.include('application/json')
                expect(response.body).to.have.property('field', 'title')
                expect(response.body).to.have.property('message').that.is.a('string').and.not.be.empty
                expect(response.body.message).to.include('title')
            })
        })
    });

    // Objetivo: Validar que um livro pode ser atualizado com sucesso
    // Verificar que apenas admin pode atualizar livros (validação de permissão)
    it('PUT - Deve atualizar um livro previamente cadastrado', () => {
        cy.fixture('livro').then(livro => {
            const titulo = livro.title + ' ' + Date.now()

            // Criar um livro próprio para este teste.
            cy.cadastrarLivro(
                titulo, livro.author, livro.description, livro.category,
                livro.isbn, livro.editor, livro.language, livro.publication_year,
                livro.pages, livro.format, livro.total_copies, livro.available_copies,
                livro.cover_image, token
            ).then(response => {
                livroId = response.body.book.id
                expect(response.status).to.equal(201)

                cy.api({
                    method: 'PUT',
                    url: 'books/' + livroId,
                    headers: { Authorization: token },
                    body: {
                        title: titulo + ' - atualizado',
                        author: livro.author,
                        total_copies: 5,
                        available_copies: 5
                    }
                }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.headers['content-type']).to.include('application/json')
                    expect(response.body).to.have.property('message', 'Livro atualizado com sucesso.')
                    expect(response.body.bookId).to.equal(livroId)
                    expect(response.body.updatedFields).to.be.an('array')
                    expect(response.body.updatedFields).to.include('title')
                })

                // Consultar novamente para confirmar que os novos valores foram salvos.
                cy.api({
                    method: 'GET',
                    url: 'books/' + livroId
                }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.book.id).to.equal(livroId)
                    expect(response.body.book.title).to.equal(titulo + ' - atualizado')
                    expect(response.body.book.author).to.equal(livro.author)
                    expect(response.body.book.total_copies).to.equal(5)
                    expect(response.body.book.available_copies).to.equal(5)
                })
            })
        })
    });

    // Objetivo: Validar que um livro pode ser removido do catálogo
    // Verificar que apenas admin pode deletar livros (validação de permissão)
    it('DELETE - Deve deletar um livro previamente cadastrado', () => {
        cy.fixture('livro').then(livro => {
            const titulo = livro.title + ' ' + Date.now()

            cy.cadastrarLivro(
                titulo, livro.author, livro.description, livro.category,
                livro.isbn, livro.editor, livro.language, livro.publication_year,
                livro.pages, livro.format, livro.total_copies, livro.available_copies,
                livro.cover_image, token
            ).then(response => {
                livroId = response.body.book.id
                expect(response.status).to.equal(201)
                const idParaExcluir = livroId

                cy.api({
                    method: 'DELETE',
                    url: 'books/' + idParaExcluir,
                    headers: { Authorization: token }
                }).then(response => {
                    if (response.status === 200) {
                        // Se a exclusão foi bem-sucedida, limpar o livroId para evitar tentativa de exclusão no afterEach
                        livroId = undefined
                    }
                }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.headers['content-type']).to.include('application/json')
                    expect(response.body).to.have.property('message', 'Livro deletado com sucesso.')
                    expect(response.body).to.have.property('deletedBook').that.is.an('object')
                    expect(response.body.deletedBook.id).to.equal(idParaExcluir)
                    expect(response.body.deletedBook.title).to.equal(titulo)
                    expect(response.body.deletedBook.author).to.equal(livro.author)
                })

                cy.api({
                    method: 'GET',
                    url: 'books/' + idParaExcluir,
                    failOnStatusCode: false
                }).should(response => {
                    expect(response.status).to.equal(404)
                    expect(response.headers['content-type']).to.include('application/json')
                    expect(response.body).to.have.property('message', 'Livro não encontrado.')
                    expect(response.body.bookId).to.equal(idParaExcluir)
                })
            })
        })
    });
});
