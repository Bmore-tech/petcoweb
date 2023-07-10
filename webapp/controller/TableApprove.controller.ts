import BaseController from "./BaseController";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { History as historyDto } from "com/bmore/portalproveedores/model/response/History";
import { getHistory, getHistoryByFilter } from "../service/History.service";
import JSONModel from "sap/ui/model/json/JSONModel";
import { InvoiceStatus } from "../model/InvoiceStatus";
import UI5Element from "sap/ui/core/Element";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import Sorter from "sap/ui/model/Sorter";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import ListItemBase from "sap/m/ListItemBase";
/**
 * @namespace com.bmore.portalproveedores.controller
 */
export default class TableApprove extends BaseController {
    private isDescendingConcepts: boolean = false;
    public async onAfterRendering(): Promise<void> {
        this.AppController = sap.ui.getCore().byId('__component0---app').getController();
        await this.AppController.home_navbar();
    }
    public async onInit(): Promise<void> {
        BusyIndicator.show(0);
        const historyData: historyDto[] = await this.loadHistory();
        const table: UI5Element = this.byId("table");
        table.setModel(new JSONModel({
            ...historyData
        }), "tbModel");

        BusyIndicator.hide();
    }
    public async loadHistory(): Promise<historyDto[]> {

        const historyData: historyDto[] = await getHistoryByFilter(InvoiceStatus.IN_PROGRESS);

        return historyData;
    }

    public onFilterConcepts(): void {

        const searchConcept: string = this.byId("searchConcept").getValue();
        const tableHelpConceps: UI5Element = this.byId("table");
        const filter: Filter = new Filter("generalConcept", FilterOperator.Contains, searchConcept);
        const binding: Binding = tableHelpConceps.getBinding("items");

        binding.filter([filter]);
    }

    public onSortConcepts(): void {

        this.isDescendingConcepts = !this.isDescendingConcepts;

        const searchConcept: string = this.byId("searchConcept").getValue();
        const tableHelpConceps: UI5Element = this.byId("table");
        const filter: Filter = new Filter("generalConcept", FilterOperator.Contains, searchConcept);
        const binding = tableHelpConceps.getBinding("items");
        let sorters: Array<string> = [];

        sorters.push(new Sorter("generalConcept", this.isDescendingConcepts));
        binding.filter([filter]).sort(sorters);
    }

    public async handleRowClick(oEvent: Event): Promise<void> {

        const id: string = oEvent.getSource().getCells()[0].getText();

        this.getRouter().navTo("ApproveDetails", { id: id });

        if (sap.ui.getCore().byId('__component0---Approve')) {
            this.ReceptionController = sap.ui.getCore().byId('__component0---Approve').getController();
            await this.ReceptionController.loadDetails();
        }

    }

}