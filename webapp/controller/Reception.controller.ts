import BaseController from "./BaseController";
import View from "sap/ui/core/mvc/View";
import Fragment from "sap/ui/core/Fragment";
import {Concept} from "com/bmore/portalproveedores/model/Concept";
import {getConceps} from "com/bmore/portalproveedores/service/Conceps.service";
import JSONModel from "sap/ui/model/json/JSONModel";
import {Subsidiary as SubsidiaryDto} from "com/bmore/portalproveedores/model/Subsidiary";
import {getSubsidiaries} from "com/bmore/portalproveedores/service/Subsidiary.service";
import UI5Element from "sap/ui/core/Element";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Binding from "sap/ui/model/Binding";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Reception extends BaseController {

	private isDescendingConcepts: boolean = false;
	private isDescendingSubsidiaries: boolean = false;

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}

	public async _onSelectSubsidiary(oEvent): void {

		const tableHelpSubsidiaries: UI5Element = this.byId("tableHelpSubsidiaries");

		if (tableHelpSubsidiaries.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar una sucursal para continuar.");
		} else {

			const items = tableHelpSubsidiaries.getSelectedItems();
			let subsidiaryList: Array<object> = [];

			if (items.length > 0) {

				items.forEach((itemData): void => {
					const item = itemData.getCells();
					subsidiaryList.push({
						idSubsidiary: item[0].getValue(),
						subsidiary: item[1].getValue()
					})
				})
			}

			await this.setModel(new JSONModel({
				...subsidiaryList
			}), "subsidiaryList");

			await this._onClose("subsidiaryHelp");
		}

	}

	public async loadSubsidiaries(): Promise<void> {

		const subsidiaryData: SubsidiaryDto = await getSubsidiaries();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "subsidiariesModel");

		await this.displayHelp("subsidiaryHelp");

		this.byId("searchSubsidiary").setValue("");
		this.isDescendingSubsidiaries = false
	}

	public async _onDeleteRowSubsidiary(oEvent): Promise<void> {

		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const item = oEvent.getSource().getBindingContext("subsidiaryList").getObject();
		const subsidiaryList: Array<object>  = tableSubsidiaries.getModel("subsidiaryList").getData();

		const sizeList: number = Object.keys(subsidiaryList).length;
		let subsidiaryListFilter: Array<object> = [];

		if (sizeList > 0) {

			for (let index: number = 0; index < sizeList; index++) {
				if (parseInt(subsidiaryList[index].idSubsidiary) != parseInt(item.idSubsidiary)) {
					subsidiaryListFilter.push(subsidiaryList[index]);
				}
			}
		}

		await this.setModel(new JSONModel({
			...subsidiaryListFilter
		}), "subsidiaryList");
	}

	public async sumAmount(): Promise<void> {

		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const subsidiaryList: Array<object>  = tableSubsidiaries.getItems();

		let sum: number = 0;
		if (subsidiaryList.length > 0) {

			subsidiaryList.forEach((subsidiary: object): void => {

				const cellAmount = subsidiary.getCells()[1];
				const value = cellAmount.mAggregations.content[0].mProperties.value;

				sum += Number(value);
			});
		}

		console.log("suma tienda: ", sum);

		this.byId("subsidiarySum").setText(`Subtotal prorrateo $${sum}`);
	}

	public async _onSelectConcept(oEvent): void {

		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");

		if (tableHelpConceps.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar un concepto para continuar.");
		} else {

			const item = tableHelpConceps.getSelectedItem().getCells();

			this.byId("conceptId").setValue(item[0].getValue());
			this.byId("concept").setValue(item[1].getValue());

			await this._onClose("conceptHelp");
		}
	}

	public async onLoadConcepts(): void {

		const conceptData: Concept = await getConceps();

		await this.setModel(new JSONModel({
			...conceptData
		}), "concepsModel");

		await this.displayHelp("conceptHelp");

		this.byId("searchConcept").setValue("");
		this.isDescendingConcepts = false
	}

	public async onFilterConcepts(): void {

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding: Binding = tableHelpConceps.getBinding("items");

		binding.filter([filter]);
	}

	public async onSortConcepts(): void {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items");
		let sorters: Array<string> = [];

		sorters.push(new Sorter("concept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}

	public async onFilterSubsidiaries(): void {

		const searchConcept: string = this.byId("searchSubsidiary").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding: Binding = tableHelpConceps.getBinding("items");

		binding.filter([filter]);

	}

	public async onSortSubsidiaries(): void {

		this.isDescendingSubsidiaries = !this.isDescendingSubsidiaries;

		const searchConcept: string = this.byId("searchSubsidiary").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items");
		let sorters: Array<string> = [];

		sorters.push(new Sorter("subsidiary", this.isDescendingSubsidiaries));
		binding.filter([filter]).sort(sorters);
	}

	public async uploadFiles(oEvent): Promise<void> {

		debugger
		const uploadCollection = oEvent.getSource();

		MessageBox.information("prueba")
	}

	public async displayHelp(idViewHelp: string): Promise<void> {

		const oView: View = this.getView();
		if (!this.byId(idViewHelp)) {

			const oDialog: Control = await Fragment.load({
				id: oView.getId(),
				name: `com.bmore.portalproveedores.view.fragments.${idViewHelp}`,
				controller: this
			});

			await oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			this.byId(idViewHelp).open();
			this.byId(idViewHelp).addStyleClass("sapUiSizeCompact");
		}
	}
	public _onClose(idViewHelp: string): void {
		this.byId(idViewHelp).close();
	}

}
