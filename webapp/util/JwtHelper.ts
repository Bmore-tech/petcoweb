import {JwtData} from "com/bmore/portalproveedores/model/response/JwtData";
import MessageToast from "sap/m/MessageToast";
import UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import {Roles} from "com/bmore/portalproveedores/model/Roles";

export const decodeJWT  = async (token: string) : void  => {

	const parts : Array<string>  = token.split(".");
	if (parts.length !== 3) {
		console.error('Invalid token format');
		throw new Error('Invalid token format');
	}

	const header: string = JSON.parse(atob(parts[0]));
	const payload: JwtData = JSON.parse(atob(parts[1]));

	await sap.ui.getCore().setModel({
		jwt: token,
		payload
	}, "sessionData");

}

export const getJWT  = async () : string  => {

	await validatedSession();
	const token: string = sap.ui.getCore().getModel("sessionData")?.jwt;

	return token;
}

const validatedSession  = async () : void  => {

	const appController: Controller = sap.ui.getCore()
		.byId('__component0---app').getController();

	let token: string = sap.ui.getCore().getModel("sessionData")?.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token === undefined) {

		console.log("No tiene sesion valida ..........");

		MessageToast.show('Tu sessión no es valida.',
{
			duration: 3000,
			width: "15rem", // default max width supported
		});
		appController._closeSession();

	} else {

		await decodeJWT(token);

		const payload: JwtData = sap.ui.getCore().getModel("sessionData")?.payload;

		const dateExpiration: number = new Date(Number(`${payload.exp}000`)).getTime();
		console.log("Date Expiration : ", dateExpiration);

		if (new Date().getTime() > dateExpiration) {

			console.log("Date Expiration timeout..........");

			MessageToast.show('Tu sessión ha expirado.',
	{
				duration: 3000,
				width: "15rem", // default max width supported
			});

			appController._closeSession();
		}
	}
}


export const validatedRoles  = async () : void  => {

	let token: string = sap.ui.getCore().getModel("sessionData")?.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token !== undefined) {

		await decodeJWT(token);
		const payload: JwtData = sap.ui.getCore().getModel("sessionData")?.payload;

		const roleUser: string = Object.values(payload.roles)
			.find((role: string):boolean => Roles[role] != Roles.EXECUTE_APPLICATION);

		await validatedMenu(roleUser);
	}
}


export const validatedMenu  = async (roleUser: Roles) : void  => {

	console.log("############# Role User : " + roleUser);

	// Se oculta catalogos
	const itemCatalogs: UI5Element = await findMenu("Catálogos");
	itemCatalogs.setVisible(false);

	switch (Roles[roleUser]) {
		case Roles.ADMINGROUP:
			console.log("Role Admin");
			itemCatalogs.setVisible(true);
			break;
		case Roles.PROVIDER_ROLE:
			console.log("Role Proveedor")
			break;
		case Roles.PREVALIDATOR_ROLE:
			console.log("Role prevalidador")
			break;
		case Roles.APPROVER_ROLE:
			console.log("Role Aprobador")
			break;
	}

}

export const findMenu  = async (itemFind: Roles) : UI5Element  => {

	const menu: UI5Element = sap.ui.getCore().byId('__component0---app--navbar');
	const itemsMenu: Array<UI5Element> = menu.getItem().getItems();

	const responseItem: UI5Element = itemsMenu
		.find((menuitem: UI5Element):boolean => menuitem.mProperties.text == itemFind);

	return responseItem;
}