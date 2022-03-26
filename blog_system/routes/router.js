const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');

//http://localhost:3000/api/sign-up
router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {

    db.query(`SELECT * FROM users WHERE LOWER(username) = LOWER(${req.body.username};)`, (err, result) => {
        if(result && result.length){
            return res.status(409).send({
                message: 'This username is already in use!',
            });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) {
                    throw err;
                    return res.status(500).send({
                        message: err,
                    });
                } else {
                    db.query(
                        `INSERT INTO users (id, username, password, registered) VALUES ('${uuid.v4()}', 
                        ${db.escape(req.body.username)}, ${db.escape(hash)}, now())`,

                        (err, result) => {
                        if(err) {
                            throw err;
                            return res.status(400).send({
                                message: err,
                            });
                        }
                        return res.status(201).send({
                            message: 'Registered!',
                        });
                    });
                }
            });
        }
    });

});

//http://localhost:3000/api/login
router.post('/login', (req, res, next) => {
    db.query(`SELECT * FROM users WHERE username = ${db.escape(req.body.username)};`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        if(!result.length) {
            return res.status(400).send({
                message: 'Username or password incorrect! '
            });
        }

        bcrypt.compare(req.body.password, result[0]['password'], (bErr, bResult) => {
            if(bErr) {
                throw bErr;
                return res.status(400).send({
                    message: 'Username or password incorrect! '
                });
            }
            if(bResult) {
                const token = jwt.sign({
                    username: result[0].username,
                    userId: result[0].id,
                },
                "SECRETKEY", 
                {expiresIn: "7d"}

                );

                db.query(`UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`);
                return res.status(200).send({
                    message: 'Logged in!',
                    token,
                    user: result[0]
                });
            }
            return res.status(401).send({
                message: 'Username or password incorrect!',
            });
        });
    });
});

//http://localhost:3000/api/getuser
router.get('/getuser', (req, res, next) => {
    db.query(`SELECT * FROM users WHERE id='${req.body.id}';`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(200).send({
            result
        });
    });
});

//http://localhost:3000/api/getusers
router.get('/getusers', (req, res, next) => {
    db.query(`SELECT * FROM users`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(200).send({
            result
        });
    });
});

//http://localhost:3000/api/post
router.post('/post', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(
        `INSERT INTO posts (title, content, categorie, user, created) VALUES (${db.escape(req.body.title)}, 
        ${db.escape(req.body.content)}, ${db.escape(req.body.categorie)}, 
        ${db.escape(req.userData.username)}, now())`,
        (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Post Created!',
        });
    });
});

//http://localhost:3000/api/singlepost
router.put('/editpost', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(`UPDATE posts SET title = ${db.escape(req.body.title)}, 
    content = ${db.escape(req.body.content)}, categorie = ${db.escape(req.body.categorie)} 
    WHERE id=${db.escape(req.body.id)}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            result,
        });
    });
});

//http://localhost:3000/api/getposts
router.get('/getposts', (req, res, next) => {
    db.query(`SELECT * FROM posts`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(200).send({
            posts: result,
        });
    });
});

//http://localhost:3000/api/singlepost
router.get('/singlepost/:id', (req, res, next) => {
    const { id } = req.params;
    db.query(`SELECT * FROM posts WHERE id=${id}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            result,
        });
    });
});

//http://localhost:3000/api/deletepost
router.delete('/deletepost', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(`DELETE FROM posts WHERE id=${db.escape(req.body.id)}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Post Deleted!',
        });
    });
});

//http://localhost:3000/api/getcategories
router.get('/getcategories', (req, res, next) => {
    db.query(`SELECT * FROM categories`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(200).send({
            result,
        });
    });
});

//http://localhost:3000/api/postcategorie
router.post('/postcategorie', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(
        `INSERT INTO categories (name) VALUES (${db.escape(req.body.name)})`,
        (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Categorie Created!',
        });
    });
});

//http://localhost:3000/api/deletecategorie
router.delete('/deletecategorie', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(`DELETE FROM categories WHERE id=${db.escape(req.body.id)}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Categorie Deleted!',
        });
    });
});

//http://localhost:3000/api/singlepost
router.get('/singlecategorie', (req, res, next) => {
    db.query(`SELECT * FROM posts WHERE categorie=${db.escape(req.body.categorie)}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            result,
        });
    });
});

//http://localhost:3000/api/getnotes
router.get('/getnotes', (req, res, next) => {
    db.query(`SELECT * FROM notes`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(200).send({
            result,
        });
    });
});

//http://localhost:3000/api/postnote
router.post('/postnote', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(
        `INSERT INTO notes (content, user) VALUES (${db.escape(req.body.content)}, 
        ${db.escape(req.userData.username)})`,
        (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Note Created!',
        });
    });
});

//http://localhost:3000/api/deletenote
router.delete('/deletenote', userMiddleware.isLoggedIn, (req, res, next) => {
    db.query(`DELETE FROM notes WHERE id=${db.escape(req.body.id)}`, (err, result) => {
        if(err) {
            throw err;
            return res.status(400).send({
                message: err,
            });
        }
        return res.status(201).send({
            message: 'Note Deleted!',
        });
    });
});

//http://localhost:3000/api/status
router.get('/status', userMiddleware.isLoggedIn, (req, res, next) => {
    return res.status(200).send(
        'User logged in!'
    );
});

module.exports = router;