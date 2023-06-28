import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {Subsidiary} from "com/bmore/portalproveedores/model/Subsidiary";
import {validatedErrorResponse} from "com/bmore/portalproveedores/util/Util";

export const getSubsidiaries = async (): Promise<Subsidiary> => {

	let subsidiaryResponse: Subsidiary;

	try {

		const jwt : string = await getJWT();
		const subsidiaryDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.subsidiary}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (subsidiaryDataResponse.status == 200) {
			subsidiaryResponse = await subsidiaryDataResponse.json();
		} else {

			const subsidiaryResponseError : ErrorResponse  = await subsidiaryDataResponse.json();

			await validatedErrorResponse(subsidiaryDataResponse.status, subsidiaryResponseError,
				"Error no se puede cargar la información de las sucursales.");
		}
	} catch (e) {
		showMsgStrip("Error no se puede cargar la información de las sucursales.", MessageStripType.ERROR);
	}

	return subsidiaryResponse;
}


export const saveSubsidiary = async (subsidiary : Subsidiary): Promise<boolean> => {

	let isSaveSubsidiary: boolean = false;

	try {

		const jwt : string = await getJWT();
		const subsidiaryDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.subsidiary}`,
			{
				method: 'PUT',
				body: JSON.stringify(subsidiary),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (subsidiaryDataResponse.status == 201) {
			isSaveSubsidiary = true;
			showMsgStrip("Datos de sucursal guardados con exito.", MessageStripType.SUCCESS);
		} else {

			const subsidiaryResponseError : ErrorResponse  = await subsidiaryDataResponse.json();

			await validatedErrorResponse(subsidiaryDataResponse.status, subsidiaryResponseError,
				"Error en el servicio al guardar la sucursal.");
		}

	} catch (e) {
		showMsgStrip("Error no se puede guardar la información de la sucursal.", MessageStripType.ERROR);
	}

	return isSaveSubsidiary;
}

export const updateSubsidiary = async (subsidiary : Subsidiary): Promise<boolean> => {

	let isUpdateSubsidiary: boolean = false;

	try {

		const jwt : string = await getJWT();
		const subsidiaryDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.subsidiary}`,
			{
				method: 'POST',
				body: JSON.stringify(subsidiary),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (subsidiaryDataResponse.status == 200) {
			isUpdateSubsidiary = true;
			showMsgStrip("Datos de sucursal actualizados con exito.", MessageStripType.SUCCESS);
		} else {

			const subsidiaryResponseError : ErrorResponse  = await subsidiaryDataResponse.json();

			await validatedErrorResponse(subsidiaryDataResponse.status, subsidiaryResponseError,
				"Error en el servicio al actualizar la sucursal.");
		}

	} catch (e) {
		showMsgStrip("Error no se puede actualizar la información de la sucursal.", MessageStripType.ERROR);
	}

	return isUpdateSubsidiary;
}




export const deleteSubsidiary = async (subsidiaryId : string): Promise<boolean> => {

	let isDeleteSubsidiary: boolean = false;

	try {

		const jwt : string = await getJWT();
		const subsidiaryDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.subsidiary}/${subsidiaryId}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (subsidiaryDataResponse.status == 204) {
			isDeleteSubsidiary = true;
			showMsgStrip("Datos de sucursal borrados con exito.", MessageStripType.SUCCESS);
		} else {

			const subsidiaryResponseError : ErrorResponse  = await subsidiaryDataResponse.json();

			await validatedErrorResponse(subsidiaryDataResponse.status, subsidiaryResponseError,
				"Error en el servicio al borrar la sucursal.");
		}

	} catch (e) {
		showMsgStrip("Error no se puede borrar la información de la sucursal.", MessageStripType.ERROR);
	}

	return isDeleteSubsidiary;
}

