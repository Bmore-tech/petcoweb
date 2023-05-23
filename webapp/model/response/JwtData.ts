import {Roles} from "com/bmore/portalproveedores/model/Roles";

export interface JwtData {
	sub:      string;
	nameUser: string;
	roles:    Roles[];
	exp:      number;
	iat:      number;
}
