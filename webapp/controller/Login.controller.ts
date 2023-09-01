import BaseController from "./BaseController";
import { signIn } from "com/bmore/portalproveedores/service/Login.service";
import { SignInRequest } from "com/bmore/portalproveedores/model/resquest/SignInRequest";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { showMsgStrip } from "com/bmore/portalproveedores/component/MessageStrip.component";
import { MessageStripType } from "com/bmore/portalproveedores/model/MessageStripType";
import View from "sap/ui/core/mvc/View";
import Input from "sap/m/Input";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Login extends BaseController {
	private AppController: any;
	private Main: any;
	public async enter(): Promise<void> {

		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();

		BusyIndicator.show(0);

		const user: string = (this.byId("user") as Input).getValue();
		const password: string = (this.byId("pass") as Input).getValue();

		if (user.length == 0 || password.length == 0) {
			showMsgStrip("Los campos de usuario o password no deben estar vacios.", MessageStripType.INFORMATION);
		} else {

			const userRequest: SignInRequest = {
				user,
				password
			}

			if (await signIn(userRequest)) {
				await this.AppController.navTo_home();
				if (sap.ui.getCore().byId('__component0---main')) {
					this.Main = (sap.ui.getCore().byId('__component0---main') as View).getController();
					await this.Main.onInit();
				}
			}
		}

		BusyIndicator.hide();
	}
	public async onLogin(): Promise<void> {

		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();

		BusyIndicator.show(0);

		const user: string = (this.byId("user") as Input).getValue();
		const password: string = (this.byId("pass") as Input).getValue();

		if (user.length == 0 || password.length == 0) {
			showMsgStrip("Los campos de usuario o password no deben estar vacios.", MessageStripType.INFORMATION);
		} else {

			const userRequest: SignInRequest = {
				user,
				password
			}

			if (await signIn(userRequest)) {
				await this.AppController.navTo_home();
				if (sap.ui.getCore().byId('__component0---main')) {
					this.Main = (sap.ui.getCore().byId('__component0---main') as View).getController();
					await this.Main.onInit();
				}
			}
		}

		BusyIndicator.hide();
	}
	public onAfterRendering(): void {
		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		this.AppController.login_navbar();
	}

}
