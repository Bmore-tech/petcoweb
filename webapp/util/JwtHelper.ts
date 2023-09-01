import { JwtData } from "com/bmore/portalproveedores/model/response/JwtData";
import UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import { Roles } from "com/bmore/portalproveedores/model/Roles";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";
import View from "sap/ui/core/mvc/View";
import NavigationListItem from "sap/tnt/NavigationListItem";
import SideNavigation from "sap/tnt/SideNavigation";

export const decodeJWT = async (token: string): Promise<void> => {

	const parts: Array<string> = token.split(".");
	if (parts.length !== 3) {
		console.error('Invalid token format');
		throw new Error('Invalid token format');
	}

	const header: string = JSON.parse(atob(parts[0]));
	const payload: JwtData = JSON.parse(atob(parts[1]));
	let model: JSONModel = new JSONModel({
		jwt: token,
		payload
	});

	await sap.ui.getCore().setModel(model, "sessionData");

}

export const getJWT = async (): Promise<string> => {

	await validatedSession();
	const token: string = (sap.ui.getCore().getModel("sessionData") as any)?.oData.jwt;

	return token;
}

const validatedSession = async (): Promise<void> => {

	let token: string = (sap.ui.getCore().getModel("sessionData") as any)?.oData.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token === undefined) {

		messageCloseSession('Tu sessión no es valida.');

	} else {

		await decodeJWT(token);

		const payload: JwtData = (sap.ui.getCore().getModel("sessionData") as any)?.oData.payload;

		const dateExpiration: number = new Date(Number(`${payload.exp}000`)).getTime();

		if (new Date().getTime() > dateExpiration) {

			messageCloseSession('Tu sessión ha expirado.');
		}
	}
}

export const messageCloseSession = async (message: string): Promise<void> => {

	const appController: any = (sap.ui.getCore()
		.byId('__component0---app') as View).getController();

	MessageBox.information(message, {
		actions: ["Aceptar"],
		emphasizedAction: "Aceptar",
		onClose: async (sAction:string) => {
			if (sAction == null || sAction === "Aceptar") {
				appController._closeSession();
			}
		}
	});
}

export const validatedRoles = async (): Promise<void> => {

	let token: string = (sap.ui.getCore().getModel("sessionData") as any)?.oData.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token !== undefined) {

		await decodeJWT(token);
		const payload: JwtData = (sap.ui.getCore().getModel("sessionData") as any)?.oData.payload;

		const roleUser: Roles = Object.values(payload.roles)
			.find((role: Roles): boolean => role.toString() != Roles[1].toString());		
		await validatedMenu(roleUser);
	}
}

export const validatedRoleProvider = async (): Promise<boolean> => {

	let token: string = (sap.ui.getCore().getModel("sessionData") as any)?.oData.jwt;
	token ??= JSON.parse(localStorage.getItem("sessionData"))?.jwt;

	if (token !== undefined) {

		await decodeJWT(token);
		const payload: JwtData = (sap.ui.getCore().getModel("sessionData") as any)?.oData.payload;

		const roleUser: boolean =
			payload.roles.find((role: Roles): boolean => ((role.toString() === Roles[2].toString()) || (role.toString() === Roles[0].toString())))
				=== undefined ? false : true;
		// .find( );
		return roleUser;


	} else return false;
}
export const validatedMenu = async (roleUser: Roles): Promise<void> => {

	// Se oculta catalogos
	const itemCatalogs: NavigationListItem = await findMenu("Catálogos");
	const itemDraft: NavigationListItem = await findMenu("CFDI");
	const itemAprobadores: NavigationListItem = await findMenu("Aprobadores");
	const itemPrevalidadores: NavigationListItem = await findMenu("Prevalidadores");

	itemDraft.setVisible(false);
	itemDraft.getItems()[2].setVisible(false);
	itemCatalogs.setVisible(false);
	itemAprobadores.setVisible(false);
	itemPrevalidadores.setVisible(false);

	switch (roleUser.toString()) {
		case Roles[0].toString():
			itemCatalogs.setVisible(true);
			itemDraft.setVisible(true);
			itemDraft.getItems()[2].setVisible(true);
			itemAprobadores.setVisible(true);
			break;
		case Roles[2].toString():
			itemDraft.setVisible(true);
			itemDraft.getItems()[2].setVisible(true);
			break;
		case Roles[4].toString():
			itemPrevalidadores.setVisible(true);
			break;
		case Roles[3].toString():
			itemAprobadores.setVisible(true);
			break;
	}

}

export const findMenu = async (itemFind: string): Promise<NavigationListItem> => {

	const menu: SideNavigation = sap.ui.getCore().byId('__component0---app--navbar') as SideNavigation;
	const itemsMenu: Array<NavigationListItem> = menu.getItem().getItems();

	const responseItem: NavigationListItem = itemsMenu
		.find((menuitem): boolean => (menuitem as any).mProperties.text == itemFind);

	return responseItem;
}
