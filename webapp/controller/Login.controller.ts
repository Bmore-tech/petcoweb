import BaseController from "./BaseController";
import formatter from "../model/formatter";
import {signIn} from "com/bmore/portalproveedores/service/Login.service";
import {SignInRequest} from "com/bmore/portalproveedores/model/resquest/SignInRequest";
import BusyIndicator from "sap/ui/core/BusyIndicator";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Login extends BaseController {
	private formatter = formatter;

	public async onLogin(): Promise<void> {

		BusyIndicator.show(0);

		const userRequest : SignInRequest = {
			user: this.byId("user").getValue(),
			password: this.byId("pass").getValue()
		}

		if (await signIn(userRequest)) {
			//this.AppController.
			this.getRouter().navTo("Main");
		}

		BusyIndicator.hide();
	}
	public onAfterRendering(): void {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		this.AppController.login_navbar();
	}

}
