import BaseController from "./BaseController";
import formatter from "../model/formatter";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Dashboard } from "../model/resquest/DashBoard";
import { Carrucel } from "../model/resquest/Carrucel";
import { getDashBoard } from "../service/Main.service";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Integer from "sap/ui/model/type/Integer";
import { validatedRoleProvider } from "../util/JwtHelper";


/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Main extends BaseController {
	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();

	}
	public async onInit(): Promise<void> {

		console.log("onInit Main .............")

		BusyIndicator.show(0);

		const draftItem: UI5Element = sap.ui.getCore().byId('__component0---main--itemList');
		// console.log("draftItem ", draftItem.getItems()[2]);

		const isProvider: boolean = await validatedRoleProvider();
		console.log(isProvider);
		
		if (!isProvider)
			draftItem.getItems()[2].removeAllContent();

		const dashBoardData: Dashboard = await getDashBoard();
		const imagesCarrucel: Array<string> = await this.getCarrucel(dashBoardData);
		const total: Integer = await this.getTotal(dashBoardData);

		await this.setModel(new JSONModel({
			...dashBoardData,
			carrucel: imagesCarrucel,
			total
		}), "dashboard");

		BusyIndicator.hide();

	}


	public async getCarrucel(dashBoardData: Dashboard): Promise<Array<string>> {

		const imagesCarrucel: Array<string> = [];

		if (Object.keys(dashBoardData?.carrucel ?? []).length > 0) {
			for (const image: Carrucel of dashBoardData.carrucel) {
				imagesCarrucel.push(`data:image/${image.type};base64, ${image.base64}`);
			}
		}

		return imagesCarrucel;
	}

	public async getTotal(dashBoardData: Dashboard): Promise<Array<Integer>> {

		let total: Integer = 0;

		if (Object.keys(dashBoardData?.carrucel ?? []).length > 0) {
			total = Object.entries(dashBoardData)
				.filter((elemntDashBoard) => elemntDashBoard[0] !== "carrucel")
				.map((elemntDashBoard) => elemntDashBoard[1])
				.reduce((elemntA, elemntB) => { return elemntA + elemntB; }, 0);
		}

		return total;
	}

}
