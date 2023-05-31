import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import formatter from "../model/formatter";
import Fragment from "sap/ui/core/Fragment";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Conceps extends BaseController {
    private formatter = formatter;

    public _onAddConcept(oEvent): void {
		const oView = this.getView();
		if (!this.byId("addConcept")) {
			Fragment.load({
				id: oView.getId(),
				name: "com.bmore.portalproveedores.view.fragments.addConceps",
				controller: this
			}).then(function (oDialog) {
				oView.addDependent(oDialog);
				oDialog.open();
				oDialog.addStyleClass("sapUiSizeCompact");
			});
		} else {
			this.byId("addConcept").open();
			this.byId("addConcept").addStyleClass("sapUiSizeCompact");
		}
	}
	public _onCloseConcept(oEvent): void {
		this.byId("addConcept").close();
	}
	public _onSaveConcept(oEvent): void {
		this.byId("addConcept").close();
	}
	public _onDeleteConcept(oEvent): void {
		MessageBox.alert("¿Está seguro que desea eliminar el concepto?", {
			actions: ["Aceptar", "Cancelar"],
			emphasizedAction: "Aceptar",
			onClose: function (sAction) {
				if (sAction === "Aceptar") {
					MessageBox.success("Sucursal eliminada con éxito");
				}
			}.bind(this)
		});
	}
	public _onEditConcept(oEvent): void {
		this.byId("editButtonConcept").setVisible(false);
		this.byId("saveButtonConcept").setVisible(true);
		this.byId("cancelButtonConcept").setVisible(true);
		this.byId("AddConceptButton").setVisible(false);
		this.byId("DeleteConcept").setVisible(false);
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


}

