import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import MessageBox from "sap/m/MessageBox";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
	deleteSubsidiary,
	getSubsidiaries,
	saveSubsidiary,
	updateSubsidiary
} from "com/bmore/portalproveedores/service/Subsidiary.service";
import UI5Element from "sap/ui/core/Element";
import {closeMsgStrip, showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";
import { Subsidiary as SubsidiaryDto } from "com/bmore/portalproveedores/model/Subsidiary";
import View from "sap/ui/core/mvc/View";
import {clearFieldsText, validatedFieldsText} from "com/bmore/portalproveedores/util/Util";
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
export default class Subsidiary extends BaseController {

	private isDescendingSubsidiaries: boolean = false;
	private AppController: any;
	public async onAfterRendering(): Promise<void> {
		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		await this.AppController.home_navbar();
	}

	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		await this.loadSubsidiaries();
		BusyIndicator.hide();
	}

	public async _onAddSubsidiary(oEvent: Event): Promise<void> {

		const fieldsClear: Array<string> = [
			"idSubsidiary",
			"subsidiary",
			"costCenter"
		];

		await this.displayPopUp();

		(this.byId("titleSubsidiary") as Title).setText("Agregar Sucursal");
		(this.byId("formSectionId") as FormElement).setVisible(false);
		(this.byId("buttonSave") as Button).setVisible(true);
		(this.byId("buttonUpdate") as Button).setVisible(false);

		await clearFieldsText(fieldsClear, "__component0---Subsidiary--");
	}

	public async _onEditSubsidiary(oEvent: Event): Promise<void> {

		await closeMsgStrip();
		const tableSubsidiaries: Table = this.byId("tableSubsidiaries") as Table;

		if (tableSubsidiaries.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar una sucursal para actualizar los datos.", MessageStripType.INFORMATION);
		} else {

			await this.displayPopUp();

			const item = (tableSubsidiaries.getSelectedItem() as any).getCells();

			(this.byId("titleSubsidiary") as Title).setText("Actualizar Sucursal");
			(this.byId("formSectionId") as FormElement).setVisible(true);
			(this.byId("buttonSave") as Button).setVisible(false);
			(this.byId("buttonUpdate") as Button).setVisible(true);

			(this.byId("idSubsidiary") as Input).setValue(item[0].getValue());
			(this.byId("subsidiary") as Input).setValue(item[1].getValue());
			(this.byId("costCenter") as Input).setValue(item[2].getValue());
		}

	}

	public _onCloseSubsidiary(oEvent: Event): void {
		(this.byId("addSubsidiary") as Dialog).close();
	}
	public async _onSaveSubsidiary(oEvent: Event): Promise<void> {

		const fieldsValidated: Array<string> = [
			"subsidiary",
			"costCenter"
		];

		if (await validatedFieldsText(fieldsValidated, "__component0---Subsidiary--")) {

			BusyIndicator.show(0);

			const subsidiaryRequest: SubsidiaryDto = {
				id: null,
				subsidiaryId: null,
				subsidiary: (this.byId("subsidiary") as Input).getValue(),
				costCenter: Number.parseFloat((this.byId("costCenter") as Input).getValue())
			};

			if (await saveSubsidiary(subsidiaryRequest)) {
				await this.loadSubsidiaries();
			}

			this._onCloseSubsidiary(null);

			BusyIndicator.hide();

		} else {
			MessageBox.alert("Los campos no pueden ser vacios.",
				{
					actions: ["Aceptar"],
					emphasizedAction: "Aceptar"
				});
		}
	}

	public async _onUpdateSubsidiary(oEvent: Event): Promise<void> {

		BusyIndicator.show(0);

		const subsidiaryRequest: SubsidiaryDto = {
			id: null,
			subsidiaryId: Number.parseInt((this.byId("idSubsidiary") as Input).getValue()),
			subsidiary: (this.byId("subsidiary") as Input).getValue(),
			costCenter: Number.parseFloat((this.byId("costCenter") as Input).getValue())
		};

		if (await updateSubsidiary(subsidiaryRequest)) {
			await this.loadSubsidiaries();
		}

		this._onCloseSubsidiary(null);

		BusyIndicator.hide();
	}
	public async _onDeleteSubsidiary(oEvent: Event): Promise<void> {

		await closeMsgStrip();
		const tableSubsidiaries: Table = this.byId("tableSubsidiaries") as Table;

		if (tableSubsidiaries.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar una sucursal para borrar los datos.", MessageStripType.INFORMATION);
		} else {

			const item = (tableSubsidiaries.getSelectedItem() as any).getCells();

			const subsidiaryId: string = item[0].getValue();
			const subsidiaryName: string = item[1].getValue();

			MessageBox.alert(`¿Está seguro que desea eliminar la sucursal ${subsidiaryName}?`, {
				actions: ["Aceptar", "Cancelar"],
				emphasizedAction: "Aceptar",
				onClose: async (sAction: string) => {
					if (sAction === "Aceptar") {
						if (await deleteSubsidiary(subsidiaryId)) {
							await this.loadSubsidiaries();
						}
					}
				}
			});
		}
	}

	public async loadSubsidiaries(): Promise<void> {

		const subsidiaryData: SubsidiaryDto = await getSubsidiaries();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "subsidiariesModel");

	}

	public async displayPopUp(): Promise<void> {

		const oView: View = this.getView();
		if (!this.byId("addSubsidiary")) {

			const oDialog: Dialog = await Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addSubsidiary",
				controller: this
			}) as Dialog;

			oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			(this.byId("addSubsidiary") as Dialog).open();
			(this.byId("addSubsidiary") as Dialog).addStyleClass("sapUiSizeCompact");
		}
	}


	public onSave(oEvent: Event): void {
		(this.byId("editButton") as Button).setVisible(true);
		(this.byId("saveButton") as Button).setVisible(false);
		(this.byId("cancelButton") as Button).setVisible(false);
		(this.byId("AddSubsidiaryButton") as Button).setVisible(true);
		(this.byId("DeleteSubsidiary") as Button).setVisible(true);
	}
	public onCancel(oEvent: Event): void {
		(this.byId("editButton") as Button).setVisible(true);
		(this.byId("saveButton") as Button).setVisible(false);
		(this.byId("cancelButton") as Button).setVisible(false);
		(this.byId("AddSubsidiaryButton") as Button).setVisible(true);
		(this.byId("DeleteSubsidiary") as Button).setVisible(true);
	}

	public async onFilterSubsidiaries(): Promise<void> {

		const searchSubsidiary: string = (this.byId("searchSubsidiary") as SearchField).getValue();
		const tableHelpSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchSubsidiary);
		const binding: ListBinding = tableHelpSubsidiaries.getBinding("items") as ListBinding;

		binding.filter([filter]);
	}

	public async onSortSubsidiaries(): Promise<void> {

		this.isDescendingSubsidiaries = !this.isDescendingSubsidiaries;

		const searchSubsidiary: string = (this.byId("searchSubsidiary") as SearchField).getValue();
		const tableHelpSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchSubsidiary);
		const binding = tableHelpSubsidiaries.getBinding("items") as ListBinding;
		let sorters: Sorter[] = [];

		sorters.push(new Sorter("subsidiary", this.isDescendingSubsidiaries));
		binding.filter([filter]).sort(sorters);
	}

}
