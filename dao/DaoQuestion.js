"use strict"

const utils = require('../utils')

class DaoQuestion {

    constructor(pool) {
        this.pool = pool;
    }


    getTags(callback) {

        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `SELECT *
                FROM tag 
                ORDER BY tag_name ASC`

            conn.query(sql, (err, rows) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }

                let etiquetas = rows.map(row => row.tag_name)

                callback(null, etiquetas)
            })
        })

    }

    // Inserta los tags en la tablas de tags unicamente
    insertTags(tagNames, conn, callback) {
        // convertimos rowdatapacket a array
        let tags = []
        tagNames.forEach(tagName => {
            tags.push([tagName])
        });

        let sql = 'INSERT IGNORE INTO tag(tag_name) VALUES ?';

        conn.query(sql, [tags], (err, res) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null, true)
        });
    }

    // Inserta los tags y las preguntas en la tabla intermedia que los relaciona
    insertQuestionTagRelation(questionId, tagIds, conn, callback) {

        // convertimos rowdatapacket a array
        let tag_ids = []
        tagIds.forEach(tagId => {
            tag_ids.push(tagId.id)
        });

        // agrupamos el Id de la pregunta con los Ids de las etiquetas
        let questionTag = []
        tag_ids.forEach(tagId => {
            questionTag.push([questionId, tagId])
        })

        // insertamos los pares(idPregunta, idEtiqueta)
        let sql = 'INSERT INTO question_tag VALUES ?';
        conn.query(sql, [questionTag], (err, res) => {
            conn.release();
            if (err) {
                callback(err)
                return;
            }
        });
    }

    // Crea la pregunta con sus respectivos tags
    createQuestion(question, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            if (question.tags.length > 0) {
                // inserto las etiquetas
                this.insertTags(question.tags, conn, (err, res) => {
                    if (err) {
                        callback(err)
                        return
                    }

                    // inserto la pregunta
                    let sql = 'INSERT INTO question(user_id, tittle, q_body) VALUES (?,?,?)';
                    conn.query(sql, [question.user, question.tittle, question.body], (err, res) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        // obtengo el Id de la pregunta
                        let questionId = res.insertId;
                        // obtengo los Ids de las etiquetas
                        let sql2 = 'SELECT id FROM tag WHERE tag_name in(?)'

                        conn.query(sql2, [question.tags], (err, tagsIds) => {
                            if (err) {
                                callback(err)
                                return;
                            }

                            // inserto en la tabla que relaciona las etiquetas con la pregunta
                            this.insertQuestionTagRelation(questionId, tagsIds, conn, (err, res) => {
                                if (err) {
                                    callback(err)
                                    return;
                                }
                            })
                            callback(null, res)
                        })
                    });
                });
            }
            else {

                // inserto unicamente la pregunta ya que no hay etiquetas
                let sql = 'INSERT INTO question(user_id, tittle, q_body) VALUES (?,?,?)';
                conn.query(sql, [question.user, question.tittle, question.body], (err, res) => {
                    conn.release();
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, true)
                })

            }
        });
    }

    getQuestion(questionId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            // Obtengo los votos de la pregunta 
            let sql = `SELECT SUM(vote) as votes
            FROM question_vote
            WHERE question_id = ?;`

            conn.query(sql, [questionId], (err, res) => {
                if (err) {
                    callback(err);
                    return;
                }

                let votes = res[0].votes

                // Actualizo los votos de la pregunta 
                let sql2 = `UPDATE question 
                         SET q_votes = ?
                         WHERE id = ?;`

                conn.query(sql2, [votes, questionId], (err, updated) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // Obtengo la pregunta
                    let sql3 = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name, q_votes
                                FROM question 
                                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                                LEFT JOIN user ON (question.user_id = user.id)
                                LEFT JOIN tag ON (tag.id = question_tag.tag_id)
                                WHERE question.id = ?`

                    conn.query(sql3, questionId, (err, rows) => {
                        conn.release()
                        let question = utils.createQuestion(rows)
                        callback(null, question[0])
                    })

                })
            })
        })
    }

    // Obtiene todas las preguntas 
    getAllQuestions(callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name
            FROM question 
                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                LEFT JOIN user ON (question.user_id = user.id)
                LEFT JOIN tag ON (tag.id = question_tag.tag_id)`

            conn.query(sql, (err, rows) => {
                conn.release();
                let questionList = utils.createQuestions(rows)
                callback(null, questionList)
            })
        })
    }


    findQuestionByText(searchTerm, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name
            FROM question 
                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                LEFT JOIN user ON (question.user_id = user.id)
                LEFT JOIN tag ON (tag.id = question_tag.tag_id)
                WHERE tittle LIKE ? OR q_body like ?`

            conn.query(sql, ['%' + searchTerm + '%', '%' + searchTerm + '%'], (err, rows) => {
                conn.release();
                let questionList = utils.createQuestions(rows)
                callback(null, questionList)
            })
        })
    }

    findQuestionByTag(tagName, callback) {

        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT question.id
            FROM question 
                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                LEFT JOIN tag ON (tag.id = question_tag.tag_id)
                LEFT JOIN user ON (question.user_id = user.id)
                WHERE tag_name = ?`

            conn.query(sql, [tagName], (err, rows) => {

                let qids = rows.map(row => row.id)

                let sql2 = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name
                FROM question 
                    LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                    LEFT JOIN user ON (question.user_id = user.id)
                    LEFT JOIN tag ON (tag.id = question_tag.tag_id)
                    WHERE question.id IN(?)`

                conn.query(sql2, [qids], (err, rows) => {
                    conn.release();
                    let questionList = utils.createQuestions(rows)
                    callback(null, questionList)
                })
            })
        })
    }

    getQuestionsWithNoAnswer(callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT answer.question_id FROM answer`

            conn.query(sql, (err, questionIds) => {

                questionIds = questionIds.map(qid => qid.question_id)

                let sql2;
                if (questionIds.length > 0) { //si algunas estan sin responder
                    sql2 = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name
                                FROM question 
                                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                                LEFT JOIN user ON (question.user_id = user.id)
                                LEFT JOIN tag ON (tag.id = question_tag.tag_id)
                                WHERE question.id NOT IN(?)`
                }
                else { // si todas estan sin responder
                    sql2 = `SELECT question.id, tittle, q_body, tag_name, q_created_at, user_id, user_name
                                FROM question 
                                LEFT JOIN question_tag ON (question.id = question_tag.question_id)
                                LEFT JOIN user ON (question.user_id = user.id)
                                LEFT JOIN tag ON (tag.id = question_tag.tag_id)`
                }

                conn.query(sql2, [questionIds], (err, rows) => {
                    conn.release();
                    let questionList = []
                    questionList = utils.createQuestions(rows)
                    callback(null, questionList)
                })
            })
        });
    }


    getAnserwsFromQuestion(questionId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT answer.id, answer.user_id,  answer.ans_body, 
            answer.ans_created_at, user.user_name, answer.ans_votes
            FROM answer 
                LEFT JOIN user ON (answer.user_id = user.id)
                WHERE answer.question_id = ? `

            conn.query(sql, [questionId], (err, rows) => {
                // convertimos rowdatapacket a array de respuestas
                let answers = []
                rows.forEach(ansRow => {
                    let answer = {
                        id: ansRow.id,
                        body: ansRow.ans_body,
                        creationDate: ansRow.ans_created_at.toLocaleDateString(),
                        userId: ansRow.user_id,
                        userName: ansRow.user_name,
                        votes: ansRow.ans_votes
                    }
                    this.updateAnswersVotes(ansRow.id, conn, (err, votes) => {
                        answer.votes = votes
                    })
                    answers.push(answer)
                });
                conn.release()
                callback(null, answers)
            })
        });
    }

    insertAnswer(answer, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            // inserto la respuesta 
            let sql = 'INSERT INTO answer(question_id, user_id, ans_body) VALUES (?,?,?)';
            conn.query(sql, [answer.questionId, answer.userId, answer.body], (err, res) => {
                conn.release();
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, res)
            })
        })
    }

    getQuestionIdFromAnswer(answerId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }

            let sql = `SELECT answer.question_id
            FROM answer 
            WHERE answer.id= ? `

            conn.query(sql, [answerId], (err, questionId) => {
                conn.release();

                if (err) {
                    callback(err)
                    return;
                }
                callback(null, questionId[0].question_id)
            })

        })
    }

    // Visitas
    // ----------------------------------------------------------------------------------------------------------
    questionVisits(questionId, userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }
            // el ignore into no inserta duplicados
            let sql = `INSERT IGNORE INTO question_visit(question_id, user_id) VALUES (?,?)`

            conn.query(sql, [questionId, userId], (err, result) => {
                if (err) {
                    callback(err);
                    return;
                }
                // count de los usuarios que han visitado la pregunta
                let sql2 = `SELECT COUNT(question_id) as visits
                       FROM question_visit
                       WHERE question_id = ?`

                conn.query(sql2, [questionId], (err, visits) => {
                    conn.release();
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, visits[0].visits)
                })
            })
        })
    }

    // Votos
    // ----------------------------------------------------------------------------------------------------------
    positiveVoteQuestion(questionId, userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }
            // inserto filo por si no existe, el ignore into no inserta duplicados
            let sql = `INSERT IGNORE INTO question_vote(question_id, user_id, vote) VALUES (?,?,?)`

            conn.query(sql, [questionId, userId, 1], (err, inserted) => {
                conn.release()
                if (err) {
                    callback(err);
                    return;
                }
                callback(err, inserted)
            })
        })
    }


    negativeVoteQuestion(questionId, userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }
            // inserto filo por si no existe, el ignore into no inserta duplicados
            let sql = `INSERT IGNORE INTO question_vote(question_id, user_id, vote) VALUES (?,?,?)`

            conn.query(sql, [questionId, userId, -1], (err, inserted) => {
                conn.release()
                if (err) {
                    callback(err);
                    return;
                }
                callback(err, inserted)
            })
        })
    }

    updateAnswersVotes(answerId, conn, callback) {
        // sumo los votos de la respuesta que estamos actualizando
        let sql = `SELECT SUM(vote) as votes
          FROM answer_vote
          WHERE answer_id = ?;`

        conn.query(sql, [answerId], (err, res) => {
            if (err) {
                callback(err);
                return;
            }

            let votes = res[0].votes ? res[0].votes : 0

            // actualizo los votos de la respuesta en su respectiva tabla
            let sql2 = `UPDATE answer 
                      SET ans_votes = ?
                      WHERE id = ?;`

            conn.query(sql2, [votes, answerId], (err, updated) => {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, votes)
            })
        })
    }

    positiveVoteAnswer(answerId, userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }
            // inserto filo por si no existe, el ignore into no inserta duplicados
            let sql = `INSERT IGNORE INTO answer_vote(answer_id, user_id, vote) VALUES (?,?,?)`

            conn.query(sql, [answerId, userId, 1], (err, inserted) => {
                conn.release()
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, inserted)
            })
        })
    }

    negativeVoteAnswer(answerId, userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return;
            }
            // inserto filo por si no existe, el ignore into no inserta duplicados
            let sql = `INSERT IGNORE INTO answer_vote(answer_id, user_id, vote) VALUES (?,?,?)`

            conn.query(sql, [answerId, userId, -1], (err, inserted) => {
                conn.release()
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, inserted)
            })
        })
    }

}

module.exports = DaoQuestion;