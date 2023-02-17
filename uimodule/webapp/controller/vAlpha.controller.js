sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("com.bmore.inveweb.controller.vAlpha", {

    onInit: function () {
      this.getView().addDelegate({
        onBeforeShow: function () {
          let date = new Date();
          let firstDayMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          let lastDayMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          this.byId("iniDate").setValue(firstDayMonth.getFullYear() + "-" + (firstDayMonth.getMonth() + 1) + "-" + firstDayMonth.getDate());
          this.byId("endDate").setValue(lastDayMonth.getFullYear() + "-" + (lastDayMonth.getMonth() + 1) + "-" + lastDayMonth.getDate());
          let lastTowYears = date.getTime() - 1000 * 60 * 60 * 24 * 730;
          lastTowYears = new Date(lastTowYears);
          this.byId("iniDate").setMinDate(lastTowYears);
          this.byId("iniDate").setMaxDate(lastDayMonth);
          this.byId("endDate").setMinDate(lastTowYears);
          this.byId("endDate").setMaxDate(lastDayMonth);
          this.showLog = false;
          this.getRanking();
        }.bind(this),
      });
    },
    getRanking: async function () {
      this._setInitDateDashboard(this.byId("iniDate").getDateValue().getFullYear() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getDate());
      this._setLastDateDashboard(this.byId("endDate").getDateValue().getFullYear() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getDate());
      let iniDate = this.byId("iniDate").getDateValue().getFullYear() + "-" + (this.byId("iniDate").getDateValue().getMonth() + 1) + "-" + this.byId("iniDate").getDateValue().getDate();
      let endDate = this.byId("endDate").getDateValue().getFullYear() + "-" + (this.byId("endDate").getDateValue().getMonth() + 1) + "-" + this.byId("endDate").getDateValue().getDate();
      let initTitle = new Date(iniDate.split("-")[0], iniDate.split("-")[1] - 1, iniDate.split("-")[2]);
      let lastTitle = new Date(endDate.split("-")[0], endDate.split("-")[1] - 1, endDate.split("-")[2]);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      this.byId("title").setText("RANKING POR PAÍS DEL " + initTitle.toLocaleDateString("es-MX", options).toUpperCase() + " AL " + lastTitle.toLocaleDateString("es-MX", options).toUpperCase());
      try {
        let request = {
          "iniDate": iniDate,
          "endDate": endDate
        };
        const json = await this.execService(InveServices.GET_SUMARY_BY_COUNTRY_REGION, request, "getRanking", this.showLog);
        json.lsObject.forEach(element => {
          switch (element.countryRegion) {
            case "MEX":
              element.countryRegion = "México";
              break;
            case "ECU":
              element.countryRegion = "Ecuador";
              break;
            case "COL":
              element.countryRegion = "Colombia";
              break;
            case "PAN":
              element.countryRegion = "Panamá";
              break;
            case "PER":
              element.countryRegion = "Perú";
              break;
            case "HND":
              element.countryRegion = "Honduras";
              break ;
            case "SLV":
              element.countryRegion = "El Salvador";
              break;
            case "DOM":
              element.countryRegion = "República Dominicana";
              break;
          }
          if(element.skus > 0){
            this.prepareStatusUsability(element);
            this.prepareStatusExactitud(element);
            this.prepareStatusUsabilidad(element);
          }
          
        });
        let oModel = new JSONModel(json);
        this.getView().setModel(oModel);
      } catch (err) {
        console.log(err);
      }
    },
    getImageCountry: function (country) {
      if (country == "México") {
        return "./resources/img/mexico.png";
      } else if (country == "Ecuador") {
        return "./resources/img/ecuador.png";
      } else if (country == "Colombia") {
        return "./resources/img/colombia.png";
      } else if (country == "Panamá") {
        return "./resources/img/panama.png";
      } else if (country == "Perú") {
        return "./resources/img/peru.png";
      } else if (country == "Honduras") { 
        return "./resources/img/honduras.png";
      } else if (country == "El Salvador") {
        return "./resources/img/elsalvador.png";
      } else if (country == "República Dominicana") {
        return "./resources/img/dominicana.png";
      }
    },
    getCountry: function (country) {
      if (country == "MEX") {
        return "México";
      } else if (country == "ECU") {
        return "Ecuador";
      } else if (country == "COL") {
        return "Colombia";
      } else if (country == "PAN") {
        return "Panamá";
      } else if (country == "PER") {
        return "Perú";
      }else if (country == "HND") { 
        return "Honduras";
      } else if (country == "SLV") {
        return "El Salvador";
      } else if (country == "DOM") {
        return "República Dominicana";
      }
    },
    _onSearch: function (oEvent) {
      let sQuery = oEvent.getSource().getValue();
      let oFilter = new Filter({
        filters: [
          new Filter("countryRegion", FilterOperator.Contains, sQuery)
        ],
        and: false
      });
      let oBinding = this.byId("country").getBinding("items");
      oBinding.filter(oFilter, sap.ui.model.FilterType.Application);
    },
    navContry: function (oEvent) {
      switch (oEvent.getSource().getTitle()) {
        case "México":
          this.country = "MEX";
          break;
        case "Ecuador":
          this.country = "ECU";
          break;
        case "Colombia":
          this.country = "COL";
          break;
        case "Panamá":
          this.country = "PAN";
          break;
        case "Perú":
          this.country = "PER";
          break;
        case "Honduras":
          this.country = "HND";
          break ;
        case "El Salvador":
          this.country = "SLV";
          break;
        case "República Dominicana":
          this.country = "DOM";
          break;
      }
      this.navTo("vBeta", {
        countyId: this.country
      });
    },
    returnAction: function () {
      this.flag = false;
      window.history.go(-1);
    },
    
  });
});