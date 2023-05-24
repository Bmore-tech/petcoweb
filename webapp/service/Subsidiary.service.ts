import {SubsidiaryResponse} from "com/bmore/portalproveedores/model/response/SubsidiaryResponse";
import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {Subsidiary} from "com/bmore/portalproveedores/model/Subsidiary";

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
			console.log(subsidiaryResponseError)
			if (subsidiaryDataResponse.status >= 500) {
				showMsgStrip("Error no se puede cargar la información de las sucursales.", MessageStripType.ERROR);
			} else {
				showMsgStrip(subsidiaryResponseError.message, MessageStripType.WARNING);
			}
		}

		console.log(subsidiaryResponse);
	} catch (e) {
		console.log(e);
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
			console.log(subsidiaryResponseError)
			if (subsidiaryDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al guardar la sucursal.", MessageStripType.ERROR);
			} else {
				showMsgStrip(subsidiaryResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede guardar la información de la sucursal.", MessageStripType.ERROR);
	}

	return isSaveSubsidiary;
}

