export type FaseSala = "LOBBY" | "MAP" | "COMBAT" | "REWARD" | "VICTORY" | "DEFEAT";

export const MENSAJES = {
    ELEGIR_PERSONAJE: "elegir_personaje",
    TOGGLE_LISTO: "toggle_listo",
    VOTAR_NODO: "votar_nodo",
    JUGAR_CARTA: "jugar_carta",
    TERMINAR_TURNO: "terminar_turno",
    ELEGIR_RECOMPENSA: "elegir_recompensa",
    REINICIAR_PARTIDA: "reiniciar_partida"
} as const;

export type PersonajeId = "SHELLY" | "CROW"

export type ClaseId = "combate" | "ladron" | "shelly" | "veneno" | "asesino" | "crow"

export interface IPersonajeInfo {
    id: PersonajeId
    nombre: string
    icono: string
    hpMax: number
    energiaMax: number
    descripcion: string
    clases: ClaseId[]
    mazoInicial: string[];
}

export const PERSONAJES_INFO: Record<PersonajeId, IPersonajeInfo> = {
    SHELLY: {
        id: "SHELLY",
        nombre: "Shelly",
        icono: "icono_shelly",
        hpMax: 90,
        energiaMax: 3,
        descripcion: "Personaje simple, tiene buen ataque, defensa y forma de ganar dinero.",
        clases: ["combate", "ladron", "shelly"],
        mazoInicial: ["golpe_combate", "golpe_combate", "golpe_combate", "golpe_combate",
            "defender_combate", "defender_combate", "defender_combate", "defender_combate",
            "bash"
        ]
    },
    CROW: {
        id: "CROW",
        nombre: "Crow",
        icono: "icono_crow",
        hpMax: 70,
        energiaMax: 3,
        descripcion: "Envenena a sus enemigos y lanza muchos ataques para acabar con sus enemigos.",
        clases: ["veneno", "asesino", "crow"],
        mazoInicial: ["golpe_veneno", "golpe_veneno", "golpe_veneno", "golpe_veneno",
            "defender_veneno", "defender_veneno", "defender_veneno", "defender_veneno",
            "bash"
        ]
    }
};