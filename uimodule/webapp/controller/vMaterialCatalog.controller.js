/* eslint-disable no-console */
sap.ui.define([
  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/Fragment",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageStrip",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
], function(Controller, Fragment , BusyIndicator,JSONModel,MessageStrip,Sorter,MessageBox) {
  "use strict";

  return Controller.extend("com.bmore.inveweb.controller.vMaterialCatalog", {
    onInit: function() {
      //Code to execute every time view is displayed
      this.getView().addDelegate({
              onBeforeShow: function(evt) {
                BusyIndicator.hide();
                
                this.eraseNotification();
                this.cleanView();
              }.bind(this)
          });
    },
    returnAction: function (){
      this.byId("idvContainer").getController().retunrPage();
    },
    eraseNotification: function() {
      this.byId("vbFrame").setVisible(false);
    },
    cleanView: function(){
        //Load table data
        let oModel = new JSONModel([]);
        let oTable = this.byId("oTable");
        oTable.setModel(oModel, "oModel");
    },
    searchFilter: function(evt){
      let flag = evt.getParameters().clearButtonPressed
      if (flag == true){
        return;
      }
      let fSearch = this.byId("fSearch");
      this.loadMaterials(fSearch.getValue());
    },

    refreshTable: function(){
        this.loadMaterials("");
    },

    loadMaterials: async function(object){
      BusyIndicator.show(0);
      this.eraseNotification();

      const request = {
        tokenObject: null,
        lsObject: object
      };

      const json = await this.execService(InveServices.GET_TMATNR,request,"loadMaterials",this.showLog);

      if(json){
        let modelMaterials = json.lsObject;//JSON.parse(JSON.stringify(json.lsObject));
          let oModel = new JSONModel(modelMaterials);
          let oTable = this.byId("oTable");
          oTable.setModel(oModel,"oModel");
          BusyIndicator.hide();
      }
     
    },

    filter: function(){
      //this.createViewSettingsDialog("com.bmore.inveweb.view.fragments.SortDialogvMaterialCatalog").open();
      let oView = this.getView ();
      if(!this.byId("oDialogSortMaterial")){
        Fragment.load({
          id: oView.getId(),
          name: "com.bmore.inveweb.view.fragments.SortDialogvMaterialCatalog",
          controller: this
        }).then(function (oDialog){
          oView.addDependent(oDialog);
          oDialog.open();
          oDialog.addStyleClass("sapUiSizeCompact");
          
        })
      }else{
        this.byId("oDialogSortMaterial").open();
      }
    },
    handleSortDialogConfirm: function (oEvent) {
      try {
        let oTable = this.byId("oTable"),
          mParams = oEvent.getParameters(),
          oBinding = oTable.getBinding("items"),
          sPath,
          bDescending,
          aSorters = [];

      sPath = mParams.sortItem.getKey();
      bDescending = mParams.sortDescending;
      aSorters.push(new Sorter(sPath, bDescending));
      oBinding.sort(aSorters);
      } catch (error) {
        MessageBox.show('No seleccionó criterio de clasificación',
                            MessageBox.Icon.WARNING, "Filtro incompleto");
        return;
      }
      
  },
  });
});