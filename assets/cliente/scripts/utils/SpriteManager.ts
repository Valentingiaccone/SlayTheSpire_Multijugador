import { resources, SpriteFrame, Sprite } from "cc";

export type TipoCarpeta = "iconos" | "cartas"

export class SpriteManager {
    // Caché en memoria: clave "carpeta/nombre" -> SpriteFrame
    private static cache: Map<string, SpriteFrame> = new Map();

    // Evita lanzar múltiples cargas simultáneas del mismo archivo si aún no terminó de cargar
    private static cargasEnCurso: Map<string, Promise<SpriteFrame | null>> = new Map();

    /**
     * Devuelve un SpriteFrame desde memoria si ya fue cargado, o lo carga desde resources/<carpeta>/<nombre>.
     */
    public static async obtenerSprite(carpeta: TipoCarpeta, nombre: string): Promise<SpriteFrame | null> {
        // Limpiamos barras sobrantes por seguridad (ej: "cartas/" -> "cartas")
        const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
        const rutaBase = carpetaLimpia ? `${carpetaLimpia}/${nombre}` : nombre;

        // 1. Si ya está en memoria, lo devuelve al instante
        if (this.cache.has(rutaBase)) {
            return this.cache.get(rutaBase)!;
        }

        // 2. Si ya se está cargando en este momento, esperamos esa misma promesa
        if (this.cargasEnCurso.has(rutaBase)) {
            return this.cargasEnCurso.get(rutaBase)!;
        }

        // 3. Cargar desde Cocos resources (en Cocos 3.x requiere el sufijo /spriteFrame)
        const promesaCarga = new Promise<SpriteFrame | null>((resolve) => {
            resources.load(`${rutaBase}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                this.cargasEnCurso.delete(rutaBase);

                if (err || !spriteFrame) {
                    console.warn(`[SpriteManager] No se encontró el sprite en: resources/${rutaBase}`);
                    resolve(null);
                    return;
                }

                this.cache.set(rutaBase, spriteFrame);
                resolve(spriteFrame);
            });
        });

        this.cargasEnCurso.set(rutaBase, promesaCarga);
        return promesaCarga;
    }

    /**
     * Atajo seguro: busca el sprite y lo asigna directo a un componente Sprite,
     * verificando que el nodo no haya sido destruido mientras cargaba.
     */
    public static async aplicarSprite(spriteComp: Sprite | null, carpeta: TipoCarpeta, nombre: string): Promise<void> {
        if (!spriteComp) return;

        const frame = await this.obtenerSprite(carpeta, nombre);
        if (frame && spriteComp.isValid) {
            spriteComp.spriteFrame = frame;
        }
    }

    /**
     * Opcional: precarga toda una subcarpeta de golpe (útil para pantallas de carga).
     */
    public static precargarCarpeta(carpeta: TipoCarpeta): Promise<void> {
        const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
        return new Promise((resolve) => {
            resources.loadDir(carpetaLimpia, SpriteFrame, (err, assets) => {
                if (!err && assets) {
                    assets.forEach((frame) => {
                        const clave = carpetaLimpia ? `${carpetaLimpia}/${frame.name}` : frame.name;
                        this.cache.set(clave, frame);
                    });
                }
                resolve();
            });
        });
    }
}