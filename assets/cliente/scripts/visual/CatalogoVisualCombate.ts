import { EstadoId } from "../../compartido/CondicionesYEfectos";
import { ENEMIGOS_INFO, TipoIntencion } from "../../compartido/Enemigos";

export interface IInfoVisualEstado {
    nombre: string;
    sprite: string;
    construirDescripcion: (valor: number) => string;
}

export interface IInfoVisualIntencion {
    nombre: string;
    sprite: string;
    construirDescripcion: (valor: number, golpes: number, invocarId: string) => string;
}

export const INFO_VISUAL_ESTADOS: Record<EstadoId, IInfoVisualEstado> = {
    FUERZA: {
        nombre: "Fuerza",
        sprite: "fuerza",
        construirDescripcion: (v) =>
            v >= 0
                ? `Los ataques infligen +${v} de daño adicional.`
                : `Los ataques infligen ${v} menos de daño.`
    },
    FUERZA_TEMPORAL: {
        nombre: "Fuerza Temporal",
        sprite: "fuerza_temporal",
        construirDescripcion: (v) => `Al final de este turno, pierde ${v} de Fuerza.`
    },
    DESTREZA: {
        nombre: "Destreza",
        sprite: "destreza",
        construirDescripcion: (v) =>
            v >= 0
                ? `Las cartas otorgan +${v} de bloqueo adicional.`
                : `Las cartas otorgan ${v} menos de bloqueo.`
    },
    VULNERABLE: {
        nombre: "Vulnerable",
        sprite: "vulnerable",
        construirDescripcion: (v) =>
            `Recibe 50% más de daño de ataques durante ${v} turno${v === 1 ? "" : "s"}.`
    },
    DEBIL: {
        nombre: "Débil",
        sprite: "debil",
        construirDescripcion: (v) =>
            `Inflige 25% menos de daño con ataques durante ${v} turno${v === 1 ? "" : "s"}.`
    },
    ESPINAS: {
        nombre: "Espinas",
        sprite: "espinas",
        construirDescripcion: (v) => `Al ser atacado, devuelve ${v} de daño directo al atacante.`
    },
    VENENO: {
        nombre: "Veneno",
        sprite: "veneno",
        construirDescripcion: (v) =>
            `Al inicio de su turno pierde ${v} de HP (ignora bloqueo) y reduce Veneno en 1.`
    },
    AVARICIA: {
        nombre: "Avaricia",
        sprite: "avaricia",
        construirDescripcion: (v) => `Gana ${v} de oro por cada punto de HP que pierda.`
    },
    ARRIESGAR_GANAR: {
        nombre: "Arriesgar y Ganar",
        sprite: "arriesgar_ganar",
        construirDescripcion: (v) =>
            `Al iniciar cada turno pierde 3 HP y gana ${v} de oro por cada 20 de oro que tenga.`
    },
    SIN_ROBO: {
        nombre: "Sin Robo",
        sprite: "sin_robo",
        construirDescripcion: () => `No puede robar más cartas durante el resto de este turno.`
    },
    COMBUSTION: {
        nombre: "Combustión",
        sprite: "combustion",
        construirDescripcion: (v) =>
            `Al terminar el turno pierde 1 HP e inflige ${v} de daño a todos los enemigos.`
    }
};

export const INFO_VISUAL_INTENCIONES: Record<TipoIntencion, IInfoVisualIntencion> = {
    ATACAR: {
        nombre: "Ataque",
        sprite: "atacar",
        construirDescripcion: (valor, golpes) =>
            golpes > 1
                ? `Atacará a todos los jugadores por ${valor} de daño, ${golpes} veces.`
                : `Atacará a todos los jugadores por ${valor} de daño.`
    },
    BLOQUEAR: {
        nombre: "Defensa",
        sprite: "bloquear",
        construirDescripcion: (valor) => `Ganará ${valor} de bloqueo en su turno.`
    },
    ATACAR_Y_BLOQUEAR: {
        nombre: "Ataque y Defensa",
        sprite: "atacar_y_bloquear",
        construirDescripcion: (valor) =>
            `Atacará por ${valor} de daño y ganará ${valor} de bloqueo.`
    },
    GANAR_FUERZA: {
        nombre: "Potenciarse (Fuerza)",
        sprite: "ganar_fuerza",
        construirDescripcion: (valor) => `Ganará +${valor} de Fuerza permanente.`
    },
    GANAR_ESPINAS: {
        nombre: "Potenciarse (Espinas)",
        sprite: "ganar_espinas",
        construirDescripcion: (valor) => `Ganará +${valor} de Espinas.`
    },
    APLICAR_VULNERABLE: {
        nombre: "Debilitar (Vulnerable)",
        sprite: "aplicar_vulnerable",
        construirDescripcion: (valor) =>
            `Aplicará ${valor} de Vulnerable a todos los jugadores.`
    },
    APLICAR_DEBIL: {
        nombre: "Debilitar (Débil)",
        sprite: "aplicar_debil",
        construirDescripcion: (valor) => `Aplicará ${valor} de Débil a todos los jugadores.`
    },
    CURAR_ALIADOS: {
        nombre: "Curación Grupal",
        sprite: "curar_aliados",
        construirDescripcion: (valor) =>
            `Curará ${valor} de HP a todos los enemigos vivos.`
    },
    INVOCAR: {
        nombre: "Invocar",
        sprite: "invocar",
        construirDescripcion: (valor, _golpes, invocarId) => {
            const nombre = ENEMIGOS_INFO[invocarId]?.nombre || invocarId;
            return `Invocará ${valor} ${nombre} al combate.`;
        }
    }
};