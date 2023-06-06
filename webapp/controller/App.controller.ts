import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";

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
	}
	public home_navbar(): void {
		this.byId("avatar").setVisible(true);
		this.byId("shell_bar_app").setShowMenuButton(false);
		this.byId("shell_bar_app").setShowNavButton(false);
		this.byId("navbar").setVisible(true);
	}
	public handlePopoverPress(oEvent): void {
		var oButton = this.byId("avatar");
		var sMsg = "Bienvenido ";
		if (!this._oPopoverUser) {
		  Fragment.load({
			name: "com.bmore.portalproveedores.view.fragments.user",
			controller: this
		  }).then(function (pPopover) {
			this._oPopoverUser = pPopover;
			this.getView().addDependent(this._oPopoverUser);
			this._oPopoverUser.openBy(oButton);
			this._oPopoverUser.setTitle(sMsg);
		  }.bind(this));
		} else {
		  this._oPopoverUser.openBy(oButton);
		  this._oPopoverUser.setTitle(sMsg);
		}
	}
	public _closeSession(): void {
		this.getRouter().navTo("TargetLogin");
	}
	public navto_reception(): void {
		this.getRouter().navTo("Reception");
	}
	public navTo_home(): void {
		this.getRouter().navTo("Main");
	}
	public navToSubsidiary(): void {
		this.getRouter().navTo("Subsidiary");
	}
	public navToConcepts(): void {
		this.getRouter().navTo("Concepts");
	}
	public navToHistory(): void {
		this.getRouter().navTo("History");
	}


}
