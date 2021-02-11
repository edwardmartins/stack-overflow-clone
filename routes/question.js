// Modulos 
// ----------------------------------------------------------------------
const { response, request } = require('express');
const express = require('express') // modulo express
const mysql = require('mysql') // modulo mysql para llamadas a BD
const config = require("../config"); // configuracion
const DaoQuest = require("../dao/DaoQuestion"); // dao de pregunta
const isLogged = require("../middlewares").isLogged

// Inicializamos pool de conexiones
const pool = mysql.createPool(config.mysqlConfig);
// Creacion de la subaplicacion con sus propios middlewares
const router = express.Router();
// Creacion del Dao
const daoQuest = new DaoQuest(pool)

// Añadimos el middleware que requiere estar logeado para ver las preguntas
// ----------------------------------------------------------------------
router.use(isLogged)

// Llamada a las rutas
// ----------------------------------------------------------------------



router.get('/', (request, response, next) => {

    daoQuest.getAllQuestions((error, result) => {
        if (error) {
            return next(error)
        }

        let query = 'Todas las preguntas'
        response.render('questions', { questionList: result, totalQuestions: result.length, query: query })
    })

})

router.get('/search', (request, response, next) => {
    let seacrhTerm = request.query.searchInput

    daoQuest.findQuestionByText(seacrhTerm, (error, result) => {
        if (error) {
            return next(error)
        }

        let query = 'Resultados de la busqueda "' + seacrhTerm + '"'
        response.render('questions', { questionList: result, totalQuestions: result.length, query: query })
    })
})

router.get('/tags/:tagName', (request, response, next) => {

    let tagSearched = request.params.tagName;

    daoQuest.findQuestionByTag(tagSearched, (error, result) => {
        if (error) {
            return next(error)
        }

        let query = 'Preguntas con la etiqueta [' + tagSearched + ']'
        response.render('questions', { questionList: result, totalQuestions: result.length, query: query })
    })

})

router.get('/noanswer', (request, response, next) => {

    daoQuest.getQuestionsWithNoAnswer((error, result) => {
        if (error) {
            return next(error)
        }

        let query = 'Preguntas sin responder'
        response.render('questions', { questionList: result, totalQuestions: result.length, query: query })
    })

})


// Examennnnnnnnnnnnn
//----------------------------------------------------------
router.get('/create', (request, response, next) => {
    daoQuest.getTags((error, tags) =>{
        if (error) {
            return next(error)
        }
        response.render('question_form', {tags: tags});
    })
})

//----------------------------------------------------------

router.post('/create', (request, response, next) => {
    // creamos array de tags
    let tags = []
    let pattern = /@\w+/g
    // devuelve null si no matchea ningun tag del tipo @tag
    let tagsMatched = request.body.tags.match(pattern)

    if (tagsMatched) {
        tagsMatched = tagsMatched.slice(0, 5) // maximo 5 tags
        tags = tagsMatched
        tags = tags.map(tag => tag.substring(1))
    }
    // creamos el objeto pregunta
    let question = {
        user: request.session.currentUser,
        tittle: request.body.tittle,
        body: request.body.body,
        tags: tags
    }
    // llamamos al Dao
    daoQuest.createQuestion(question, (error, inserted) => {
        if (error) {
            return next(error)
        }
        response.redirect('/questions')
    })
})

router.get('/question/:id', (request, response, next) => {

    daoQuest.getQuestion(request.params.id, (error, question) => {
        if (error) {
            return next(error)
        }

        daoQuest.getAnserwsFromQuestion(request.params.id, (error, answers) => {
            if (error) {
                return next(error)
            }

            daoQuest.questionVisits(request.params.id, request.session.currentUser, (error, visits) => {
                if (error) {
                    return next(error)
                }

                response.render('question_details', { question: question, answers: answers, visits: visits })
            })
        })
    })
})

router.post('/insertAnswer', (request, response, next) => {

    let answer = {
        body: request.body.answerBody,
        questionId: request.body.questionId,
        userId: request.body.userId,
    }

    daoQuest.insertAnswer(answer, (error, inserted) => {
        if (error) {
            return next(error)
        }
        // redirigimos al usuario a todas las preguntas
        response.redirect('/questions') // ruta absoluta importante
    })
})

// Votos
// ----------------------------------------------------------------------------------------------------------

router.get('/uparrowq/:questionId', (request, response, next) => {
    daoQuest.positiveVoteQuestion(request.params.questionId, request.session.currentUser, (error, updated) => {
        if (error) {
            return next(error)
        }
        response.redirect('/questions/question/' + request.params.questionId)
    })
})

router.get('/downarrowq/:questionId', (request, response, next) => {
    daoQuest.negativeVoteQuestion(request.params.questionId, request.session.currentUser, (error, updated) => {
        if (error) {
            return next(error)
        }
        response.redirect('/questions/question/' + request.params.questionId)
    })
})

router.get('/uparrowa/:answerId', (request, response, next) => {

    daoQuest.positiveVoteAnswer(request.params.answerId, request.session.currentUser, (error, updated) => {
        if (error) {
            return next(error)
        }
        daoQuest.getQuestionIdFromAnswer(request.params.answerId, (error, questionId) =>{
            if (error) {
                return next(error)
            }
            response.redirect('/questions/question/' + questionId)
        })
    })
})

router.get('/downarrowa/:answerId', (request, response, next) => {

    daoQuest.negativeVoteAnswer(request.params.answerId, request.session.currentUser, (error, updated) => {
        if (error) {
            return next(error)
        }

        daoQuest.getQuestionIdFromAnswer(request.params.answerId, (error, questionId) =>{
            if (error) {
                return next(error)
            }
            response.redirect('/questions/question/' + questionId)
        })
    })
})

// Exportamos modulo
module.exports = router