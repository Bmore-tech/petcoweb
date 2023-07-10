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
import { getDocument } from "../service/Document.service";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Pending extends BaseController {

	private invoiceId: number = 0;
	private subsidiaryList: Array<Apportionment> = [];
	private filesData: Array<File> = [];
	private isDescendingConcepts: boolean = false;
	private isDescendingSubsidiaries: boolean = false;
	private uuid: string = "";
	private uuidExist: boolean = false;

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}
	public async onInit(): Promise<void> {
		this.disableAllInputs();
		await this.loadDetails();

		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		uploadFilesData.getDefaultFileUploader().setTooltip("");
		uploadFilesData.getDefaultFileUploader().setIconOnly(false);
		uploadFilesData.getDefaultFileUploader().setIconFirst(true);
		uploadFilesData.getDefaultFileUploader().setIcon("sap-icon://attachment");
	}

	public async _onSelectSubsidiary(oEvent): Promise<void> {

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
						subsidiaryId: item[0].getValue(),
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
		let subsidiaryListFilter: Array<Apportionment> = [];
		if (this.subsidiaryList.length > 0) {

			subsidiaryListFilter = this.subsidiaryList
				.filter(subsidiary => subsidiary.subsidiaryId != parseInt(item.subsidiaryId));
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
		const subsidiaryListData: Array<Apportionment> = tableSubsidiaries.getItems();

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
				.map(async (subsidiary: Apportionment) => {

					if (Number(subsidiary.subsidiaryId) == Number(valueSubsidiaryIdFind)) {
						subsidiary.amount = valueAmountUpdate;
					}
					return subsidiary;
				});
		}
		this.byId("subsidiarySum").setText(`Subtotal prorrateo $${sum}`);
	}

	public async _onSelectConcept(oEvent): Promise<void> {

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

	public async onLoadConcepts(): Promise<void> {

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

	public async onFilterConcepts(): Promise<void> {

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding: Binding = tableHelpConceps.getBinding("items");

		binding.filter([filter]);
	}

	public async onSortConcepts(): Promise<void> {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = this.byId("searchConcept").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpConceps");
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items");
		let sorters: Array<string> = [];

		sorters.push(new Sorter("concept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}

	public async onFilterSubsidiaries(): Promise<void> {

		const searchConcept: string = this.byId("searchSubsidiary").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding: Binding = tableHelpConceps.getBinding("items");

		binding.filter([filter]);

	}

	public async onSortSubsidiaries(): Promise<void> {

		this.isDescendingSubsidiaries = !this.isDescendingSubsidiaries;

		const searchConcept: string = this.byId("searchSubsidiary").getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items");
		let sorters: Array<string> = [];

		sorters.push(new Sorter("subsidiary", this.isDescendingSubsidiaries));
		binding.filter([filter]).sort(sorters);
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

		const uploadFilesData: UploadSet = this.byId("uploadFilesData");
		uploadFilesData.getItems().forEach(async (item): Promise<void> => {
			if (item.getListItem().getSelected()) {
				try {
					const exportUrl: string = URL.createObjectURL(item.getFileObject());
					const aElement = document.createElement('a');
					aElement.href = exportUrl;
					aElement.setAttribute('download', item.getFileObject().name)
					aElement.setAttribute('target', '_blank');
					aElement.click();
				} catch (e) {

				}

			}
		});
	}

	public async validatedXml(file: File): Promise<void> {
		if (file.type == "text/xml" || file.type == "xml") {
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


		// this.byId("subsidiarySum").setEnabled(false);

		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		// uploadFilesData.removeAllItems();

		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		// tableSubsidiaries.removeAllItems();

	}
	public async fillAllInputs(invoiceDataResponse: InvoiceResponse): Promise<void> {

		// Clear state]
		this.invoiceId = invoiceDataResponse.applicationId;
		this.uuid = "";
		this.subsidiaryList = invoiceDataResponse.apportionments; //invoiceDataResponse.;
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;
		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		uploadFilesData.removeAllItems();

		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		tableSubsidiaries.removeAllItems();

		let comments: string = "";
		invoiceDataResponse.comments.forEach(element => {
			comments += element.comment
		})
		// Clear components view
		this.byId("folio").setValue(invoiceDataResponse.folio);
		this.byId("amount").setValue(invoiceDataResponse.amount);
		this.byId("conceptId").setValue(invoiceDataResponse.conceptId);
		this.byId("concept").setValue(invoiceDataResponse.concept);
		this.byId("generalConcept").setValue(invoiceDataResponse.generalConcept);
		this.byId("comment").setValue(comments);

		let model: JSONModel = new JSONModel();
		model.setData(invoiceDataResponse.apportionments);
		this.setModel(new JSONModel({
			...this.subsidiaryList
		}), "subsidiaryList")
		const oItems: ListItemBase[] = tableSubsidiaries.getItems();
		for (let i: number = 0; i < oItems.length; i++) {

			let oCells = oItems[i].getCells();
			let oHorizontalLayout0 = oCells[0];
			let oInput0 = oHorizontalLayout0.getContent()[1];
			let oHorizontalLayout1 = oCells[1];
			let oInput1 = oHorizontalLayout1.getContent()[0];
			let oHorizontalLayout2 = oCells[2];
			let oInput2 = oHorizontalLayout2.getContent()[0];
			oInput0.setEnabled(false);
			oInput1.setEnabled(false);
			oInput2.setEnabled(false);
			await this.sumAmount();

		}

		invoiceDataResponse.documents.forEach(async (doc): Promise<void> => {
			const documentData: Document = await getDocument(doc);
			const file: File = new File([documentData.file], documentData.fileName, { type: documentData.fileName.split(/[.]+/).pop() });
			let uploadSetItem: UploadSetItem = new UploadSetItem();
			uploadSetItem.setFileName(doc.fileName);
			uploadSetItem.setEnabledEdit(false);
			uploadSetItem.setEnabledRemove(false);
			uploadSetItem._setFileObject(file);
			uploadFilesData.addItem(uploadSetItem);

			this.validatedXml(file);
			this.filesData.push(file);
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
			this.fillAllInputs(response);
		}
		BusyIndicator.hide();
	}

}
