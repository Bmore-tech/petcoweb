import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {Invoice} from "com/bmore/portalproveedores/model/resquest/Invoice";
import {InvoiceResponse} from "com/bmore/portalproveedores/model/response/InvoiceResponse";

export const saveDrafInvoiceService = async (invoice : Invoice): Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const jwt : string = await getJWT();
		const invoiceDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.saveInvoice}`,
			{
				method: 'PUT',
				body: JSON.stringify(invoice),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (invoiceDataResponse.status == 201) {
			response = await invoiceDataResponse.json();
		} else {

			const invoiceResponseError : ErrorResponse  = await invoiceDataResponse.json();
			console.log(invoiceResponseError)
			if (invoiceDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al guardar la factura.", MessageStripType.ERROR);
			} else {
				showMsgStrip(invoiceResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede guardar la información de la factura.", MessageStripType.ERROR);
	}

	return response;
}

export const sendInvoiceService = async (invoice : Invoice): Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const jwt : string = await getJWT();
		const invoiceDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.sendInvoice}`,
			{
				method: 'PUT',
				body: JSON.stringify(invoice),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (invoiceDataResponse.status == 201) {
			response = await invoiceDataResponse.json();
		} else {

			const invoiceResponseError : ErrorResponse  = await invoiceDataResponse.json();
			console.log(invoiceResponseError)
			if (invoiceDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al enviar la factura.", MessageStripType.ERROR);
			} else {
				showMsgStrip(invoiceResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede enviar la información de la factura.", MessageStripType.ERROR);
	}

	return response;
}
