sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "thirdparty/xlsx/dist/xlsx.full.min",
], function (BaseController, JSONModel, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("com.bmore.inveweb.controller.vDelta", {
    onInit: function () {
      this.getView().addDelegate({
        onBeforeShow: function () {
          let date = new Date();
          let lastDayMonth;
          if (this.getInitDateDashboard()) {
            this.byId("iniDate").setValue(this.getInitDateDashboard());
            this.byId("endDate").setValue(this.getLastDateDashboard());
          } else {
            let firstDayMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            lastDayMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            this.byId("iniDate").setValue(firstDayMonth.getFullYear() + "-" + (firstDayMonth.getMonth() + 1) + "-" + firstDayMonth.getDate());
            this.byId("endDate").setValue(lastDayMonth.getFullYear() + "-" + (lastDayMonth.getMonth() + 1) + "-" + lastDayMonth.getDate());
          }
          let lastTowYears = date.getTime() - 1000 * 60 * 60 * 24 * 730;
          lastTowYears = new Date(lastTowYears);
          this.byId("iniDate").setMinDate(lastTowYears);
          this.byId("iniDate").setMaxDate(lastDayMonth);
          this.byId("endDate").setMinDate(lastTowYears);
          this.byId("endDate").setMaxDate(lastDayMonth);
          this.showLog = false;
        }.bind(this),
      });
     
      this.getRouter().getRoute("vDelta").attachPatternMatched(this._onContryMatched, this);
    },
    download: function () {
      let oData = this.getView().getModel().getData().lsObject.docInvList;
      let reformattedArray = oData.map(function(obj){
        obj["DOCUMENTO"] = obj["docInvId"];
        obj["SOCIEDAD"] = obj["bukrs"];
        obj["CENTRO"] = obj["werks"];
        obj["FECHA"] = obj["createdDate"];
        obj["MATERIAL"] = obj["matnr"];
        obj["DESCRIPCION"] = obj["maktx"];
        obj["MODIFICADO POR"] = obj["modifiedBy"];
        obj["FECHA DE MODIFICACIÓN"] = obj["modifiedDate"];
        obj["CONTADO"] = obj["counted"];
        obj["TEORICO"] = obj["theoric"];
        obj["DIFERENCIA"] = obj["diff"];
        obj["EXACTITUD"] = obj["exactitud"];
        obj["JUSTIFICACIÓN"] = obj["justification"];
        obj["COSTO"] = obj["costMatnr"];
        obj["CANTIDAD JUSTIFICADA"] = obj["quantity"];
        delete obj["docInvId"];
        delete obj["bukrs"];
        delete obj["werks"];
        delete obj["createdDate"];
        delete obj["matnr"];
        delete obj["maktx"];
        delete obj["modifiedBy"];
        delete obj["modifiedDate"];
        delete obj["counted"];
        delete obj["theoric"];
        delete obj["diff"];
        delete obj["exactitud"];
        delete obj["justification"];
        delete obj["costMatnr"];
        delete obj["closed"];
        delete obj["cost"];
        delete obj["sapRecount"];
        delete obj["quantity"];
        obj["FECHA"] = new Date(obj["FECHA"]);
        obj["FECHA DE MODIFICACIÓN"] = new Date(obj["FECHA DE MODIFICACIÓN"]);
        return obj;
     });
      let ws = XLSX.utils.json_to_sheet(reformattedArray);
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, this.werks);
      let iniDate = this.byId("iniDate").getDateValue().getDate() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getFullYear();
      let endDate = this.byId("endDate").getDateValue().getDate() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getFullYear();
      XLSX.writeFile(wb, `${this.werks} ${this.werksDesc} del ${iniDate} al ${endDate}.xlsx`);
    },


    _onContryMatched: function (oEvent) {
      this.countryRegion = oEvent.getParameter("arguments").countryRegion;
      this.idDrv = oEvent.getParameter("arguments").idDrv;
      this.werks = oEvent.getParameter("arguments").werks;
      this.werksDesc = oEvent.getParameter("arguments").werksDesc;
      this.getSumaryByMatnr();
    },
    getSumaryByMatnr: async function () {
      let iniDate = this.byId("iniDate").getDateValue().getFullYear() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getDate();
      let endDate = this.byId("endDate").getDateValue().getFullYear() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getDate();
      let initTitle = new Date(iniDate.split("-")[0], iniDate.split("-")[1] - 1, iniDate.split("-")[2]);
      let lastTitle = new Date(endDate.split("-")[0], endDate.split("-")[1] - 1, endDate.split("-")[2]);
      const options = { year: "numeric", month: "long", day: "numeric" };
      this.byId("title").setText("MATERIALES "+ this.werksDesc.toUpperCase() +" DEL " + initTitle.toLocaleDateString("es-MX", options).toUpperCase() + " - " + lastTitle.toLocaleDateString("es-MX", options).toUpperCase());
      try {
        let request = {
          "iniDate": iniDate,
          "endDate": endDate,
          "countryRegion": this.countryRegion,
          "idDrv": this.idDrv,
          "werks": this.werks
        };
        let json = await this.execService(InveServices.GET_SUMARY_BY_MATNR, request, "getSumaryByMatnr", this.showLog);
        json.lsObject.summaryList.forEach(e =>{
          if(e.skus > 0){
            this.prepareStatusUsability(e);
            this.prepareStatusExactitud(e);
            this.prepareStatusUsabilidad(e);
          }
        });
        let oModel = new JSONModel(json);
        this.getView().setModel(oModel);
      } catch (err) {
        console.log(err);
      }
    },
    _onSearch: function (oEvent) {
      let sQuery = oEvent.getSource().getValue();
      let oFilter = new Filter({
        filters: [
          new Filter("maktx", FilterOperator.Contains, sQuery),
          new Filter("matnr", FilterOperator.Contains, sQuery)
        ],
        and: false
      });
      let oBinding = this.byId("drv").getBinding("items");
      oBinding.filter(oFilter, sap.ui.model.FilterType.Application);
    },
    navContry: function (oEvent) {
      console.log(oEvent.getSource().getTitle());
    },
    returnAction: function () {
      this.flag = false;
      window.history.go(-1);
    }
  });
});