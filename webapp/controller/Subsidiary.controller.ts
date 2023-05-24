import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import MessageBox from "sap/m/MessageBox";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import JSONModel from "sap/ui/model/json/JSONModel";
import {getSubsidiaries, saveSubsidiary} from "com/bmore/portalproveedores/service/Subsidiary.service";
import {SubsidiaryResponse} from "com/bmore/portalproveedores/model/response/SubsidiaryResponse";

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

		const subsidiaryData: SubsidiaryResponse = await getSubsidiaries();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "subsidiariesModel");

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
			const subsidiaryData: SubsidiaryResponse = await getSubsidiaries();

			await this.setModel(new JSONModel({
				...subsidiaryData
			}), "subsidiariesModel");
		}

		this.byId("addSubsidiary").close();

		BusyIndicator.hide();
	}
	public _onDeleteSubsidiary(oEvent): void {
		MessageBox.alert("¿Está seguro que desea eliminar la sucursal?", {
			actions: ["Aceptar", "Cancelar"],
			emphasizedAction: "Aceptar",
			onClose: function (sAction) {
				if (sAction === "Aceptar") {
					MessageBox.success("Sucursal eliminada con éxito");
				}
			}.bind(this)
		});
	}
	public _onEditSubsidiary(oEvent): void {
		this.byId("editButton").setVisible(false);
		this.byId("saveButton").setVisible(true);
		this.byId("cancelButton").setVisible(true);
		this.byId("AddSubsidiaryButton").setVisible(false);
		this.byId("DeleteSubsidiary").setVisible(false);
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
