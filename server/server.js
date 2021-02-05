const io = require('socket.io')(); // () immediately calls
const {createGameState, gameLoop, getUpdatedVelocity} = require('./game')
const { FRAME_RATE } = require('./constants')
const {makeid} = require('./utils')

const state = {}
const clientRooms = {}

io.on('connection', client => {

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

    function handleJoinGame(gamecode) {
        const room = io.sockets.adapter.rooms[gameCode]

        let allUsers;
        if (room) {
            allUsers = room.sockets; //object with all current users in room, key is id and object is client itself
        }

        let numClients = 0;
        if (allUsers) {
            numClients = Object.keys(allUsers.length)
        }

        if (numClients === 0) {
            client.emit('unknownGame');
            return
        } else if (numClients > 1) {
            client.emit('tooManyPlayers')
            return
        }

        clientRooms[client.id] = gameCode
        client.number = 2
        client.emit('init', 2);

        startGameInterval(gameCode)
    }

    function handleNewGame() {
        let roomName = makeid(5);
        clientRooms[client.id] = roomName
        client.emit('gameCode', roomName)

        state[roomName] = initGame();

        client.join(roomName)
        client.number = 1;
        client.emit('init', 1)

    }


    function handleKeydown(keyCode) { //need access to client so defining inside function
        const roomName = clientRooms[client.id]

        if (!roomName) {
            return
        }

        try {
            keyCode = parseInt(keyCode)
        } catch(e) {
            console.error(e)
            return
        }

        const vel = getUpdatedVelocity(keyCode)

        if (vel) {
            state[roomName].players[client.number - 1].vel = vel;
            state.player.vel = vel
        }
    }
})

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]); // return 0 player wins, 1 player has lost if single player mode
        // multiplayer, 0 continue playing, 1 player 1 wins, 2 player 2 wins

        if (!winner) { // if no winner, game still continues
            emitGameState(roomName, state[room])
        } else {
            emitGameOver(roomName, winner)
            state[roomName] = null
            clearInterval(intervalId)
        }

    }, 1000/FRAME_RATE) //1000 ms / frame rate per second - gives frames ms to width

}

function emitGameState(roomName, state) {
    io.socket.in(roomName)
        .emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName)
    .emit('gameOver', JSON.stringify({winner})
}

io.listen(3000) //listen on port 3000