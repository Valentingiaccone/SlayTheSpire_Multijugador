"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatCoordinator = void 0;
const SpireState_1 = require("../schema/SpireState");
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
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.esCombateElite = tipoCombate === "ELITE";
        this.state.esCombateJefe = tipoCombate === "JEFE";
        this.state.enemigos.clear();
        const cantidadJugadores = Math.max(1, this.state.jugadores.size);
        const idsEnemigos = (0, Enemigos_1.obtenerEncuentroAleatorio)(tipoCombate, this.state.pisoActual);
        idsEnemigos.forEach((enemigoId, index) => {
            const info = Enemigos_1.ENEMIGOS_INFO[enemigoId];
            if (!info)
                return;
            const enemigo = new SpireState_1.EnemyState();
            enemigo.uid = `enemigo_${index}_${Date.now()}`;
            enemigo.enemigoId = info.id;
            enemigo.nombre = info.nombre;
            enemigo.hpMax = info.hpBase * cantidadJugadores;
            enemigo.hp = enemigo.hpMax;
            enemigo.indicePatron = 0;
            enemigo.intencionTipo = info.patron[0].tipo;
            enemigo.intencionValor = info.patron[0].valor;
            this.state.enemigos.push(enemigo);
        });
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine_1.CombatEngine.prepararMazoCombate(j);
                j.energia = j.energiaMax;
                j.turnoTerminado = false;
            }
        });
        // 1. Disparar AL_INICIAR_COMBATE antes del primer robo (permite que reliquias sumen energía, bloqueo o cartas extra)
        RelicEngine_1.RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", this.state);
        // 2. Iniciar el Turno 1 conservando el bloqueo/energía ganados por reliquias de inicio de combate
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
        // Disparar reliquias AL_TERMINAR_TURNO y verificar si alguna mató al último enemigo
        RelicEngine_1.RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", this.state, jugador);
        CombatEngine_1.CombatEngine.descartarMano(jugador);
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
        // Reducir estados de los jugadores al cierre de su fase de turno
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine_1.CombatEngine.reducirEstadosPorTurno(j);
            }
        });
        // Ejecutar turno de los enemigos
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
            CombatEngine_1.CombatEngine.procesarInicioTurno(j, this.state);
            // Si murió por veneno al iniciar su turno, AccionProcesarMuerte ya marcó turnoTerminado = true
            if (j.hp <= 0)
                return;
            CombatEngine_1.CombatEngine.robarCartas(j, 5);
        });
        // Verificar si todos los jugadores murieron por veneno al inicio del turno
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
}
exports.CombatCoordinator = CombatCoordinator;
