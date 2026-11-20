import { SpireState } from "../schema/SpireState";
import { obtenerEncuentroAleatorio } from "../../../../assets/cliente/compartido/Enemigos";
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
        this.state.combateFinalizando = false;
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.esCombateElite = tipoCombate === "ELITE";
        this.state.esCombateJefe = tipoCombate === "JEFE";
        this.state.enemigos.clear();

        const idsEnemigos = obtenerEncuentroAleatorio(
            tipoCombate,
            this.state.ambientacionActual
        );

        idsEnemigos.forEach((enemigoId, index) => {
            const enemigo = CombatEngine.crearInstanciaEnemigo(
                enemigoId,
                this.state,
                `enemigo_${index}_${Date.now()}`
            );
            if (enemigo) {
                this.state.enemigos.push(enemigo);
            }
        });

        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine.prepararMazoCombate(j);
                RelicEngine.reiniciarContadoresCombate(j);
                j.energia = j.energiaMax;
                j.turnoTerminado = false;
            }
        });

        RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", this.state);
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

        RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", this.state, jugador);
        CombatEngine.descartarMano(jugador, this.state);
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

        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) {
                CombatEngine.reducirEstadosPorTurno(j);
            }
        });

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
            RelicEngine.actualizarContadoresInicioTurno(j, this.state.turnoNumero);

            CombatEngine.procesarInicioTurno(j, this.state);
            if (j.hp <= 0) return;

            CombatEngine.robarCartas(j, 5);
        });

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