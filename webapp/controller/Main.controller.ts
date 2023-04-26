import BaseController from "./BaseController";
import formatter from "../model/formatter";


/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Main extends BaseController {

	private formatter = formatter;


	public async onInit(): Promise<void> {

		sap.ui.getCore().setModel({
			toolTitle: this.byId("toolTitle"),
			backButtonTool: this.byId("toolTitle"),
			labelTitle: this.byId("labelTitle"),
			containerMessage : this.byId("stripContent"),
			containerView : this.byId("viewContent"),
		}, "coreModel");


		await this.navToView("DashBoard");
	}

}

