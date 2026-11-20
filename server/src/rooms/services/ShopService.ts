import { SpireState } from "../schema/SpireState";
import {
    generarOpcionesRecompensa,
    obtenerPrecioCarta
} from "../../../../assets/cliente/compartido/Cartas";
import {
    obtenerReliquiasRecompensa,
    obtenerPrecioReliquia
} from "../../../../assets/cliente/compartido/Reliquias";
import { ECONOMIA_CONFIG } from "../../../../assets/cliente/compartido/GameTypes";
import { RelicEngine } from "../../engine/RelicEngine";
import { PlayerStatsHelper } from "../../engine/PlayerStatsHelper";
import { CombatEngine } from "../../engine/CombatEngine";

export class ShopService {
    constructor(
        private state: SpireState,
        private onTiendaCompletadaCallback: () => void
    ) {}

    public iniciarEventoTienda(): void {
        const cantJugadores = Math.max(1, this.state.jugadores.size);

        this.state.jugadores.forEach((jugador) => {
            jugador.tiendaCompletada = false;
            jugador.tiendaEliminacionUsada = false;
            jugador.tiendaCartas.clear();
            jugador.tiendaReliquias.clear();

            const cartasOferta = generarOpcionesRecompensa(
                jugador.personajeId,
                4,
                "TIENDA",
                cantJugadores
            );
            cartasOferta.forEach((cId) => jugador.tiendaCartas.push(cId));

            const reliquiasOferta = obtenerReliquiasRecompensa(
                this.state.jugadores,
                3,
                jugador.personajeId,
                "TIENDA"
            );
            reliquiasOferta.forEach((rId) => jugador.tiendaReliquias.push(rId));
        });

        this.state.faseActual = "SHOP";
    }

    public comprarCarta(sessionId: string, indiceTienda: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;
        if (indiceTienda < 0 || indiceTienda >= jugador.tiendaCartas.length) return;

        const cartaId = jugador.tiendaCartas[indiceTienda];
        if (!cartaId) return;

        const precio = obtenerPrecioCarta(cartaId);
        if (jugador.oro < precio) return;

        PlayerStatsHelper.modificarOro(jugador, -precio);
        jugador.mazoMaestro.push(cartaId);

        const stockRestante = Array.from(jugador.tiendaCartas);
        stockRestante.splice(indiceTienda, 1);
        CombatEngine.sincronizarArraySchema(jugador.tiendaCartas, stockRestante);
    }

    public comprarReliquia(sessionId: string, indiceReliquia: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;
        if (indiceReliquia < 0 || indiceReliquia >= jugador.tiendaReliquias.length) return;

        const reliquiaId = jugador.tiendaReliquias[indiceReliquia];
        if (!reliquiaId) return;

        const precio = obtenerPrecioReliquia(reliquiaId);
        if (jugador.oro < precio) return;

        PlayerStatsHelper.modificarOro(jugador, -precio);

        const stockRestante = Array.from(jugador.tiendaReliquias);
        stockRestante.splice(indiceReliquia, 1);
        CombatEngine.sincronizarArraySchema(jugador.tiendaReliquias, stockRestante);

        RelicEngine.otorgarReliquia(this.state, jugador, reliquiaId, true);
    }

    public eliminarCartaMazo(sessionId: string, indiceMazo: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada || jugador.tiendaEliminacionUsada) return;
        if (jugador.mazoMaestro.length <= 1) return;
        if (indiceMazo < 0 || indiceMazo >= jugador.mazoMaestro.length) return;

        const costo = ECONOMIA_CONFIG.COSTO_ELIMINAR_CARTA_TIENDA;
        if (jugador.oro < costo) return;

        PlayerStatsHelper.modificarOro(jugador, -costo);

        const mazoTemp = Array.from(jugador.mazoMaestro);
        mazoTemp.splice(indiceMazo, 1);
        CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, mazoTemp);

        jugador.tiendaEliminacionUsada = true;
    }

    public salirTienda(sessionId: string): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;

        jugador.tiendaCompletada = true;
        this.verificarFinTienda();
    }

    public verificarFinTienda(): void {
        if (this.state.faseActual !== "SHOP") return;

        let todosListos = true;
        this.state.jugadores.forEach((j) => {
            if (!j.tiendaCompletada) todosListos = false;
        });

        if (todosListos) {
            this.onTiendaCompletadaCallback();
        }
    }
}