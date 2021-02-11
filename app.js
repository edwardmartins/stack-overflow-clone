"use strict";
// Modulos
// ----------------------------------------------------------------------
const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);
const config = require('./config');

const authRoutes = require('./routes/auth')
const questionRoutes = require('./routes/question')
const userRoutes = require('./routes/user');
const { request, response } = require('express');

// Crear un servidor Express.js
const app = express();

// Crear un almacen de sesiones
const sessionStore = new MySQLStore({
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password,
    database: config.mysqlConfig.database
});

// Sentencias de configuracion del motor de plantillas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
// ----------------------------------------------------------------------
app.use(express.static(__dirname + '/public')); // busca y envia los recursos estaticos almacenados en public
app.use(logger('dev')) // escribe por pantalla las peticiones realizadas
app.use(bodyParser.urlencoded({ extended: false })); // procesa peticiones post añadiendo el objeto body a request
app.use(session({ // middleware para el manejo de sesiones de usuario
    saveUninitialized: false,
    secret: 'foobar34',
    resave: false,
    store: sessionStore
})) 

// Rutas
// ----------------------------------------------------------------------
app.use('/auth', authRoutes); 
app.use('/user', userRoutes);
app.use('/questions', questionRoutes);

//home page
app.get('/', (request, response) => {
    response.redirect('/auth/login');
});

// Middlewares control de errores
// ----------------------------------------------------------------------
//404 : page not found (no se ha encontrado el recurso)
app.use((request, response, next) => {
    response.status(404);
    response.render("error404", { url: request.url });
});

// Código 500: Internal server error -> cuando invocamos al parametro next(err)
app.use((error, request, response, next) => {
    response.status(500);
    response.render("error500", {
        mensaje: error.message,
        pila: error.stack
    });
});

// Inicio del servidor
// ------------------------------------------
app.listen(config.port, err => {
    if (err) {
        console.log("No se ha podido iniciar el servidor.");
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});