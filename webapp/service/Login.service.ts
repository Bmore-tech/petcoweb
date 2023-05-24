import {JwtResponse} from "com/bmore/portalproveedores/model/response/JwtResponse";
import {
	SECURITY_ENDPOINT, SECURITY_SERVICES
} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {SignInRequest} from "com/bmore/portalproveedores/model/resquest/SignInRequest";
import {decodeJWT} from "com/bmore/portalproveedores/util/JwtHelper";

export const signIn = async (userRequest : SignInRequest): Promise<boolean> => {

	let isValidUser: boolean = false;

	try {

		const loginDataResponse: Response = await fetch(
		`${SECURITY_ENDPOINT}${SECURITY_SERVICES.login}`,
		{
				method: 'POST',
				body: JSON.stringify(userRequest),
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (loginDataResponse.status == 200) {

			const jwtResponse: JwtResponse = await loginDataResponse.json();
			decodeJWT(jwtResponse.jwt);
			localStorage.setItem("sessionData", JSON
				.stringify({
					jwt: jwtResponse.jwt
				})
			);
			isValidUser = true;

		} else {

			const loginDataResponseError : ErrorResponse = await loginDataResponse.json();
			console.error(loginDataResponseError);

			if (loginDataResponse.status == 404) {
				await showMsgStrip("El usuario no existe.", MessageStripType.ERROR);
			} else if (loginDataResponse.status == 409) {
				await showMsgStrip(loginDataResponseError.mensaje, MessageStripType.ERROR);
			} else {
				await showMsgStrip("Error interno, no se puede iniciar sesión.", MessageStripType.ERROR);
			}
		}

		console.log("Is valid user.... ", isValidUser);
	} catch (e) {
		console.log(e);
		await showMsgStrip("Error no se puede cargar la información de inicio de sesión.", MessageStripType.ERROR);
	}

	return isValidUser;
}
