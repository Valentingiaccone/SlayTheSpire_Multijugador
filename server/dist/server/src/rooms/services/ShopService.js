"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const Cartas_1 = require("../../../../assets/cliente/compartido/Cartas");
const Reliquias_1 = require("../../../../assets/cliente/compartido/Reliquias");
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
const RelicEngine_1 = require("../../engine/RelicEngine");
const PlayerStatsHelper_1 = require("../../engine/PlayerStatsHelper");
const CombatEngine_1 = require("../../engine/CombatEngine");
class ShopService {
    constructor(state, onTiendaCompletadaCallback) {
        this.state = state;
        this.onTiendaCompletadaCallback = onTiendaCompletadaCallback;
    }
    iniciarEventoTienda() {
        const cantJugadores = Math.max(1, this.state.jugadores.size);
        this.state.jugadores.forEach((jugador) => {
            jugador.tiendaCompletada = false;
            jugador.tiendaEliminacionUsada = false;
            jugador.tiendaCartas.clear();
            jugador.tiendaReliquias.clear();
            const cartasOferta = (0, Cartas_1.generarOpcionesRecompensa)(jugador.personajeId, 4, "TIENDA", cantJugadores);
            cartasOferta.forEach((cId) => jugador.tiendaCartas.push(cId));
            const reliquiasOferta = (0, Reliquias_1.obtenerReliquiasRecompensa)(this.state.jugadores, 3, jugador.personajeId, "TIENDA");
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
        PlayerStatsHelper_1.PlayerStatsHelper.modificarOro(jugador, -precio);
        jugador.mazoMaestro.push(cartaId);
        const stockRestante = Array.from(jugador.tiendaCartas);
        stockRestante.splice(indiceTienda, 1);
        CombatEngine_1.CombatEngine.sincronizarArraySchema(jugador.tiendaCartas, stockRestante);
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
        PlayerStatsHelper_1.PlayerStatsHelper.modificarOro(jugador, -precio);
        const stockRestante = Array.from(jugador.tiendaReliquias);
        stockRestante.splice(indiceReliquia, 1);
        CombatEngine_1.CombatEngine.sincronizarArraySchema(jugador.tiendaReliquias, stockRestante);
        RelicEngine_1.RelicEngine.otorgarReliquia(this.state, jugador, reliquiaId, true);
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
        PlayerStatsHelper_1.PlayerStatsHelper.modificarOro(jugador, -costo);
        const mazoTemp = Array.from(jugador.mazoMaestro);
        mazoTemp.splice(indiceMazo, 1);
        CombatEngine_1.CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, mazoTemp);
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
