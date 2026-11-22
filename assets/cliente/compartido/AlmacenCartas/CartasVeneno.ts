import { ICartaData } from "../Cartas";

export const CARTAS_VENENO: ICartaData[] = [
    {
        id: "golpe_veneno",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_combate",
        clase: "veneno",
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
        id: "defender_veneno",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana {B} de bloqueo.",
        clase: "veneno",
        sprite: "defender_combate",
        enPoolRecompensa: false,
        precioTienda: 45,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }]
        }
    }
];