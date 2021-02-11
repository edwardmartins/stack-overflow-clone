"use strict"


class DaoUser {

    constructor(pool) {
        this.pool = pool;
    }

    // EXamennnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
    getUsers(callback){
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `SELECT *
            FROM user `

            conn.query(sql, userId, (err, rows) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }

                callback(null, rows)
            })
        })
    }

    insertMessage(mensaje){
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `INSERT INTO mensaje(emisor,receptor,texto) values(?,?,?)`

            conn.query(sql, [mensaje.emisor, mensaje.receptor, mensaje.texto], (err, rows) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }

                callback(null, rows)
            })
        })
    }


    getMessagesFromUser(userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `SELECT *
                       FROM mensaje 
                       WHERE receptor = ?
                       ORDER BY fecha_hora`

            conn.query(sql, userId, (err, rows) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }

                let mensajes = []
                rows.forEach(row => {
                    let mensaje = {
                        id: row.id,
                        emisor: row.emisor,
                        receptor: row.receptor,
                        texto: row.texto,
                        fecha: row.fecha_hora.toLocaleDateString(),
                        hora: row.fecha_hora.toLocaleTimeString()
                    }
                    mensajes.push(mensaje)
                });
                
                callback(null, mensajes)
            })

        });
    }

    deleteMessage(idMensaje, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `DELETE
                       FROM mensaje 
                       WHERE id = ?`

            conn.query(sql, idMensaje, (err, result) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }
                
                callback(null, result)
            })

        });
    }

    // ----------------------------------------------------------
    checkCredentials(email, pass, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err);
                return
            }

            let sql = 'SELECT id, email, password FROM user WHERE email=?';

            conn.query(sql, [email, pass], (err, result) => {
                conn.release();
                if (err) {
                    callback(err)
                    return
                }

                if (result[0] && (result[0].email === email && result[0].password === pass)) {
                    callback(null, result[0].id)
                }
                else {
                    callback(null, 0);
                }

            })
        })
    }

    createUser(user, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = 'INSERT INTO user(email, password, user_name, image) VALUES (?,?,?,?)';

            conn.query(sql, [user.email, user.password, user.name, user.image], (err, result) => {
                conn.release();
                if (err) {
                    callback(err);
                    return
                }
                callback(null, result.insertId)
            });

        });
    }

    getUserDetails(userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = 'SELECT * FROM user WHERE id=?'

            conn.query(sql, userId, (err, result) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }
                result[0].user_created_at = result[0].user_created_at.toLocaleDateString();
                callback(null, result[0])
            })

        });
    }

    emailExists(userEmail, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }
            let sql = 'SELECT email FROM user WHERE email=?'

            conn.query(sql, userEmail, (err, result) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }
                callback(null, result[0])
            })
        });
    }

    questionsNumber(userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `SELECT COUNT(user_id) as numberOfQuestions
                        FROM question WHERE user_id =?`

            conn.query(sql, userId, (err, res) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }
                callback(null, res[0].numberOfQuestions)
            })
        })
    }

    answerNumber(userId, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err)
                return
            }

            let sql = `SELECT COUNT(user_id) as numberOfAnswers
                        FROM answer WHERE user_id =?`

            conn.query(sql, userId, (err, res) => {
                conn.release()
                if (err) {
                    callback(err);
                    return
                }
                callback(null, res[0].numberOfAnswers)
            })
        })
    }

}

module.exports = DaoUser;