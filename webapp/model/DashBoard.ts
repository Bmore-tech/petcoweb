import {Carrucel} from "./Carrucel";

export interface Dashboard {
    approved: number;
    carrucel: Carrucel[];
    draft:    number;
    progress: number;
    rejected: number;
}
