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
import {SubsidiaryResponse} from "com/bmore/portalproveedores/model/response/SubsidiaryResponse";
import UI5Element from "sap/ui/core/Element";
import {closeMsgStrip, showMsgStrip} from "com/bmore/portalproveedores/component/MessageStrip.component";
import {MessageStripType} from "com/bmore/portalproveedores/model/MessageStripType";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Subsidiary extends BaseController {

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}

	public async onInit(): Promise<void> {

		BusyIndicator.show(0);
		await this.loadSubsidiaries();
		BusyIndicator.hide();
	}

	public async _onAddSubsidiary(oEvent): void {

		const oView = this.getView();
		if (!this.byId("addSubsidiary")) {

			const oDialog: Control = await Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addSubsidiary",
				controller: this
			});

			oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			this.byId("addSubsidiary").open();
			this.byId("addSubsidiary").addStyleClass("sapUiSizeCompact");
		}

		this.byId("titleSucursal").setText("Agregar Sucursal");
		this.byId("formSectionId").setVisible(false);
		this.byId("buttonSave").setVisible(true);
		this.byId("buttonUpdate").setVisible(false);
	}

	public async _onEditSubsidiary(oEvent): void {

		await closeMsgStrip();
		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");

		if (tableSubsidiaries.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar una sucursal para actualizar los datos.", MessageStripType.INFORMATION);
		} else {

			const oView = this.getView();
			if (!this.byId("addSubsidiary")) {

				const oDialog: Control = await Fragment.load({
					id: oView.getId(),
					name: "com.bmore.portalproveedores.view.fragments.addSubsidiary",
					controller: this
				});

				oView.addDependent(oDialog);
				oDialog.open();
				oDialog.addStyleClass("sapUiSizeCompact");

			} else {
				this.byId("addSubsidiary").open();
				this.byId("addSubsidiary").addStyleClass("sapUiSizeCompact");
			}


			const item = tableSubsidiaries.getSelectedItem().getCells();

			this.byId("titleSucursal").setText("Actualizar Sucursal");
			this.byId("formSectionId").setVisible(true);
			this.byId("buttonSave").setVisible(false);
			this.byId("buttonUpdate").setVisible(true);

			this.byId("idSubsidiary").setValue(item[0].getValue());
			this.byId("subsidiary").setValue(item[1].getValue());
			this.byId("costCenter").setValue(item[2].getValue());
		}

	}

	public _onCloseSubsidiary(oEvent): void {
		this.byId("addSubsidiary").close();
	}
	public async _onSaveSubsidiary(oEvent): void {

		BusyIndicator.show(0);

		const SubsidiaryRequest : Subsidiary = {
			id: null,
			subsidiaryId: null,
			subsidiary: this.byId("subsidiary").getValue(),
			costCenter: this.byId("costCenter").getValue()
		};

		if (await saveSubsidiary(SubsidiaryRequest)) {
			await this.loadSubsidiaries();
		}

		this.byId("addSubsidiary").close();

		BusyIndicator.hide();
	}

	public async _onUpdateSubsidiary(oEvent): void {

		BusyIndicator.show(0);

		const SubsidiaryRequest : Subsidiary = {
			id: null,
			subsidiaryId: this.byId("idSubsidiary").getValue(),
			subsidiary: this.byId("subsidiary").getValue(),
			costCenter: this.byId("costCenter").getValue()
		};

		if (await updateSubsidiary(SubsidiaryRequest)) {
			await this.loadSubsidiaries();
		}

		this.byId("addSubsidiary").close();

		BusyIndicator.hide();
	}
	public async _onDeleteSubsidiary(oEvent): void {

		await closeMsgStrip();
		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");

		if (tableSubsidiaries.getSelectedItem() == null) {
			showMsgStrip("Debes seleccionar una sucursal para borrar los datos.", MessageStripType.INFORMATION);
		} else {

			const item = tableSubsidiaries.getSelectedItem().getCells();

			const subsidiaryId : string = item[0].getValue();
			const subsidiaryName : string = item[1].getValue();

			MessageBox.alert(`¿Está seguro que desea eliminar la sucursal ${subsidiaryName}?`, {
				actions: ["Aceptar", "Cancelar"],
				emphasizedAction: "Aceptar",
				onClose: async (sAction) => {
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

		BusyIndicator.show(0);

		const subsidiaryData: SubsidiaryResponse = await getSubsidiaries();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "subsidiariesModel");

		BusyIndicator.hide();

	}

	public onSave(oEvent): void {
		this.byId("editButton").setVisible(true);
		this.byId("saveButton").setVisible(false);
		this.byId("cancelButton").setVisible(false);
		this.byId("AddSubsidiaryButton").setVisible(true);
		this.byId("DeleteSubsidiary").setVisible(true);
	}
	public onCancel(oEvent): void {
		this.byId("editButton").setVisible(true);
		this.byId("saveButton").setVisible(false);
		this.byId("cancelButton").setVisible(false);
		this.byId("AddSubsidiaryButton").setVisible(true);
		this.byId("DeleteSubsidiary").setVisible(true);
	}


}
