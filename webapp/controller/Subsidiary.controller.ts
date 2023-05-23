import BaseController from "./BaseController";
import Fragment from "sap/ui/core/Fragment";
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Subsidiary extends BaseController {
	public _onAddSubsidiary(oEvent): void {
		const oView = this.getView();
		if (!this.byId("addSubsidiary")) {
			Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addSubsidiary",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				oDialog.open();
				oDialog.addStyleClass("sapUiSizeCompact");
			});
		} else {
			this.byId("addSubsidiary").open();
			this.byId("addSubsidiary").addStyleClass("sapUiSizeCompact");
		}
	}
	public _onCloseSubsidiary(oEvent): void {
		this.byId("addSubsidiary").close();
	}
	public _onSaveSubsidiary(oEvent): void {
		this.byId("addSubsidiary").close();
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
