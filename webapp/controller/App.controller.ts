import BaseController from "./BaseController";
import Event from "sap/ui/base/Event";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class App extends BaseController {

	public onInit() : void {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}

}
