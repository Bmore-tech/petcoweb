import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
	deleteConcept,
	getConceps,
	saveConcept,
	updateConcept
} from "com/bmore/portalproveedores/service/Conceps.service";
import {Concept} from "com/bmore/portalproveedores/model/Concept";
import View from "sap/ui/core/mvc/View";
import {clearFieldsText, validatedFieldsText} from "com/bmore/portalproveedores/util/Util";
import {closeMsgStrip, showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import UI5Element from "sap/ui/core/Element";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Conceps extends BaseController {

	private isDescendingConcepts: boolean = false;

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}

	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		await this.loadConceps();
		BusyIndicator.hide();
	}

    public async _onAddConcept(oEvent): void {

		const fieldsClear: Array<string> = [
			"conceptId",
			"concept",
			"accountingAccount",
			"approvingGroup",
			"prevalidationGroup"
		];

		await this.displayPopUp();

		this.byId("titleConcept").setText("Agregar Concepto");
		this.byId("formSectionId").setVisible(false);
		this.byId("buttonSave").setVisible(true);
		this.byId("buttonUpdate").setVisible(false);

		await clearFieldsText(fieldsClear, "__component0---Conceps--");
	}

	public async _onEditConcept(oEvent): void {

		await closeMsgStrip();
		const tableConceps: UI5Element = this.byId("tableConceps");

		if (tableConceps.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar un concepto para actualizar los datos.", MessageStripType.INFORMATION);
		} else {

			await this.displayPopUp();

			const item = tableConceps.getSelectedItem().getCells();

			this.byId("titleConcept").setText("Actualizar Concepto");
			this.byId("formSectionId").setVisible(true);
			this.byId("buttonSave").setVisible(false);
			this.byId("buttonUpdate").setVisible(true);

			this.byId("conceptId").setValue(item[0].getValue());
			this.byId("concept").setValue(item[1].getValue());
			this.byId("accountingAccount").setValue(item[2].getValue());
			this.byId("approvingGroup").setValue(item[3].getValue());
			this.byId("prevalidationGroup").setValue(item[4].getValue());
		}
	}


	public _onCloseConcept(oEvent): void {
		this.byId("addConcept").close();
	}
	public async _onSaveConcept(oEvent): void {

		const fieldsValidated: Array<string> = [
			"concept",
			"accountingAccount",
			"approvingGroup",
			"prevalidationGroup"
		];

		if (await validatedFieldsText(fieldsValidated, "__component0---Conceps--")) {

			BusyIndicator.show(0);

			const conceptRequest : Concept = {
				id: null,
				conceptId: null,
				concept: this.byId("concept").getValue(),
				accountingAccount: this.byId("accountingAccount").getValue(),
				approvingGroup: this.byId("approvingGroup").getValue(),
				prevalidationGroup:this.byId("prevalidationGroup").getValue()
			};

			if (await saveConcept(conceptRequest)) {
				await this.loadConceps();
			}

			this._onCloseConcept(null);

			BusyIndicator.hide();

		} else {
			MessageBox.alert("Los campos no pueden ser vacios.",
				{
					actions: ["Aceptar"],
					emphasizedAction: "Aceptar"
				});
		}

	}

	public async _onUpdateConcept(oEvent): void {

		BusyIndicator.show(0);

		const conceptRequest : Concept = {
			id: null,
			conceptId: this.byId("conceptId").getValue(),
			concept: this.byId("concept").getValue(),
			accountingAccount: this.byId("accountingAccount").getValue(),
			approvingGroup: this.byId("approvingGroup").getValue(),
			prevalidationGroup:this.byId("prevalidationGroup").getValue()
		};

		if (await updateConcept(conceptRequest)) {
			await this.loadConceps();
		}

		this._onCloseConcept(null);

		BusyIndicator.hide();
	}


	public async _onDeleteConcept(oEvent): void {

		await closeMsgStrip();
		const tableConceps: UI5Element = this.byId("tableConceps");

		if (tableConceps.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar un concepto para borrar los datos.", MessageStripType.INFORMATION);
		} else {

			const item = tableConceps.getSelectedItem().getCells();

			const conceptId : string = item[0].getValue();
			const conceptName : string = item[1].getValue();

			MessageBox.alert(`¿Está seguro que desea eliminar el concepto ${conceptName}?`, {
				actions: ["Aceptar", "Cancelar"],
				emphasizedAction: "Aceptar",
				onClose: async (sAction) => {
					if (sAction === "Aceptar") {
						if (await deleteConcept(conceptId)) {
							await this.loadConceps();
						}
					}
				}
			});
		}
	}

	public async loadConceps(): Promise<void> {

		const conceptData: Concept = await getConceps();

		await this.setModel(new JSONModel({
			...conceptData
		}), "concepsModel");
	}

	public async displayPopUp(): Promise<void> {

		const oView: View = this.getView();
		if (!this.byId("addConcept")) {

			const oDialog: Control = await Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addConcept",
				controller: this
			});

			oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			this.byId("addConcept").open();
			this.byId("addConcept").addStyleClass("sapUiSizeCompact");
		}

	}

	public onSaveConcept(oEvent): void {
		this.byId("editButtonConcept").setVisible(true);
		this.byId("saveButtonConcept").setVisible(false);
		this.byId("cancelButtonConcept").setVisible(false);
		this.byId("AddConceptButton").setVisible(true);
		this.byId("DeleteConcept").setVisible(true);
	}
	public onCancelConcept(oEvent): void {
		this.byId("editButtonConcept").setVisible(true);
		this.byId("saveButtonConcept").setVisible(false);
		this.byId("cancelButtonConcept").setVisible(false);
		this.byId("AddConceptButton").setVisible(true);
		this.byId("DeleteConcept").setVisible(true);
	}

	public async onFilterConcepts(): void {

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding: Binding = tableHelpConceps.getBinding("items");

		binding.filter([filter]);
	}

	public async onSortConcepts(): void {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items");
		let sorters: Array<string> = [];

		sorters.push(new Sorter("concept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}


}

