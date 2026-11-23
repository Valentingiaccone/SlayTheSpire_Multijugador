import { ICartaData } from "../Cartas";

export const CARTAS_VENENO: ICartaData[] = [
    // ================= BÁSICAS (MAZO INICIAL CROW) =================
    {
        id: "golpe_veneno",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_veneno",
        clase: "veneno",
        calidad: "BASICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: false,
        descripcion: "Inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "defender_veneno",
        nombre: "Defender",
        costo: 1,
        sprite: "defender_veneno",
        clase: "veneno",
        calidad: "BASICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: false,
        descripcion: "Gana {B} de bloqueo.",
        efectos: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }]
        }
    },

    // ================= COMUNES =================
    {
        id: "perdicion",
        nombre: "Perdición",
        costo: 1,
        sprite: "perdicion",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si el enemigo tiene Veneno, inflige {D} de daño adicional.",
        efectos: [
            { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", minimo: 1 },
                efectosSiCumple: [{ tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" }]
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si el enemigo tiene Veneno, inflige {D} de daño adicional.",
            efectos: [
                { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", minimo: 1 },
                    efectosSiCumple: [{ tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" }]
                }
            ]
        }
    },
    {
        id: "veneno",
        nombre: "Veneno",
        costo: 1,
        sprite: "veneno",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Aplica 5 de Veneno a un enemigo.",
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 5, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Aplica 7 de Veneno a un enemigo.",
            efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 7, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "proteccion",
        nombre: "Protección",
        costo: 0,
        sprite: "proteccion",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo.",
        efectos: [{ tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" }]
        }
    },
    {
        id: "debilidad",
        nombre: "Debilidad",
        costo: 1,
        sprite: "debilidad",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Todos los enemigos pierden 6 de Fuerza este turno. Agotar.",
        efectos: [{ tipo: "REDUCIR_FUERZA_TEMPORAL", valor: 6, objetivo: "TODOS_ENEMIGOS" }],
        mejora: {
            descripcion: "Todos los enemigos pierden 8 de Fuerza este turno. Agotar.",
            efectos: [{ tipo: "REDUCIR_FUERZA_TEMPORAL", valor: 8, objetivo: "TODOS_ENEMIGOS" }]
        }
    },
    {
        id: "daga_venenosa",
        nombre: "Daga venenosa",
        costo: 1,
        sprite: "daga_venenosa",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y aplica 3 de Veneno.",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 4 de Veneno.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 4, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "golpe_rapido",
        nombre: "Golpe rápido",
        costo: 1,
        sprite: "golpe_rapido",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Roba 1 carta.",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Roba 1 carta.",
            efectos: [
                { tipo: "DANIO", valor: 12, objetivo: "ENEMIGO" },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_debilatorio",
        nombre: "Golpe debilatorio",
        costo: 1,
        sprite: "golpe_debilatorio",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y aplica 1 de Débil.",
        efectos: [
            { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 2 de Débil.",
            efectos: [
                { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "ENEMIGO" }
            ]
        }
    },

    // ================= ÉPICAS =================
    {
        id: "bloqueo_duradero",
        nombre: "Bloqueo duradero",
        costo: 1,
        sprite: "bloqueo_duradero",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Tu bloqueo no se reinicia al inicio de tu próximo turno.",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "MANTENER_BLOQUEO", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Tu bloqueo no se reinicia al inicio de tu próximo turno.",
            efectos: [
                { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "MANTENER_BLOQUEO", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "rebote_de_veneno",
        nombre: "Rebote de veneno",
        costo: 2,
        sprite: "rebote_de_veneno",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Aplica 3 de Veneno a un enemigo aleatorio 3 veces.",
        efectos: [
            {
                tipo: "APLICAR_ESTADO",
                estadoId: "VENENO",
                valor: 3,
                objetivo: "ENEMIGO_ALEATORIO",
                repeticiones: 3
            }
        ],
        mejora: {
            descripcion: "Aplica 3 de Veneno a un enemigo aleatorio 4 veces.",
            efectos: [
                {
                    tipo: "APLICAR_ESTADO",
                    estadoId: "VENENO",
                    valor: 3,
                    objetivo: "ENEMIGO_ALEATORIO",
                    repeticiones: 4
                }
            ]
        }
    },
    {
        id: "contraataque",
        nombre: "Contraataque",
        costo: 1,
        sprite: "contraataque",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Gana 3 de Espinas (devuelve daño al ser atacado).",
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "ESPINAS", valor: 3, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana 5 de Espinas (devuelve daño al ser atacado).",
            efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "ESPINAS", valor: 5, objetivo: "PROPIO" }]
        }
    },
    {
        id: "pocima_mejorada",
        nombre: "Pócima mejorada",
        costo: 1,
        sprite: "pocima_mejorada",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        objetivoSeleccion: "ENEMIGO",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Duplica el Veneno de un enemigo. Agotar.",
        efectos: [
            { tipo: "MULTIPLICAR_ESTADO", estadoId: "VENENO", multiplicador: 2, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Triplica el Veneno de un enemigo. Agotar.",
            efectos: [
                { tipo: "MULTIPLICAR_ESTADO", estadoId: "VENENO", multiplicador: 3, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "cuervo",
        nombre: "Cuervo",
        costo: 2,
        sprite: "cuervo",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Aplica 4 de Veneno y 2 de Débil a TODOS los enemigos. Agotar.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 4, objetivo: "TODOS_ENEMIGOS" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "TODOS_ENEMIGOS" }
        ],
        mejora: {
            descripcion: "Aplica 7 de Veneno y 2 de Débil a TODOS los enemigos. Agotar.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 7, objetivo: "TODOS_ENEMIGOS" },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "TODOS_ENEMIGOS" }
            ]
        }
    }
];