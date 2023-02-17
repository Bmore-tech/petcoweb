sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Item",
	"sap/ui/core/Fragment",
], function(Controller, MessageBox, BusyIndicator,JSONModel,Item,Fragment) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vMCBukrsWerks", {
    setControlSettings: function(frgId, viewId, oDialog){
		
      this.frgId = frgId;
      this.viewId = viewId;
      this.oDialog = oDialog;
      this.cleanOdialog();
      this.loadBukrs();
      
      setTimeout(function() {
        let viewBukrskey = sap.ui.getCore().byId(this.viewId + '--bukrs').getSelectedKey();
        Fragment.byId(this.frgId, "bukrs").setSelectedKey(viewBukrskey);
        this.loadWerks();
      }.bind(this),300);
      
    },
      
    cleanOdialog: function(){
              
      Fragment.byId(this.frgId, "bukrs").removeAllItems();	
      Fragment.byId(this.frgId, "bukrs").destroyItems();	
      Fragment.byId(this.frgId, "werks").removeAllItems();
      Fragment.byId(this.frgId, "werks").destroyItems();
      
      Fragment.byId(this.frgId, "bukrs").setSelectedKey(null);		
      Fragment.byId(this.frgId, "werks").setSelectedKey(null);	
      
    
    },
    
    loadBukrs: async function(){
      
      const request = {
        tokenObject: null,
        lsObject: ""
      };

      const json = await this.execService(InveServices.GET_BUKRS,request,"loadBukrs",this.showLog);
            if(json){
              let selectBukrs = Fragment.byId(this.frgId, "bukrs");
               selectBukrs.removeAllItems();
               selectBukrs.destroyItems();
              let data = json.lsObject;  		
  
              for(let i = 0; i < data.length; i++){
          
              let item = new Item({
                text : data[i].bukrs + " - " + data[i].bukrsDesc, 
                key : data[i].bukrs, 
                tooltip : data[i].bukrs, 
                });
                
                selectBukrs.addItem(item);	            			
              }
              BusyIndicator.hide();
            }
    }, 
    
    loadWerks: async function(){
      
      let bukrsBean = new Object();
      bukrsBean.bukrs = Fragment.byId(this.frgId, "bukrs").getSelectedKey();
      bukrsBean.bukrsDesc = null;
      bukrsBean.werks = null;
      bukrsBean.werksDesc = null;
      
      let selectWerks = Fragment.byId(this.frgId, "werks");
      
      selectWerks.removeAllItems();
      selectWerks.destroyItems();
      Fragment.byId(this.frgId, "werks").setSelectedKey(null);
  
      const request = {
        tokenObject: null,
        lsObject: bukrsBean
      };
      const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
            if(json){
              let selectWerks = Fragment.byId(this.frgId, "werks");
            
              selectWerks.removeAllItems();
              selectWerks.destroyItems();
              let data = json.lsObject;	            		
    
              if(data.length!=0){
    
                
    
                for(let i = 0; i < data.length; i++){
    
                  let item = new Item({
                    text : data[i].werks + " - " + data[i].werksDesc, 
                    key : data[i].werks, 
                    tooltip : data[i].werks, 
                  });
                  selectWerks.addItem(item);	            			
                } 	

                if(Fragment.byId(this.frgId, "bukrs").getSelectedKey() != undefined){
                    selectWerks.focus();
               }
  
              }else{
    
                MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
                   MessageBox.Icon.ERROR, "Error");
                }	
                BusyIndicator.hide();
            }  
    },
       
    setValues: function(){
      
      
      
      let burks = Fragment.byId(this.frgId, "bukrs");
      let burksId = burks.getSelectedKey();
    
      
      if(burksId.length == 0){	        			
        MessageBox.show('Es necesario elegir una sociedad.',
           MessageBox.Icon.ERROR, "Error");
        
        return;
      }
      
      let werks = Fragment.byId(this.frgId, "werks");
      let werksId = werks.getSelectedKey();
      
      if(werksId.length == 0){        			
        MessageBox.show('Es necesario elegir un centro.',
           MessageBox.Icon.ERROR, "Error");
        
        return;
      }
      
      let data;
      
      try {
        data = sap.ui.getCore().byId(this.viewId + "--oTable").getModel("oModel").getData();
      } catch (e) {
        data = [];
      }
      
      
      
      for(let i = 0; i < data.length; i++){
        
        if(data[i].werks == werksId 
            && data[i].bukrs == burksId
            ){
          	        			
           MessageBox.show('La combinación ya se encuentra definida.',
              MessageBox.Icon.ERROR, "Error");	    		
            return;
        }
      }
      
    
      
      let entry = new Object();
      
  
      entry.bukrs = burksId;
      entry.bukrsDesc = burks.getSelectedItem().getText();
      
      
      entry.werks = werksId;
      entry.werksDesc = werks.getSelectedItem().getText();
      
      
      data.push(entry);
          
      let oModel = new JSONModel(data);
            
      let oTable = sap.ui.getCore().byId(this.viewId + "--oTable");
      oTable.setModel(oModel,"oModel");
            

      this.oDialog.close();
      
    }
  
  })
});