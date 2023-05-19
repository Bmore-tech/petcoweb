export interface JwtData {
	sub:      string;
	nameUser: string;
	roles:    string[];
	exp:      number;
	iat:      number;
}
