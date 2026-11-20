export type NombreAnimacionBase = "idle" | "atacar" | "recibir_danio" | "morir";
// Permite autocompletado de las 4 animaciones base y sumar cualquier animación futura sin romper tipos
export type NombreAnimacion = NombreAnimacionBase | (string & {});

export interface ICoordFrame {
    fila: number; // 0 = fila superior
    col: number;  // 0 = columna izquierda
}

export interface IDefinicionAnimacion {
    /** Opción A (rango simple en una misma fila): */
    fila?: number;
    desdeCol?: number;
    hastaCol?: number;
    /** Opción B (lista libre de frames, ideal si cruza filas o reutiliza cuadros): */
    frames?: ICoordFrame[];
    /** Velocidad en cuadros por segundo (ej: 6 a 12 para pixel art) */
    fps: number;
    /** true para idle; false para atacar, recibir_danio, morir */
    loop?: boolean;
    /** Si es true (ej: morir), al terminar deja el último cuadro fijo en vez de volver a idle */
    mantenerUltimoFrame?: boolean;
}

export interface IConfigSpriteEntidad {
    /** Nombre del PNG dentro de resources/entidades/ (sin .png) */
    archivo: string;
    columnas: number;
    filas: number;
    /** Tamaño final en pantalla (en píxeles de UI) independiente de la resolución del PNG */
    tamano: { ancho: number; alto: number };
    /** true para espejar horizontalmente el sprite */
    voltearX?: boolean;
    /** Diccionario flexible de animaciones */
    animaciones: Partial<Record<NombreAnimacion, IDefinicionAnimacion>>;
}

export const PLACEHOLDER_ENTIDAD = {
    archivo: "placeholder",
    tamanoPorDefecto: { ancho: 120, alto: 120 }
};

/**
 * Catálogo central de spritesheets y tamaños.
 * Clave = PersonajeId ("SHELLY", "CROW") o enemigoId ("robot", "pekka", etc.).
 * Si un ID no está acá (o aún no tiene PNG), se muestra automáticamente `entidades/placeholder`.
 */
export const CATALOGO_ANIMACIONES_ENTIDADES: Record<string, IConfigSpriteEntidad> = {
    // ================= PERSONAJES =================
    SHELLY: {
        archivo: "shelly",
        columnas: 4,
        filas: 3,
        tamano: { ancho: 120, alto: 130 },
        voltearX: false,
        animaciones: {
            idle: { fila: 0, desdeCol: 0, hastaCol: 2, fps: 5, loop: true },
            atacar: { fila: 1, desdeCol: 0, hastaCol: 1, fps: 8, loop: false },
            recibir_danio: { fila: 2, desdeCol: 0, hastaCol: 0, fps: 4, loop: false },
            morir: { fila: 2, desdeCol: 0, hastaCol: 3, fps: 7, loop: false, mantenerUltimoFrame: true }
        }
    },
    robot_pequeno: {
        archivo: "robot_pequeno",
        columnas: 7,
        filas: 3,
        tamano: { ancho: 95, alto: 95 },
        voltearX: false,
        animaciones: {
            idle: { fila: 0, desdeCol: 0, hastaCol: 3, fps: 6, loop: true },
            atacar: { fila: 1, desdeCol: 0, hastaCol: 3, fps: 10, loop: false },
            recibir_danio: { fila: 2, desdeCol: 0, hastaCol: 1, fps: 8, loop: false },
            morir: { fila: 2, desdeCol: 0, hastaCol: 6, fps: 9, loop: false, mantenerUltimoFrame: true }
        }
    },

    // Ejemplo de cómo definir tamaño distinto aunque todavía use placeholder o cuando sumes su sheet:
    // CROW: {
    //     archivo: "crow",
    //     columnas: 4,
    //     filas: 3,
    //     tamano: { ancho: 115, alto: 115 },
    //     animaciones: { ... }
    // },

    // ================= TAMAÑOS PERSONALIZADOS PARA ENEMIGOS (Opcional) =================
    // Podés ir agregando cada enemigo a medida que dibujes su spritesheet.
    // Si querés que un jefe sea más grande incluso usando el placeholder, podés definirlo así:
    pekka: {
        archivo: "pekka", // Si aún no existe pekka.png, caerá a placeholder con este tamaño
        columnas: 1,
        filas: 1,
        tamano: { ancho: 170, alto: 170 },
        animaciones: {}
    },
    charizard: {
        archivo: "charizard",
        columnas: 1,
        filas: 1,
        tamano: { ancho: 175, alto: 175 },
        animaciones: {}
    },
    robot_jefe: {
        archivo: "robot_jefe",
        columnas: 1,
        filas: 1,
        tamano: { ancho: 165, alto: 165 },
        animaciones: {}
    },
    larry: {
        archivo: "larry",
        columnas: 1,
        filas: 1,
        tamano: { ancho: 80, alto: 80 },
        animaciones: {}
    }
};

/** Convierte una definición de animación (rango o lista libre) en coordenadas concretas */
export function expandirCoordsAnimacion(def: IDefinicionAnimacion): ICoordFrame[] {
    if (def.frames && def.frames.length > 0) {
        return def.frames;
    }

    const fila = def.fila ?? 0;
    const inicio = def.desdeCol ?? 0;
    const fin = def.hastaCol ?? inicio;
    const resultado: ICoordFrame[] = [];

    if (inicio <= fin) {
        for (let c = inicio; c <= fin; c++) resultado.push({ fila, col: c });
    } else {
        for (let c = inicio; c >= fin; c--) resultado.push({ fila, col: c });
    }
    return resultado;
}