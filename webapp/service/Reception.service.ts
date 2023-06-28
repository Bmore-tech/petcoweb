import { getJWT } from "com/bmore/portalproveedores/util/JwtHelper";
import { SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT } from "com/bmore/portalproveedores/properties/properties";
import { showMsgStrip } from "com/bmore/portalproveedores/component/MessageStrip.component";
import { MessageStripType } from "com/bmore/portalproveedores/model/MessageStripType";
import { ErrorResponse } from "com/bmore/portalproveedores/model/response/ErrorResponse";
import { Invoice } from "com/bmore/portalproveedores/model/resquest/Invoice";
import { InvoiceResponse } from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import { DocumentInfoXML } from "com/bmore/portalproveedores/model/response/DocumentInfoXML";
import { DocumentInfoXLSX } from "com/bmore/portalproveedores/model/response/DocumentInfoXLSX";
import { validatedErrorResponse } from "com/bmore/portalproveedores/util/Util";

export const saveDrafInvoiceService = async (invoice: Invoice, filesData: Array<File>): Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const requestInvoice: FormData = new FormData();
		requestInvoice.append("invoice", JSON.stringify(invoice));
		filesData.forEach((file: File): void => {
			requestInvoice.append("documentos", file, file.name);
		});

		const jwt: string = await getJWT();
		const invoiceDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.saveInvoice}`,
			{
				method: 'PUT',
				body: requestInvoice,
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (invoiceDataResponse.status == 201) {
			response = await invoiceDataResponse.json();
		} else {

			const invoiceResponseError: ErrorResponse = await invoiceDataResponse.json();
			console.log(invoiceResponseError)

			await validatedErrorResponse(invoiceDataResponse.status, invoiceResponseError,
				"Error en el servicio al guardar la factura.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede guardar la información de la factura.", MessageStripType.ERROR);
	}

	return response;
}

export const sendInvoiceService = async (invoice: Invoice, filesData: Array<File>)
	: Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const requestInvoice: FormData = new FormData();
		requestInvoice.append("invoice", JSON.stringify(invoice));
		filesData.forEach((file: File): void => {
			requestInvoice.append("documentos", file, file.name);
		});

		const jwt: string = await getJWT();
		const invoiceDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.sendInvoice}`,
			{
				method: 'PUT',
				body: requestInvoice,
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (invoiceDataResponse.status == 201) {
			response = await invoiceDataResponse.json();
			showMsgStrip(`Los datos de la factura ${response.invoiceId} fueron enviados con exito.`, MessageStripType.SUCCESS);
		} else {

			const invoiceResponseError: ErrorResponse = await invoiceDataResponse.json();
			console.log(invoiceResponseError);

			await validatedErrorResponse(invoiceDataResponse.status, invoiceResponseError,
				"Error en el servicio al enviar la factura.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se puede enviar la información de la factura.", MessageStripType.ERROR);
	}

	return response;
}
export const getInvoiceByIdService = async (invoice: Invoice)
	: Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const jwt: string = await getJWT();
		const documentDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.getInvoice}/${invoice.applicationId}`,
			{
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (documentDataResponse.status == 200) {
			response = await documentDataResponse.json();
			console.log(response);

		} else {

			const documentResponseError: ErrorResponse = await documentDataResponse.json();
			console.log(documentResponseError);

			await validatedErrorResponse(documentDataResponse.status, documentResponseError,
				"Error en el servicio al recuperar los datos del archivo xml.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden recuperar los datos del archivo xml.", MessageStripType.ERROR);
	}

	return response;
}


export const getInfoXmlService = async (file: File)
	: Promise<DocumentInfoXML> => {

	let response: DocumentInfoXML = null;

	try {

		const document: FormData = new FormData();
		document.append("documento", file, file.name);

		const jwt: string = await getJWT();
		const documentDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.getInfoXml}`,
			{
				method: 'POST',
				body: document,
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (documentDataResponse.status == 200) {
			response = await documentDataResponse.json();
		} else {

			const documentResponseError: ErrorResponse = await documentDataResponse.json();
			console.log(documentResponseError);

			await validatedErrorResponse(documentDataResponse.status, documentResponseError,
				"Error en el servicio al recuperar los datos del archivo xml.");
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden recuperar los datos del archivo xml.", MessageStripType.ERROR);
	}

	return response;
}


export const getInfoProrrateoXlsxService = async (file: File)
	: Promise<DocumentInfoXLSX> => {

	let response: DocumentInfoXLSX = null;

	try {

		const document: FormData = new FormData();
		document.append("documento", file, file.name);

		const jwt: string = await getJWT();
		const documentDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.getProrrateoXlsx}`,
			{
				method: 'POST',
				body: document,
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (documentDataResponse.status == 200) {
			response = await documentDataResponse.json();
		} else {

			const documentResponseError: ErrorResponse = await documentDataResponse.json();
			console.log(documentResponseError);

			await validatedErrorResponse(documentDataResponse.status, documentResponseError,
				"Error en el servicio al recuperar los datos del archivo xlsx.");

		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden recuperar los datos del archivo xlsx.", MessageStripType.ERROR);
	}

	return response;
}
