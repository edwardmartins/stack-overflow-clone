"use strict"
// Modulos 
// ----------------------------------------------------------------------
const express = require('express')
const mysql = require('mysql')
const config = require("../config");
const multer = require("multer")
const path = require("path")
const DaoUser = require("../dao/DaoUser");
const { request } = require('express');
const { render } = require('ejs');

// Inicializamos pool de conexiones
const pool = mysql.createPool(config.mysqlConfig);

// Creacion de la subaplicacion con sus propios middlewares
const router = express.Router();

// Creacion del Dao
const daoUser = new DaoUser(pool);

// Middleware para el guardado de imagenes
const multerFactory = multer({ dest: path.join(__dirname, "../uploads") })


// rutas
// ----------------------------------------------------------------------
router.get('/login', (request, response) => {
    response.render('login', { errorMsg: null, registerSucces: null })
})

router.post('/login', (request, response, next) => {
    daoUser.checkCredentials(request.body.email, request.body.password, (error, userId) => {
        if (error) {
            return next(error)
        }

        if (!userId) {
            return response.render('login',
                {
                    errorMsg: 'Dirección de correo y/o contraseña no válidos',
                    registerSucces: null
                })
        }

        request.session.currentUser = userId
        response.redirect('/user/index')
    })
})

router.get('/logout', (request, response) => {
    request.session.destroy();
    response.redirect('login');
});

router.get('/register', (request, response) => {
    response.render('register', { errorMsg: null })
});

router.post('/register', multerFactory.single('image'), (request, response, next) => {

    let user = {
        email: request.body.email,
        password: request.body.password,
        name: request.body.username,
        image: request.file ? request.file.filename
            : 'defecto' + Math.floor((Math.random() * 3) + 1) + '.png'
    }

    daoUser.emailExists(user.email, (error, exists) => {

        if (exists) {
            return response.render('register',
                { errorMsg: 'Email existente, por favor introduzca otro email' })
        }

        if (request.body.password !== request.body.pass_confirm) {
            return response.render('register', { errorMsg: 'Las contraseñas no coinciden' })
        }

        daoUser.createUser(user, (error, userId) => {
            if (error) {
                return next(error)
            }

            response.render('login',
                {
                    errorMsg: null,
                    registerSucces: 'Se ha registrado con exito, introduzca sus credenciales'
                })
        });
    });
});

// exportamos
module.exports = router

