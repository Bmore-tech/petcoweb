sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterType",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/ui/core/Item",
], function(Controller, MessageBox, BusyIndicator,JSONModel,Filter,FilterType,FilterOperator,Export,ExportTypeCSV,Item) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vPriceMatnr", {

    onInit: function(){
        
        this.getView().addDelegate({
                
            onBeforeShow : function(evt) {                 
                this.showLog = false;
                BusyIndicator.hide();
                this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                this.setBukrsAndWerks();
            }.bind(this)
        });
    },

    returnAction : function() {
		window.history.back();
		
	},

    eraseNotification : function() {
        this.byId("vbFrame").setVisible(false);	
      }, 

    setBukrsAndWerks: async function(){
        await this.loadSocieties(this.byId("bukrs"));
        if(!this.ADMIN_ROLE){

            let bukrs = this.getBukrs();
            this.byId("bukrs").setSelectedKey(bukrs);
            this.byId("bukrs").setEnabled(false);
            await this.loadWerks();
            let werks = this.getWerks();
            this.byId("werks").setSelectedKey(werks);
            this.byId("werks").setEnabled(false);
            this.getPricesMatnr();
        }else{

            this.byId("bukrs").setSelectedKey(null);
            this.byId("bukrs").setEnabled(true);
            this.byId("werks").removeAllItems();
            this.byId("werks").destroyItems();
            this.byId("werks").setSelectedKey(null);
            this.byId("werks").setEnabled(true);
        }
    },

    loadWerks: async function(){

        this.eraseNotification();

        let bukrsBean = {
            bukrs : this.byId('bukrs').getSelectedKey()
        }

        const request = {
            tokenObject: null,
            lsObject:bukrsBean
        };

        const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);

        if(json){
            let selectWerks = this.byId("werks");
            selectWerks.removeAllItems();
            selectWerks.destroyItems();
            selectWerks.setSelectedKey(null);
            
            let data = json.lsObject;	
            

            if(data.length!=0){

                this.fillWerks(data,selectWerks);

            }else{

                MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
                        MessageBox.Icon.ERROR, "Sin centros");

            }	
        }
    },

    getPricesMatnr: async function(){
        let bukrs = this.byId('bukrs').getSelectedKey();
        let werks = this.byId('werks').getSelectedKey();
        if(bukrs == undefined || bukrs == "" || werks == undefined || werks == ""){
            MessageBox.show('Favor de seleccionar "Sociedad" y "Centro"',
            MessageBox.Icon.ERROR, "Información incompleta");
            return;
        }
        this.byId("oTable").setModel(new JSONModel([]),"oModel");
        const request = {
            tokenObject: null,
            lsObject: {
                bukrs : bukrs,
                werks: werks
            }
          };
        const json = await this.execService(InveServices.GET_PRICES_MATNR,request,"getPricesMatnr",this.showLog);

			if(json){
                this.byId("oTable").setModel(new JSONModel(json.lsObject),"oModel");
            }
    },

    filterTable: function(){
		BusyIndicator.show(0);
		let fSearch = this.byId("fSearch");
		let value = fSearch.getValue();
		let oFilterMatnr = new Filter("matnr",  FilterOperator.Contains, value);
		let oFilterbwkey = new Filter("bwkey",  FilterOperator.Contains, value);
        let oFilterbwtar = new Filter("bwtar",  FilterOperator.Contains, value);
		let oFilterZPrecio = new Filter("zprecio",  FilterOperator.Contains, value);
        let allFilter = new Filter([oFilterMatnr, oFilterbwkey, oFilterbwtar, oFilterZPrecio]);        
        let oTable = this.byId("oTable");
        oTable.getBinding("items").filter(allFilter, FilterType.Application);
        BusyIndicator.hide();
	},

    downloadTable: function(){
        this.exportTableToCSV(this.byId("oTable"));
    },

    exportTableToCSV: async function(oTable){
        await BusyIndicator.show(0);
        
        if(oTable.getModel("oModel") == undefined || oTable.getModel("oModel").getData() == undefined || oTable.getModel("oModel").getData().length == 0){
            MessageBox.show('Sin información para exportar.',
                    MessageBox.Icon.ERROR, "Sin datos");
            BusyIndicator.hide();
            return;
        }
        let modelData = oTable.getModel("oModel").getData();
        let columns = [];
        let attribute_column_Map = new Map();
        for(let i in modelData[0]){
          if(this.getColumnByAttribute(i)){
            attribute_column_Map.set(this.getColumnByAttribute(i),i);
          }
        
        }

        let columnsTable = oTable.getColumns();
        for(let i in columnsTable){
          let objExport = new Object();
             objExport.name = columnsTable[i].getHeader().getProperty("text");
             objExport.template = {
             content : "{"+attribute_column_Map.get(columnsTable[i].getHeader().getProperty("text"))+"}"
            }
            columns.push(objExport);
        }

        let oExport = new Export({

          exportType: new ExportTypeCSV({
              fileExtension: "csv",
              separatorChar: this.getCharSeparator()
          }),

          models: new JSONModel(modelData),

          rows: {
              path: "/"
          },
          
          columns: columns
      });
        let fileName = this.getWerks() == undefined ? this.formatDate(new Date) : "Centro "+ this.getWerks() +" "+this.formatDate(new Date);
        oExport.saveFile("Precios Materiales "+fileName).catch(function(oError) {
            console.error("Error al exportar csv",oError);
        }).then(function() {
            oExport.destroy();
            
        }); 
        BusyIndicator.hide();
    },

    getColumnByAttribute: function(att){
        let columns = new Map();
  
        // Set Map Values
        columns.set("matnr", "MATERIAL");
        columns.set("bwkey", "CENTRO");
        columns.set("bwtar", "TIPO DE VALORACIÓN");
        columns.set("zprecio", "PRECIO");
  
        return columns.get(att);
        
      }

   })
});