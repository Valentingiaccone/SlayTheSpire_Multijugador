"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatEngine = void 0;
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const Enemigos_1 = require("../../../assets/cliente/compartido/Enemigos");
const Mapa_1 = require("../../../assets/cliente/compartido/Mapa");
const EFECTO_HANDLERS = {
    DANIO: (state, lanzador, efecto, objetivoId) => {
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            CombatEngine.aplicarDanio(lanzador, obj, efecto.valor);
        }
    },
    BLOQUEO: (state, lanzador, efecto, objetivoId) => {
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            obj.bloqueo += efecto.valor;
        }
    },
    APLICAR_ESTADO: (state, lanzador, efecto, objetivoId) => {
        if (!efecto.estadoId)
            return;
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            const actual = obj.estados.get(efecto.estadoId) || 0;
            obj.estados.set(efecto.estadoId, actual + efecto.valor);
        }
    },
    ROBAR_CARTA: (_state, lanzador, efecto) => {
        CombatEngine.robarCartas(lanzador, efecto.valor);
    },
    GANAR_ENERGIA: (_state, lanzador, efecto) => {
        lanzador.energia += efecto.valor;
    }
};
function resolverObjetivos(state, lanzador, tipo, objetivoId) {
    switch (tipo) {
        case "PROPIO":
            return [lanzador];
        case "ENEMIGO": {
            const enemigo = state.enemigos.find((e) => e.uid === objetivoId && e.hp > 0);
            return enemigo ? [enemigo] : [];
        }
        case "TODOS_ENEMIGOS":
            return state.enemigos.filter((e) => e.hp > 0);
        case "ALIADO": {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            return aliado && aliado.hp > 0 ? [aliado] : [];
        }
        case "TODOS_ALIADOS": {
            const vivos = [];
            state.jugadores.forEach((j) => { if (j.hp > 0)
                vivos.push(j); });
            return vivos;
        }
        default:
            return [];
    }
}
class CombatEngine {
    /** Embudo único para jugar cualquier carta */
    static jugarCarta(state, jugador, indiceMano, objetivoId) {
        if (state.faseActual !== "COMBAT" || jugador.hp <= 0 || jugador.turnoTerminado)
            return false;
        if (indiceMano < 0 || indiceMano >= jugador.mano.length)
            return false;
        const cartaId = jugador.mano[indiceMano];
        const cartaData = Cartas_1.CATALOGO_CARTAS[cartaId];
        if (!cartaData)
            return false;
        if (jugador.energia < cartaData.costo)
            return false;
        // Validar objetivo si la carta lo exige
        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo)
                return false;
        }
        else if (cartaData.objetivoSeleccion === "ALIADO") {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            if (!aliado || aliado.hp <= 0)
                return false;
        }
        // 1. Cobrar energía y sacar la carta de la mano
        jugador.energia -= cartaData.costo;
        jugador.mano.splice(indiceMano, 1);
        // 2. Ejecutar todos los efectos componibles en orden
        for (const efecto of cartaData.efectos) {
            const handler = EFECTO_HANDLERS[efecto.tipo];
            if (handler) {
                handler(state, jugador, efecto, objetivoId);
            }
        }
        // 3. Mandar carta al descarte
        jugador.descarteInterno.push(cartaId);
        this.actualizarContadoresMazo(jugador);
        // 4. Verificar si murieron todos los enemigos
        this.verificarVictoriaCombate(state);
        return true;
    }
    /** Cálculo centralizado de daño (aplica Fuerza, Débil y Vulnerable automáticamente) */
    static aplicarDanio(atacante, defensor, danioBase) {
        if (defensor.hp <= 0)
            return;
        let monto = danioBase + (atacante.estados.get("FUERZA") || 0);
        if ((atacante.estados.get("DEBIL") || 0) > 0) {
            monto = Math.floor(monto * 0.75);
        }
        if ((defensor.estados.get("VULNERABLE") || 0) > 0) {
            monto = Math.floor(monto * 1.5);
        }
        monto = Math.max(0, monto);
        const danioTrasBloqueo = Math.max(0, monto - defensor.bloqueo);
        defensor.bloqueo = Math.max(0, defensor.bloqueo - monto);
        defensor.hp = Math.max(0, defensor.hp - danioTrasBloqueo);
    }
    static prepararMazoCombate(jugador) {
        jugador.estados.clear();
        jugador.mano.clear();
        jugador.descarteInterno = [];
        jugador.pilaRoboInterna = [...jugador.mazoMaestro];
        this.mezclarArray(jugador.pilaRoboInterna);
        this.actualizarContadoresMazo(jugador);
    }
    static robarCartas(jugador, cantidad) {
        for (let i = 0; i < cantidad; i++) {
            if (jugador.mano.length >= 10)
                break;
            if (jugador.pilaRoboInterna.length === 0) {
                if (jugador.descarteInterno.length === 0)
                    break;
                jugador.pilaRoboInterna = [...jugador.descarteInterno];
                jugador.descarteInterno = [];
                this.mezclarArray(jugador.pilaRoboInterna);
            }
            const cartaRobada = jugador.pilaRoboInterna.pop();
            if (cartaRobada) {
                jugador.mano.push(cartaRobada);
            }
        }
        this.actualizarContadoresMazo(jugador);
    }
    static descartarMano(jugador) {
        while (jugador.mano.length > 0) {
            const carta = jugador.mano.pop();
            if (carta)
                jugador.descarteInterno.push(carta);
        }
        this.actualizarContadoresMazo(jugador);
    }
    static reducirEstadosPorTurno(entidad) {
        ["VULNERABLE", "DEBIL"].forEach((estado) => {
            const val = entidad.estados.get(estado) || 0;
            if (val > 1)
                entidad.estados.set(estado, val - 1);
            else if (val === 1)
                entidad.estados.delete(estado);
        });
    }
    static ejecutarTurnoEnemigos(state) {
        state.enemigos.forEach((enemigo) => {
            if (enemigo.hp <= 0)
                return;
            enemigo.bloqueo = 0;
            if (enemigo.intencionTipo === "ATACAR") {
                state.jugadores.forEach((jugador) => {
                    if (jugador.hp > 0) {
                        this.aplicarDanio(enemigo, jugador, enemigo.intencionValor);
                    }
                });
            }
            else if (enemigo.intencionTipo === "BLOQUEAR") {
                enemigo.bloqueo += enemigo.intencionValor;
            }
            this.reducirEstadosPorTurno(enemigo);
            const info = Enemigos_1.ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                enemigo.intencionTipo = info.patron[enemigo.indicePatron].tipo;
                enemigo.intencionValor = info.patron[enemigo.indicePatron].valor;
            }
        });
    }
    static actualizarContadoresMazo(jugador) {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
    }
    static mezclarArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    static verificarVictoriaCombate(state) {
        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            state.faseActual = state.pisoActual >= Mapa_1.CONFIG_MAPA.CANTIDAD_PISOS ? "VICTORY" : "REWARD";
            console.log(`¡Combate ganado! Nueva fase: ${state.faseActual}`);
        }
    }
}
exports.CombatEngine = CombatEngine;
