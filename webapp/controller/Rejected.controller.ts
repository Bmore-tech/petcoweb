import BaseController from "./BaseController";
import View from "sap/ui/core/mvc/View";
import Fragment from "sap/ui/core/Fragment";
import { Concept } from "com/bmore/portalproveedores/model/Concept";
import { getConceps } from "com/bmore/portalproveedores/service/Conceps.service";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Subsidiary as SubsidiaryDto } from "com/bmore/portalproveedores/model/Subsidiary";
import { getSubsidiaries } from "com/bmore/portalproveedores/service/Subsidiary.service";
import UI5Element from "sap/ui/core/Element";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Binding from "sap/ui/model/Binding";
import Sorter from "sap/ui/model/Sorter";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import {
	getInfoProrrateoXlsxService,
	getInfoXmlService,
	getInvoiceByIdService,
	saveDrafInvoiceService,
	sendInvoiceService
} from "com/bmore/portalproveedores/service/Reception.service";
import { Invoice } from "com/bmore/portalproveedores/model/resquest/Invoice";
import { Apportionment } from "com/bmore/portalproveedores/model/resquest/Apportionment";
import { Comment } from "com/bmore/portalproveedores/model/resquest/Comment";
import { InvoiceResponse } from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import { DocumentInfoXML } from "com/bmore/portalproveedores/model/response/DocumentInfoXML";
import { validatedErrorResponse } from "../util/Util";
import UploadSetItem from "sap/m/upload/UploadSetItem";
import UploadSet from "sap/m/upload/UploadSet";
import Table from "sap/m/Table";
import ListItemBase from "sap/m/ListItemBase";
import FileUploader from "sap/ui/unified/FileUploader";
import HashChanger from "sap/ui/core/routing/HashChanger";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Rejected extends BaseController {

	private invoiceId: number = 0;
	private subsidiaryList: Array<object> = [];
	private filesData: Array<File> = [];
	private isDescendingConcepts: boolean = false;
	private isDescendingSubsidiaries: boolean = false;
	private uuid: string = "";
	private uuidExist: boolean = false;
	private canEdit: boolean = false;

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
		this.disableAllInputs();
	}
	public async onInit(): Promise<void> {

		await this.loadDetails();

		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		uploadFilesData.getDefaultFileUploader().setTooltip("");
		uploadFilesData.getDefaultFileUploader().setIconOnly(false);
		uploadFilesData.getDefaultFileUploader().setIconFirst(true);
		uploadFilesData.getDefaultFileUploader().setIcon("sap-icon://attachment");
	}

	public async _onSelectSubsidiary(oEvent): void {

		const tableHelpSubsidiaries: UI5Element = this.byId("tableHelpSubsidiaries");

		if (tableHelpSubsidiaries.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar una sucursal para continuar.");
		} else {

			const items = tableHelpSubsidiaries.getSelectedItems();
			this.subsidiaryList = [];

			if (items.length > 0) {

				items.forEach((itemData): void => {
					const item = itemData.getCells();
					this.subsidiaryList.push({
						idSubsidiary: item[0].getValue(),
						subsidiary: item[1].getValue(),
						amount: 0
					})
				})
			}

			await this.setModel(new JSONModel({
				...this.subsidiaryList
			}), "subsidiaryList");

			await this.sumAmount();

			await this._onClose("subsidiaryHelp");
		}

	}

	public async loadSubsidiaries(): Promise<void> {

		BusyIndicator.show(0);

		const subsidiaryData: SubsidiaryDto = await getSubsidiaries();

		await this.setModel(new JSONModel({
			...subsidiaryData
		}), "subsidiariesModel");

		await this.displayHelp("subsidiaryHelp");

		this.byId("searchSubsidiary").setValue("");
		this.isDescendingSubsidiaries = false

		BusyIndicator.hide();
	}

	public async _onDeleteRowSubsidiary(oEvent): Promise<void> {

		const item = oEvent.getSource().getBindingContext("subsidiaryList").getObject();
		let subsidiaryListFilter: Array<object> = [];
		if (this.subsidiaryList.length > 0) {

			subsidiaryListFilter = this.subsidiaryList
				.filter(subsidiary => parseInt(subsidiary.idSubsidiary) != parseInt(item.idSubsidiary));
		}

		this.subsidiaryList = subsidiaryListFilter;
		await this.setModel(new JSONModel({
			...this.subsidiaryList
		}), "subsidiaryList");

		await this.sumAmount();
	}

	public async sumAmount(oEvent): Promise<void> {

		//  Obtner state para montos
		let item = null;
		let valueSubsidiaryIdFind = 0;

		if (oEvent != null) {
			item = oEvent.getSource().getBindingContext("subsidiaryList").getObject();
			valueSubsidiaryIdFind = item.idSubsidiary;
		}

		let valueAmountUpdate: number = 0;

		//  Obtener state para sumar cantidades por tienda
		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const subsidiaryListData: Array<object> = tableSubsidiaries.getItems();

		let sum: number = 0;
		if (subsidiaryListData.length > 0) {

			subsidiaryListData.forEach((subsidiary: object): void => {

				const cellSubsidiaryId = subsidiary.getCells()[0];
				const valueSubsidiaryId = cellSubsidiaryId.mAggregations.content[0].mProperties.value;
				const cellAmount = subsidiary.getCells()[1];
				const valueAmount = cellAmount.mAggregations.content[0].mProperties.value;

				if (Number(valueSubsidiaryId) == Number(valueSubsidiaryIdFind)) {
					valueAmountUpdate = Number(valueAmount);
				}

				sum += Number(valueAmount);
			});

			// Actualizar state subsidiaryList
			this.subsidiaryList
				.map(async (subsidiary: object) => {

					if (Number(subsidiary.idSubsidiary) == Number(valueSubsidiaryIdFind)) {
						subsidiary.amount = valueAmountUpdate;
					}
					return subsidiary;
				});
		}
		this.byId("subsidiarySum").setText(`Subtotal prorrateo $${sum}`);
	}

	public async _onSelectConcept(oEvent): void {

		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");

		if (tableHelpConceps.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar un concepto para continuar.");
		} else {

			const item = tableHelpConceps.getSelectedItem().getCells();

			this.byId("conceptId").setValue(item[0].getText());
			this.byId("concept").setValue(item[1].getText());

			await this._onClose("conceptHelp");
		}
	}

	public async onLoadConcepts(): void {

		BusyIndicator.show(0);

		const conceptData: Concept = await getConceps();

		await this.setModel(new JSONModel({
			...conceptData
		}), "concepsModel");

		await this.displayHelp("conceptHelp");

		this.byId("searchConcept").setValue("");
		this.isDescendingConcepts = false

		BusyIndicator.hide();
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

	public async sendInvoice(): void {

		BusyIndicator.show(0);

		// Check if there's a folio

		if (this.byId("folio").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Folio Factura".');
			BusyIndicator.hide();
			return;
		}
		// check if subsidiarySum is equals to amount
		let sum: number = 0;
		const ammt: Number = this.byId("amount").getValue();
		let apportionments: Apportionment = [];
		if (this.subsidiaryList.length > 0) {

			this.subsidiaryList
				.forEach((subsidiary) => {
					apportionments.push({
						subsidiaryId: subsidiary.idSubsidiary,
						amount: subsidiary.amount
					});
					sum += Number(subsidiary.amount);
				})
		} else {
			await validatedErrorResponse(1000, null,
				'Es necesario definir al menos una sucursal en "Prorrateo".');
			BusyIndicator.hide();
			return;
		}

		if (sum != ammt) {
			await validatedErrorResponse(1000, null,
				"El subtotal de factura y la suma del prorrateo no coinciden");
			BusyIndicator.hide();
			return;
		}
		// Check if there's a selected job type

		if (this.byId("conceptId").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar los campos "Id / Tipo de Trabajo".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's a general concept

		if (this.byId("generalConcept").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Concepto en Especifico".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's at least 2 files
		if (this.filesData.length < 2) {
			await validatedErrorResponse(1000, null,
				'Deben existir al menos 2 archivos: "Factura.xml", "Factura(.pdf, .jpeg, .jpg)".');
			BusyIndicator.hide();
			return;
		}
		// Check if there's at least one xml files
		let countXML: boolean = false;
		let ext: String;
		this.filesData.forEach(element => {
			ext = element.name.split('.').pop().toLowerCase();
			if (ext == 'xml') {
				countXML = true;
			}
		});
		if (!countXML) {
			await validatedErrorResponse(1000, null,
				'Debe cargar la factura en formato XML.');
			BusyIndicator.hide();
			return;
		}
		// Check if there's at least one pdf files
		let countpdf: boolean = false;
		let extpdf: String;
		this.filesData.forEach(element => {
			extpdf = element.name.split('.').pop().toLowerCase();
			if (extpdf == 'pdf') {
				countpdf = true;
			}
		});
		if (!countpdf) {
			await validatedErrorResponse(1000, null,
				'Debe cargar la factura en formato PDF.');
			BusyIndicator.hide();
			return;
		}


		const comment: Comment = {
			commentId: null,
			comment: this.byId("comment").getValue()
		};

		const invoice: Invoice = {
			amount: Number(this.byId("amount").getValue()),
			applicationId: this.invoiceId,
			apportionments,
			comment,
			conceptId: this.byId("conceptId").getValue(),
			folio: this.byId("folio").getValue(),
			generalConcept: this.byId("generalConcept").getValue(),
			uuid: this.uuid
		}
		if (!this.uuidExist) {
			const invoiceResponse: InvoiceResponse = await sendInvoiceService(invoice, this.filesData);

			if (invoiceResponse != null) {
				await this.AppController.navTo_home();
			}
		}
		else {
			await validatedErrorResponse(1000, null,
				'La factura ya ha sido registrada en otro proceso.');
			BusyIndicator.hide();
			return;
		}

		BusyIndicator.hide();
	}
	public async saveInvoice(): void {

		BusyIndicator.show(0);

		// Check if there's a folio

		if (this.byId("folio").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Folio Factura".');
			BusyIndicator.hide();
			return;
		}
		// check if subsidiarySum is equals to amount
		let sum: number = 0;
		const ammt: Number = this.byId("amount").getValue();
		let apportionments: Apportionment = [];
		if (this.subsidiaryList.length > 0) {

			this.subsidiaryList
				.forEach((subsidiary) => {
					apportionments.push({
						subsidiaryId: subsidiary.idSubsidiary,
						amount: subsidiary.amount
					});
					sum += Number(subsidiary.amount);
				})

		} else {
			await validatedErrorResponse(1000, null,
				'Es necesario definir al menos una sucursal en "Prorrateo".');
			BusyIndicator.hide();
			return;
		}

		if (sum != ammt) {
			await validatedErrorResponse(1000, null,
				"El subtotal de factura y la suma del prorrateo no coinciden");
			BusyIndicator.hide();
			return;
		}
		// Check if there's a selected job type

		if (this.byId("conceptId").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar los campos "Id / Tipo de Trabajo".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's a general concept

		if (this.byId("generalConcept").getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Concepto en Especifico".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's at least 2 files
		if (this.filesData.length < 2) {
			await validatedErrorResponse(1000, null,
				'Deben existir al menos 2 archivos: "Factura.xml", "Factura(.pdf, .jpeg, .jpg)".');
			BusyIndicator.hide();
			return;
		}
		// Check if there's at least one xml files
		let countXML: boolean = false;
		let ext: String;
		this.filesData.forEach(element => {
			ext = element.name.split('.').pop().toLowerCase();
			if (ext == 'xml') {
				countXML = true;
			}
		});
		if (!countXML) {
			await validatedErrorResponse(1000, null,
				'Debe cargar la factura en formato XML.');
			BusyIndicator.hide();
			return;
		}
		// Check if there's at least one pdf files
		let countpdf: boolean = false;
		let extpdf: String;
		this.filesData.forEach(element => {
			extpdf = element.name.split('.').pop().toLowerCase();
			if (extpdf == 'pdf') {
				countpdf = true;
			}
		});
		if (!countpdf) {
			await validatedErrorResponse(1000, null,
				'Debe cargar la factura en formato PDF.');
			BusyIndicator.hide();
			return;
		}


		const comment: Comment = {
			commentId: null,
			comment: this.byId("comment").getValue()
		};

		const invoice: Invoice = {
			amount: Number(this.byId("amount").getValue()),
			applicationId: this.invoiceId,
			apportionments,
			comment,
			conceptId: this.byId("conceptId").getValue(),
			folio: this.byId("folio").getValue(),
			generalConcept: this.byId("generalConcept").getValue(),
			uuid: this.uuid
		}

		if (!this.uuidExist) {
			const invoiceResponse: InvoiceResponse = await saveDrafInvoiceService(invoice, this.filesData);

			if (invoiceResponse != null) {
				await this.AppController.navTo_home();
			}
		}
		else {
			await validatedErrorResponse(1000, null,
				'La factura ya ha sido registrada en otro proceso.');
			BusyIndicator.hide();
			return;
		}

		BusyIndicator.hide();
	}

	public async uploadFiles(): Promise<void> {

		this.filesData = [];
		const uploadFilesData: UploadSet = this.byId("uploadFilesData");
		const filesItems: UploadSetItem[] = uploadFilesData.getItems();
		if (filesItems.length > 0) {
			let error: boolean = false;
			filesItems.forEach(async (item): void => {
				if (!error) {

					const file: File = item.getFileObject();

					//Check if file already exists on the list
					const exitstTwoTimes: Array<File> = filesItems.filter(item2 => item2.getFileObject().name == file.name)
					if (exitstTwoTimes.length > 1) {
						error = true;
						filesItems[0].destroy();
						await validatedErrorResponse(1000, null,
							'Archivo ya registrado.');
						BusyIndicator.hide();
						return;
					}

					//Check if is xml to allow only one

					const exitstOneXML: Array<File> = filesItems.filter(item2 => item2.getFileObject().type.toLowerCase() == "text/xml")
					if (exitstOneXML.length > 1) {
						error = true;
						filesItems[0].destroy();
						await validatedErrorResponse(1000, null,
							'Solo se permite un archivo xml por carga de archivos.');
						BusyIndicator.hide();
						return;
					}



					await this.validatedXml(file);
					await this.validatedXlsx(file);

					if (file.type == "text/xml") {
						if (this.uuidExist) {
							filesItems[0].destroy();
							await validatedErrorResponse(1000, null,
								'La factura ya ha sido registrada en otro proceso.');
							BusyIndicator.hide();
							return;
						}
					}
					this.filesData.push(file);
				}
			});

		}
	}

	public async downloadFiles(): Promise<void> {

		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		uploadFilesData.getItems().forEach(async (item): void => {
			if (item.getListItem().getSelected()) {
				const exportUrl: string = URL.createObjectURL(item.getFileObject());
				const aElement = document.createElement('a');
				aElement.href = exportUrl;
				aElement.setAttribute('download', item.getFileObject().name)
				aElement.setAttribute('target', '_blank');
				aElement.click();
				URL.revokeObjectURL(href);
			}
		});
	}

	public async validatedXml(file: File): Promise<void> {

		if (file.type == "text/xml") {
			let documentInfoXML: DocumentInfoXML = await getInfoXmlService(file);

			this.uuid = documentInfoXML.uuid;
			this.byId("folio").setValue(documentInfoXML.folio);
			this.byId("amount").setValue(documentInfoXML.amount);
			this.uuidExist = documentInfoXML.existeUuid;
		}
	}

	public async validatedXlsx(file: File): Promise<void> {

		const typeXlsx: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		if (file.type == typeXlsx) {
			let documentInfoXlsx: DocumentInfoXLSX = await getInfoProrrateoXlsxService(file);

			this.subsidiaryList = [...documentInfoXlsx];

			await this.setModel(new JSONModel({
				...this.subsidiaryList
			}), "subsidiaryList");

			await this.sumAmount();
		}
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

	public clear(): void {

		// Clear state
		this.invoiceId = 0;
		this.uuid = "";
		this.subsidiaryList = [];
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;

		// Clear components view
		this.byId("folio").setValue("");
		this.byId("amount").setValue("");
		this.byId("conceptId").setValue("");
		this.byId("concept").setValue("");
		this.byId("generalConcept").setValue("");
		this.byId("comment").setValue("");
		this.byId("subsidiarySum").setText('Subtotal prorrateo $0');

		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		uploadFilesData.removeAllItems();

		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		tableSubsidiaries.removeAllItems();
	}
	public disableAllInputs(): void {

		// Clear state
		this.invoiceId = 0;
		this.uuid = "";
		this.subsidiaryList = [];
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;

		// Clear components view
		this.byId("folio").setEnabled(false);
		this.byId("amount").setEnabled(false);
		this.byId("conceptId").setEnabled(false);
		this.byId("concept").setEnabled(false);
		this.byId("generalConcept").setEnabled(false);
		this.byId("comment").setEnabled(false);
		this.byId("loadSubsidiariesBtn").setEnabled(false);
		this.byId("DownloadBtn").setEnabled(false);

	}
	public fillAllInputs(invoiceDataResponse: InvoiceResponse): void {

		// Clear state
		this.invoiceId = invoiceDataResponse.invoiceId;
		this.uuid = "";
		this.subsidiaryList = invoiceDataResponse.apportionments; //invoiceDataResponse.;
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;

		let comments: string = "";
		invoiceDataResponse.comments.forEach(element => {
			comments += element.comment + "\n"
		})
		// Clear components view
		this.byId("folio").setValue(invoiceDataResponse.folio);
		this.byId("amount").setValue(invoiceDataResponse.amount);
		this.byId("conceptId").setValue(invoiceDataResponse.conceptId);
		this.byId("concept").setValue(invoiceDataResponse.concept);
		this.byId("generalConcept").setValue(invoiceDataResponse.generalConcept);
		this.byId("comment").setValue(comments);

		const tableSubsidiaries: Table = this.byId("tableSubsidiaries");
		let model: JSONModel = new JSONModel();
		model.setData(invoiceDataResponse.apportionments);
		tableSubsidiaries.setModel(model, "subsidiaryList");

		let sum: number = 0;
		const oItems: ListItemBase[] = tableSubsidiaries.getItems();
		for (let i: number = 0; i < oItems.length; i++) {

			let oCells = oItems[i].getCells();
			let oHorizontalLayout = oCells[1];
			let oInput = oHorizontalLayout.getContent()[0];
			sum = +oInput.getValue();
			let oHorizontalLayout2 = oCells[2];
			let oInput2 = oHorizontalLayout2.getContent()[0];
			oInput.setEnabled(false);
			oInput2.setEnabled(false);
		}

		this.byId("subsidiarySum").setText(`Subtotal prorrateo $${sum}`);

		const uploadFilesData: UploadSet = this.byId("uploadFilesData");


		invoiceDataResponse.documents.forEach(doc => {
			let uploadSetItem: UploadSetItem = new UploadSetItem();
			uploadSetItem.setFileName(doc.fileName);
			uploadSetItem.setEnabledEdit(false);
			uploadSetItem.setEnabledRemove(false);
			console.log(uploadSetItem);
			uploadFilesData.addItem(uploadSetItem);
			// oUploadSet.upload();
		})
		uploadFilesData.setUploadEnabled(false);


	}
	public async loadDetails(): Promise<void> {
		BusyIndicator.show(0);
		const oHashChanger: HashChanger = sap.ui.core.routing.HashChanger.getInstance();
		const sId: string = oHashChanger.getHash().split("/")[1];
		let invoice: Invoice = {
			applicationId: sId
		};
		const response: InvoiceResponse = await getInvoiceByIdService(invoice);
		if (response !== null) {
			console.log(response);
			this.fillAllInputs(response);
		}
		BusyIndicator.hide();
	}

	public async activateEdit(): Promise<void> {
		this.canEdit = !this.canEdit;
		this.byId("folio").setEnabled(this.canEdit);
		this.byId("amount").setEnabled(this.canEdit);
		this.byId("conceptId").setEnabled(this.canEdit);
		this.byId("concept").setEnabled(this.canEdit);
		this.byId("generalConcept").setEnabled(this.canEdit);
		this.byId("comment").setEnabled(this.canEdit);
		this.byId("loadSubsidiariesBtn").setEnabled(this.canEdit);
		this.byId("DownloadBtn").setEnabled(this.canEdit);
	}
}