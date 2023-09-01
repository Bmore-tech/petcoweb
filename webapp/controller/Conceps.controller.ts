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
import { Concept } from "com/bmore/portalproveedores/model/Concept";
import View from "sap/ui/core/mvc/View";
import { clearFieldsText, validatedFieldsText } from "com/bmore/portalproveedores/util/Util";
import { closeMsgStrip, showMsgStrip } from "com/bmore/portalproveedores/component/MessageStrip.component";
import UI5Element from "sap/ui/core/Element";
import { MessageStripType } from "com/bmore/portalproveedores/model/MessageStripType";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";
import Event from "sap/ui/base/Event";
import Title from "sap/m/Title";
import FormElement from "sap/ui/layout/form/FormElement";
import Button from "sap/m/Button";
import Table from "sap/m/Table";
import Input from "sap/m/Input";
import Dialog from "sap/m/Dialog";
import SearchField from "sap/m/SearchField";
import ListBinding from "sap/ui/model/ListBinding";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Conceps extends BaseController {

	private isDescendingConcepts: boolean = false;
	private AppController: any;
	public async onAfterRendering(): Promise<void> {
		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		await this.AppController.home_navbar();
	}

	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		await this.loadConceps();
		BusyIndicator.hide();
	}

	public async _onAddConcept(oEvent: Event): Promise<void> {

		const fieldsClear: Array<string> = [
			"conceptId",
			"concept",
			"accountingAccount",
			"approvingGroup",
			"prevalidationGroup"
		];

		await this.displayPopUp();

		(this.byId("titleConcept") as Title).setText("Agregar Concepto");
		(this.byId("formSectionId") as FormElement).setVisible(false);
		(this.byId("buttonSave") as Button).setVisible(true);
		(this.byId("buttonUpdate") as Button).setVisible(false);

		await clearFieldsText(fieldsClear, "__component0---Conceps--");
	}

	public async _onEditConcept(oEvent: Event): Promise<void> {

		await closeMsgStrip();
		const tableConceps: Table = this.byId("tableConceps") as Table;

		if (tableConceps.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar un concepto para actualizar los datos.", MessageStripType.INFORMATION);
		} else {

			await this.displayPopUp();

			const item = (tableConceps.getSelectedItem() as any).getCells();

			(this.byId("titleConcept") as Title).setText("Actualizar Concepto");
			(this.byId("formSectionId") as FormElement).setVisible(true);
			(this.byId("buttonSave") as Button).setVisible(false);
			(this.byId("buttonUpdate") as Button).setVisible(true);

			(this.byId("conceptId") as Input).setValue(item[0].getValue());
			(this.byId("concept") as Input).setValue(item[1].getValue());
			(this.byId("accountingAccount") as Input).setValue(item[2].getValue());
			(this.byId("approvingGroup") as Input).setValue(item[3].getValue());
			(this.byId("prevalidationGroup") as Input).setValue(item[4].getValue());
		}
	}


	public _onCloseConcept(oEvent: Event): void {
		(this.byId("addConcept") as Dialog).close();
	}
	public async _onSaveConcept(oEvent: Event): Promise<void> {

		const fieldsValidated: Array<string> = [
			"concept",
			"accountingAccount",
			"approvingGroup",
			"prevalidationGroup"
		];

		if (await validatedFieldsText(fieldsValidated, "__component0---Conceps--")) {

			BusyIndicator.show(0);

			const conceptRequest: Concept = {
				id: null,
				conceptId: null,
				concept: (this.byId("concept") as Input).getValue(),
				accountingAccount: Number.parseInt((this.byId("accountingAccount") as Input).getValue()),
				approvingGroup: (this.byId("approvingGroup") as Input).getValue(),
				prevalidationGroup: (this.byId("prevalidationGroup") as Input).getValue()
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

	public async _onUpdateConcept(oEvent: Event): Promise<void> {

		BusyIndicator.show(0);

		const conceptRequest: Concept = {
			id: null,
			conceptId: Number.parseInt((this.byId("conceptId") as Input).getValue()),
			concept: (this.byId("concept") as Input).getValue(),
			accountingAccount: Number.parseInt((this.byId("accountingAccount") as Input).getValue()),
			approvingGroup: (this.byId("approvingGroup") as Input).getValue(),
			prevalidationGroup: (this.byId("prevalidationGroup") as Input).getValue()
		};

		if (await updateConcept(conceptRequest)) {
			await this.loadConceps();
		}

		this._onCloseConcept(null);

		BusyIndicator.hide();
	}


	public async _onDeleteConcept(oEvent: Event): Promise<void> {

		await closeMsgStrip();
		const tableConceps: Table = this.byId("tableConceps") as Table;

		if (tableConceps.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar un concepto para borrar los datos.", MessageStripType.INFORMATION);
		} else {

			const item = (tableConceps.getSelectedItem() as any).getCells();

			const conceptId: string = item[0].getValue();
			const conceptName: string = item[1].getValue();

			MessageBox.alert(`¿Está seguro que desea eliminar el concepto ${conceptName}?`, {
				actions: ["Aceptar", "Cancelar"],
				emphasizedAction: "Aceptar",
				onClose: async (sAction: string) => {
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

			const oDialog: Dialog = await Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addConcept",
				controller: this
			}) as Dialog;

			oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			(this.byId("addConcept") as Dialog).open();
			(this.byId("addConcept") as Dialog).addStyleClass("sapUiSizeCompact");
		}

	}

	public onSaveConcept(oEvent: Event): void {
		(this.byId("editButtonConcept") as Button).setVisible(true);
		(this.byId("saveButtonConcept") as Button).setVisible(false);
		(this.byId("cancelButtonConcept") as Button).setVisible(false);
		(this.byId("AddConceptButton") as Button).setVisible(true);
		(this.byId("DeleteConcept") as Button).setVisible(true);
	}
	public onCancelConcept(oEvent: Event): void {
		(this.byId("editButtonConcept") as Button).setVisible(true);
		(this.byId("saveButtonConcept") as Button).setVisible(false);
		(this.byId("cancelButtonConcept") as Button).setVisible(false);
		(this.byId("AddConceptButton") as Button).setVisible(true);
		(this.byId("DeleteConcept") as Button).setVisible(true);
	}

	public async onFilterConcepts(): Promise<void> {

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("tableConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding: ListBinding = tableHelpConceps.getBinding("items") as ListBinding;

		binding.filter([filter]);
	}

	public async onSortConcepts(): Promise<void> {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("tableConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items") as ListBinding;
		let sorters: Sorter[] = [];

		sorters.push(new Sorter("concept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}


}

