import { Clock, Delayed } from "colyseus";
import { SpireState } from "../schema/SpireState";
import { obtenerReliquiasRecompensa } from "../../../../assets/cliente/compartido/Reliquias";
import { CONFIG_MAPA } from "../../../../assets/cliente/compartido/Mapa";
import { RelicEngine } from "../../engine/RelicEngine";

export class ChestService {
    private timerCofre: Delayed | null = null;
    private firmaVotosCofreActual: string = "";

    constructor(
        private state: SpireState,
        private clock: Clock,
        private onCofreCompletadoCallback: () => void
    ) {}

    public iniciarEventoCofre(): void {
        this.cancelarCuentaRegresiva();
        this.state.cofreAbierto = false;
        this.state.reliquiasCofre.clear();
        this.state.jugadores.forEach((j) => {
            j.reliquiaCofreVotadaId = "";
        });
        this.state.faseActual = "CHEST";
    }

    public abrirCofre(sessionId: string): void {
        if (this.state.faseActual !== "CHEST" || this.state.cofreAbierto) return;
        if (!this.state.jugadores.has(sessionId)) return;

        this.state.cofreAbierto = true;
        this.state.reliquiasCofre.clear();

        const cantJugadores = Math.max(1, this.state.jugadores.size);
        const forzarLegendaria = RelicEngine.consumirCargasCofreLegendario(this.state);
        const reliquiasGeneradas = obtenerReliquiasRecompensa(
            this.state.jugadores,
            cantJugadores,
            undefined,
            "COFRE",
            forzarLegendaria ? "LEGENDARIA" : undefined
        );
        reliquiasGeneradas.forEach((rId) => this.state.reliquiasCofre.push(rId));
    }

    public votarReliquia(sessionId: string, reliquiaId: string): void {
        if (this.state.faseActual !== "CHEST" || !this.state.cofreAbierto) return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador) return;

        if (!this.state.reliquiasCofre.includes(reliquiaId)) return;

        jugador.reliquiaCofreVotadaId =
            jugador.reliquiaCofreVotadaId === reliquiaId ? "" : reliquiaId;

        this.evaluarVotos();
    }

    public evaluarVotos(): void {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0) return;

        let elegidos = 0;
        const conteoPorReliquia: Map<string, number> = new Map();
        const paresFirma: string[] = [];

        this.state.jugadores.forEach((j, sessionId) => {
            if (j.reliquiaCofreVotadaId) {
                elegidos++;
                conteoPorReliquia.set(
                    j.reliquiaCofreVotadaId,
                    (conteoPorReliquia.get(j.reliquiaCofreVotadaId) || 0) + 1
                );
                paresFirma.push(`${sessionId}:${j.reliquiaCofreVotadaId}`);
            }
        });

        let hayColision = false;
        conteoPorReliquia.forEach((cant) => {
            if (cant > 1) hayColision = true;
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

    public cancelarCuentaRegresiva(): void {
        if (this.timerCofre) {
            this.timerCofre.clear();
            this.timerCofre = null;
        }
        this.firmaVotosCofreActual = "";
        this.state.tiempoCuentaRegresivaCofre = 0;
        this.state.hayConflictoCofre = false;
    }

    private iniciarCuentaRegresiva(firma: string): void {
        this.cancelarCuentaRegresiva();
        this.firmaVotosCofreActual = firma;
        this.state.tiempoCuentaRegresivaCofre = CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;

        this.timerCofre = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaCofre -= 1;
            if (this.state.tiempoCuentaRegresivaCofre <= 0) {
                this.cancelarCuentaRegresiva();
                this.entregarReliquiasYAvanzar();
            }
        }, 1000);
    }

    private entregarReliquiasYAvanzar(): void {
        this.state.jugadores.forEach((j) => {
            if (j.reliquiaCofreVotadaId) {
                const relId = j.reliquiaCofreVotadaId;
                j.reliquiaCofreVotadaId = "";
                RelicEngine.otorgarReliquia(this.state, j, relId, true);
            }
        });

        this.onCofreCompletadoCallback();
    }
}