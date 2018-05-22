export class Position {
    altitude: number;
    position: number[];
    speed: number;
    heading: number;
    vertical_rate: number;
    occuredAt: Date;

    constructor(
        altitude: number,
        position: number[],
        speed: number,
        heading: number,
        vertical_rate: number,
        occuredAt: Date
    ) {
        this.altitude = altitude;
        this.position = position;
        this.speed = speed;
        this.heading = heading;
        this.vertical_rate = vertical_rate;
        this.occuredAt = occuredAt;
    }
}
