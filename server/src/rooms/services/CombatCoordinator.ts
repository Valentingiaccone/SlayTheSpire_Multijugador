import { SpireState, EnemyState } from "../schema/SpireState";
import { ENEMIGOS_INFO, obtenerEncuentroAleatorio } from "../../../../assets/cliente/compartido/Enemigos";
import { EventoVisualCombate } from "../../../../assets/cliente/compartido/GameTypes";
import { CombatEngine } from "../../engine/CombatEngine";
import { RelicEngine } from "../../engine/RelicEngine";

export class CombatCoordinator {
    constructor(
        private state: SpireState,
        private onEntrarEnFaseRecompensa: () => void,
        private onEmitirSecuenciaVisual: (eventos: EventoVisualCombate[]) => void
    ) {}

    public iniciarCombate(tipoCombate: "COMBATE" | "ELITE" | "JEFE" = "COMBATE"): void {
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.esCombateElite = tipoCombate === "ELITE";
        this.state.esCombateJefe = tipoCombate === "JEFE";
        this.state.enemigos.clear();

        const cantidadJugadores = Math.max(1, this.state.jugadores.size);
        const idsEnemigos = obtenerEncuentroAleatorio(tipoCombate, this.state.pisoActual);

        idsEnemigos.forEach((enemigoId, index) => {
            const info = ENEMIGOS_INFO[enemigoId];
            if (!info) return;

            const enemigo = new EnemyState();
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
                CombatEngine.prepararMazoCombate(j);
                j.energia = j.energiaMax;
                j.turnoTerminado = false;
            }
        });

        // 1. Disparar AL_INICIAR_COMBATE antes del primer robo (permite que reliquias sumen energía, bloqueo o cartas extra)
        RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", this.state);

        // 2. Iniciar el Turno 1 conservando el bloqueo/energía ganados por reliquias de inicio de combate
        this.iniciarNuevoTurnoJugadores(true);
        this.despacharVisualesYRecompensas();
    }

    public jugarCarta(sessionId: string, indiceMano: number, objetivoId?: string): void {
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador) return;

        const jugadaExitosa = CombatEngine.jugarCarta(this.state, jugador, indiceMano, objetivoId);
        if (jugadaExitosa) {
            this.despacharVisualesYRecompensas();
        }
    }

    public terminarTurnoJugador(sessionId: string): void {
        if (this.state.faseActual !== "COMBAT") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.hp <= 0 || jugador.turnoTerminado) return;

        jugador.turnoTerminado = true;

        // Disparar reliquias AL_TERMINAR_TURNO y verificar si alguna mató al último enemigo
        RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", this.state, jugador);
        CombatEngine.descartarMano(jugador);
        CombatEngine.verificarVictoriaCombate(this.state);

        this.verificarFinTurnoJugadores();
        this.despacharVisualesYRecompensas();
    }

    public verificarFinTurnoJugadores(): void {
        if (this.state.faseActual !== "COMBAT") return;

        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0 && !j.turnoTerminado) todosTerminaron = false;
        });

        if (!todosTerminaron) return;

        // Reducir estados de los jugadores al cierre de su fase de turno
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine.reducirEstadosPorTurno(j);
            }
        });

        // Ejecutar turno de los enemigos
        CombatEngine.ejecutarTurnoEnemigos(this.state);

        if (this.state.faseActual !== "COMBAT") {
            return;
        }

        this.state.turnoNumero += 1;
        this.iniciarNuevoTurnoJugadores(false);
    }

    private iniciarNuevoTurnoJugadores(esPrimerTurno: boolean): void {
        if (this.state.faseActual !== "COMBAT") return;

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

            CombatEngine.procesarInicioTurno(j, this.state);

            // Si murió por veneno al iniciar su turno, AccionProcesarMuerte ya marcó turnoTerminado = true
            if (j.hp <= 0) return;

            CombatEngine.robarCartas(j, 5);
        });

        // Verificar si todos los jugadores murieron por veneno al inicio del turno
        CombatEngine.verificarVictoriaCombate(this.state);
        if (this.state.faseActual !== "COMBAT") return;

        RelicEngine.dispararParaTodos("AL_INICIAR_TURNO", this.state);
        CombatEngine.verificarVictoriaCombate(this.state);
    }

    private despacharVisualesYRecompensas(): void {
        const eventos = CombatEngine.consumirEventosVisuales();
        if (eventos.length > 0) {
            this.onEmitirSecuenciaVisual(eventos);
        }

        if (this.state.faseActual === "REWARD") {
            this.onEntrarEnFaseRecompensa();
        }
    }
}