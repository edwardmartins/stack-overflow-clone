"use strict";

// Transforma el resultado de la consulta SQL de preguntas
function createQuestions(rows) {
    // dict para reagrupar
    const questions = {}
    rows.forEach(question => {
        // si no existe la pregunta, la creamos 
        if (!questions[question.id]) {
            questions[question.id] = {
                id: question.id,
                tittle: question.tittle,
                body: question.q_body.length <= 150 ? question.q_body : question.q_body.substr(0, 150) + '...',
                tag_names: [],
                creation_date: question.q_created_at.toLocaleDateString(),
                user_id: question.user_id,
                user_name: question.user_name
            }
        }
        // si tiene tags los insertamos
        if (question.tag_name) {
            questions[question.id].tag_names.push(question.tag_name)
        }
    })
    // convierto el diccionario a lista para ordenar las preguntas
    let questionList = Object.values(questions)
    // ordenamos por fecha
    questionList.sort((a, b) => (new Date(a.creation_date) < new Date(b.creation_date)) ? 1 : -1)
    return questionList;
}


// Transforma el resultado de la consulta SQL de preguntas
function createQuestion(rows) {
    // dict para reagrupar
    const questions = {}
    rows.forEach(question => {
        // si no existe la pregunta, la creamos 
        if (!questions[question.id]) {
            questions[question.id] = {
                id: question.id,
                tittle: question.tittle,
                body: question.q_body,
                tag_names: [],
                creation_date: question.q_created_at.toLocaleDateString(),
                user_id: question.user_id,
                user_name: question.user_name,
                votes: question.q_votes
            }
        }
        // si tiene tags los insertamos
        if (question.tag_name) {
            questions[question.id].tag_names.push(question.tag_name)
        }
    })
    // convierto el diccionario a lista para ordenar las preguntas
    let questionList = Object.values(questions)
    return questionList;
}

module.exports = {
    createQuestions,
    createQuestion
}