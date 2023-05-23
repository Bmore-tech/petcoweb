import BaseController from "./BaseController";
import formatter from "../model/formatter";
import {signIn} from "com/bmore/portalproveedores/service/Login.service";
import {SignInRequest} from "com/bmore/portalproveedores/model/resquest/SignInRequest";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import {validatedRoles} from "com/bmore/portalproveedores/util/JwtHelper";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Login extends BaseController {
	private formatter = formatter;

	public async onLogin(): Promise<void> {

		this.AppController = sap.ui.getCore().byId('__component0---app').getController();

		BusyIndicator.show(0);

		const userRequest : SignInRequest = {
			user: this.byId("user").getValue(),
			password: this.byId("pass").getValue()
		}

		if (await signIn(userRequest)) {
			await this.AppController.navTo_home();
			this.Main = sap.ui.getCore().byId('__component0---main').getController();
			await validatedRoles();
			await this.Main.onInit();

			//await this.getRouter().navTo("Main");
		}

		BusyIndicator.hide();
	}
	public onAfterRendering(): void {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		this.AppController.login_navbar();
	}

}
