import { ICartaData } from "../Cartas";

export const CARTAS_COMBATE: ICartaData[] = [
    {
        id: "golpe_combate",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_combate",
        clase: "combate",
        descripcion: "Inflige 6 de daño.",
        enPoolRecompensa: false,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }
        ]
    },
    {
        id: "defender_combate",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana 5 de bloqueo.",
        clase: "combate",
        sprite: "defender_combate",
        enPoolRecompensa: false,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }
        ]
    },
    {
        id: "bash",
        nombre: "Bash",
        costo: 2,
        descripcion: "Inflige 8 de daño y aplica 2 de Vulnerable.",
        objetivoSeleccion: "ENEMIGO",
        clase: "combate",
        sprite: "bash",
        enPoolRecompensa: false,
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", valor: 2, objetivo: "ENEMIGO", estadoId: "VULNERABLE" }
        ]
    },
    {
        id: "formacion_defensiva",
        nombre: "Formación Defensiva",
        costo: 1,
        descripcion: "Todos los aliados ganan 6 de bloqueo.",
        clase: "combate",
        sprite: "formacion_defensiva_combate",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 6, objetivo: "TODOS_ALIADOS" }
        ]
    },
    {
        id: "cobertura_aliada",
        nombre: "Cobertura",
        costo: 1,
        descripcion: "Otorga 7 de bloqueo a un aliado. Roba 1 carta.",
        objetivoSeleccion: "ALIADO",
        clase: "combate",
        sprite: "cobertura_combate",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 7, objetivo: "ALIADO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ]
    },
    {
        id: "golpe_perforante",
        nombre: "Golpe perforante",
        costo: 1,
        descripcion: "Inflige 8 de daño a todos los enemigos.",
        clase: "combate",
        sprite: "golpe_perforante",
        enPoolRecompensa: true,
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "TODOS_ENEMIGOS" }
        ]
    },
    {
        id: "onda_de_hierro",
        nombre: "Onda de hierro",
        costo: 1,
        descripcion: "Inflige 5 de daño a un enemigo. Gana 5 de bloqueo.",
        clase: "combate",
        sprite: "onda_de_hierro",
        enPoolRecompensa: true,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }
        ]
    },
    {
        id: "golpe_fuerte_combate",
        nombre: "Golpe fuerte",
        costo: 1,
        descripcion: "Inflige 9 de daño. Roba 1 carta.",
        clase: "combate",
        sprite: "golpe_fuerte_combate",
        enPoolRecompensa: true,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ]
    },
    {
        id: "escudo_rectangular",
        nombre: "Escudo rectangular",
        costo: 1,
        descripcion: "Gana 8 de bloqueo. Roba 1 carta.",
        clase: "combate",
        sprite: "escudo_rectangular",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ]
    },
    {
        id: "golpe_boomerang",
        nombre: "Golpe boomerang",
        costo: 1,
        descripcion: "Inflige 3 de daño a un enemigo aleatorio 3 veces.",
        clase: "combate",
        sprite: "golpe_boomerang",
        enPoolRecompensa: true,
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 3, objetivo: "ENEMIGO_ALEATORIO", repeticiones: 3 }
        ]
    }
];