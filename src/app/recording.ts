import { Position } from './position';

export class Recording {
    id: string;
    icao: string = null;
    call_sign: string = null;
    positions: Position[] = [];
    idAntenna: string;
    totalPositions: number;
    createdAt: Date = new Date();
}
