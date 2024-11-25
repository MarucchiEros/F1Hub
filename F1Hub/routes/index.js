const express = require('express');
const bcrypt = require('bcryptjs');
const os = require('os');
const router = express.Router();
const db = require('../db');
const mongoose = require('mongoose');


// --------------------------------------------------
// Connessione a MongoDB con Mongoose
// --------------------------------------------------
mongoose.connect('mongodb://localhost:27017/F1')
    .then(() => {
        console.log("Connesso a MongoDB");
    })
    .catch(err => {
        console.error("Errore di connessione MongoDB:", err);
    });

// Modello Mongoose per la collezione 'Login'
const Login = mongoose.model('Login', {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_admin: { type: Boolean, default: false }
});

// --------------------------------------------------
// Funzione di Migrazione degli Utenti da MySQL a MongoDB
// --------------------------------------------------

async function migrateUsers() {
    try {
        // Esegui la query per ottenere gli utenti dal database MySQL
        const query = 'SELECT * FROM utenti';

        // Avvolgere il db.query in una Promise per usare async/await
        const results = await new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) {
                    reject('Errore nella query MySQL: ' + err.message);
                } else {
                    resolve(results);
                }
            });
        });

        // Per ogni utente, inseriscilo in MongoDB
        for (let user of results) {
            // Verifica se l'utente esiste già nel database MongoDB
            const existingUser = await Login.findOne({ username: user.username });

            if (!existingUser) {
                // Se non esiste, aggiungilo
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const newLogin = new Login({
                    username: user.username,
                    password: hashedPassword,
                    is_admin: user.is_admin === 1 // Mapping tra MySQL e MongoDB per il campo is_admin
                });

                await newLogin.save();
                console.log(`Utente ${user.username} migrato con successo.`);
            } else {
                console.log(`L'utente ${user.username} esiste già in MongoDB.`);
            }
        }
    } catch (error) {
        console.error('Errore durante la migrazione degli utenti:', error);
    }
}

// Funzione per sincronizzare gli utenti da MySQL a MongoDB (senza eliminare utenti da MongoDB)
async function syncUsers() {
    try {
        // Esegui la query per ottenere tutti gli utenti dal database MySQL
        const query = 'SELECT * FROM utenti';

        // Avvolgere il db.query in una Promise per usare async/await
        const results = await new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) {
                    reject('Errore nella query MySQL: ' + err.message);
                } else {
                    resolve(results);
                }
            });
        });

        // Per ogni utente, inseriscilo o aggiorna in MongoDB
        for (let user of results) {
            const existingUser = await Login.findOne({ username: user.username });

            if (!existingUser) {
                // Se non esiste, aggiungilo
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const newLogin = new Login({
                    username: user.username,
                    password: hashedPassword,
                    is_admin: user.is_admin === 1 // Mapping tra MySQL e MongoDB per il campo is_admin
                });

                await newLogin.save();
                console.log(`Utente ${user.username} migrato con successo in MongoDB.`);
            }
        }
    } catch (error) {
        console.error('Errore durante la sincronizzazione degli utenti:', error);
    }
}

// Sincronizza gli utenti periodicamente, ogni 1 minuto (60000 ms)
setInterval(syncUsers, 10000); // 1 minuto

// Endpoint per avviare la sincronizzazione manualmente
router.get('/sync-users', async (req, res) => {
    try {
        await syncUsers();
        res.status(200).send('Sincronizzazione utenti completata!');
    } catch (error) {
        res.status(500).send('Errore durante la sincronizzazione utenti: ' + error.message);
    }
});

// Endpoint per avviare la migrazione degli utenti
router.get('/migrate-users', async (req, res) => {
    try {
        await migrateUsers();
        res.status(200).send('Migrazione degli utenti completata!');
    } catch (error) {
        res.status(500).send('Errore nella migrazione degli utenti: ' + error.message);
    }
});

// --------------------------------------------------
// Aggiungi un Endpoint per Avviare la Migrazione
// --------------------------------------------------
// Endpoint per avviare la migrazione degli utenti
router.get('/migrate-users', async (req, res) => {
    try {
        await migrateUsers();
        res.status(200).send('Migrazione degli utenti completata!');
    } catch (error) {
        res.status(500).send('Errore nella migrazione degli utenti: ' + error.message);
    }
});



// --------------------------------------------------
// Middleware
// --------------------------------------------------

function isAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// --------------------------------------------------
// Pagine di login, logout e registrazione
// --------------------------------------------------

router.get('/', (req, res) => {
    const username = os.userInfo().username;
    res.render('loginOrRegister', { username });
});

router.get('/login', (req, res) => {
    const username = os.userInfo().username;
    res.render('loginOrRegister', { username });
});

// Gestisci la registrazione
router.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!password) {
        return res.status(400).send('La password è obbligatoria');
    }

    try {
        db.query('SELECT * FROM utenti WHERE username = ?', [username], async (err, results) => {
            if (err) {
                return res.status(500).send('Errore durante la registrazione');
            }

            if (results.length > 0) {
                return res.status(400).send('Username già esistente');
            }

            // Aggiungi l'utente nel database MySQL
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('INSERT INTO utenti (username, password) VALUES (?, ?)', [username, hashedPassword], async (err) => {
                if (err) {
                    return res.status(500).send('Errore durante la registrazione');
                }

                // Migra l'utente appena registrato in MongoDB
                const newUser = {
                    username: username,
                    password: hashedPassword,
                    is_admin: 0  // Impostalo su 0 per default
                };

                // Verifica se l'utente esiste già in MongoDB
                const existingUser = await Login.findOne({ username: newUser.username });

                if (!existingUser) {
                    // Se non esiste, aggiungi l'utente in MongoDB
                    const newLogin = new Login({
                        username: newUser.username,
                        password: newUser.password,
                        is_admin: newUser.is_admin
                    });

                    await newLogin.save();
                    console.log(`Utente ${newUser.username} migrato con successo in MongoDB.`);
                } else {
                    console.log(`L'utente ${newUser.username} esiste già in MongoDB.`);
                }

                res.redirect('/login');
            });
        });
    } catch (error) {
        return res.status(500).send('Errore durante la registrazione');
    }
});



// Gestisci il login
router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        db.query('SELECT * FROM utenti WHERE username = ?', [username], async (err, results) => {
            if (err) {
                return res.status(500).send('Errore durante il login');
            }

            if (results.length === 0) {
                return res.status(400).send('Username non trovato');
            }

            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(400).send('Password errata');
            }

            req.session.authenticated = true;
            req.session.isAdmin = user.is_admin === 1;
            req.session.username = user.username;
            req.session.userId = user.id;
            res.redirect('/index');
        });
    } catch (error) {
        return res.status(500).send('Errore durante il login');
    }
});

// Gestisci il logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/index');
        }
        res.redirect('/login');
    });
});

// --------------------------------------------------
// Pagina principale (Index)
// --------------------------------------------------

router.get('/index', isAuthenticated, (req, res) => {
    const username = req.session.username;

    const queryScuderie = 'SELECT * FROM scuderie';
    const queryPiste = 'SELECT * FROM piste';
    const queryPiloti = `
        SELECT piloti.id, piloti.nome, piloti.cognome, piloti.numero, 
               piloti.data_nascita, 
               piloti.mondiali_vinti, 
               piloti.nazionalità, 
               scuderie.nome AS scuderia_nome
        FROM piloti
        LEFT JOIN scuderie ON piloti.scuderia_id = scuderie.id
    `;
    const queryUtenti = 'SELECT * FROM utenti';

    db.query(queryScuderie, (errScuderie, resultsScuderie) => {
        if (errScuderie) {
            return res.status(500).send('Errore nel caricamento delle scuderie');
        }

        db.query(queryPiste, (errPiste, resultsPiste) => {
            if (errPiste) {
                return res.status(500).send('Errore nel caricamento delle piste');
            }

            db.query(queryPiloti, (errPiloti, resultsPiloti) => {
                if (errPiloti) {
                    return res.status(500).send('Errore nel caricamento dei piloti');
                }

                // Formatta la data di nascita per ogni pilota
                resultsPiloti = resultsPiloti.map(pilota => {
                    const dataNascita = new Date(pilota.data_nascita);
                    pilota.data_nascita = dataNascita.toLocaleDateString('it-IT'); // Formatta la data
                    return pilota;
                });

                db.query(queryUtenti, (errUtenti, resultsUtenti) => {
                    if (errUtenti) {
                        return res.status(500).send('Errore nel caricamento degli utenti');
                    }

                    // Modifica il campo 'is_admin' in 'Admin' o 'User'
                    resultsUtenti = resultsUtenti.map(utente => {
                        utente.tipo = utente.is_admin === 1 ? 'Admin' : 'User';
                        return utente;
                    });

                    res.render('index', {
                        scuderie: resultsScuderie,
                        piste: resultsPiste,
                        piloti: resultsPiloti,
                        utenti: resultsUtenti,
                        isAdmin: req.session.isAdmin,
                        username: req.session.username
                    });
                });
            });
        });
    });
});


// --------------------------------------------------
// Aggiunta di Entità (Scuderie, Piste, Piloti, Utenti)
// --------------------------------------------------

// Gestisci l'aggiunta di una scuderia
router.post('/scuderie/add', isAuthenticated, (req, res) => {
    const { nome, sede, anno_fondazione } = req.body;

    if (!nome || !sede || !anno_fondazione) {
        return res.status(400).send('Tutti i campi sono obbligatori.');
    }

    const query = 'INSERT INTO scuderie (nome, sede, anno_fondazione) VALUES (?, ?, ?)';
    db.query(query, [nome, sede, anno_fondazione], (err) => {
        if (err) {
            return res.status(500).send('Errore durante l\'aggiunta della scuderia.');
        }
        res.redirect('/index');
    });
});

// Gestisci l'aggiunta di una pista
router.post('/piste/add', isAuthenticated, (req, res) => {
    const { paese, lunghezza, anno_inaugurazione, numero_curve } = req.body;

    if (!paese || !lunghezza || !anno_inaugurazione || !numero_curve) {
        return res.status(400).send('Tutti i campi sono obbligatori.');
    }

    const query = 'INSERT INTO piste (paese, lunghezza, anno_inaugurazione, numero_curve) VALUES (?, ?, ?, ?)';
    db.query(query, [paese, lunghezza, anno_inaugurazione, numero_curve], (err) => {
        if (err) {
            return res.status(500).send('Errore durante l\'aggiunta della pista.');
        }
        res.redirect('/index');
    });
});

// Gestisci l'aggiunta di un pilota
router.post('/piloti/add', isAuthenticated, (req, res) => {
    const { nome, cognome, numero, scuderia_id, mondiali_vinti, data_nascita, nazionalità } = req.body;

    if (!nome || !cognome || !numero || !scuderia_id || !data_nascita || !nazionalità) {
        return res.status(400).send('Tutti i campi sono obbligatori.');
    }

    const query = 'INSERT INTO piloti (nome, cognome, numero, scuderia_id, mondiali_vinti, data_nascita, nazionalità) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [nome, cognome, numero, scuderia_id, mondiali_vinti, data_nascita, nazionalità], (err) => {
        if (err) {
            return res.status(500).send('Errore durante l\'aggiunta del pilota.');
        }
        res.redirect('/index');
    });
});

// Gestisci l'aggiunta di un utente (solo per admin)
router.post('/utenti/add', isAuthenticated, async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('Accesso negato. Solo gli admin possono aggiungere utenti.');
    }

    const { username, password, is_admin } = req.body;

    if (!username || !password || is_admin === undefined) {
        return res.status(400).send('Tutti i campi sono obbligatori.');
    }

    db.query('SELECT * FROM utenti WHERE username = ?', [username], async (err, results) => {
        if (err) {
            return res.status(500).send('Errore durante la registrazione dell\'utente');
        }

        if (results.length > 0) {
            return res.status(400).send('Username già esistente.');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Aggiungi l'utente nel database MySQL
            db.query('INSERT INTO utenti (username, password, is_admin) VALUES (?, ?, ?)', [username, hashedPassword, is_admin], async (err) => {
                if (err) {
                    return res.status(500).send('Errore durante l\'aggiunta dell\'utente');
                }

                // Dopo aver aggiunto l'utente in MySQL, migra l'utente in MongoDB
                const newUser = {
                    username: username,
                    password: hashedPassword,
                    is_admin: is_admin === 1  // Impostato su true se is_admin è 1
                };

                // Verifica se l'utente esiste già in MongoDB
                const existingUser = await Login.findOne({ username: newUser.username });

                if (!existingUser) {
                    // Se non esiste, aggiungi l'utente in MongoDB
                    const newLogin = new Login({
                        username: newUser.username,
                        password: newUser.password,
                        is_admin: newUser.is_admin
                    });

                    await newLogin.save();
                    console.log(`Utente ${newUser.username} migrato con successo in MongoDB.`);
                } else {
                    console.log(`L'utente ${newUser.username} esiste già in MongoDB.`);
                }

                res.redirect('/index');
            });
        } catch (error) {
            return res.status(500).send('Errore durante la registrazione dell\'utente');
        }
    });
});


// --------------------------------------------------
// Elimina Entità (Scuderie, Piste, Piloti, Utenti)
// --------------------------------------------------

// Gestisci l'eliminazione scuderia
router.delete('/delete/scuderia/:id', isAuthenticated, (req, res) => {
    const scuderiaId = req.params.id;
    if (!req.session.isAdmin) {
        return res.status(403).send('Accesso negato. Solo gli admin possono eliminare dati.');
    }

    const query = 'DELETE FROM scuderie WHERE id = ?';
    db.query(query, [scuderiaId], (err) => {
        if (err) {
            return res.status(500).send('Errore nell\'eliminazione della scuderia');
        }
        res.sendStatus(200);
    });
});

// Gestisci l'eliminazione pista
router.delete('/delete/pista/:id', isAuthenticated, (req, res) => {
    const pistaId = req.params.id;
    if (!req.session.isAdmin) {
        return res.status(403).send('Accesso negato. Solo gli admin possono eliminare dati.');
    }

    const query = 'DELETE FROM piste WHERE id = ?';
    db.query(query, [pistaId], (err) => {
        if (err) {
            return res.status(500).send('Errore nell\'eliminazione della pista');
        }
        res.sendStatus(200);
    });
});

// Gestisci l'eliminazione pilota
router.delete('/delete/pilota/:id', isAuthenticated, (req, res) => {
    const pilotaId = req.params.id;
    if (!req.session.isAdmin) {
        return res.status(403).send('Accesso negato. Solo gli admin possono eliminare dati.');
    }

    const query = 'DELETE FROM piloti WHERE id = ?';
    db.query(query, [pilotaId], (err) => {
        if (err) {
            return res.status(500).send('Errore nell\'eliminazione del pilota');
        }
        res.sendStatus(200);
    });
});

// Gestisci l'eliminazione utente
router.delete('/delete/utente/:id', isAuthenticated, (req, res) => {
    const utenteId = req.params.id;
    const sessioneUtenteId = req.session.userId;

    // Controlla che l'utente non stia cercando di eliminare se stesso
    if (utenteId == sessioneUtenteId) {
        return res.status(400).send('Non puoi eliminare te stesso.');
    }

    // Controlla che l'utente sia un admin
    if (!req.session.isAdmin) {
        return res.status(403).send('Accesso negato. Solo gli admin possono eliminare dati.');
    }

    const query = 'DELETE FROM utenti WHERE id = ?';
    db.query(query, [utenteId], (err) => {
        if (err) {
            return res.status(500).send('Errore nell\'eliminazione dell\'utente');
        }
        res.sendStatus(200);
    });
});

// --------------------------------------------------
// Gestione Preferiti (Aggiungi, Rimuovi e Visualizza)
// --------------------------------------------------

// Gestisci l'aggiunta ai preferiti
router.post('/preferiti/add', isAuthenticated, (req, res) => {
    const { elemento_id, tipo_elemento } = req.body;
    const utente_id = req.session.userId;

    const validTypes = ['scuderia', 'pilota', 'pista'];
    if (!validTypes.includes(tipo_elemento)) {
        return res.status(400).json({ message: 'Tipo di elemento non valido.' });
    }

    if (!elemento_id || !utente_id) {
        return res.status(400).json({ message: 'Elemento ID o utente ID mancanti.' });
    }

    // Verifica se l'elemento è già nei preferiti
    let queryCheck = '';
    if (tipo_elemento === 'pilota') {
        queryCheck = 'SELECT 1 FROM preferiti WHERE utente_id = ? AND pilota_id = ?';
    } else if (tipo_elemento === 'scuderia') {
        queryCheck = 'SELECT 1 FROM preferiti WHERE utente_id = ? AND scuderia_id = ?';
    } else if (tipo_elemento === 'pista') {
        queryCheck = 'SELECT 1 FROM preferiti WHERE utente_id = ? AND pista_id = ?';
    }

    db.query(queryCheck, [utente_id, elemento_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel controllo dei preferiti.' });
        }

        // Se l'elemento esiste già nei preferiti, restituiamo un errore
        if (results.length > 0) {
            return res.status(400).json({ message: 'Questo elemento è già nei tuoi preferiti.' });
        }

        // Procediamo con l'inserimento nei preferiti
        let queryInsert = '';
        let params = [utente_id];

        if (tipo_elemento === 'pilota') {
            queryInsert = 'INSERT INTO preferiti (utente_id, pilota_id, created_at) VALUES (?, ?, ?)';
            params.push(elemento_id, new Date());
        } else if (tipo_elemento === 'scuderia') {
            queryInsert = 'INSERT INTO preferiti (utente_id, scuderia_id, created_at) VALUES (?, ?, ?)';
            params.push(elemento_id, new Date());
        } else if (tipo_elemento === 'pista') {
            queryInsert = 'INSERT INTO preferiti (utente_id, pista_id, created_at) VALUES (?, ?, ?)';
            params.push(elemento_id, new Date());
        }

        db.query(queryInsert, params, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Errore durante l\'aggiunta ai preferiti.' });
            }
            return res.status(200).json({ message: 'Aggiunto ai preferiti con successo!' });
        });
    });
});


// Recuperi in modo dinamico i preferiti
router.get('/preferiti', isAuthenticated, (req, res) => {
    const utente_id = req.session.userId;
    const query = `
        SELECT pf.id, 
               pf.scuderia_id, pf.pilota_id, pf.pista_id,
               s.nome AS scuderia_nome, s.sede AS scuderia_sede, s.anno_fondazione AS scuderia_anno_fondazione,
               p.nome AS pilota_nome, p.cognome AS pilota_cognome, p.numero AS pilota_numero, 
               t.paese AS pista_paese, t.lunghezza AS pista_lunghezza, t.numero_curve AS pista_numero_curve
        FROM preferiti pf
        LEFT JOIN scuderie s ON pf.scuderia_id = s.id
        LEFT JOIN piloti p ON pf.pilota_id = p.id
        LEFT JOIN piste t ON pf.pista_id = t.id
        WHERE pf.utente_id = ?
    `;

    db.query(query, [utente_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel recupero dei preferiti.' });
        }

        const preferiti = results.map(item => {
            if (item.scuderia_nome) {
                return {
                    tipo: 'scuderia',
                    id: item.scuderia_id,
                    nome: item.scuderia_nome,
                    sede: item.scuderia_sede || 'Non disponibile',
                    anno_fondazione: item.scuderia_anno_fondazione || 'Non disponibile'
                };
            } else if (item.pilota_nome) {
                return {
                    tipo: 'pilota',
                    id: item.pilota_id,
                    nome: item.pilota_nome,
                    cognome: item.pilota_cognome,
                    numero: item.pilota_numero || 'Non disponibile'
                };
            } else if (item.pista_paese) {
                return {
                    tipo: 'pista',
                    id: item.pista_id,
                    paese: item.pista_paese,
                    lunghezza: item.pista_lunghezza || 'Non disponibile',
                    numero_curve: item.pista_numero_curve || 'Non disponibile'
                };
            }
        }).filter(item => item !== undefined);
        res.json(preferiti);
    });
});

// Gestisci la rimozioni dei preferiti
router.post('/preferiti/remove', isAuthenticated, (req, res) => {
    const { elemento_id, tipo_elemento } = req.body;
    const utente_id = req.session.userId;

    if (!elemento_id || !tipo_elemento || !utente_id) {
        return res.status(400).json({ message: 'Dati mancanti.' });
    }

    let queryDelete;
    let params = [utente_id];

    if (tipo_elemento === 'pilota') {
        queryDelete = 'DELETE FROM preferiti WHERE utente_id = ? AND pilota_id = ?';
        params.push(elemento_id);
    } else if (tipo_elemento === 'scuderia') {
        queryDelete = 'DELETE FROM preferiti WHERE utente_id = ? AND scuderia_id = ?';
        params.push(elemento_id);
    } else if (tipo_elemento === 'pista') {
        queryDelete = 'DELETE FROM preferiti WHERE utente_id = ? AND pista_id = ?';
        params.push(elemento_id);
    }

    db.query(queryDelete, params, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nella rimozione dal preferito.' });
        }
        res.status(200).json({ message: 'Preferito rimosso con successo!' });
    });
});


// --------------------------------------------------
// Modifica dati DB
// --------------------------------------------------


// aggiorna la tabella scuderie
router.post('/update/scuderie', async (req, res) => {
    const { id, data } = req.body;
    console.log('Data ricevuta per aggiornamento scuderie:', data);

    try {
        if (!id || !data) {
            return res.status(400).json({ success: false, message: 'ID o dati mancanti' });
        }

        const query = 'UPDATE scuderie SET nome = ?, sede = ?, anno_fondazione = ? WHERE id = ?';
        const values = [data.nome, data.sede, data.anno_fondazione, id];

        console.log('Eseguendo query:', query);
        console.log('Con valori:', values);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Errore nella query:', err);
                return res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Nessuna riga aggiornata' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: error.message });
    }
});



// aggiorna la tabella utenti
router.post('/update/utenti', async (req, res) => {
    const { id, data } = req.body;
    console.log('Data ricevuta per aggiornamento utenti:', data);

    try {
        if (!id || !data) {
            return res.status(400).json({ success: false, message: 'ID o dati mancanti' });
        }

        const query = 'UPDATE utenti SET username = ?, password = ?, is_admin = ? WHERE id = ?';
        const values = [
            data.username,
            data.password,
            data.is_admin,
            id
        ];

        console.log('Eseguendo query:', query);
        console.log('Con valori:', values);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Errore nella query:', err);
                return res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Nessuna riga aggiornata' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: error.message });
    }
});



// aggiorna la tabella piste
router.post('/update/piste', async (req, res) => {
    console.log('Richiesta arrivata a: /update/piste');
    const { id, data } = req.body;
    console.log('Data ricevuta per aggiornamento piste:', data);

    try {
        if (!id || !data) {
            return res.status(400).json({ success: false, message: 'ID o dati mancanti' });
        }

        const query = 'UPDATE piste SET paese = ?, lunghezza = ?, anno_inaugurazione = ?, numero_curve = ? WHERE id = ?';
        const values = [
            data.paese,
            data.lunghezza,
            data.anno_inaugurazione,
            data.numero_curve,
            id
        ];

        console.log('Eseguendo query:', query);
        console.log('Con valori:', values);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Errore nella query:', err);
                return res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Nessuna riga aggiornata' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: error.message });
    }
});


// aggiorna la tabella piloti
router.post('/update/piloti', async (req, res) => {
    const { id, data } = req.body;
    console.log('Data ricevuta per aggiornamento piloti:', data);

    try {
        if (!id || !data) {
            return res.status(400).json({ success: false, message: 'ID o dati mancanti' });
        }

        const query = `
            UPDATE piloti 
            SET nome = ?, cognome = ?, numero = ?, scuderia_id = ?, mondiali_vinti = ?, data_nascita = ?, nazionalità = ? 
            WHERE id = ?`;
        const values = [
            data.nome,
            data.cognome,
            data.numero,
            data.scuderia_id,
            data.mondiali_vinti,
            data.data_nascita,
            data.nazionalità,
            id
        ];

        console.log('Eseguendo query:', query);
        console.log('Con valori:', values);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Errore nella query:', err);
                return res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Nessuna riga aggiornata' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({ success: false, message: 'Errore nel salvataggio dei dati', error: error.message });
    }
});


// --------------------------------------------------
// Esportazione dei Moduli
// --------------------------------------------------
module.exports = router;


