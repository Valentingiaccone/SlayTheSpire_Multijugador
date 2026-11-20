import { IReliquiaData } from "../Reliquias";

export const RELIQUIAS_INICIALES: IReliquiaData[] = [
    {
        id: "bandita",
        nombre: "Bandita",
        descripcion: "Al finalizar un combate, cura 8 de HP.",
        icono: "reliquia_bandita",
        clase: "shelly",
        calidad: "INICIAL",
        enPoolRecompensa: false,
        trigger: "AL_FINALIZAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 8, objetivo: "PROPIO" }]
    },
    {
        id: "cocoroch",
        nombre: "Cocoroch",
        descripcion: "Cada vez que inflijas daño de ataque a un enemigo, le aplica 1 de Veneno.",
        icono: "reliquia_cocoroch",
        clase: "crow",
        calidad: "INICIAL",
        enPoolRecompensa: false,
        trigger: "AL_INFLIGIR_DANIO",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "ENEMIGO", estadoId: "VENENO" }]
    }
];