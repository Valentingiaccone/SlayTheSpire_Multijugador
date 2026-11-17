import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "colyseus";
import { SpireRoom } from "./rooms/SpireRoom";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
    server: httpServer,
});

gameServer.define("spire_room", SpireRoom);

const PORT = Number(process.env.PORT) || 2567;
gameServer.listen(PORT).then(() => {
    console.log(`Servidor Colyseus escuchando en el puerto ${PORT}`);
});