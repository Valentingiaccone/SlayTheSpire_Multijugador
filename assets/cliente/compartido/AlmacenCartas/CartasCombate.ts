import { ICartaData } from "../Cartas";

export const CARTAS_COMBATE: ICartaData[] = [
    {
        id: "golpe_combate",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_combate",
        clase: "combate",
        descripcion: "Inflige {D} de daño.",
        enPoolRecompensa: false,
        precioTienda: 45,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "defender_combate",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana {B} de bloqueo.",
        clase: "combate",
        sprite: "defender_combate",
        enPoolRecompensa: false,
        precioTienda: 45,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }]
        }
    },
    {
        id: "bash",
        nombre: "Bash",
        costo: 2,
        descripcion: "Inflige {D} de daño y aplica 2 de Vulnerable.",
        objetivoSeleccion: "ENEMIGO",
        clase: "combate",
        sprite: "bash",
        enPoolRecompensa: false,
        precioTienda: 65,
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", valor: 2, objetivo: "ENEMIGO", estadoId: "VULNERABLE" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 3 de Vulnerable.",
            efectos: [
                { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", valor: 3, objetivo: "ENEMIGO", estadoId: "VULNERABLE" }
            ]
        }
    },
    {
        id: "formacion_defensiva",
        nombre: "Formación Defensiva",
        costo: 1,
        descripcion: "Todos los aliados ganan {B} de bloqueo.",
        clase: "combate",
        sprite: "formacion_defensiva_combate",
        enPoolRecompensa: true,
        precioTienda: 60,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 6, objetivo: "TODOS_ALIADOS" }],
        mejora: {
            descripcion: "Todos los aliados ganan {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 9, objetivo: "TODOS_ALIADOS" }]
        }
    },
    {
        id: "cobertura_aliada",
        nombre: "Cobertura",
        costo: 1,
        descripcion: "Otorga {B} de bloqueo a un aliado. Roba 1 carta.",
        objetivoSeleccion: "ALIADO",
        clase: "combate",
        sprite: "cobertura_combate",
        enPoolRecompensa: true,
        precioTienda: 55,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 7, objetivo: "ALIADO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Otorga {B} de bloqueo a un aliado. Roba 2 cartas.",
            efectos: [
                { tipo: "BLOQUEO", valor: 10, objetivo: "ALIADO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_perforante",
        nombre: "Golpe perforante",
        costo: 1,
        descripcion: "Inflige {D} de daño a todos los enemigos.",
        clase: "combate",
        sprite: "golpe_perforante",
        enPoolRecompensa: true,
        precioTienda: 60,
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 8, objetivo: "TODOS_ENEMIGOS" }],
        mejora: {
            descripcion: "Inflige {D} de daño a todos los enemigos.",
            efectos: [{ tipo: "DANIO", valor: 11, objetivo: "TODOS_ENEMIGOS" }]
        }
    },
    {
        id: "onda_de_hierro",
        nombre: "Onda de hierro",
        costo: 1,
        descripcion: "Inflige {D} de daño a un enemigo. Gana {B} de bloqueo.",
        clase: "combate",
        sprite: "onda_de_hierro",
        enPoolRecompensa: true,
        precioTienda: 55,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño a un enemigo. Gana {B} de bloqueo.",
            efectos: [
                { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
                { tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_fuerte_combate",
        nombre: "Golpe fuerte",
        costo: 1,
        descripcion: "Inflige {D} de daño. Roba 1 carta.",
        clase: "combate",
        sprite: "golpe_fuerte_combate",
        enPoolRecompensa: true,
        precioTienda: 65,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Roba 2 cartas.",
            efectos: [
                { tipo: "DANIO", valor: 11, objetivo: "ENEMIGO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "escudo_rectangular",
        nombre: "Escudo rectangular",
        costo: 1,
        descripcion: "Gana {B} de bloqueo. Roba 1 carta.",
        clase: "combate",
        sprite: "escudo_rectangular",
        enPoolRecompensa: true,
        precioTienda: 60,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Roba 1 carta.",
            efectos: [
                { tipo: "BLOQUEO", valor: 11, objetivo: "PROPIO" },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_boomerang",
        nombre: "Golpe boomerang",
        costo: 1,
        descripcion: "Inflige {D} de daño a un enemigo aleatorio 3 veces.",
        clase: "combate",
        sprite: "golpe_boomerang",
        enPoolRecompensa: true,
        precioTienda: 65,
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 3, objetivo: "ENEMIGO_ALEATORIO", repeticiones: 3 }],
        mejora: {
            descripcion: "Inflige {D} de daño a un enemigo aleatorio 4 veces.",
            efectos: [{ tipo: "DANIO", valor: 3, objetivo: "ENEMIGO_ALEATORIO", repeticiones: 4 }]
        }
    }
];