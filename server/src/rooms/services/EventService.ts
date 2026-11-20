import { Clock, Delayed } from "colyseus";
import { SpireState, PlayerState } from "../schema/SpireState";
import {
    CATALOGO_EVENTOS,
    IEventoData,
    IOpcionEventoData,
    obtenerEventoAleatorio,
    opcionRequiereElegirCartaMazo,
    validarRequisitosOpcionParaJugador
} from "../../../../assets/cliente/compartido/Eventos";
import {
    generarOpcionesRecompensa,
    obtenerDataCarta,
    obtenerMaldicionAleatoria
} from "../../../../assets/cliente/compartido/Cartas";
import { obtenerReliquiasRecompensa } from "../../../../assets/cliente/compartido/Reliquias";
import { CONFIG_MAPA } from "../../../../assets/cliente/compartido/Mapa";
import { IPayloadAccionEvento } from "../../../../assets/cliente/compartido/GameTypes";
import { RelicEngine } from "../../engine/RelicEngine";
import { PlayerStatsHelper } from "../../engine/PlayerStatsHelper";
import { CombatEngine } from "../../engine/CombatEngine";

export class EventService {
    private timerEvento: Delayed | null = null;

    constructor(
        private state: SpireState,
        private clock: Clock,
        private onEventoCompletadoCallback: () => void
    ) {}

    public iniciarEventoAleatorio(): void {
        this.cancelarCuentaRegresiva();
        const evento = obtenerEventoAleatorio();
        this.state.eventoActualId = evento.id;
        this.state.hayEmpateEvento = false;
        this.state.opcionGanadoraEventoIdx = -1;
        this.state.tiempoCuentaRegresivaEvento = 0;

        const cantJugadores = Math.max(1, this.state.jugadores.size);
        const reliquiasComunitariasPorOpcion: string[] = [];
        const maldicionesComunitariasPorOpcion: string[] = [];

        if (evento.modo === "COMUNITARIO") {
            evento.opciones.forEach((op, idx) => {
                const pideReliquia = op.efectos.some((e) => e.tipo === "GANAR_RELIQUIA");
                const pideMaldicion = op.efectos.some((e) => e.tipo === "GANAR_MALDICION");

                reliquiasComunitariasPorOpcion[idx] = pideReliquia
                    ? obtenerReliquiasRecompensa(this.state.jugadores, 1, undefined, "EVENTO")[0] ||
                      "distintivo_abogado"
                    : "";
                maldicionesComunitariasPorOpcion[idx] = pideMaldicion
                    ? obtenerMaldicionAleatoria()
                    : "";
            });
        }

        this.state.jugadores.forEach((j) => {
            j.eventoCompletado = false;
            j.eventoVotoOpcion = -1;
            j.eventoOpcionCartas.clear();
            j.eventoOpcionReliquias.clear();
            j.eventoOpcionMaldiciones.clear();

            const cartasPreSorteadas = generarOpcionesRecompensa(
                j.personajeId,
                evento.opciones.length,
                "EVENTO",
                cantJugadores
            );
            const reliquiasPreSorteadas = obtenerReliquiasRecompensa(
                this.state.jugadores,
                evento.opciones.length,
                j.personajeId,
                "EVENTO"
            );

            evento.opciones.forEach((op, idx) => {
                const pideCarta = op.efectos.some((e) => e.tipo === "GANAR_CARTA");
                const pideReliquia = op.efectos.some((e) => e.tipo === "GANAR_RELIQUIA");
                const pideMaldicion = op.efectos.some((e) => e.tipo === "GANAR_MALDICION");

                j.eventoOpcionCartas.push(
                    pideCarta
                        ? cartasPreSorteadas[idx % Math.max(1, cartasPreSorteadas.length)] || "golpe_combate"
                        : ""
                );

                if (evento.modo === "COMUNITARIO") {
                    j.eventoOpcionReliquias.push(reliquiasComunitariasPorOpcion[idx] || "");
                    j.eventoOpcionMaldiciones.push(maldicionesComunitariasPorOpcion[idx] || "");
                } else {
                    j.eventoOpcionReliquias.push(
                        pideReliquia
                            ? reliquiasPreSorteadas[idx % Math.max(1, reliquiasPreSorteadas.length)] ||
                                  "distintivo_abogado"
                            : ""
                    );
                    j.eventoOpcionMaldiciones.push(pideMaldicion ? obtenerMaldicionAleatoria() : "");
                }
            });
        });

        this.state.faseActual = "EVENT";
    }

    public procesarAccionIndividual(sessionId: string, payload: IPayloadAccionEvento): void {
        if (this.state.faseActual !== "EVENT") return;
        const evento = CATALOGO_EVENTOS[this.state.eventoActualId];
        if (!evento || evento.modo !== "INDIVIDUAL") return;

        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.eventoCompletado) return;

        const idxOpcion = payload?.indiceOpcion;
        if (typeof idxOpcion !== "number" || idxOpcion < 0 || idxOpcion >= evento.opciones.length) return;

        const opcion = evento.opciones[idxOpcion];
        const validacion = validarRequisitosOpcionParaJugador(opcion, {
            hp: jugador.hp,
            hpMax: jugador.hpMax,
            oro: jugador.oro,
            mazoLength: jugador.mazoMaestro.length,
            mazoCartasIds: jugador.mazoMaestro
        });
        if (!validacion.valida) return;

        if (opcionRequiereElegirCartaMazo(opcion)) {
            const idxCarta = payload.indiceCartaEliminar;
            if (
                typeof idxCarta !== "number" ||
                idxCarta < 0 ||
                idxCarta >= jugador.mazoMaestro.length
            ) {
                return;
            }
        }

        this.aplicarEfectosOpcionAJugador(jugador, opcion, idxOpcion, payload.indiceCartaEliminar);
        jugador.eventoCompletado = true;
        this.verificarFinEvento();
    }

    public registrarVotoComunitario(sessionId: string, indiceOpcion: number): void {
        if (this.state.faseActual !== "EVENT") return;
        const evento = CATALOGO_EVENTOS[this.state.eventoActualId];
        if (!evento || evento.modo !== "COMUNITARIO") return;

        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador) return;
        if (typeof indiceOpcion !== "number" || indiceOpcion < 0 || indiceOpcion >= evento.opciones.length) return;

        const opcion = evento.opciones[indiceOpcion];
        if (!this.opcionComunitariaDisponibleParaTodos(opcion)) return;

        jugador.eventoVotoOpcion =
            jugador.eventoVotoOpcion === indiceOpcion ? -1 : indiceOpcion;

        this.evaluarVotosComunitarios(evento);
    }

    public evaluarVotosComunitarios(eventoParam?: IEventoData): void {
        if (this.state.faseActual !== "EVENT") return;
        const evento = eventoParam || CATALOGO_EVENTOS[this.state.eventoActualId];
        if (!evento || evento.modo !== "COMUNITARIO") return;

        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0) return;

        let votosEmitidos = 0;
        const conteo: Map<number, number> = new Map();

        this.state.jugadores.forEach((j) => {
            if (j.eventoVotoOpcion >= 0) {
                votosEmitidos++;
                conteo.set(j.eventoVotoOpcion, (conteo.get(j.eventoVotoOpcion) || 0) + 1);
            }
        });

        if (votosEmitidos < totalJugadores) {
            this.cancelarCuentaRegresiva();
            return;
        }

        let maxVotos = 0;
        let opcionesGanadoras: number[] = [];

        conteo.forEach((cantidad, idxOpcion) => {
            if (cantidad > maxVotos) {
                maxVotos = cantidad;
                opcionesGanadoras = [idxOpcion];
            } else if (cantidad === maxVotos) {
                opcionesGanadoras.push(idxOpcion);
            }
        });

        if (opcionesGanadoras.length !== 1) {
            this.cancelarCuentaRegresiva();
            this.state.hayEmpateEvento = true;
            return;
        }

        const ganadorIdx = opcionesGanadoras[0];
        this.state.hayEmpateEvento = false;

        if (this.timerEvento && this.state.opcionGanadoraEventoIdx === ganadorIdx) {
            return;
        }

        this.iniciarCuentaRegresivaComunitaria(evento, ganadorIdx);
    }

    public verificarFinEvento(): void {
        if (this.state.faseActual !== "EVENT") return;
        const evento = CATALOGO_EVENTOS[this.state.eventoActualId];
        if (!evento) return;

        if (evento.modo === "COMUNITARIO") {
            this.evaluarVotosComunitarios(evento);
            return;
        }

        let todosListos = true;
        this.state.jugadores.forEach((j) => {
            if (!j.eventoCompletado) todosListos = false;
        });

        if (todosListos) {
            this.onEventoCompletadoCallback();
        }
    }

    public cancelarCuentaRegresiva(): void {
        if (this.timerEvento) {
            this.timerEvento.clear();
            this.timerEvento = null;
        }
        this.state.tiempoCuentaRegresivaEvento = 0;
        this.state.opcionGanadoraEventoIdx = -1;
        this.state.hayEmpateEvento = false;
    }

    private opcionComunitariaDisponibleParaTodos(opcion: IOpcionEventoData): boolean {
        let todosPueden = true;
        this.state.jugadores.forEach((j) => {
            const res = validarRequisitosOpcionParaJugador(opcion, {
                hp: j.hp,
                hpMax: j.hpMax,
                oro: j.oro,
                mazoLength: j.mazoMaestro.length,
                mazoCartasIds: j.mazoMaestro
            });
            if (!res.valida) todosPueden = false;
        });
        return todosPueden;
    }

    private iniciarCuentaRegresivaComunitaria(evento: IEventoData, ganadorIdx: number): void {
        this.cancelarCuentaRegresiva();
        this.state.opcionGanadoraEventoIdx = ganadorIdx;
        this.state.tiempoCuentaRegresivaEvento = CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;

        this.timerEvento = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaEvento -= 1;
            if (this.state.tiempoCuentaRegresivaEvento <= 0) {
                const idxFinal = this.state.opcionGanadoraEventoIdx;
                this.cancelarCuentaRegresiva();
                const opcionElegida = evento.opciones[idxFinal];
                if (opcionElegida) {
                    this.state.jugadores.forEach((j) => {
                        this.aplicarEfectosOpcionAJugador(j, opcionElegida, idxFinal);
                        j.eventoCompletado = true;
                    });
                }
                this.onEventoCompletadoCallback();
            }
        }, 1000);
    }

    private aplicarEfectosOpcionAJugador(
        jugador: PlayerState,
        opcion: IOpcionEventoData,
        indiceOpcion: number,
        indiceCartaElegida?: number
    ): void {
        for (const ef of opcion.efectos) {
            switch (ef.tipo) {
                case "GANAR_ORO":
                    PlayerStatsHelper.modificarOro(jugador, ef.cantidad);
                    break;
                case "PERDER_ORO":
                    PlayerStatsHelper.modificarOro(jugador, -ef.cantidad);
                    break;
                case "CURAR_HP": {
                    const curacion = ef.porcentajeHpMax
                        ? Math.max(1, Math.floor(jugador.hpMax * ef.porcentajeHpMax))
                        : ef.cantidad || 0;
                    jugador.hp = Math.min(jugador.hpMax, jugador.hp + curacion);
                    break;
                }
                case "PERDER_HP":
                    PlayerStatsHelper.aplicarPerdidaHpJugador(this.state, jugador, ef.cantidad, {
                        permitirMuerte: false
                    });
                    break;
                case "GANAR_CARTA": {
                    const cartaId = jugador.eventoOpcionCartas[indiceOpcion];
                    if (cartaId) jugador.mazoMaestro.push(cartaId);
                    break;
                }
                case "GANAR_RELIQUIA": {
                    const relId = jugador.eventoOpcionReliquias[indiceOpcion];
                    if (relId) RelicEngine.otorgarReliquia(this.state, jugador, relId, true);
                    break;
                }
                case "GANAR_MALDICION": {
                    const maldId = jugador.eventoOpcionMaldiciones[indiceOpcion];
                    if (maldId) jugador.mazoMaestro.push(maldId);
                    break;
                }
                case "ELIMINAR_CARTA_AZAR": {
                    if (jugador.mazoMaestro.length > 1) {
                        const mazoTemp = Array.from(jugador.mazoMaestro);
                        const idxAzar = Math.floor(Math.random() * mazoTemp.length);
                        mazoTemp.splice(idxAzar, 1);
                        CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, mazoTemp);
                    }
                    break;
                }
                case "ELIMINAR_CARTA_ELECCION": {
                    if (
                        jugador.mazoMaestro.length > 1 &&
                        typeof indiceCartaElegida === "number" &&
                        indiceCartaElegida >= 0 &&
                        indiceCartaElegida < jugador.mazoMaestro.length
                    ) {
                        const mazoTemp = Array.from(jugador.mazoMaestro);
                        mazoTemp.splice(indiceCartaElegida, 1);
                        CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, mazoTemp);
                    }
                    break;
                }
                case "ELIMINAR_CARTA_CALIDAD_AZAR": {
                    if (jugador.mazoMaestro.length > 1) {
                        const indicesCandidatos: number[] = [];
                        for (let i = 0; i < jugador.mazoMaestro.length; i++) {
                            const id = jugador.mazoMaestro[i];
                            if (obtenerDataCarta(id)?.calidad === ef.calidad) {
                                indicesCandidatos.push(i);
                            }
                        }
                        if (indicesCandidatos.length > 0) {
                            const mazoTemp = Array.from(jugador.mazoMaestro);
                            const elegido =
                                indicesCandidatos[Math.floor(Math.random() * indicesCandidatos.length)];
                            mazoTemp.splice(elegido, 1);
                            CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, mazoTemp);
                        }
                    }
                    break;
                }
                case "NADA":
                    break;
            }
        }
    }
}