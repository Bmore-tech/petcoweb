import Controller from "sap/ui/core/mvc/Controller";
import BaseController from "./BaseController";

/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class TablePendings extends BaseController {
    public async onAfterRendering(): Promise<void> {
        this.AppController = sap.ui.getCore().byId('__component0---app').getController();
        await this.AppController.home_navbar();
    }


}