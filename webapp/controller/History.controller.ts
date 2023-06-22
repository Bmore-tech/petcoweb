import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import { History as historyDto } from "com/bmore/portalproveedores/model/response/History";
import UI5Element from "sap/ui/core/Element";
import { validatedRoleProvider } from "../util/JwtHelper";
import JSONModel from "sap/ui/model/json/JSONModel";
import IconTabFilter from "sap/m/IconTabFilter";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { getHistory } from "../service/History.service";

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
		await this.loadHistory();
		BusyIndicator.hide();

		let model: JSONModel = new sap.ui.model.json.JSONModel();
		const isProvider:boolean = await validatedRoleProvider();
		// "{/ProductCollectionStats/Counts/Weight/Total}"
		// "{/ProductCollectionStats/Counts/Weight/Ok}"
		// "{/ProductCollectionStats/Counts/Weight/Heavy}"
		// "{/ProductCollectionStats/Counts/Weight/draft}"
		// "{/ProductCollectionStats/Counts/Weight/Overweight}"
		model.setData(
			{
				filter: [
					{}, {},
					{ icon: "sap-icon://multiselect-all", iconColor: "Default", count: 0, text: 'Todos', key: "all", visible: true },
					{ icon: "sap-icon://message-success", iconColor: "Positive", count: 0, text: 'Aprobadas', key: "ok" , visible: true},
					{ icon: "sap-icon://begin", iconColor: "Critical", count: 0, text: 'En progreso', key: "process" , visible: true},
					{ icon: "sap-icon://sap-box", iconColor: "Neutral", count: 0 , text: 'Borradores', key: "draft", visible: isProvider},
					{ icon: "sap-icon://error", iconColor: "Negative", count: 0, text: 'Rechazadas', key: "rejected" , visible: true}
				]
			});

		const iconTabBar: UI5Element = this.byId("idIconTabBar");
		// var items:JSONModel = model.getProperty("/filter");
		 iconTabBar.setModel(model, "itbModel");
		 await iconTabBar.bindAggregation("items", "itbModel>/filter", new IconTabFilter({ icon: "{itbModel>icon}", iconColor: "{itbModel>iconColor}", count: "{itbModel>count}", text: "{itbModel>text}", key: "itbModel>key", visible:"{itbModel>visible}" }));
	}
	public async loadHistory(): Promise<void> {

		const subsidiaryData: historyDto = await getHistory();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "historyModel");
		console.log(this.getModel("historyModel"));
		

	}

}
