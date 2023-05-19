import {JwtData} from "com/bmore/portalproveedores/model/response/JwtData";

export const decodeJWT  = async (token: string) : void  => {

	const parts : Array<string>  = token.split(".");
	if (parts.length !== 3) {
		console.error('Invalid token format');
		throw new Error('Invalid token format');
	}

	const header: string = JSON.parse(atob(parts[0]));
	const payload: JwtData = JSON.parse(atob(parts[1]));

	sap.ui.getCore().setModel({
		jwt: token,
		payload
	}, "sessionData");

}

export const getJWT  = async () : string  => {

	let token: string = sap.ui.getCore().getModel("sessionData")?.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	return token;
}
