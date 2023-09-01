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
import Sorter from "sap/ui/model/Sorter";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import {
	getInfoProrrateoXlsxService,
	getInfoXmlService,
	getInvoiceByIdService
} from "com/bmore/portalproveedores/service/Reception.service";
import { Invoice } from "com/bmore/portalproveedores/model/resquest/Invoice";
import { Apportionment, Document, InvoiceResponse } from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import { DocumentInfoXML } from "com/bmore/portalproveedores/model/response/DocumentInfoXML";
import { validatedErrorResponse } from "../util/Util";
import UploadSetItem from "sap/m/upload/UploadSetItem";
import UploadSet from "sap/m/upload/UploadSet";
import Table from "sap/m/Table";
import ListItemBase from "sap/m/ListItemBase";
import HashChanger from "sap/ui/core/routing/HashChanger";
import { getDocument } from "../service/Document.service";
import SearchField from "sap/m/SearchField";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import Text from "sap/m/Text";
import Input from "sap/m/Input";
import ListBinding from "sap/ui/model/ListBinding";
import Dialog from "sap/m/Dialog";
import TextArea from "sap/m/TextArea";
import Button from "sap/m/Button";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class HistoryDetails extends BaseController {

	private invoiceId: number = 0;
	private subsidiaryList: Array<Apportionment> = [];
	private filesData: Array<File> = [];
	private isDescendingConcepts: boolean = false;
	private isDescendingSubsidiaries: boolean = false;
	private uuid: string = "";
	private uuidExist: boolean = false;
	private AppController: any;
	public async onAfterRendering(): Promise<void> {
		this.AppController = (sap.ui.getCore().byId('__component0---app') as View).getController();
		await this.AppController.home_navbar();
	}
	public async onInit(): Promise<void> {
		this.disableAllInputs();
		await this.loadDetails();

		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		uploadFilesData.getDefaultFileUploader().setTooltip("");
		uploadFilesData.getDefaultFileUploader().setIconOnly(false);
		uploadFilesData.getDefaultFileUploader().setIconFirst(true);
		uploadFilesData.getDefaultFileUploader().setIcon("sap-icon://attachment");
	}

	public async _onSelectSubsidiary(): Promise<void> {

		const tableHelpSubsidiaries: Table = this.byId("tableHelpSubsidiaries") as Table;

		if (tableHelpSubsidiaries.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar una sucursal para continuar.");
		} else {

			const items = tableHelpSubsidiaries.getSelectedItems();
			this.subsidiaryList = [];

			if (items.length > 0) {

				items.forEach((itemData): void => {
					const item = (itemData as any).getCells();
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

		(this.byId("searchSubsidiary") as SearchField).setValue("");
		this.isDescendingSubsidiaries = false

		BusyIndicator.hide();
	}

	public async _onDeleteRowSubsidiary(oEvent: Event): Promise<void> {

		const item: Apportionment = (oEvent.getSource() as Control).getBindingContext("subsidiaryList").getObject() as Apportionment;
		let subsidiaryListFilter: Array<Apportionment> = [];
		if (this.subsidiaryList.length > 0) {

			subsidiaryListFilter = this.subsidiaryList
				.filter(subsidiary => subsidiary.subsidiaryId != item.subsidiaryId);
		}

		this.subsidiaryList = subsidiaryListFilter;
		await this.setModel(new JSONModel({
			...this.subsidiaryList
		}), "subsidiaryList");

		await this.sumAmount();
	}

	public async sumAmount(oEvent?: Event): Promise<void> {

		//  Obtner state para montos
		let item = null;
		let valueSubsidiaryIdFind = 0;

		if (oEvent != null) {
			item = (oEvent.getSource() as Control).getBindingContext("subsidiaryList").getObject() as SubsidiaryDto;
			valueSubsidiaryIdFind = item.subsidiaryId;
		}

		let valueAmountUpdate: number = 0;

		//  Obtener state para sumar cantidades por tienda
		const tableSubsidiaries: Table = this.byId("tableSubsidiaries") as Table;
		const subsidiaryListData: ListItemBase[] = tableSubsidiaries.getItems();

		let sum: number = 0;
		if (subsidiaryListData.length > 0) {

			subsidiaryListData.forEach((subsidiary: ListItemBase): void => {

				const cellSubsidiaryId = (subsidiary as any).getCells()[0];
				const valueSubsidiaryId = cellSubsidiaryId.mAggregations.content[0].mProperties.value;
				const cellAmount = (subsidiary as any).getCells()[1];
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
		(this.byId("subsidiarySum") as Text).setText(`Subtotal prorrateo $${sum}`);
	}

	public async _onSelectConcept(oEvent: Event): Promise<void> {

		const tableHelpConceps: Table = this.byId("tableHelpConceps") as Table;

		if (tableHelpConceps.getSelectedItem() == null) {
			MessageBox.information("Debes seleccionar un concepto para continuar.");
		} else {

			const item = (tableHelpConceps.getSelectedItem() as any).getCells();

			(this.byId("conceptId") as Input).setValue(item[0].getText());
			(this.byId("concept") as Input).setValue(item[1].getText());

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

		(this.byId("searchConcept") as SearchField).setValue("");
		this.isDescendingConcepts = false

		BusyIndicator.hide();
	}

	public async onFilterConcepts(): Promise<void> {

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: Table = this.byId("tableHelpConceps") as Table;
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding: ListBinding = tableHelpConceps.getBinding("items") as ListBinding;

		binding.filter([filter]);
	}

	public async onSortConcepts(): Promise<void> {

		this.isDescendingConcepts = !this.isDescendingConcepts;

		const searchConcept: string = (this.byId("searchConcept") as SearchField).getValue();
		const tableHelpConceps: Table = this.byId("tableHelpConceps") as Table;
		const filter: Filter = new Filter("concept", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items") as ListBinding;
		let sorters: Sorter[] = [];

		sorters.push(new Sorter("concept", this.isDescendingConcepts));
		binding.filter([filter]).sort(sorters);
	}

	public async onFilterSubsidiaries(): Promise<void> {

		const searchConcept: string = (this.byId("searchSubsidiary") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding: ListBinding = tableHelpConceps.getBinding("items") as ListBinding;

		binding.filter([filter]);

	}

	public async onSortSubsidiaries(): Promise<void> {

		this.isDescendingSubsidiaries = !this.isDescendingSubsidiaries;

		const searchConcept: string = (this.byId("searchSubsidiary") as SearchField).getValue();
		const tableHelpConceps: UI5Element = this.byId("tableHelpSubsidiaries");
		const filter: Filter = new Filter("subsidiary", FilterOperator.Contains, searchConcept);
		const binding = tableHelpConceps.getBinding("items") as ListBinding;
		let sorters: Sorter[] = [];

		sorters.push(new Sorter("subsidiary", this.isDescendingSubsidiaries));
		binding.filter([filter]).sort(sorters);
	}

	public async uploadFiles(): Promise<void> {

		this.filesData = [];
		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		const filesItems: any[] = uploadFilesData.getItems();
		if (filesItems.length > 0) {
			let error: boolean = false;
			filesItems.forEach(async (item): Promise<void> => {
				if (!error) {

					const file: File = item.getFileObject();

					//Check if file already exists on the list
					const exitstTwoTimes: Array<File> = filesItems.filter(item2 => (item2.getFileObject() as File).name == file.name)
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

		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		uploadFilesData.getItems().forEach(async (item): Promise<void> => {
			if (item.getListItem().getSelected()) {
				try {
					const exportUrl: string = URL.createObjectURL(item.getFileObject());
					const aElement = document.createElement('a');
					aElement.href = exportUrl;
					aElement.setAttribute('download', (item.getFileObject() as File).name)
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
			(this.byId("folio") as Input).setValue(documentInfoXML.folio);
			(this.byId("amount") as Input).setValue(documentInfoXML.amount.toString());
			this.uuidExist = documentInfoXML.existeUuid;

		}
	}

	public async validatedXlsx(file: File): Promise<void> {

		const typeXlsx: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		if (file.type == typeXlsx) {
			let documentInfoXlsx: Apportionment[] = await getInfoProrrateoXlsxService(file) as Apportionment[];

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

			const oDialog: Dialog = await Fragment.load({
				id: oView.getId(),
				name: `com.bmore.portalproveedores.view.fragments.${idViewHelp}`,
				controller: this
			}) as Dialog;

			await oView.addDependent(oDialog);
			oDialog.open();
			oDialog.addStyleClass("sapUiSizeCompact");

		} else {
			(this.byId(idViewHelp) as Dialog).open();
			(this.byId(idViewHelp) as Dialog).addStyleClass("sapUiSizeCompact");
		}
	}
	public _onClose(idViewHelp: string): void {
		(this.byId(idViewHelp) as Dialog).close();
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
		(this.byId("folio") as Input).setEnabled(false);
		(this.byId("amount") as Input).setEnabled(false);
		(this.byId("conceptId") as Input).setEnabled(false);
		(this.byId("concept") as Input).setEnabled(false);
		(this.byId("generalConcept") as Input).setEnabled(false);
		(this.byId("comment") as TextArea).setEnabled(false);
		(this.byId("loadSubsidiariesBtn") as Button).setEnabled(false);


	}
	public async fillAllInputs(invoiceDataResponse: InvoiceResponse): Promise<void> {

		// Clear state]
		this.invoiceId = invoiceDataResponse.applicationId;
		this.uuid = "";
		this.subsidiaryList = invoiceDataResponse.apportionments; //invoiceDataResponse.;
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;
		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		uploadFilesData.removeAllItems();

		const tableSubsidiaries: Table = this.byId("tableSubsidiaries") as Table;
		tableSubsidiaries.removeAllItems();

		let comments: string = "";
		invoiceDataResponse.comments.forEach((element): void => {
			element.comment != "" ? comments += element.comment + '\n' : ""
		});
		// Clear components view
		(this.byId("folio") as Input).setValue(invoiceDataResponse.folio);
		(this.byId("amount") as Input).setValue(invoiceDataResponse.amount.toString());
		(this.byId("conceptId") as Input).setValue(invoiceDataResponse.conceptId.toString());
		(this.byId("concept") as Input).setValue(invoiceDataResponse.concept);
		(this.byId("generalConcept") as Input).setValue(invoiceDataResponse.generalConcept);
		(this.byId("comment") as TextArea).setValue(comments);

		let model: JSONModel = new JSONModel();
		model.setData(invoiceDataResponse.apportionments);
		this.setModel(new JSONModel({
			...this.subsidiaryList
		}), "subsidiaryList")
		const oItems: ListItemBase[] = tableSubsidiaries.getItems();
		for (let i: number = 0; i < oItems.length; i++) {

			let oCells = (oItems[i] as any).getCells();
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
			(uploadSetItem as any)._setFileObject(file);
			uploadFilesData.addItem(uploadSetItem);

			this.validatedXml(file);
			this.filesData.push(file);
		})
		uploadFilesData.setUploadEnabled(false);
	}
	public async loadDetails(): Promise<void> {
		BusyIndicator.show(0);
		const oHashChanger: HashChanger = HashChanger.getInstance();
		const sId: string = oHashChanger.getHash().split("/")[1];
		let invoice: Invoice = {
			applicationId: sId,
			amount: 0,
			apportionments: [],
			comment: null,
			conceptId: 0,
			folio: "",
			generalConcept: "",
			uuid: ""
		};
		const response: InvoiceResponse = await getInvoiceByIdService(invoice);
		if (response !== null) {
			this.fillAllInputs(response);
		}
		BusyIndicator.hide();
	}

}
