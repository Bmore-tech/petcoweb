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
import BusyIndicator from "sap/ui/core/BusyIndicator";
import {
	getInfoProrrateoXlsxService,
	getInfoXmlService,
	saveDocumentInvoice,
	sendInvoiceService
} from "com/bmore/portalproveedores/service/Reception.service";
import {Invoice} from "com/bmore/portalproveedores/model/resquest/Invoice";
import {Apportionment} from "com/bmore/portalproveedores/model/resquest/Apportionment";
import {Comment} from "com/bmore/portalproveedores/model/resquest/Comment";
import {InvoiceResponse} from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import {DocumentInfoXML} from "com/bmore/portalproveedores/model/response/DocumentInfoXML";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Reception extends BaseController {

	private invoiceId: number = 0;
	private subsidiaryList: Array<object> = [];
	private filesData : Array<File> = [];
	private isDescendingConcepts: boolean = false;
	private isDescendingSubsidiaries: boolean = false;

	private uuid: string = "";

	public async onAfterRendering(): Promise<void> {
		this.AppController = sap.ui.getCore().byId('__component0---app').getController();
		await this.AppController.home_navbar();
	}

	public async onInit(): Promise<void> {

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
		this.sumAmount();
	}

	public async sumAmount(oEvent): Promise<void> {

		//  Obtner state para montos
		const item = oEvent.getSource().getBindingContext("subsidiaryList").getObject();
		const valueSubsidiaryIdFind = item.idSubsidiary;
		let valueAmountUpdate: number = 0;

		//  Obtener state para sumar cantidades por tienda
		const tableSubsidiaries: UI5Element = this.byId("tableSubsidiaries");
		const subsidiaryListData: Array<object>  = tableSubsidiaries.getItems();

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

		let apportionments : Apportionment = [];
		this.subsidiaryList
			.forEach((subsidiary) =>{
				apportionments.push({
					subsidiaryId: subsidiary.idSubsidiary,
					amount: subsidiary.amount
				});
			})

		const comment : Array<Comment> = [
			{
				commentId: null,
				comment: this.byId("comment").getValue()
			}
		];

		const invoice : Invoice = {
			amount: Number(this.byId("amount").getValue()),
			applicationId: this.invoiceId,
			apportionments,
			comment,
			conceptId: this.byId("conceptId").getValue(),
			folio: this.byId("folio").getValue(),
			generalConcept: this.byId("generalConcept").getValue(),
		}

		console.log("******** Factura: ", invoice);

		const invoiceResponse: InvoiceResponse = await sendInvoiceService(invoice);
/*
		const invoiceResponse: InvoiceResponse = {
			invoiceId: 179536
		};*/
		console.log("******** Invoice Response id: ", invoiceResponse.invoiceId)

		await saveDocumentInvoice(invoiceResponse, this.filesData);

		BusyIndicator.hide();
	}

	public async uploadFiles(): Promise<void> {

		this.filesData = [];
		const uploadFilesData: UI5Element = this.byId("uploadFilesData");
		const filesItems = uploadFilesData.getItems();

		if (filesItems.length > 0) {

			filesItems.forEach(async (item): void => {

				const file: File = item.getFileObject();
				this.filesData.push(file);

				await this.validatedXml(file);
				await this.validatedXlsx(file);

				console.log(window.URL.createObjectURL(file));
			});

			console.log("Files: ", this.filesData);
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
			console.log("DocumentInfoXML : ", documentInfoXML);

			this.uuid = documentInfoXML.uuid;
			this.byId("folio").setValue(documentInfoXML.folio);
		}
	}

	public async validatedXlsx(file: File): Promise<void> {

		const typeXlsx: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		if (file.type == typeXlsx) {
			let documentInfoXlsx: DocumentInfoXLSX = await getInfoProrrateoXlsxService(file);
			console.log("DocumentInfoXlsx : ", documentInfoXlsx);

			this.subsidiaryList = [...documentInfoXlsx];

			await this.setModel(new JSONModel({
				...this.subsidiaryList
			}), "subsidiaryList");

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

}
