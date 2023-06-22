import {JwtData} from "com/bmore/portalproveedores/model/response/JwtData";
import UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import {Roles} from "com/bmore/portalproveedores/model/Roles";
import MessageBox from "sap/m/MessageBox";
import Log from "sap/base/Log";

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

	let token: string = sap.ui.getCore().getModel("sessionData")?.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token === undefined) {

		console.log("No tiene sesion valida ..........");
		messageCloseSession('Tu sessión no es valida.');

	} else {

		await decodeJWT(token);

		const payload: JwtData = sap.ui.getCore().getModel("sessionData")?.payload;

		const dateExpiration: number = new Date(Number(`${payload.exp}000`)).getTime();
		console.log("Date Expiration : ", dateExpiration);

		if (new Date().getTime() > dateExpiration) {

			console.log("Date Expiration timeout..........");
			messageCloseSession('Tu sessión ha expirado.');
		}
	}
}

export const messageCloseSession = async (message: string) : void  => {

	const appController: Controller = sap.ui.getCore()
		.byId('__component0---app').getController();

	MessageBox.information(message, {
		actions: ["Aceptar"],
		emphasizedAction: "Aceptar",
		onClose: async (sAction) => {
			if (sAction == null || sAction === "Aceptar") {
				appController._closeSession();
			}
		}
	});
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

export const validatedRoleProvider  = async () : boolean  => {

	let token: string = sap.ui.getCore().getModel("sessionData")?.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token !== undefined) {

		await decodeJWT(token);
		const payload: JwtData = sap.ui.getCore().getModel("sessionData")?.payload;
		const roleUser: boolean = 
		payload.roles.find((role: string):boolean => Roles[role] === Roles.PROVIDER_ROLE)
		=== undefined ? false :true;
			// .find( );
		return roleUser ;


	} else return false; 
}
export const validatedMenu  = async (roleUser: Roles) : void  => {

	console.log("############# Role User : " + roleUser);

	// Se oculta catalogos
	const itemCatalogs: UI5Element = await findMenu("Catálogos");
	const itemDraft: UI5Element = await findMenu("CFDI");
	
	itemDraft.getItems()[2].setVisible(false);
	itemCatalogs.setVisible(false);

	switch (Roles[roleUser]) {
		case Roles.ADMINGROUP:
			console.log("Role Admin");
			itemCatalogs.setVisible(true);
			break;
		case Roles.PROVIDER_ROLE:
			console.log("Role Proveedor")
			itemDraft.getItems()[2].setVisible(true);
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
