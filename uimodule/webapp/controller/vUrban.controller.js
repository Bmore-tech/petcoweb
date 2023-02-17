sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
  "sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Item",
	"sap/ui/core/Fragment",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/ui/core/MessageType",
  "sap/m/ButtonType",
  "sap/ui/core/mvc/Controller"
 ], function(Controller,MessageBox,BusyIndicator,JSONModel,Item,Fragment,
               Dialog,Button,MessageType,ButtonType,FragmentController) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vUrban", {
    onInit: function() {
  
      this.getView().addDelegate({
  
        onBeforeShow: function(evt) {      
  
        BusyIndicator.hide();				
          this.cleanView();						
          
          this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
          this.setBukrsAndWerks();			
        }.bind(this)
      });
  
    },
  
    returnAction : function() {
      window.history.go(-1);
  
    },
  
    eraseNotification : function() {
      this.byId("vbFrame").setVisible(false);		
    },
  
    cleanView: function(){

      // Clean Edition
      this.byId('modifiedBy').setValue("");
      this.byId('modifiedDate').setValue("");
  
      //this.byId("bEdit").setEnabled(false);
      this.byId("bCancel").setEnabled(false);
      this.byId("bSave").setEnabled(false);
      this.byId("bAddPosition").setEnabled(false);
      this.byId("bDeletePosition").setEnabled(false);
  

      let oModel = new JSONModel([]);
    
  
      let oTable = this.byId("oTable");
      oTable.setModel(oModel,"oModel");
    },
  
    setBukrsAndWerks: async function(){
     await this.loadBukrs();

      if(!this.ADMIN_ROLE){
        this.byId("bEdit").setEnabled(true);
        let bukrs = this.getBukrs();
        this.byId("bukrs").setSelectedKey(bukrs);
        this.byId("bukrs").setEnabled(false);
  
        let cmbxWerks = this.byId("werks");
  
        if(cmbxWerks.getItems().length == 0){
  
         await this.loadWerks();
        }
  
        let werks = this.getWerks();
        this.byId("werks").setSelectedKey(werks);
        this.byId("werks").setEnabled(false);
        this.loadWerksBukrsUrban();
      }else{
        this.byId("bEdit").setEnabled(false);
        this.byId("bukrs").setSelectedKey(null);
        this.byId("bukrs").setEnabled(true);
        this.byId("werks").removeAllItems();
        this.byId("werks").destroyItems();
        this.byId("werks").setSelectedKey(null);
        this.byId("werks").setEnabled(true);
        
      }
    },
  
      loadBukrs: async function(){	
  
        const request = {
          tokenObject: null,
          lsObject: ""
        };

        const json = await this.execService(InveServices.GET_BUKRS,request,"loadBukrs",this.showLog);

        if(json){
          // Create a model and bind the table rows to this model
					let selectBukrs = this.byId("bukrs");
					selectBukrs.removeAllItems();
					selectBukrs.destroyItems();
					let data = json.lsObject;  
             
					for(let i = 0; i < data.length; i++){

						let item = new Item({
							text : data[i].bukrs + " - " + data[i].bukrsDesc, // string
							key : data[i].bukrs, // string
							tooltip : data[i].bukrs, // sap.ui.core.TooltipBase
						});
						selectBukrs.addItem(item
              );	            			
					}
        }
    },	
  
    loadWerks: async function(){
  
      this.eraseNotification();
  
      let bukrsBean = new Object();
      bukrsBean.bukrs = this.byId('bukrs').getSelectedKey();
      bukrsBean.bukrsDesc = null;
      bukrsBean.werks = null;
      bukrsBean.werksDesc = null;
  
      this.cleanView();
  
      const request = {
        tokenObject: null,
        lsObject: bukrsBean
      };

      const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);

      if(json){
        let selectWerks = this.byId("werks");
        selectWerks.removeAllItems();
        selectWerks.destroyItems();
        selectWerks.setSelectedKey(null);
        
        let data = json.lsObject;	
        

        if(data.length!=0){

          for(let i = 0; i < data.length; i++){

            let item = new Item({
              text : data[i].werks + " - " + data[i].werksDesc, // string
              key : data[i].werks, // string
              tooltip : data[i].werks, // sap.ui.core.TooltipBase
            });
            selectWerks.addItem(item);	            			
          } 	

          setTimeout(function() {
            selectWerks.focus();
            
          },100);

        }else{


          MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
              MessageBox.Icon.ERROR, "Error");

        }	
        BusyIndicator.hide();
      }

    },
  
    cloneAddPosition:function(){
      let oView = this.getView();
      if (!this.byId("oDialogBukrsWerks")){
            Fragment.load({
              id: oView.getId(),
              name: "com.bmore.inveweb.view.fragments.vMCBukrsWerksDialog",
              controller: this
            }).then(function(oDialog){
              oView.addDependent(oDialog);
              this.cleanOdialog();
              this.loadBukrsFragment();
              oDialog.open();
            }.bind(this));
      }else{
        this.cleanOdialog();
        this.loadBukrsFragment();
        this.byId("oDialogBukrsWerks").open();
      }
    },
    _closeDialog:function(){
      this.byId("oDialogBukrsWerks").close();
    },
    cleanOdialog: function(){
              
      Fragment.byId(this.getView().getId(), "bukrs_").removeAllItems();	
      Fragment.byId(this.getView().getId(), "bukrs_").destroyItems();	
      Fragment.byId(this.getView().getId(), "werks_").removeAllItems();
      Fragment.byId(this.getView().getId(), "werks_").destroyItems();
      
      Fragment.byId(this.getView().getId(), "bukrs_").setSelectedKey(null);		
      Fragment.byId(this.getView().getId(), "werks_").setSelectedKey(null);	
    
    },

    loadBukrsFragment: async function(){
      
      const request = {
        tokenObject: null,
        lsObject: ""
      };

      const json = await this.execService(InveServices.GET_BUKRS,request,"loadBukrs",this.showLog);
            if(json){
              let selectBukrs = Fragment.byId(this.getView().getId(), "bukrs_");
               selectBukrs.removeAllItems();
               selectBukrs.destroyItems();
              let data = json.lsObject;  		
  
              data.forEach(element =>{
                let item = new Item({
                  text : element.bukrs + " - " + element.bukrsDesc, 
                  key : element.bukrs, 
                  tooltip : element.bukrs, 
                  });
                  selectBukrs.addItem(item);
              });
              let viewBukrskey = this.byId('bukrs').getSelectedKey();
              Fragment.byId(this.getView().getId(), "bukrs_").setSelectedKey(viewBukrskey);
              this.loadWerksFragment();
              BusyIndicator.hide();
            }
    }, 

    loadWerksFragment: async function(){
      
      let bukrsBean = new Object();
      bukrsBean.bukrs = Fragment.byId(this.getView().getId(), "bukrs_").getSelectedKey();
      bukrsBean.bukrsDesc = null;
      bukrsBean.werks = null;
      bukrsBean.werksDesc = null;
      
      let selectWerks = Fragment.byId(this.getView().getId(), "werks_");
      
      selectWerks.removeAllItems();
      selectWerks.destroyItems();
      Fragment.byId(this.getView().getId(), "werks_").setSelectedKey(null);
  
      const request = {
        tokenObject: null,
        lsObject: bukrsBean
      };
      const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
            if(json){
              let selectWerks = Fragment.byId(this.getView().getId(), "werks_");
            
              selectWerks.removeAllItems();
              selectWerks.destroyItems();
              let data = json.lsObject;	            		
    
              if(data.length!=0){
    
                data.forEach(e=>{
                  let item = new Item({
                    text :e.werks + " - " + e.werksDesc, 
                    key : e.werks, 
                    tooltip : e.werks, 
                  });
                  selectWerks.addItem(item);	 
                });
                if(Fragment.byId(this.getView().getId(), "bukrs_").getSelectedKey() != undefined){
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
      let burks = Fragment.byId(this.getView().getId(), "bukrs_");
      let burksId = burks.getSelectedKey();
      
      if(burksId.length == 0){	        			
        MessageBox.show('Es necesario elegir una sociedad.',
           MessageBox.Icon.ERROR, "Error");
        
        return;
      }
      
      let werks = Fragment.byId(this.getView().getId(), "werks_");
      let werksId = werks.getSelectedKey();
      
      if(werksId.length == 0){        			
        MessageBox.show('Es necesario elegir un centro.',
           MessageBox.Icon.ERROR, "Error");
        
        return;
      }
      
      let data;
      
      try {
        data = this.byId("oTable").getModel("oModel").getData();
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
            
      let oTable = this.byId("oTable");
      oTable.setModel(oModel,"oModel");
      this._closeDialog();
      
    },
  
    removePosition: function(){
  
      let oTable = this.getView().byId("oTable");  		
      let selectedItems = oTable.getSelectedItems();
        
      if(selectedItems.length > 0){
  
        // Clean messages
        this.getView().byId("messagesBox").removeAllItems();

        // Delete data
        let arr = [];
        let selectedItems = oTable.getSelectedItems();
        let data = oTable.getModel("oModel").getData();

        for(let i = 0; i < data.length; i++){
          if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
            arr.push(data[i]);
          }			    			        			
        }
  
         oTable.setModel(new JSONModel(arr), "oModel");
  
      }else{
  
        this.toast("Nada que eliminar", "20em");
      }
    }, 	
  
  
    editRecord: function(){
  
      
      let data;
  
      try {
        data = this.byId("oTable").getModel("oModel").getData();
      } catch (e) {
        data = [];
      }	
  
    
  
      this.byId("bEdit").setEnabled(false);
      this.byId("bCancel").setEnabled(true);
      this.byId("bSave").setEnabled(true);
      this.byId("bAddPosition").setEnabled(true);
      this.byId("bDeletePosition").setEnabled(true);
  
      this.setOnEdit(true);
      this.backupRecord = this.copyObjToNew(data);
  
      for(let i = 0; i < data.length; i++){
  
        data[i].editable = true;
      }
  
      this.byId("oTable").getModel("oModel").refresh(true);
      
      
    },
  
    cancelEdition: function(){
  
      this.eraseNotification();
     
  
      // Show confirm dialog

      MessageBox.confirm(
          "¿Desea cancelar la edición?", {
            icon: MessageBox.Icon.QUESTION,
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function(oAction) { 
  
              if(oAction == 'YES'){
  
                this.setOnEdit(false);
  
                this.byId("bEdit").setEnabled(true);
                this.byId("bCancel").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                this.byId("bAddPosition").setEnabled(false);
                this.byId("bDeletePosition").setEnabled(false);
  
  
                // Restore table positions
                for(let i = 0; i < this.backupRecord.length; i++){
                  this.backupRecord[i].editable = false;
                }
  
                let oTable = this.byId("oTable");		
                let positions = this.copyObjToNew(this.backupRecord);
                let model = new JSONModel(positions);
                oTable.setModel(model,"oModel");
		        					        					        					        					        		
              }  			        	  			        	  
            }.bind(this)						
          }
      );
    },
  
    saveEdition: async function(){
      let entry = new Object();
  
      entry.bukrs = this.byId('bukrs').getSelectedKey();
      entry.bukrsDesc = "vacio";
      
      entry.werks = this.byId('werks').getSelectedKey();
      entry.werksDesc = "vacio";
      
      let isMultiAlmacen = await this.isMultiAlmacen();
      if(isMultiAlmacen){
        MessageBox.show('La sociedad '+entry.bukrs+' y centro '+entry.werks+' del usuario, ya está configurada como Multi-Almacen\nFavor de desactivar Multi-Almacen para usar Urban',
            MessageBox.Icon.ERROR, "Conflicto");
                     BusyIndicator.hide();
            return;
      }
      let data;
  
      try {
        data = this.byId("oTable").getModel("oModel").getData();
      } catch (e) {
        data = [];
      }
      
        
      data.unshift(entry);
      
      const request = {
        tokenObject: null,
        lsObject: data
      };

      const json = await this.execService(InveServices.SAVE_BUKRS_AND_WERKS_URBAN,request,"saveBukrsAndWerksUrban",this.showLog);

      if(json){
        this.byId("bEdit").setEnabled(true);
        this.byId("bCancel").setEnabled(false);
        this.byId("bSave").setEnabled(false);
        this.byId("bAddPosition").setEnabled(false);
        this.byId("bDeletePosition").setEnabled(false);

        let message = 'El registro se guardó de forma exitosa'; 
        this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pUrban"));

        setTimeout(function() {
          this.byId("messagesBox").getItems()[0].close();      
        }.bind(this),3000);
        this.setOnEdit(false);
        BusyIndicator.hide();	
        this.byId("werks").fireChange();
      }
      
     },


      loadWerksBukrsUrban: async function(){

        let werksBean = new Object();
        
        werksBean.bukrs = this.byId('bukrs').getSelectedKey();
        werksBean.werks = this.byId('werks').getSelectedKey();

        this.cleanView();		

        const request = {
          tokenObject: null,
          lsObject: werksBean
        };

        const json = await this.execService(InveServices.GET_BUKRS_WERKS_URBAN,request,"loadWerksBukrsUrban",this.showLog);

        if(json){
          if (json.lsObject.length > 0) {
            this.byId('modifiedBy').setValue(json.lsObject[0].modifiedBy);
            this.byId('modifiedDate').setValue(this.formatDate(new Date(json.lsObject[0].modifiedDate)));
          }
          let data = json.lsObject;	            		

          if(data.length!=0){
            
            let data2;
            
            try {
              data2 = this.byId("oTable").getModel("oModel").getData();
            } catch (e) {
              data2 = [];
            }

            for(let i = 0; i < data.length; i++){

              
              let entry = new Object();
              

              entry.bukrs = data[i].bukrs;
              entry.bukrsDesc = data[i].bukrsDesc;
              
              entry.werks = data[i].werks;
              entry.werksDesc = data[i].werksDesc;
              
              data2.push(entry);				
                                                      
            }

            let oModel = new JSONModel(data2);
                        
            let oTable = this.byId("oTable");
            oTable.setModel(oModel,"oModel");
                        
                    }
        }
        this.byId("bEdit").setEnabled(true);
        BusyIndicator.hide();
      },


    
     isMultiAlmacen: async function(){
         let werksBean = {
                   bukrs : this.byId('bukrs').getSelectedKey(),
                   werks : this.byId('werks').getSelectedKey()
               }
        const request = {
        tokenObject: null,
        lsObject: werksBean
        };
        const json = await this.execService(InveServices.IS_MULTI_ALMACEN,request,"isMultiAlmacen",this.showLog);

        if(json){
          return json.abstractResult.booleanResult;
        }
       },
  });
});