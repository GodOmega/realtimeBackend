const express = require("express");
const cors = require("cors");

const { createServer } = require("http");
const { Server } = require("socket.io");

const randomNumber = require("./utils/ramdonNumber");

const app = express();



// Settings
const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT || "http://localhost:3000",
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT || "http://localhost:3000",
  },
});

const colors = [
  "#FC9216",
  "#FF3B20",
  "#00F37F",
  "#FF00D6",
  "#3817FE",
  "#2DFFF2",
];

app.get("/room", (req, res) => {
  const time = Date.now() + "";
  const room = time.split("").slice(3, -1).join("");
  res.json({ room });
});

io.on("connection", (socket) => {
  const randomIndex = randomNumber(0, colors.length - 1);
  socket.color = colors[randomIndex]

  socket.on("add-nickname", (nickname) => {
    socket.nickname = nickname;
  });

  socket.on("join-room", (room) => {
    const messageBody = {
      user: socket.nickname,
      messageType: "newUser",
    };
    socket.join(room);
    socket.to(room).emit("user-connected", messageBody);
  });

  socket.on("send-message", ({ message, room, username }) => {
    const messageBody = {
      message,
      user: username,
      userColor: socket.color,
      messageType: "newMessage",
    };
    io.in(room).emit("message-received", messageBody);
  });

  socket.on("load-url", ({ url, room }) => {
    io.in(room).emit("get-url", url);
  });

  socket.on("play-video", (room) => {
    socket.to(room).emit("play-video");
  });

  socket.on("pause-video", (room) => {
    socket.to(room).emit("pause-video");
  });

  socket.on('sync', ({room, currentTime}) => {
    io.in(room).emit("pause-video");
    socket.to(room).emit('active-sync', currentTime)
  })

  socket.on('desactive-sync', (room) => {
    io.in(room).emit('desactive-sync')
  })
});

httpServer.listen(process.env.PORT || 3002, () => {
  console.log("running on 3002");
});
