import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import {decodeJWT, getJWT, validatedRoles} from "com/bmore/portalproveedores/util/JwtHelper";
import UI5Element from "sap/ui/core/Element";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class App extends BaseController {

	public async onInit(): Promise<void> {
		// apply content density mode to root view
		//this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

		let model: JSONModel = new JSONModel({
			containerMessage : this.byId("stripContent")
		});
		sap.ui.getCore().setModel(model, "coreModel");
	}

	public login_navbar(): void {
		this.byId("avatar").setVisible(false);
		this.byId("shell_bar_app").setShowMenuButton(false);
		this.byId("shell_bar_app").setShowNavButton(false);
		this.byId("navbar").setVisible(false);
		sap.ui.getCore().byId("__component0---Login--stripContent").setVisible(false);

		let model: JSONModel = new JSONModel({
			containerMessage : sap.ui.getCore().byId("__component0---Login--stripContent")
		});
		sap.ui.getCore().setModel(model, "coreModel");
	}
	public async home_navbar(): Promise<void> {

		await validatedRoles();
		this.byId("avatar").setVisible(true);
		this.byId("shell_bar_app").setShowMenuButton(false);
		this.byId("shell_bar_app").setShowNavButton(false);
		this.byId("navbar").setVisible(true);

		let model: JSONModel = new JSONModel({
			containerMessage : sap.ui.getCore().byId("__component0---app--stripContent")
		});
		sap.ui.getCore().setModel(model, "coreModel");
	}
	public async handlePopoverPress(oEvent:Event): Promise<void> {

		const jwtEncode : string = await getJWT();
		await decodeJWT(jwtEncode);
		const jwt: string = sap.ui.getCore().getModel("sessionData")?.oData.payload;

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

		const views: Array<string> = [
			"__component0---main",
			"__component0---Conceps",
			"__component0---Subsidiary",
			"__component0---Reception",
			"__component0---History",
			"__component0---TablePendings",
			"__component0---TableDrafts",
			"__component0---TableRejecteds",
			"__component0---TablePreapprove",
			"__component0---TableApprove",
			"__component0---Preapprove",
			"__component0---Approve",
			"__component0---Draft",
			"__component0---Pending",
			"__component0---Rejected",
			"__component0---HistoryDetails"
		];

		views.forEach((view: string): void => {

			if (sap.ui.getCore().byId(view)) {
				sap.ui.getCore().byId(view).removeContent();
			}
		});

		localStorage.removeItem("sessionData");
		this.getRouter().navTo("TargetLogin");
		window.location.href = "/index.html#"
	}
	public async navto_reception(): Promise<void> {
		this.getRouter().navTo("Reception");
		
		if(sap.ui.getCore().byId('__component0---Reception')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---Reception').getController();
			await this.ReceptionController.clear();
		}
		
	}
	public async navTo_home(): Promise<void> {

		this.getRouter().navTo("Main");
		if(sap.ui.getCore().byId('__component0---main')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---main').getController();
			await this.ReceptionController.onInit();
		}
		
	}
	public async navToSubsidiary(): Promise<void> {
		this.getRouter().navTo("Subsidiary");
		if(sap.ui.getCore().byId('__component0---Subsidiary')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---Subsidiary').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToConcepts(): Promise<void> {
		this.getRouter().navTo("Concepts");
		if(sap.ui.getCore().byId('__component0---Conceps')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---Conceps').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToHistory(): Promise<void> {
		this.getRouter().navTo("History");
		if(sap.ui.getCore().byId('__component0---History')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---History').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToPending(): Promise<void> {
		this.getRouter().navTo("TablePendings");
		if(sap.ui.getCore().byId('__component0---TablePendings')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---TablePendings').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToDraft(): Promise<void> {
		this.getRouter().navTo("TableDrafts");
		if(sap.ui.getCore().byId('__component0---TableDrafts')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---TableDrafts').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToRejected(): Promise<void> {
		this.getRouter().navTo("TableRejecteds");
		if(sap.ui.getCore().byId('__component0---TableRejecteds')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---TableRejecteds').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToPreapprove(): Promise<void> {
		this.getRouter().navTo("TablePreapprove");
		if(sap.ui.getCore().byId('__component0---TablePreapprove')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---TablePreapprove').getController();
			await this.ReceptionController.onInit();
		}
	}
	public async navToApprove(): Promise<void> {
		this.getRouter().navTo("TableApprove");
		if(sap.ui.getCore().byId('__component0---TableApprove')){
			this.ReceptionController = sap.ui.getCore().byId('__component0---TableApprove').getController();
			await this.ReceptionController.onInit();
		}
	}

}
