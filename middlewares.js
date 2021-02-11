'use strict'

const mysql = require('mysql')
const config = require("./config");
const DaoUser = require("./dao/DaoUser");
const pool = mysql.createPool(config.mysqlConfig);
const daoUser = new DaoUser(pool);

// Middleware para comprobar si un usuario esta logeado
const isLogged = function (request, response, next) {
    if (request.session.currentUser) { // currentUser lleva el Id del usuario
        daoUser.getUserDetails(request.session.currentUser, (error, user) => {
            if (error) {
                return next(error)
            }
            response.locals.userName = user.user_name
            response.locals.userId = user.id
            next() // Saltar al siguiente middleware
        })
    }
    else {
        response.redirect('/auth/login')
    }
}

module.exports = { isLogged }