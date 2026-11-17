"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapService = void 0;
const SpireState_1 = require("../schema/SpireState");
const Mapa_1 = require("../../../../assets/cliente/compartido/Mapa");
class MapService {
    constructor(state, clock, onViajarANodoCallback) {
        this.state = state;
        this.clock = clock;
        this.onViajarANodoCallback = onViajarANodoCallback;
        this.timerMapa = null;
    }
    inicializarMapaNuevaRun() {
        this.state.nodosMapa.clear();
        this.state.nodoActualId = "";
        this.state.pisoActual = 1;
        const datosMapa = (0, Mapa_1.generarMapaRun)();
        for (const d of datosMapa) {
            const nodoSchema = new SpireState_1.MapNodeState();
            nodoSchema.id = d.id;
            nodoSchema.piso = d.piso;
            nodoSchema.columna = d.columna;
            nodoSchema.tipo = d.tipo;
            nodoSchema.estado = d.estado;
            d.siguientesIds.forEach((sigId) => nodoSchema.siguientesIds.push(sigId));
            this.state.nodosMapa.push(nodoSchema);
        }
        this.abrirFaseMapa();
    }
    abrirFaseMapa() {
        this.cancelarCuentaRegresiva();
        this.state.jugadores.forEach((j) => {
            j.nodoVotadoId = "";
        });
        this.state.faseActual = "MAP";
    }
    registrarVoto(sessionId, nodoId) {
        if (this.state.faseActual !== "MAP")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador)
            return;
        const nodo = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodo || nodo.estado !== "DISPONIBLE")
            return;
        jugador.nodoVotadoId = nodo.id;
        this.evaluarVotos();
    }
    evaluarVotos() {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0)
            return;
        let votosEmitidos = 0;
        const conteo = new Map();
        this.state.jugadores.forEach((j) => {
            if (j.nodoVotadoId) {
                votosEmitidos++;
                conteo.set(j.nodoVotadoId, (conteo.get(j.nodoVotadoId) || 0) + 1);
            }
        });
        if (votosEmitidos < totalJugadores) {
            this.cancelarCuentaRegresiva();
            return;
        }
        let maxVotos = 0;
        let candidatosGanadores = [];
        conteo.forEach((cantidad, nodoId) => {
            if (cantidad > maxVotos) {
                maxVotos = cantidad;
                candidatosGanadores = [nodoId];
            }
            else if (cantidad === maxVotos) {
                candidatosGanadores.push(nodoId);
            }
        });
        if (candidatosGanadores.length !== 1) {
            this.cancelarCuentaRegresiva();
            this.state.hayEmpateMapa = true;
            return;
        }
        const ganadorId = candidatosGanadores[0];
        this.state.hayEmpateMapa = false;
        if (this.timerMapa && this.state.nodoGanadorMapaId === ganadorId) {
            return;
        }
        this.iniciarCuentaRegresiva(ganadorId);
    }
    desbloquearSiguientesNodos() {
        const nodoActual = this.state.nodosMapa.find((n) => n.id === this.state.nodoActualId);
        if (!nodoActual)
            return;
        nodoActual.estado = "COMPLETADO";
        const siguientes = new Set(Array.from(nodoActual.siguientesIds));
        this.state.nodosMapa.forEach((n) => {
            if (siguientes.has(n.id)) {
                n.estado = "DISPONIBLE";
            }
        });
    }
    cancelarCuentaRegresiva() {
        if (this.timerMapa) {
            this.timerMapa.clear();
            this.timerMapa = null;
        }
        this.state.tiempoCuentaRegresivaMapa = 0;
        this.state.nodoGanadorMapaId = "";
        this.state.hayEmpateMapa = false;
    }
    iniciarCuentaRegresiva(ganadorId) {
        this.cancelarCuentaRegresiva();
        this.state.nodoGanadorMapaId = ganadorId;
        this.state.tiempoCuentaRegresivaMapa = Mapa_1.CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;
        this.timerMapa = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaMapa -= 1;
            if (this.state.tiempoCuentaRegresivaMapa <= 0) {
                const destinoId = this.state.nodoGanadorMapaId;
                this.cancelarCuentaRegresiva();
                this.viajarANodo(destinoId);
            }
        }, 1000);
    }
    viajarANodo(nodoId) {
        const nodoElegido = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodoElegido)
            return;
        this.state.nodosMapa.forEach((n) => {
            if (n.estado === "ACTUAL")
                n.estado = "COMPLETADO";
            else if (n.estado === "DISPONIBLE" && n.id !== nodoElegido.id)
                n.estado = "BLOQUEADO";
        });
        nodoElegido.estado = "ACTUAL";
        this.state.nodoActualId = nodoElegido.id;
        this.state.pisoActual = nodoElegido.piso;
        this.state.jugadores.forEach((j) => {
            j.nodoVotadoId = "";
        });
        this.onViajarANodoCallback(nodoElegido.tipo);
    }
}
exports.MapService = MapService;
