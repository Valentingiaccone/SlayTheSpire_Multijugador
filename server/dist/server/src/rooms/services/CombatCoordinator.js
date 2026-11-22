"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatCoordinator = void 0;
const Enemigos_1 = require("../../../../assets/cliente/compartido/Enemigos");
const CombatEngine_1 = require("../../engine/CombatEngine");
const RelicEngine_1 = require("../../engine/RelicEngine");
class CombatCoordinator {
    constructor(state, onEntrarEnFaseRecompensa, onEmitirSecuenciaVisual) {
        this.state = state;
        this.onEntrarEnFaseRecompensa = onEntrarEnFaseRecompensa;
        this.onEmitirSecuenciaVisual = onEmitirSecuenciaVisual;
    }
    iniciarCombate(tipoCombate = "COMBATE") {
        this.state.combateFinalizando = false;
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.esCombateElite = tipoCombate === "ELITE";
        this.state.esCombateJefe = tipoCombate === "JEFE";
        this.state.enemigos.clear();
        const idsEnemigos = (0, Enemigos_1.obtenerEncuentroAleatorio)(tipoCombate, this.state.ambientacionActual);
        idsEnemigos.forEach((enemigoId, index) => {
            const enemigo = CombatEngine_1.CombatEngine.crearInstanciaEnemigo(enemigoId, this.state, `enemigo_${index}_${Date.now()}`);
            if (enemigo) {
                this.state.enemigos.push(enemigo);
            }
        });
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine_1.CombatEngine.prepararMazoCombate(j);
                RelicEngine_1.RelicEngine.reiniciarContadoresCombate(j);
                j.energia = j.energiaMax;
                j.turnoTerminado = false;
            }
        });
        RelicEngine_1.RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", this.state);
        this.iniciarNuevoTurnoJugadores(true);
        this.despacharVisualesYRecompensas();
    }
    jugarCarta(sessionId, indiceMano, objetivoId) {
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador)
            return;
        const jugadaExitosa = CombatEngine_1.CombatEngine.jugarCarta(this.state, jugador, indiceMano, objetivoId);
        if (jugadaExitosa) {
            this.despacharVisualesYRecompensas();
        }
    }
    terminarTurnoJugador(sessionId) {
        if (this.state.faseActual !== "COMBAT")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.hp <= 0 || jugador.turnoTerminado)
            return;
        jugador.turnoTerminado = true;
        RelicEngine_1.RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", this.state, jugador);
        CombatEngine_1.CombatEngine.descartarMano(jugador, this.state);
        CombatEngine_1.CombatEngine.verificarVictoriaCombate(this.state);
        this.verificarFinTurnoJugadores();
        this.despacharVisualesYRecompensas();
    }
    verificarFinTurnoJugadores() {
        if (this.state.faseActual !== "COMBAT")
            return;
        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0 && !j.turnoTerminado)
                todosTerminaron = false;
        });
        if (!todosTerminaron)
            return;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine_1.CombatEngine.reducirEstadosPorTurno(j);
            }
        });
        CombatEngine_1.CombatEngine.ejecutarTurnoEnemigos(this.state);
        if (this.state.faseActual !== "COMBAT") {
            return;
        }
        this.state.turnoNumero += 1;
        this.iniciarNuevoTurnoJugadores(false);
    }
    iniciarNuevoTurnoJugadores(esPrimerTurno) {
        if (this.state.faseActual !== "COMBAT")
            return;
        this.state.jugadores.forEach((j) => {
            if (j.hp <= 0) {
                j.turnoTerminado = true;
                return;
            }
            if (!esPrimerTurno) {
                j.bloqueo = 0;
                j.energia = j.energiaMax;
            }
            j.turnoTerminado = false;
            j.cartasJugadasTurno = 0;
            j.ataquesJugadosTurno = 0;
            RelicEngine_1.RelicEngine.actualizarContadoresInicioTurno(j, this.state.turnoNumero);
            CombatEngine_1.CombatEngine.procesarInicioTurno(j, this.state);
            if (j.hp <= 0)
                return;
            CombatEngine_1.CombatEngine.robarCartas(j, 5);
        });
        CombatEngine_1.CombatEngine.verificarVictoriaCombate(this.state);
        if (this.state.faseActual !== "COMBAT")
            return;
        RelicEngine_1.RelicEngine.dispararParaTodos("AL_INICIAR_TURNO", this.state);
        CombatEngine_1.CombatEngine.verificarVictoriaCombate(this.state);
    }
    despacharVisualesYRecompensas() {
        const eventos = CombatEngine_1.CombatEngine.consumirEventosVisuales();
        if (eventos.length > 0) {
            this.onEmitirSecuenciaVisual(eventos);
        }
        if (this.state.faseActual === "REWARD") {
            this.onEntrarEnFaseRecompensa();
        }
    }
    resolverSeleccionMano(sessionId, indices) {
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador)
            return;
        CombatEngine_1.CombatEngine.resolverSeleccionMano(this.state, jugador, indices);
    }
}
exports.CombatCoordinator = CombatCoordinator;
