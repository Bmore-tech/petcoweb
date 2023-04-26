import {Carrucel} from "com/petco/portalproveedorespetco/model/Carrucel";

export interface Dashboard {
    approved: number;
    carrucel: Carrucel[];
    draft:    number;
    progress: number;
    rejected: number;
}