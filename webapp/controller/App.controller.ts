import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import {decodeJWT, getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import Model from "sap/ui/model/Model";
import UI5Element from "sap/ui/core/Element";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class App extends BaseController {

	public async onInit(): Promise<void> {
		// apply content density mode to root view
		//this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		sap.ui.getCore().setModel({
			toolTitle: this.byId("toolTitle"),
			backButtonTool: this.byId("toolTitle"),
			labelTitle: this.byId("labelTitle"),
			containerMessage : this.byId("stripContent"),
			containerView : this.byId("viewContent"),
		}, "coreModel");
	}

	public login_navbar(): void {
		this.byId("avatar").setVisible(false);
		this.byId("shell_bar_app").setShowMenuButton(false);
		this.byId("shell_bar_app").setShowNavButton(false);
		this.byId("navbar").setVisible(false);
		sap.ui.getCore().byId("__component0---Login--stripContent").setVisible(false);

		sap.ui.getCore().setModel({
			containerMessage : sap.ui.getCore().byId("__component0---Login--stripContent")
		}, "coreModel");
	}
	public home_navbar(): void {
		this.byId("avatar").setVisible(true);
		this.byId("shell_bar_app").setShowMenuButton(false);
		this.byId("shell_bar_app").setShowNavButton(false);
		this.byId("navbar").setVisible(true);
	}
	public async handlePopoverPress(oEvent): void {

		const jwtEncode : string = await getJWT();
		await decodeJWT(jwtEncode);
		const jwt: string = sap.ui.getCore().getModel("sessionData")?.payload;

		const oButton: UI5Element = this.byId("avatar");
		const sMsg: string = `Bienvenido ${jwt.nameUser}`;

		if (!this._oPopoverUser) {

			this._oPopoverUser = await Fragment.load({
				name: "com.bmore.portalproveedores.view.fragments.user",
				controller: this
			});

			this.getView().addDependent(this._oPopoverUser);
			this._oPopoverUser.openBy(oButton);
			this._oPopoverUser.setTitle(sMsg);
		} else {
		  this._oPopoverUser.openBy(oButton);
		  this._oPopoverUser.setTitle(sMsg);
		}
	}
	public _closeSession(): void {
		localStorage.removeItem("sessionData");
		this.getRouter().navTo("TargetLogin");
	}
	public navto_reception(): void {
		this.getRouter().navTo("Reception");
	}
	public async navTo_home(): void {
		this.getRouter().navTo("Main");
	}
	public navToSubsidiary(): void {
		this.getRouter().navTo("Subsidiary");
	}
	public navToConcepts(): void {
		this.getRouter().navTo("Concepts");
	}


}
