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
	saveDrafInvoiceService,
	sendInvoiceService
} from "com/bmore/portalproveedores/service/Reception.service";
import { Invoice } from "com/bmore/portalproveedores/model/resquest/Invoice";
import { Comment } from "com/bmore/portalproveedores/model/resquest/Comment";
import { Apportionment, InvoiceResponse } from "com/bmore/portalproveedores/model/response/InvoiceResponse";
import { DocumentInfoXML } from "com/bmore/portalproveedores/model/response/DocumentInfoXML";
import { validatedErrorResponse } from "../util/Util";
import UploadSetItem from "sap/m/upload/UploadSetItem";
import UploadSet from "sap/m/upload/UploadSet";
import { showMsgStrip } from "../component/MessageStrip.component";
import { MessageStripType } from "../model/MessageStripType";
import Control from "sap/ui/core/Control";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import ListItemBase from "sap/m/ListItemBase";
import Text from "sap/m/Text";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import TextArea from "sap/m/TextArea";
import SearchField from "sap/m/SearchField";
import ListBinding from "sap/ui/model/ListBinding";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Reception extends BaseController {

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

	public async sendInvoice(): Promise<void> {

		BusyIndicator.show(0);

		// Check if there's a folio

		if ((this.byId("folio") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Folio Factura".');
			BusyIndicator.hide();
			return;
		}
		// check if subsidiarySum is equals to amount
		let sum: number = 0;
		const ammt: Number = Number.parseFloat((this.byId("amount") as Input).getValue());
		let apportionments: Apportionment[] = [];
		if (this.subsidiaryList.length > 0) {

			this.subsidiaryList
				.forEach((subsidiary) => {
					apportionments.push({
						subsidiaryId: subsidiary.subsidiaryId,
						amount: subsidiary.amount,
						subsidiary: ""
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

		if ((this.byId("conceptId") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar los campos "Id / Tipo de Trabajo".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's a general concept

		if ((this.byId("generalConcept") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Concepto en Especifico".');
			BusyIndicator.hide();
			return;
		}

		this.filesData = [];
		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		const filesItems: UploadSetItem[] = uploadFilesData.getItems();

		filesItems.forEach(async (item): Promise<void> => {
			const file: File = item.getFileObject() as File;
			this.filesData.push(file);

		});

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
			comment: (this.byId("comment") as TextArea).getValue()
		};

		const invoice: Invoice = {
			amount: Number((this.byId("amount") as Input).getValue()),
			applicationId: this.invoiceId.toString(),
			apportionments,
			comment,
			conceptId: Number.parseInt((this.byId("conceptId") as Input).getValue()),
			folio: (this.byId("folio") as Input).getValue(),
			generalConcept: (this.byId("generalConcept") as Input).getValue(),
			uuid: this.uuid
		}
		if (!this.uuidExist) {
			const invoiceResponse: InvoiceResponse = await sendInvoiceService(invoice, this.filesData);

			if (invoiceResponse != null) {
				await this.AppController.navTo_home();
				showMsgStrip(`Los datos de la factura fueron enviados con exito.`, MessageStripType.SUCCESS);
			} else {
				await validatedErrorResponse(1000, null,
					"Error en el servicio al enviar la factura.");
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
	public async saveInvoice(): Promise<void> {

		BusyIndicator.show(0);

		// Check if there's a folio

		if ((this.byId("folio") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Folio Factura".');
			BusyIndicator.hide();
			return;
		}
		// check if subsidiarySum is equals to amount
		let sum: number = 0;
		const ammt: Number = Number.parseFloat((this.byId("amount") as Input).getValue());
		let apportionments: Apportionment[] = [];
		if (this.subsidiaryList.length > 0) {

			this.subsidiaryList
				.forEach((subsidiary) => {
					apportionments.push({
						subsidiaryId: subsidiary.subsidiaryId,
						amount: subsidiary.amount,
						subsidiary: ""
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

		if ((this.byId("conceptId") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar los campos "Id / Tipo de Trabajo".');
			BusyIndicator.hide();
			return;
		}

		// Check if there's a general concept

		if ((this.byId("generalConcept") as Input).getValue().length == 0) {
			await validatedErrorResponse(1000, null,
				'Debe llenar el campo "Concepto en Especifico".');
			BusyIndicator.hide();
			return;
		}

		this.filesData = [];
		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		const filesItems: UploadSetItem[] = uploadFilesData.getItems();

		filesItems.forEach(async (item): Promise<void> => {
			const file: File = item.getFileObject() as File;
			this.filesData.push(file);

		});

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
			comment: (this.byId("comment") as TextArea).getValue()
		};

		const invoice: Invoice = {
			amount: Number((this.byId("amount") as Input).getValue()),
			applicationId: this.invoiceId.toString(),
			apportionments,
			comment,
			conceptId: Number.parseInt((this.byId("conceptId") as Input).getValue()),
			folio: (this.byId("folio") as Input).getValue(),
			generalConcept: (this.byId("generalConcept") as Input).getValue(),
			uuid: this.uuid
		}

		if (!this.uuidExist) {
			const invoiceResponse: InvoiceResponse = await saveDrafInvoiceService(invoice, this.filesData);

			if (invoiceResponse != null) {
				await this.AppController.navTo_home();
				showMsgStrip(`Los datos de la factura fueron guardados con exito.`, MessageStripType.SUCCESS);
			} else {
				await validatedErrorResponse(1000, null,
					"Error en el servicio al guardar la factura.");
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
		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		const filesItems: any[] = uploadFilesData.getItems();
		if (filesItems.length > 0) {
			let error: boolean = false;
			filesItems.forEach(async (item): Promise<void> => {
				if (!error) {

					const file: File = item.getFileObject() as File;

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

	public async clear(): Promise<void> {

		// Clear state
		this.invoiceId = 0;
		this.uuid = "";
		this.subsidiaryList = [];
		this.filesData = [];
		this.isDescendingConcepts = false;
		this.isDescendingSubsidiaries = false;

		// Clear components view
		(this.byId("folio") as Input).setValue("");
		(this.byId("amount") as Input).setValue("");
		(this.byId("conceptId") as Input).setValue("");
		(this.byId("concept") as Input).setValue("");
		(this.byId("generalConcept") as Input).setValue("");
		(this.byId("comment") as TextArea).setValue("");
		(this.byId("subsidiarySum") as Text).setText('Subtotal prorrateo $0');

		const uploadFilesData: UploadSet = this.byId("uploadFilesData") as UploadSet;
		uploadFilesData.removeAllItems();

		const tableSubsidiaries: Table = this.byId("tableSubsidiaries") as Table;
		tableSubsidiaries.removeAllItems();
	}

}
