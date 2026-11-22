"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const colyseus_1 = require("colyseus");
const SpireRoom_1 = require("./rooms/SpireRoom");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const gameServer = new colyseus_1.Server({
    server: httpServer,
});
gameServer.define("spire_room", SpireRoom_1.SpireRoom);
const PORT = Number(process.env.PORT) || 2567;
gameServer.listen(PORT).then(() => {
    console.log(`Servidor Colyseus escuchando en el puerto ${PORT}`);
});
