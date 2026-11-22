import { ICartaData } from "../Cartas";

export const CARTAS_ASESINO: ICartaData[] = [
    // --- CARTA INTERNA DE DAGA (No sale como recompensa) ---
    {
        id: "daga_asesino",
        nombre: "Daga",
        costo: 0,
        sprite: "golpe_combate",
        clase: "asesino",
        calidad: "BASICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: false,
        agotar: true,
        descripcion: "Inflige {D} de daño. Se agota.",
        efectos: [{ tipo: "DANIO", valor: 4, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño. Se agota.",
            efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }]
        }
    },

    // --- COMUNES ---
    {
        id: "danza_cuchillas",
        nombre: "Danza de Cuchillas",
        costo: 1,
        sprite: "defender_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Añade 3 Dagas a tu mano.",
        efectos: [{ tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga_asesino", cantidad: 3 }],
        mejora: {
            descripcion: "Añade 4 Dagas a tu mano.",
            efectos: [{ tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga_asesino", cantidad: 4 }]
        }
    },
    {
        id: "capa_y_espada",
        nombre: "Capa y Espada",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Añade 1 Daga a tu mano.",
        efectos: [
            { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
            { tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga_asesino", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Añade 2 Dagas a tu mano.",
            efectos: [
                { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
                { tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga_asesino", cantidad: 2 }
            ]
        }
    },
    {
        id: "acrobacia",
        nombre: "Acrobacia",
        costo: 1,
        sprite: "cobertura_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Roba 3 cartas. Descarta 1 carta de tu mano.",
        efectos: [
            { tipo: "ROBAR_CARTA", valor: 3, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 1, cantidadMax: 1 }
        ],
        mejora: {
            descripcion: "Roba 4 cartas. Descarta 1 carta de tu mano.",
            efectos: [
                { tipo: "ROBAR_CARTA", valor: 4, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 1, cantidadMax: 1 }
            ]
        }
    },
    {
        id: "lanzamiento_daga",
        nombre: "Lanzamiento de daga",
        costo: 1,
        sprite: "golpe_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Roba 1 carta y descarta 1 carta.",
        efectos: [
            { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 1, cantidadMax: 1 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Roba 1 carta y descarta 1 carta.",
            efectos: [
                { tipo: "DANIO", valor: 12, objetivo: "ENEMIGO" },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 1, cantidadMax: 1 }
            ]
        }
    },
    {
        id: "preparacion",
        nombre: "Preparación",
        costo: 0,
        sprite: "formacion_defensiva_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Roba 1 carta. Descarta 1 carta.",
        efectos: [
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 1, cantidadMax: 1 }
        ],
        mejora: {
            descripcion: "Roba 2 cartas. Descarta 2 cartas.",
            efectos: [
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", motivo: "DESCARTAR", cantidadMin: 2, cantidadMax: 2 }
            ]
        }
    },
    {
        id: "lluvia_dagas",
        nombre: "Lluvia de dagas",
        costo: 1,
        sprite: "golpe_perforante",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño a TODOS los enemigos 2 veces.",
        efectos: [{ tipo: "DANIO", valor: 4, objetivo: "TODOS_ENEMIGOS", repeticiones: 2 }],
        mejora: {
            descripcion: "Inflige {D} de daño a TODOS los enemigos 2 veces.",
            efectos: [{ tipo: "DANIO", valor: 6, objetivo: "TODOS_ENEMIGOS", repeticiones: 2 }]
        }
    },
    {
        id: "neutralizar",
        nombre: "Neutralizar",
        costo: 0,
        sprite: "golpe_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y aplica 1 de Débil.",
        efectos: [
            { tipo: "DANIO", valor: 3, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 2 de Débil.",
            efectos: [
                { tipo: "DANIO", valor: 4, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "ENEMIGO" }
            ]
        }
    },

    // --- ÉPICAS Y LEGENDARIAS ---
    {
        id: "adrenalina",
        nombre: "Adrenalina",
        costo: 0,
        sprite: "escudo_rectangular",
        clase: "asesino",
        calidad: "LEGENDARIA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        agotar: true,
        descripcion: "Gana 1 de Energía. Roba 2 cartas. Se agota.",
        efectos: [
            { tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana 2 de Energía. Roba 2 cartas. Se agota.",
            efectos: [
                { tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },

    // --- ORIGINAL TUYA ---
    {
        id: "ira",
        nombre: "Ira",
        costo: 0,
        sprite: "golpe_combate",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Añade una copia a tu pila de descarte.",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
            { tipo: "COPIAR_CARTA_A_DESCARTE", cartaId: "ira", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Añade una copia mejorada a tu descarte.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                { tipo: "COPIAR_CARTA_A_DESCARTE", cartaId: "ira+", cantidad: 1 }
            ]
        }
    }
];