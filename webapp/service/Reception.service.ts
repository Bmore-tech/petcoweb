import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "com/bmore/portalproveedores/properties/properties";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {Invoice} from "com/bmore/portalproveedores/model/resquest/Invoice";
import {InvoiceResponse} from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import {DocumentInfoXML} from "com/bmore/portalproveedores/model/response/DocumentInfoXML";
import {DocumentInfoXLSX} from "com/bmore/portalproveedores/model/response/DocumentInfoXLSX";

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


export const saveDocumentInvoice = async (invoiceResponse : InvoiceResponse, filesData : Array<File>)
	: Promise<InvoiceResponse> => {

	let response: InvoiceResponse = null;

	try {

		const documents: FormData = new FormData();
		filesData.forEach((file: File): void => {
			documents.append("documentos", file, file.name);
		});

		const jwt : string = await getJWT();
		const invoiceDocumentDataResponse: Response = await fetch(
			`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.saveDocument}${invoiceResponse.invoiceId}`,
			{
				method: 'PUT',
				body: documents,
				headers: {
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

		if (invoiceDocumentDataResponse.status == 201) {
			response = await invoiceDocumentDataResponse.json();
		} else {

			const invoiceDocumentResponseError : ErrorResponse  = await invoiceDocumentDataResponse.json();
			console.log(invoiceDocumentResponseError)
			if (invoiceDocumentDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al enviar los documentos de la factura.", MessageStripType.ERROR);
			} else {
				showMsgStrip(invoiceDocumentResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden enviar los documentos de la factura.", MessageStripType.ERROR);
	}

	return response;
}


export const getInfoXmlService = async (file : File)
	: Promise<DocumentInfoXML> => {

	let response: DocumentInfoXML = null;

	try {

		const document: FormData = new FormData();
		document.append("documento", file, file.name);

		const jwt : string = await getJWT();
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

			const documentResponseError : ErrorResponse  = await documentDataResponse.json();
			console.log(documentResponseError)
			if (documentDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al recuperar los datos del archivo xml.", MessageStripType.ERROR);
			} else {
				showMsgStrip(documentResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden recuperar los datos del archivo xml.", MessageStripType.ERROR);
	}

	return response;
}


export const getInfoProrrateoXlsxService = async (file : File)
	: Promise<DocumentInfoXLSX> => {

	let response: DocumentInfoXLSX = null;

	try {

		const document: FormData = new FormData();
		document.append("documento", file, file.name);

		const jwt : string = await getJWT();
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

			const documentResponseError : ErrorResponse  = await documentDataResponse.json();
			console.log(documentResponseError)
			if (documentDataResponse.status >= 500) {
				showMsgStrip("Error en el servicio al recuperar los datos del archivo xlsx.", MessageStripType.ERROR);
			} else {
				showMsgStrip(documentResponseError.message, MessageStripType.WARNING);
			}
		}

	} catch (e) {
		console.log(e);
		showMsgStrip("Error no se pueden recuperar los datos del archivo xlsx.", MessageStripType.ERROR);
	}

	return response;
}
