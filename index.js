const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const ACTIONS = require('./Actions')
require('dotenv').config()

const app = express();
const server = http.createServer(app)
const io = new Server(server)

const userSocketMap = {}

const getAllConnectedClients = (roomID) => {
    return Array.from(io.sockets.adapter.rooms.get(roomID) || []).map((socketID) => {
        return {
            socketID,
            username: userSocketMap[socketID]
        }
    })
}

io.on('connection', (socket) => {

    socket.on(ACTIONS.JOIN, ({ roomID, username }) => {
        userSocketMap[socket.id] = username
        socket.join(roomID)
        const clients = getAllConnectedClients(roomID)
        // console.log();
        // console.log(clients)
        clients.forEach(({socketID}) => {
            io.to(socketID).emit(ACTIONS.JOINED , {
                clients ,
                username ,
                socketID : socket.id
            })
        })
    })

    socket.on(ACTIONS.CODE_CHANGE , ({roomID , value}) => {
        socket.in(roomID).emit(ACTIONS.CODE_CHANGE , {
            value
        })
    })

    socket.on(ACTIONS.SYNC_CODE , ({code , socketID}) => {
        socket.to(socketID).emit(ACTIONS.CODE_CHANGE , {
            code
        })
        console.log(code)
    })

    socket.on('disconnecting' , () => {
        const rooms = [...socket.rooms]
        rooms.forEach((roomID)=>{
            socket.in(roomID).emit(ACTIONS.DISCONNECTED , {
                socketID : socket.id ,
                username : userSocketMap[socket.id]
            })
        })
        delete userSocketMap[socket.id]
        socket.leave()
    })

})
PORT=process.env.PORT || 6010
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
}) 