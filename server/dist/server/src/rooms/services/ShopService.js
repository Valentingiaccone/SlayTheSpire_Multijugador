"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const Cartas_1 = require("../../../../assets/cliente/compartido/Cartas");
const Reliquias_1 = require("../../../../assets/cliente/compartido/Reliquias");
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
class ShopService {
    constructor(state, onTiendaCompletadaCallback) {
        this.state = state;
        this.onTiendaCompletadaCallback = onTiendaCompletadaCallback;
    }
    iniciarEventoTienda() {
        this.state.jugadores.forEach((jugador) => {
            jugador.tiendaCompletada = false;
            jugador.tiendaEliminacionUsada = false;
            jugador.tiendaCartas.clear();
            jugador.tiendaReliquias.clear();
            const cartasOferta = (0, Cartas_1.generarOpcionesRecompensa)(jugador.personajeId, 4);
            cartasOferta.forEach((cId) => jugador.tiendaCartas.push(cId));
            const reliquiasOferta = (0, Reliquias_1.obtenerReliquiasRecompensa)(this.state.jugadores, 3, jugador.personajeId);
            reliquiasOferta.forEach((rId) => jugador.tiendaReliquias.push(rId));
        });
        this.state.faseActual = "SHOP";
    }
    comprarCarta(sessionId, indiceTienda) {
        if (this.state.faseActual !== "SHOP")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada)
            return;
        if (indiceTienda < 0 || indiceTienda >= jugador.tiendaCartas.length)
            return;
        const cartaId = jugador.tiendaCartas[indiceTienda];
        if (!cartaId)
            return;
        const precio = (0, Cartas_1.obtenerPrecioCarta)(cartaId);
        if (jugador.oro < precio)
            return;
        jugador.oro -= precio;
        jugador.mazoMaestro.push(cartaId);
        jugador.tiendaCartas.splice(indiceTienda, 1);
    }
    comprarReliquia(sessionId, indiceReliquia) {
        if (this.state.faseActual !== "SHOP")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada)
            return;
        if (indiceReliquia < 0 || indiceReliquia >= jugador.tiendaReliquias.length)
            return;
        const reliquiaId = jugador.tiendaReliquias[indiceReliquia];
        if (!reliquiaId)
            return;
        const precio = (0, Reliquias_1.obtenerPrecioReliquia)(reliquiaId);
        if (jugador.oro < precio)
            return;
        jugador.oro -= precio;
        jugador.reliquias.push(reliquiaId);
        jugador.tiendaReliquias.splice(indiceReliquia, 1);
    }
    eliminarCartaMazo(sessionId, indiceMazo) {
        if (this.state.faseActual !== "SHOP")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada || jugador.tiendaEliminacionUsada)
            return;
        if (jugador.mazoMaestro.length <= 1)
            return;
        if (indiceMazo < 0 || indiceMazo >= jugador.mazoMaestro.length)
            return;
        const costo = GameTypes_1.ECONOMIA_CONFIG.COSTO_ELIMINAR_CARTA_TIENDA;
        if (jugador.oro < costo)
            return;
        jugador.oro -= costo;
        jugador.mazoMaestro.splice(indiceMazo, 1);
        jugador.tiendaEliminacionUsada = true;
    }
    salirTienda(sessionId) {
        if (this.state.faseActual !== "SHOP")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada)
            return;
        jugador.tiendaCompletada = true;
        this.verificarFinTienda();
    }
    verificarFinTienda() {
        if (this.state.faseActual !== "SHOP")
            return;
        let todosListos = true;
        this.state.jugadores.forEach((j) => {
            if (!j.tiendaCompletada)
                todosListos = false;
        });
        if (todosListos) {
            this.onTiendaCompletadaCallback();
        }
    }
}
exports.ShopService = ShopService;
