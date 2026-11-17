"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChestService = void 0;
const Reliquias_1 = require("../../../../assets/cliente/compartido/Reliquias");
const Mapa_1 = require("../../../../assets/cliente/compartido/Mapa");
class ChestService {
    constructor(state, clock, onCofreCompletadoCallback) {
        this.state = state;
        this.clock = clock;
        this.onCofreCompletadoCallback = onCofreCompletadoCallback;
        this.timerCofre = null;
        this.firmaVotosCofreActual = "";
    }
    iniciarEventoCofre() {
        this.cancelarCuentaRegresiva();
        this.state.cofreAbierto = false;
        this.state.reliquiasCofre.clear();
        this.state.jugadores.forEach((j) => {
            j.reliquiaCofreVotadaId = "";
        });
        this.state.faseActual = "CHEST";
    }
    abrirCofre(sessionId) {
        if (this.state.faseActual !== "CHEST" || this.state.cofreAbierto)
            return;
        if (!this.state.jugadores.has(sessionId))
            return;
        this.state.cofreAbierto = true;
        this.state.reliquiasCofre.clear();
        const cantJugadores = Math.max(1, this.state.jugadores.size);
        const reliquiasGeneradas = (0, Reliquias_1.obtenerReliquiasRecompensa)(this.state.jugadores, cantJugadores);
        reliquiasGeneradas.forEach((rId) => this.state.reliquiasCofre.push(rId));
    }
    votarReliquia(sessionId, reliquiaId) {
        if (this.state.faseActual !== "CHEST" || !this.state.cofreAbierto)
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador)
            return;
        if (!this.state.reliquiasCofre.includes(reliquiaId))
            return;
        jugador.reliquiaCofreVotadaId =
            jugador.reliquiaCofreVotadaId === reliquiaId ? "" : reliquiaId;
        this.evaluarVotos();
    }
    evaluarVotos() {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0)
            return;
        let elegidos = 0;
        const conteoPorReliquia = new Map();
        const paresFirma = [];
        this.state.jugadores.forEach((j, sessionId) => {
            if (j.reliquiaCofreVotadaId) {
                elegidos++;
                conteoPorReliquia.set(j.reliquiaCofreVotadaId, (conteoPorReliquia.get(j.reliquiaCofreVotadaId) || 0) + 1);
                paresFirma.push(`${sessionId}:${j.reliquiaCofreVotadaId}`);
            }
        });
        let hayColision = false;
        conteoPorReliquia.forEach((cant) => {
            if (cant > 1)
                hayColision = true;
        });
        this.state.hayConflictoCofre = hayColision;
        if (elegidos < totalJugadores || hayColision) {
            this.cancelarCuentaRegresiva();
            return;
        }
        const nuevaFirma = paresFirma.sort().join("|");
        if (this.timerCofre && this.firmaVotosCofreActual === nuevaFirma) {
            return;
        }
        this.iniciarCuentaRegresiva(nuevaFirma);
    }
    cancelarCuentaRegresiva() {
        if (this.timerCofre) {
            this.timerCofre.clear();
            this.timerCofre = null;
        }
        this.firmaVotosCofreActual = "";
        this.state.tiempoCuentaRegresivaCofre = 0;
        this.state.hayConflictoCofre = false;
    }
    iniciarCuentaRegresiva(firma) {
        this.cancelarCuentaRegresiva();
        this.firmaVotosCofreActual = firma;
        this.state.tiempoCuentaRegresivaCofre = Mapa_1.CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;
        this.timerCofre = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaCofre -= 1;
            if (this.state.tiempoCuentaRegresivaCofre <= 0) {
                this.cancelarCuentaRegresiva();
                this.entregarReliquiasYAvanzar();
            }
        }, 1000);
    }
    entregarReliquiasYAvanzar() {
        this.state.jugadores.forEach((j) => {
            if (j.reliquiaCofreVotadaId) {
                j.reliquias.push(j.reliquiaCofreVotadaId);
                j.reliquiaCofreVotadaId = "";
            }
        });
        this.onCofreCompletadoCallback();
    }
}
exports.ChestService = ChestService;
