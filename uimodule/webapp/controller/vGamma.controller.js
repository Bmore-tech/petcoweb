sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("com.bmore.inveweb.controller.vGamma", {
    onInit: function () {
      this.getView().addDelegate({
        onBeforeShow: function () {
          this.showLog = false;
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
          
        }.bind(this),
      });
      
      this.getRouter().getRoute("vGamma").attachPatternMatched(this._onContryMatched, this);
    },
    _onContryMatched: function (oEvent) {
      this.countryRegion = oEvent.getParameter("arguments").countryRegion;
      this.idDrv = oEvent.getParameter("arguments").idDrv;
      this.dvr = oEvent.getParameter("arguments").dvr;
      this.getRankingbyWerks();
    },
    getRankingbyWerks: async function () {
      this._setInitDateDashboard(this.byId("iniDate").getDateValue().getFullYear() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getDate());
      this._setLastDateDashboard(this.byId("endDate").getDateValue().getFullYear() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getDate());
      let iniDate = this.byId("iniDate").getDateValue().getFullYear() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getDate();
      let endDate = this.byId("endDate").getDateValue().getFullYear() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getDate();
      let initTitle = new Date(iniDate.split("-")[0], iniDate.split("-")[1]-1, iniDate.split("-")[2]);
      let lastTitle = new Date(endDate.split("-")[0], endDate.split("-")[1]-1, endDate.split("-")[2]);
      const options = { year: "numeric", month: "long", day: "numeric" };
      this.byId("title").setText("CENTROS "+ this.dvr.toUpperCase() + " DEL " + initTitle.toLocaleDateString("es-MX", options).toUpperCase() + " AL " + lastTitle.toLocaleDateString("es-MX", options).toUpperCase());
      try {
        let request = {
          "iniDate": iniDate,
          "endDate": endDate,
          "countryRegion": this.countryRegion,
          "idDrv": this.idDrv
        };
        let json = await this.execService(InveServices.GET_SUMARY_BY_WERKS, request, "getRankingbyWerks", this.showLog);
        json.lsObject.forEach(e =>{
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
          new Filter("werksDesc", FilterOperator.Contains, sQuery),
          new Filter("werks", FilterOperator.Contains, sQuery)
        ],
        and: false
      });
      let oBinding = this.byId("drv").getBinding("items");
      oBinding.filter(oFilter, sap.ui.model.FilterType.Application);
    },
    navContry: function (oEvent) {
      let data = this.getView().getModel().getData().lsObject;
      let werks="";
      let werksDesc="";
      data.forEach(element => {
        if (element.werks == oEvent.getSource().getIntro()) {
          werks = element.werks;
          werksDesc = element.werksDesc;
        }
      });
      this.navTo("vDelta", {
        countryRegion: this.countryRegion,
        idDrv: this.idDrv,
        dvr: this.dvr,
        werks: werks,
        werksDesc: werksDesc
      });
    },
    returnAction: function () {
      this.flag = false;
      window.history.go(-1);
    },
    download: async function () {
      let oData;
      let iniDate = this.byId("iniDate").getDateValue().getDate() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getFullYear();
      let endDate = this.byId("endDate").getDateValue().getDate() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getFullYear();
      try {
        let request = {
          "iniDate": iniDate,
          "endDate": endDate,
          "countryRegion": this.countryRegion,
          "idDrv": this.idDrv
        };
        const json = await this.execService(InveServices.GET_DOCS_FOR_DOWNLOAD, request, "GET_DOCS_FOR_DOWNLOAD", this.showLog);
        oData=json.lsObject;
      } catch (err) {
        console.log(err);
      }
      let reformattedArray = oData.map(function(obj){
        obj["DOCUMENTO"] = obj["docInvId"];
        obj["SOCIEDAD"] = obj["bukrs"];
        obj["CENTRO"] = obj["werks"];
        obj["FECHA"] = obj["createdDate"];
        obj["MATERIAL"] = obj["matnr"];
        //obj["DESCRIPCION"] = obj["maktx"];
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
        delete obj["typeJustification"];
        delete obj["month"];
        delete obj["quantity"];
        obj["FECHA"] = new Date(obj["FECHA"]);
        obj["FECHA DE MODIFICACIÓN"] = new Date(obj["FECHA DE MODIFICACIÓN"]);
        return obj;
     });
      let ws = XLSX.utils.json_to_sheet(reformattedArray);
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, this.dvr.toUpperCase());
     
      XLSX.writeFile(wb, `DRV ${this.dvr.toUpperCase()} del ${iniDate} al ${endDate}.xlsx`);
    },
  });
});