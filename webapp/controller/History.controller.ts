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
import FilterOperator from "sap/ui/model/FilterOperator";
import { InvoiceStatus } from "../model/InvoiceStatus";
import Sorter from "sap/ui/model/Sorter";
import IconTabSeparator from "sap/m/IconTabSeparator";
import View from "sap/ui/core/mvc/View";
import IconTabBar from "sap/m/IconTabBar";
import ListBinding from "sap/ui/model/ListBinding";
import SearchField from "sap/m/SearchField";
import Event from "sap/ui/base/Event";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class History extends BaseController {

	private AppController: any;
	public async onAfterRendering(): Promise<void> {

		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		await this.AppController.home_navbar();
	}
	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		const subsidiaryData: historyDto[] = await this.loadHistory();
		BusyIndicator.hide();

		const isProvider: boolean = await validatedRoleProvider();
		let all: Number = subsidiaryData.length;
		let aprobadas: Number = subsidiaryData.filter(a => a.status == InvoiceStatus.APPROVED).length;
		let enProgreso: Number = subsidiaryData.filter(a => a.status == InvoiceStatus.IN_PROGRESS).length;
		let borradores: Number = subsidiaryData.filter(a => a.status == InvoiceStatus.DRAFT).length;
		let rechazadas: Number = subsidiaryData.filter(a => a.status == InvoiceStatus.REJECTED).length;

		const iconTabBar: IconTabBar = this.byId("idIconTabBar") as IconTabBar;
		iconTabBar.destroyItems();

		iconTabBar.addItem(new IconTabFilter({ showAll: true, text: "Solicitudes", key: "all" }));
		iconTabBar.addItem(new IconTabSeparator());
		iconTabBar.addItem(new IconTabFilter({ icon: "sap-icon://multiselect-all", iconColor: "Default", count: all.toString(), text: 'Todos', key: "all", visible: true }));
		iconTabBar.addItem(new IconTabFilter({ icon: "sap-icon://message-success", iconColor: "Positive", count: aprobadas.toString(), text: 'Aprobadas', key: "ok", visible: true }));
		iconTabBar.addItem(new IconTabFilter({ icon: "sap-icon://begin", iconColor: "Critical", count: enProgreso.toString(), text: 'En progreso', key: "process", visible: true }));
		iconTabBar.addItem(new IconTabFilter({ icon: "sap-icon://sap-box", iconColor: "Neutral", count: borradores.toString(), text: 'Borradores', key: "draft", visible: isProvider }));
		iconTabBar.addItem(new IconTabFilter({ icon: "sap-icon://error", iconColor: "Negative", count: rechazadas.toString(), text: 'Rechazadas', key: "rejected", visible: true }));
	}
	public async loadHistory(): Promise<historyDto[]> {

		const subsidiaryData: historyDto[] = await getHistory();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "historyModel");

		return subsidiaryData;
	}
	public async onFilterSelect(oEvent: any): Promise<void> {

		let oBinding: ListBinding = this.byId("productsTable").getBinding("items") as ListBinding,
			sKey: String = oEvent.getParameter("key");

		if (sKey === "all") {
			oBinding.filter([]);
		} else if (sKey === "ok") {
			var aFilter: Filter = new Filter("status", FilterOperator.Contains, InvoiceStatus.APPROVED);
			oBinding.filter([aFilter]);
		} else if (sKey === "process") {
			var aFilter: Filter = new Filter("status", FilterOperator.Contains, InvoiceStatus.IN_PROGRESS);
			oBinding.filter([aFilter]);
		} else if (sKey === "draft") {
			var aFilter: Filter = new Filter("status", FilterOperator.Contains, InvoiceStatus.DRAFT);
			oBinding.filter([aFilter]);
		} else if (sKey === "rejected") {
			var aFilter: Filter = new Filter("status", FilterOperator.Contains, InvoiceStatus.REJECTED);
			oBinding.filter([aFilter]);
		}
		else {
			oBinding.filter([]);
		}



	}

	public async onFilterConcepts(): Promise<void> {

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("productsTable");
		const filter: Filter = new Filter("generalConcept", FilterOperator.Contains, searchConcept);
		const binding: ListBinding = tableHelpConceps.getBinding("items") as ListBinding;

		binding.filter([filter]);
	}
	isDescendingConcepts: boolean = false;
	public async onSortConcepts(): Promise<void> {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("productsTable");
		const filter: Filter = new Filter("generalConcept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items") as ListBinding;
		let sorters: Sorter[] = [];

		sorters.push(new Sorter("generalConcept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}
	ReceptionController: any;
	public async handleRowClick(oEvent: Event): Promise<void> {

		const id: string = (oEvent.getSource() as any).getCells()[0].getText();

		this.getRouter().navTo("HistoryDetails", { id: id });

		if (sap.ui.getCore().byId('__component0---HistoryDetails')) {
			this.ReceptionController = (sap.ui.getCore().byId('__component0---HistoryDetails') as View).getController();
			await this.ReceptionController.loadDetails();
		}

	}
}
