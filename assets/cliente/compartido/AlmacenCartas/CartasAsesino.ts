import { ICartaData } from "../Cartas";

export const CARTAS_ASESINO: ICartaData[] = [
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
    }
];