import { Position } from './position';
import { Antenna } from './antenna';

export class Recording {
    id: string;
    icao: string = null;
    call_sign: string = null;
    positions: Position[] = [];
    antenna: Antenna;
    totalPositions: number;
    createdAt: Date = new Date();
}
