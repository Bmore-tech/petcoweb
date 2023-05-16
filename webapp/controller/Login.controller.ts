import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import formatter from "../model/formatter";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Login extends BaseController {
	private formatter = formatter;

	public onLogin(): void {
		this.getRouter().navTo("Main");
	}
	public onAfterRendering(): void {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		this.AppController.login_navbar();
	}

}
