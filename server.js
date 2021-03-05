//1. load les modules
const express = require('express'); //charger les fichier du node module express
const socketIO = require('socket.io'); //charge lib


//2. setup server
//demarer serveur // numero port auto par heroku // ||=ou //  ||3000 valeur par def si process
const port = process.env.PORT || 3000; 
const index = '/index.html';

const server = express ()
    .use((req, res)=>{
        res.sendFile(index, {root: __dirname})
    })
    .listen(port, () => {
        console.log(`Server started on port: ${port}`)
    });

//client html // server js
//3. demarrer socketIO

const io = socketIO(server);

//créer tab user
let users =[];
let currentPlayer = null;
let timeout = null;
let words = ['Pikachu', 'Carapuce'];

//
io.on('connection', (socket) => {
    socket.on('username', (username)=>{
        console.log(`${username} joined the game.`);

        //stocker nom dans serveur + stocket dans tab
        socket.username = username;

        users.push(socket);
        sendUsers();

        // si j'ai que 1 player, c'est lui le curent
        if (users.length ===1) {
            currentPlayer = socket;
            switchPlayer();
        }
    });

    socket.on('disconnect', () => {
        users = users.filter((user) => {
            return user !== socket
        });
        sendUsers();
    });

    socket.on('line', (data) => {
        //celui qui dessine emet aux autres, revoit data line aux autres
        socket.broadcast.emit('line', data);
    });
});


//scanne tableau et retourne nom d'utilisateur
function sendUsers () {
    const usersData = users.map((user)=>{
        return{
            username: user.username,
            isActive: user === currentPlayer
        }
    });
    //envoyer ce qu'on vient de créer
    io.emit ('users', usersData);
}

//fct pour créer tour par tour
function switchPlayer (){
    timeout= setTimeout(switchPlayer, 150000);

    // savoir quel jouer est en train de jouer = recup son index dans tab
    const indexCurrentPlayer = users.indexOf(currentPlayer);
    // joueur suivant =
    currentPlayer = users[(indexCurrentPlayer + 1) % users.length];

    //un seul joueur peut dessiner
    sendUsers();

    //donner le mot au joueur en cours
    const nextWord = words[Math.floor(Math.random() * words.length)];
    currentPlayer.emit('word', nextWord);

    //nettoyer canva (pour tous)
    io.emit('clear');

    //word et clear= events
}