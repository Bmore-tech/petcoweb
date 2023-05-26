import UI5Element from "sap/ui/core/Element";

export const validatedFieldsText = async (fields: Array<string>, component : string) : Promise<boolean> => {

	const countValid: number = fields
		.map((fieldId: string) : number => {
			const field: string = sap.ui.getCore().byId(`${component}${fieldId}`).getValue();
			return field.length;
		})
		.filter((longitud:number): boolean => longitud === 0)
		.length;

	return countValid == 0 ? true : false;
}

export const clearFieldsText  = async (fields: Array<string>, component : string) : Promise<void> => {

	fields.forEach((fieldId: string) : void => {
		const field: UI5Element = sap.ui.getCore().byId(`${component}${fieldId}`);
		field.setValue("");
	});
}

