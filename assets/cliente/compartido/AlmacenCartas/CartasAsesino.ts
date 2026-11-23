import { ICartaData } from "../Cartas";

export const CARTAS_ASESINO: ICartaData[] = [
    // ================= TOKEN (NO OBTENIBLE EN RECOMPENSAS) =================
    {
        id: "daga",
        nombre: "Daga",
        costo: 0,
        sprite: "daga",
        clase: "asesino",
        calidad: "BASICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        agotar: true,
        esDaga: true,
        enPoolRecompensa: false,
        descripcion: "Inflige {D} de daño. Agotar.",
        efectos: [{ tipo: "DANIO", valor: 4, objetivo: "ENEMIGO", esDaga: true }],
        mejora: {
            descripcion: "Inflige {D} de daño. Agotar.",
            efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO", esDaga: true }]
        }
    },

    // ================= INICIALES (MAZO INICIAL CROW) =================
    {
        id: "neutralizar",
        nombre: "Neutralizar",
        costo: 0,
        sprite: "neutralizar",
        clase: "asesino",
        calidad: "BASICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: false,
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
    {
        id: "superviviente",
        nombre: "Superviviente",
        costo: 1,
        sprite: "superviviente",
        clase: "asesino",
        calidad: "BASICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: false,
        descripcion: "Gana {B} de bloqueo. Descarta 1 carta.",
        efectos: [
            { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Descarta 1 carta.",
            efectos: [
                { tipo: "BLOQUEO", valor: 11, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
            ]
        }
    },

    // ================= COMUNES =================
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
        descripcion: "Inflige {D} de daño. Añade una copia de esta carta a tu pila de descarte.",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
            { tipo: "COPIAR_CARTA_A_DESCARTE", cartaId: "ira", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Añade una copia de esta carta mejorada a tu pila de descarte.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                { tipo: "COPIAR_CARTA_A_DESCARTE", cartaId: "ira+", cantidad: 1 }
            ]
        }
    },
    {
        id: "acrobacia",
        nombre: "Acrobacia",
        costo: 1,
        sprite: "acrobacia",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Roba 3 cartas. Descarta 1 carta.",
        efectos: [
            { tipo: "ROBAR_CARTA", valor: 3, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Roba 4 cartas. Descarta 1 carta.",
            efectos: [
                { tipo: "ROBAR_CARTA", valor: 4, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
            ]
        }
    },
    {
        id: "backflip",
        nombre: "Backflip",
        costo: 1,
        sprite: "backflip",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Roba 2 cartas.",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Roba 2 cartas.",
            efectos: [
                { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "danza_de_dagas",
        nombre: "Danza de dagas",
        costo: 1,
        sprite: "danza_de_dagas",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Añade 3 Dagas a tu mano.",
        efectos: [{ tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga", cantidad: 3 }],
        mejora: {
            descripcion: "Añade 4 Dagas a tu mano.",
            efectos: [{ tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga", cantidad: 4 }]
        }
    },
    {
        id: "capa_y_daga",
        nombre: "Capa y daga",
        costo: 1,
        sprite: "capa_y_daga",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Añade 1 Daga a tu mano.",
        efectos: [
            { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
            { tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Añade 2 Dagas a tu mano.",
            efectos: [
                { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
                { tipo: "AGREGAR_CARTA_A_MANO", cartaId: "daga", cantidad: 2 }
            ]
        }
    },
    {
        id: "spray_de_dagas",
        nombre: "Spray de dagas",
        costo: 1,
        sprite: "spray_de_dagas",
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
        id: "lanza_de_daga",
        nombre: "Lanza de daga",
        costo: 1,
        sprite: "lanza_de_daga",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Roba 1 carta. Descarta 1 carta.",
        efectos: [
            { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Roba 1 carta. Descarta 1 carta.",
            efectos: [
                { tipo: "DANIO", valor: 12, objetivo: "ENEMIGO" },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
            ]
        }
    },
    {
        id: "esquivar_y_rodar",
        nombre: "Esquivar y rodar",
        costo: 1,
        sprite: "esquivar_y_rodar",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Al inicio de tu siguiente turno, gana {B} de bloqueo.",
        efectos: [
            { tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "BLOQUEO_SIGUIENTE_TURNO", valor: 4, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Al inicio de tu siguiente turno, gana {B} de bloqueo.",
            efectos: [
                { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "BLOQUEO_SIGUIENTE_TURNO", valor: 6, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "patada_voladora",
        nombre: "Patada voladora",
        costo: 1,
        sprite: "patada_voladora",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Al inicio de tu siguiente turno, gana 1 de energía.",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "ENERGIA_SIGUIENTE_TURNO", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Al inicio de tu siguiente turno, gana 1 de energía.",
            efectos: [
                { tipo: "DANIO", valor: 11, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "ENERGIA_SIGUIENTE_TURNO", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "tactica",
        nombre: "Táctica",
        costo: 1,
        sprite: "tactica",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Al inicio de tu siguiente turno, gana 2 de energía.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "ENERGIA_SIGUIENTE_TURNO", valor: 2, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Al inicio de tu siguiente turno, gana 3 de energía.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "ENERGIA_SIGUIENTE_TURNO", valor: 3, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "preparado",
        nombre: "Preparado",
        costo: 0,
        sprite: "preparado",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Roba 1 carta. Descarta 1 carta.",
        efectos: [
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" },
            { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Roba 2 cartas. Descarta 2 cartas.",
            efectos: [
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" },
                { tipo: "SELECCIONAR_CARTAS_MANO", accion: "DESCARTAR", cantidad: 2 }
            ]
        }
    },
    {
        id: "cortar",
        nombre: "Cortar",
        costo: 0,
        sprite: "cortar",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "golpe_travieso",
        nombre: "Golpe travieso",
        costo: 2,
        sprite: "golpe_travieso",
        clase: "asesino",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si descartaste una carta este turno, gana 2 de energía.",
        efectos: [
            { tipo: "DANIO", valor: 12, objetivo: "ENEMIGO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "DESCARTO_EN_TURNO" },
                efectosSiCumple: [{ tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" }]
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si descartaste una carta este turno, gana 2 de energía.",
            efectos: [
                { tipo: "DANIO", valor: 16, objetivo: "ENEMIGO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "DESCARTO_EN_TURNO" },
                    efectosSiCumple: [{ tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" }]
                }
            ]
        }
    },

    // ================= ÉPICAS =================
    {
        id: "precision",
        nombre: "Precisión",
        costo: 1,
        sprite: "precision",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Todos los aliados obtienen +4 de daño adicional con las Dagas.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "PRECISION_DAGAS", valor: 4, objetivo: "TODOS_ALIADOS" }
        ],
        mejora: {
            descripcion: "Todos los aliados obtienen +6 de daño adicional con las Dagas.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "PRECISION_DAGAS", valor: 6, objetivo: "TODOS_ALIADOS" }
            ]
        }
    },
    {
        id: "al_ataque_con_todo",
        nombre: "Al ataque con todo",
        costo: 1,
        sprite: "al_ataque_con_todo",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "ATAQUE",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño a TODOS los enemigos. Descarta 1 carta al azar.",
        efectos: [
            { tipo: "DANIO", valor: 10, objetivo: "TODOS_ENEMIGOS" },
            { tipo: "DESCARTAR_CARTA_MANO_AZAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño a TODOS los enemigos. Descarta 1 carta al azar.",
            efectos: [
                { tipo: "DANIO", valor: 14, objetivo: "TODOS_ENEMIGOS" },
                { tipo: "DESCARTAR_CARTA_MANO_AZAR", cantidad: 1 }
            ]
        }
    },
    {
        id: "daga_escondida",
        nombre: "Daga escondida",
        costo: 0,
        sprite: "daga_escondida",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        innato: true,
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Innato. Inflige {D} de daño. Agotar.",
        efectos: [{ tipo: "DANIO", valor: 11, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Innato. Inflige {D} de daño. Agotar.",
            efectos: [{ tipo: "DANIO", valor: 15, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "dados",
        nombre: "Dados",
        costo: 0,
        sprite: "dados",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Descarta toda tu mano y roba la misma cantidad de cartas. Agotar.",
        efectos: [{ tipo: "DESCARTAR_TODA_LA_MANO_Y_ROBAR" }],
        mejora: {
            agotar: false,
            descripcion: "Descarta toda tu mano y roba la misma cantidad de cartas.",
            efectos: [{ tipo: "DESCARTAR_TODA_LA_MANO_Y_ROBAR" }]
        }
    },
    {
        id: "concentracion",
        nombre: "Concentración",
        costo: 0,
        sprite: "concentracion",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        minimoOtrasCartasEnMano: 3,
        enPoolRecompensa: true,
        descripcion: "Descarta 3 cartas. Gana 2 de energía.",
        efectos: [
            {
                tipo: "SELECCIONAR_CARTAS_MANO",
                accion: "DESCARTAR",
                cantidad: 3,
                efectosAlCompletar: [{ tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" }]
            }
        ],
        mejora: {
            minimoOtrasCartasEnMano: 2,
            descripcion: "Descarta 2 cartas. Gana 2 de energía.",
            efectos: [
                {
                    tipo: "SELECCIONAR_CARTAS_MANO",
                    accion: "DESCARTAR",
                    cantidad: 2,
                    efectosAlCompletar: [{ tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" }]
                }
            ]
        }
    },
    {
        id: "dash",
        nombre: "Dash",
        costo: 2,
        sprite: "dash",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Inflige {D} de daño.",
        efectos: [
            { tipo: "BLOQUEO", valor: 10, objetivo: "PROPIO" },
            { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Inflige {D} de daño.",
            efectos: [
                { tipo: "BLOQUEO", valor: 13, objetivo: "PROPIO" },
                { tipo: "DANIO", valor: 13, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "distraccion",
        nombre: "Distracción",
        costo: 1,
        sprite: "distraccion",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Añade un Poder aleatorio de tu clase a tu mano. Cuesta 0 este turno. Agotar.",
        efectos: [{ tipo: "AGREGAR_PODER_ALEATORIO_GRATIS_MANO", cantidad: 1 }],
        mejora: {
            costo: 0,
            descripcion: "Añade un Poder aleatorio de tu clase a tu mano. Cuesta 0 este turno. Agotar.",
            efectos: [{ tipo: "AGREGAR_PODER_ALEATORIO_GRATIS_MANO", cantidad: 1 }]
        }
    },
    {
        id: "agonia_interminable",
        nombre: "Agonía interminable",
        costo: 0,
        sprite: "agonia_interminable",
        clase: "asesino",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        agotar: true,
        duplicarAlRobar: true,
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Al robar esta carta, añade una copia a tu mano. Agotar.",
        efectos: [{ tipo: "DANIO", valor: 4, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño. Al robar esta carta, añade una copia a tu mano. Agotar.",
            efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }]
        }
    }
];