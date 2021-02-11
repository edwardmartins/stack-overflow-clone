"use strict"
// Modulos 
// ----------------------------------------------------------------------
const express = require('express')
const mysql = require('mysql')
const path = require('path')
const config = require("../config");
const DaoUser = require("../dao/DaoUser");
const isLogged = require("../middlewares").isLogged

// Inicializamos pool de conexiones
const pool = mysql.createPool(config.mysqlConfig);

// Creacion de la subaplicacion con sus propios middlewares
const router = express.Router();

// Creacion del Dao
const daoUser = new DaoUser(pool);

// Añadimos el middleware que requiere estar logeado 
// ----------------------------------------------------------------------
router.use(isLogged)

router.get('/index', (request, response) => {
    response.render('index')
})

router.get('/image/:userId', (request, response, next) => {
    daoUser.getUserDetails(request.params.userId, (error, user) => {

        if (error) {
            return next(error);
        }

        response.sendFile(path.join(__dirname, '../uploads', user.image));
    });
})

router.get('/profile/:userId', (request, response, next) => {

    daoUser.getUserDetails(request.params.userId, (error, user) => {
        if (error) {
            return next(error);
        }
        daoUser.questionsNumber(request.params.userId, (error, questions) => {
            if (error) {
                return next(error);
            }
            daoUser.answerNumber(request.params.userId, (error, answers) => {
                if (error) {
                    return next(error);
                }
                response.render('profile', { user: user, questions: questions, answers: answers })
            })
        })
    })
})

// exportamos router
module.exports = router