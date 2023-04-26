import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import formatter from "../model/formatter";
import JSONModel from "sap/ui/model/json/JSONModel";
import {Dashboard} from "com/petco/portalproveedorespetco/model/DashBoard";
import {Carrucel} from "com/petco/portalproveedorespetco/model/Carrucel";
import { getDashBoard } from "../service/Main.service";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Integer from "sap/ui/model/type/Integer";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class DashBoard extends BaseController {

	private formatter = formatter;

	public async onInit(): Promise<void> {

		BusyIndicator.show(0);

		const dashBoardData: Dashboard = await getDashBoard();
		const imagesCarrucel = await this.getCarrucel(dashBoardData);
		const total : Integer = await this.getTotal(dashBoardData);

		BusyIndicator.hide();

		this.setModel(new JSONModel({
			...dashBoardData,
			carrucel: imagesCarrucel,
			total
		}), "dashboard");
	}


	public async getCarrucel(dashBoardData: Dashboard): Promise<Array<string>> {

		const imagesCarrucel : Array<string> = [];

		if (Object.keys(dashBoardData?.carrucel ?? []).length > 0) {
			for (const image: Carrucel of dashBoardData.carrucel) {
				imagesCarrucel.push(`data:image/${image.type};base64, ${image.base64}`);
			}
		}

		return imagesCarrucel;
	}

	public async getTotal(dashBoardData: Dashboard): Promise<Array<Integer>> {

		let total : Integer = 0;

		if (Object.keys(dashBoardData?.carrucel ?? []).length > 0) {
			total = Object.entries(dashBoardData)
					.filter((elemntDashBoard) => elemntDashBoard[0] !== "carrucel")
					.map((elemntDashBoard) => elemntDashBoard[1])
					.reduce((elemntA, elemntB) => { return elemntA + elemntB; }, 0);
		}

		return total;
	}

	public sayHello() : void {
		//MessageBox.show("Hello World!");
		this.navTo("conceps");
	}
}

