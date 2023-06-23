import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import { History as historyDto } from "com/bmore/portalproveedores/model/response/History";
import UI5Element from "sap/ui/core/Element";
import { validatedRoleProvider } from "../util/JwtHelper";
import JSONModel from "sap/ui/model/json/JSONModel";
import IconTabFilter from "sap/m/IconTabFilter";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { getHistory } from "../service/History.service";
import Binding from "sap/ui/model/Binding";
import Filter from "sap/ui/model/Filter";
import Model from "sap/ui/model/Model";
import FilterOperator from "sap/ui/model/FilterOperator";
import Subsidiary from "./Subsidiary.controller";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class History extends BaseController {


	public async onAfterRendering(): Promise<void> {

		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}
	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		const subsidiaryData: historyDto[] = await this.loadHistory();
		BusyIndicator.hide();

		let model: JSONModel = new sap.ui.model.json.JSONModel();
		const isProvider: boolean = await validatedRoleProvider();
		let all:Number = subsidiaryData.length;
		let aprobadas:Number = subsidiaryData.filter(a => a.status == "APPROVED").length;
		let enProgreso:Number = subsidiaryData.filter(a => a.status == "IN_PROGRESS").length;
		let borradores:Number = subsidiaryData.filter(a => a.status == "DRAFT").length;
		let rechazadas:Number = subsidiaryData.filter(a => a.status == "REJECTED").length;

		model.setData(
			{
				filter: [
					{}, {},
					{ icon: "sap-icon://multiselect-all", iconColor: "Default", count: all, text: 'Todos', key: "all", visible: true },
					{ icon: "sap-icon://message-success", iconColor: "Positive", count: aprobadas, text: 'Aprobadas', key: "ok", visible: true },
					{ icon: "sap-icon://begin", iconColor: "Critical", count: enProgreso, text: 'En progreso', key: "process", visible: true },
					{ icon: "sap-icon://sap-box", iconColor: "Neutral", count: borradores, text: 'Borradores', key: "draft", visible: isProvider },
					{ icon: "sap-icon://error", iconColor: "Negative", count: rechazadas, text: 'Rechazadas', key: "rejected", visible: true }
				]
			});

		const iconTabBar: UI5Element = this.byId("idIconTabBar");
		// var items:JSONModel = model.getProperty("/filter");
		iconTabBar.setModel(model, "itbModel");
		await iconTabBar.bindAggregation("items", "itbModel>/filter", new IconTabFilter({ icon: "{itbModel>icon}", iconColor: "{itbModel>iconColor}", count: "{itbModel>count}", text: "{itbModel>text}", key: "{itbModel>key}", visible: "{itbModel>visible}" }));
	}
	public async loadHistory(): Promise<historyDto[]> {

		const subsidiaryData: historyDto[] = await getHistory();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "historyModel");
		console.log(this.getModel("historyModel"));

		return subsidiaryData;
	}
	public async onFilterSelect(oEvent:any): Promise<void> {

		let oBinding: Binding = this.byId("productsTable").getBinding("items"),
			sKey: String = oEvent.getParameter("key");

		if (sKey === "all") {
			oBinding.filter();
		} else if (sKey === "ok") {
			var aFilter:Filter = new Filter( "status", FilterOperator.Contains, "APPROVED") ;
			oBinding.filter([aFilter]);
		} else if (sKey === "process") {
			var aFilter:Filter = new Filter( "status", FilterOperator.Contains, "IN_PROGRESS") ;
			oBinding.filter([aFilter]);
		}else if (sKey === "draft") {
			var aFilter:Filter = new Filter( "status", FilterOperator.Contains, "DRAFT") ;
			oBinding.filter([aFilter]);
		}else if (sKey === "rejected") {
			var aFilter:Filter = new Filter( "status", FilterOperator.Contains, "REJECTED") ;
			oBinding.filter([aFilter]);
		}
		else{
			oBinding.filter();
		}

		

	}

}
