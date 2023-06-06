import BaseController from "./BaseController";
import formatter from "../model/formatter";
import {signIn} from "com/bmore/portalproveedores/service/Login.service";
import {SignInRequest} from "com/bmore/portalproveedores/model/resquest/SignInRequest";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import {showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Login extends BaseController {

	public async onLogin(): Promise<void> {

		this.AppController = sap.ui.getCore().byId('__component0---app').getController();

		BusyIndicator.show(0);

		const user: string = this.byId("user").getValue();
		const password: string = this.byId("pass").getValue();

		if (user.length == 0 || password.length == 0) {
			showMsgStrip("Los campos de usuario o password no deben estar vacios.", MessageStripType.INFORMATION);
		} else {

			const userRequest: SignInRequest = {
				user,
				password
			}

			if (await signIn(userRequest)) {
				await this.AppController.navTo_home();
				this.Main = sap.ui.getCore().byId('__component0---main').getController();
				await this.Main.onInit();
			}
		}

		BusyIndicator.hide();
	}
	public onAfterRendering(): void {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		this.AppController.login_navbar();
	}

}
