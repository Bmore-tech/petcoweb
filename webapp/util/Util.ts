import UI5Element from "sap/ui/core/Element";
import { ErrorResponse } from "com/bmore/portalproveedores/model/response/ErrorResponse";
import { showMsgStrip } from "com/bmore/portalproveedores/component/MessageStrip.component";
import { MessageStripType } from "com/bmore/portalproveedores/model/MessageStripType";
import Input from "sap/m/Input";

export const validatedFieldsText = async (fields: Array<string>, component: string): Promise<boolean> => {

	const countValid: number = fields
		.map((fieldId: string): number => {
			const field: string = (sap.ui.getCore().byId(`${component}${fieldId}`) as Input).getValue();
			return field.length;
		})
		.filter((longitud: number): boolean => longitud === 0)
		.length;

	return countValid == 0 ? true : false;
}

export const clearFieldsText = async (fields: Array<string>, component: string): Promise<void> => {

	fields.forEach((fieldId: string): void => {
		const field: Input = sap.ui.getCore().byId(`${component}${fieldId}`) as Input;
		field.setValue("");
	});
}

export const validatedErrorResponse = async (statusCode: number, responseError: ErrorResponse,
	message: string): Promise<void> => {

	switch (statusCode) {
		case 401:
		case 403:
			showMsgStrip('Tu sessión ha expirado o no es valida.', MessageStripType.WARNING);
			break;

		case 404:
		case 409:
			showMsgStrip(responseError.message, MessageStripType.WARNING);
			break;

		case 500:
		case 501:
		case 502:
		case 503:
		case 504:
		case 505:
		case 506:
			showMsgStrip(message, MessageStripType.ERROR);
			break;
		case 1000:
			showMsgStrip(message, MessageStripType.ERROR);
			break;
	}

}



