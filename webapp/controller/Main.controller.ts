import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Dashboard } from "../model/resquest/DashBoard";
import { getDashBoard } from "../service/Main.service";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Integer from "sap/ui/model/type/Integer";
import { validatedRoleProvider } from "../util/JwtHelper";
import View from "sap/ui/core/mvc/View";
import List from "sap/m/List";


/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class Main extends BaseController {
	private AppController: any;
	public async onAfterRendering(): Promise<void> {
		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		await this.AppController.home_navbar();

	}
	public async onInit(): Promise<void> {
		BusyIndicator.show(0);

		const draftItem: List = sap.ui.getCore().byId('__component0---main--itemList') as List;

		const isProvider: boolean = await validatedRoleProvider();

		if (!isProvider)
			(draftItem.getItems()[2] as any).removeAllContent();

		const dashBoardData: Dashboard = await getDashBoard();
		const imagesCarrucel: Array<string> = await this.getCarrucel(dashBoardData);
		const total: Integer[] = await this.getTotal(dashBoardData);

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
			for (const image of dashBoardData.carrucel) {
				imagesCarrucel.push(`data:image/${image.type};base64, ${image.base64}`);
			}
		}

		return imagesCarrucel;
	}

	public async getTotal(dashBoardData: Dashboard): Promise<Array<Integer>> {

		let total: Integer[] = [];

		if (Object.keys(dashBoardData?.carrucel ?? []).length > 0) {
			total = Object.entries(dashBoardData)
				.filter((elemntDashBoard) => elemntDashBoard[0] !== "carrucel")
				.map((elemntDashBoard) => elemntDashBoard[1])
				.reduce((elemntA, elemntB) => { return elemntA + elemntB; }, 0);
		}

		return total;
	}

}
