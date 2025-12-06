export function getRandomNumber(): number {
    const crypto = globalThis.crypto || (<any>globalThis).msCrypto;
    const randomArray = crypto.getRandomValues(new Uint32Array(1));
    return randomArray[0] / (0xFFFFFFFF + 1);
}

export function getRandomInt(min: number, max: number): number {
    const crypto = globalThis.crypto || (<any>globalThis).msCrypto;
    const randomArray = crypto.getRandomValues(new Uint32Array(1));
    const range = max - min + 1;
    return min + (randomArray[0] % range);
}

export function getRandomFloat(min: number, max: number): number {
    const crypto = globalThis.crypto || (<any>globalThis).msCrypto;
    const randomArray = crypto.getRandomValues(new Uint32Array(1));
    return min + (randomArray[0] / (0xFFFFFFFF + 1)) * (max - min);
}

