import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {Concept} from "com/bmore/portalproveedores/model/Concept";
import {validatedErrorResponse} from "com/bmore/portalproveedores/util/Util";

export const getConceps = async (): Promise<Concept> => {

	let concepResponse: Concept;

	try {

		const jwt : string = await getJWT();
		console.log("se actualiza");
		const concepDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.concep}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (concepDataResponse.status == 200) {
			concepResponse = await concepDataResponse.json();
		} else {

			const concepResponseError : ErrorResponse  = await concepDataResponse.json();
			console.log(concepResponseError);

			await validatedErrorResponse(concepDataResponse.status, concepResponseError,
				"Error no se puede cargar la información de los conceptos.");
		}

		console.log(concepResponse);
	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede cargar la información de los conceptos.", MessageStripType.ERROR);
	}

	return concepResponse;
}


export const saveConcept = async (concep : Concept): Promise<boolean> => {

	let isSaveConcep: boolean = false;

	try {

		const jwt : string = await getJWT();
		const concepDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.concep}`,
			{
				method: 'PUT',
				body: JSON.stringify(concep),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (concepDataResponse.status == 201) {
			isSaveConcep = true;
			showMsgStrip("Datos del concepto guardados con exito.", MessageStripType.SUCCESS);
		} else {

			const concepResponseError : ErrorResponse  = await concepDataResponse.json();
			console.log(concepResponseError);

			await validatedErrorResponse(concepDataResponse.status, concepResponseError,
				"Error en el servicio al guardar el concepto.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede guardar la información del concepto.", MessageStripType.ERROR);
	}

	return isSaveConcep;
}

export const updateConcept = async (concep : Concept): Promise<boolean> => {

	let isUpdateConcep: boolean = false;

	try {

		const jwt : string = await getJWT();
		const concepDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.concep}`,
			{
				method: 'POST',
				body: JSON.stringify(concep),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (concepDataResponse.status == 200) {
			isUpdateConcep = true;
			showMsgStrip("Datos del concepto actualizados con exito.", MessageStripType.SUCCESS);
		} else {

			const concepResponseError : ErrorResponse  = await concepDataResponse.json();
			console.log(concepResponseError);

			await validatedErrorResponse(concepDataResponse.status, concepResponseError,
				"Error en el servicio al actualizar el concepto.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede actualizar la información del concepto.", MessageStripType.ERROR);
	}

	return isUpdateConcep;
}




export const deleteConcept = async (conceptId : string): Promise<boolean> => {

	let isDeleteConcep: boolean = false;

	try {

		const jwt : string = await getJWT();
		const concepDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.concep}/${conceptId}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (concepDataResponse.status == 204) {
			isDeleteConcep = true;
			showMsgStrip("Datos de concepto borrados con exito.", MessageStripType.SUCCESS);
		} else {

			const concepResponseError : ErrorResponse  = await concepDataResponse.json();
			console.log(concepResponseError);

			await validatedErrorResponse(concepDataResponse.status, concepResponseError,
				"Error en el servicio al borrar el concepto.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede borrar la información del concepto.", MessageStripType.ERROR);
	}

	return isDeleteConcep;
}

