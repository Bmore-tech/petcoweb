
import BaseController from "./BaseController";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class NotFound  extends BaseController {

	public _onNavHome(): void {
		this.getRouter().navTo("Main");
	}

}
