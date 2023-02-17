sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
  "sap/ui/core/util/Export",
  "sap/ui/core/util/ExportTypeCSV"
], function(Controller, MessageBox, BusyIndicator,JSONModel,Export,ExportTypeCSV) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vValuationClass", {
		onInit: function() {
		
      if(this.onInitFlag == undefined){						
        this.onInitFlag = true;
        this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
      }else{
        return;
      }
      // Code to execute every time view is displayed
      this.getView().addDelegate({
          
        onBeforeShow: function(evt) {    
          

          BusyIndicator.hide();
          if(this.ADMIN_ROLE){
            this.byId("bSync").setEnabled(true);
            this.byId("bSync").setVisible(true);
          }else{
            this.byId("bSync").setEnabled(false);
            this.byId("bSync").setVisible(false);
          }
          
          this.getClassValuation();
                        
            }.bind(this)
        });
    },
   
     returnAction : function () {

      window.history.back();
    },
    
    cleanView: function(){
		
        let oTable = this.byId("oTable");
          let oModel = new JSONModel([]);
          oTable.setModel(oModel,"oModel");
      
    },
    
    setClassValuation: async function(){
        MessageBox.confirm(
           "ADVERTENCIA!\nEsta acción ejecutará un proceso de fondo, que podría tardar algunos minutos.\n¿Desea continuar?", {
                  icon: MessageBox.Icon.WARNING,
                  actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                  onClose: async function(oAction) { 
                    
                  if(oAction == 'YES'){
                    
                    const request = {
                      tokenObject: null,
                      lsObject: ""
                    };
              
                    const json = await this.execService(InveServices.SET_CLASS_VALUATION,request,"setClassValuation",this.showLog);
              
                    if(json){
                      this.lastDate = this.byId("idLblDate").getText();
                      this.cleanView();
                    
                      MessageBox.show(
                            "Se ha iniciado la sincronización", 
                      MessageBox.Icon.INFORMATION,"Mensaje");
                      
                      this.byId("bSync").setEnabled(false);
                      BusyIndicator.hide();	
                    }
                  }  			        	  			        	  
                }.bind(this)						
          }
        );
    },
    
    getClassValuation: async function(){
      
      BusyIndicator.show(0);
      setTimeout(async function() {

        const request = {
           
        };
        const json = await this.execService(InveServices.GET_CLASS_VALUATION,request,"getClassValuation",this.showLog);
              
        if(json){
          this.byId("idLblDate").setText("Última sincronización: "+json.abstractResult.resultMsgCom);
          let lDate = this.lastDate;
          if(lDate != undefined && lDate.localeCompare(this.byId("idLblDate").getText()) != 0){
            this.byId("bSync").setEnabled(true);
          }
          let oTable = this.byId("oTable");
                let oModel = new JSONModel(json.lsObject.eClassVal_SapEntities);
                oTable.setModel(oModel,"oModel");            
          
          if(json.lsObject.eClassVal_SapEntities.length > 0){
            this.byId("bExport").setEnabled(true);
                }else{
                  this.byId("bExport").setEnabled(false);
                  MessageBox.show('Sin información',MessageBox.Icon.ERROR, "Error");
                }
          BusyIndicator.hide();
        }

      }.bind(this),100); 
    },
    
    exportTable: function(){
      if(this.byId("oTable").getModel("oModel") == undefined || this.byId("oTable").getModel("oModel").getData().length == 0){
                 
            MessageBox.show('Sin información para exportar.',
            MessageBox.Icon.ERROR, "Error");
            return;
      }
      let modelData = this.byId("oTable").getModel("oModel").getData();  
      let model = new JSONModel(modelData); 
      
      let oExport = new Export({
  
        exportType: new ExportTypeCSV({
          fileExtension: "csv",
          separatorChar: this.getCharSeparator()
        }),
  
        models: model,
  
        rows: {
          path: "/"
        },
        
        columns: [
          {name : "Tipo de Valoración", template: { content: "{bwtar}" }}
          ,{name : "Referencia de Categoría de Cuenta", template: { content: "{kkref}" }}
          ,{name : "Descripción de Referencia de Clases de Cuenta", template: { content: "{krftx}" }}
        ]
      });
      
      oExport.saveFile("Clase de Valuación - "+this.formatDate(new Date())).catch(function(oError) {
        
        MessageBox.error(
             "Error al generar archivo excel \n"+oError, {
                    icon: MessageBox.Icon.ERROR
             });
      }).then(function() {
        oExport.destroy();
      }); 
  
    },
    
    formatDate: function(dt){
      
      return `${
        dt.getDate().toString().padStart(2, '0')}/${
        (dt.getMonth()+1).toString().padStart(2, '0')}/${
        dt.getFullYear().toString().padStart(4, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}:${
        dt.getSeconds().toString().padStart(2, '0')}`
    }, 
    
  })
});