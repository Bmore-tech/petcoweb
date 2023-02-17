sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageStrip",
	  "sap/m/MessageToast",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
      "sap/m/Table",
      "sap/m/Toolbar",
      "sap/m/SearchField",
      "sap/m/Column",
      "sap/m/ObjectIdentifier", 
      "sap/m/Text",
      "sap/m/ColumnListItem",
	],
	function (Controller,BusyIndicator,JSONModel,MessageStrip,MessageToast,Dialog,Button,
                Item,MessageType,MessageBox,Table,Toolbar,SearchField,Column,ObjectIdentifier,Text,ColumnListItem) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vExplosion", {

        onInit: function() {
            
            this.getView().addDelegate({
                
                onBeforeShow: function(evt) { 
                    this.showLog = false;     
                    this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                    BusyIndicator.hide();				
                    this.cleanView();						
                    this.backupRecord = [];
                    
                    setTimeout(function(){
                        this.setBukrsAndWerks();
                    }.bind(this), 300);				
                }.bind(this)
            });
    
        },
        
        returnAction : function() {
            
            this.flag = false;
            window.history.go(-1);
            
        },
        
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);		
        },
        
        cleanView: function(){
            
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(false);
            this.byId("bSave").setEnabled(false);
            
            this.byId("matnr").setValue("");
            this.byId("description").setValue("");		
            
            // Empty table
            let oModel = new JSONModel([]);
            this.byId("oTable").setModel(oModel,"oModel");
        },
        
        setBukrsAndWerks: async function(){
            let cmbxBukrs = await this.loadBukrs();
            if(!this.ADMIN_ROLE){
                let bukrs = this.getBukrs();
                cmbxBukrs.setSelectedKey(bukrs);
                cmbxBukrs.setEnabled(false);
                
                
                let werksCmb = this.byId("werks");
                            
                if(werksCmb.getItems().length == 0){
                    
                    await this.loadWerks();
                }
                
                let werks = this.getWerks();
                werksCmb.setSelectedKey(werks);
                werksCmb.setEnabled(false);
            }else{
			
                this.byId("bukrs").setSelectedKey(null);
                this.byId("bukrs").setEnabled(true);
                this.byId("werks").removeAllItems();
                this.byId("werks").destroyItems();
                this.byId("werks").setSelectedKey(null);
                this.byId("werks").setEnabled(true);
            }
        },
        
        loadBukrs: async function(){
            let selectBukrs;
		    const request = {
			tokenObject: null,
			lsObject:""
		};

		const json = await this.execService(InveServices.GET_BUKRS,request,"loadSocieties",this.showLog);
			if(json){
				selectBukrs = this.byId("bukrs");
				selectBukrs.removeAllItems();
				selectBukrs.destroyItems();	
				let data = json.lsObject;
				for(let i in data){
					
					let item = new Item({
								text : data[i].bukrs + " - " + data[i].bukrsDesc, // string
								key : data[i].bukrs, // string
								tooltip : data[i].bukrs, // sap.ui.core.TooltipBase
							});
					selectBukrs.addItem(item);	            			
				}
				
			}
		return selectBukrs;
        },	
        
        loadWerks: async function(){
            let selectWerks;
            this.eraseNotification();
            
            let bukrsBean = new Object();
            bukrsBean.bukrs = this.byId('bukrs').getSelectedKey();
            bukrsBean.bukrsDesc = null;
            bukrsBean.werks = null;
            bukrsBean.werksDesc = null;

            const request = {
                tokenObject: null,
                lsObject: bukrsBean
            };

            const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
                if(json){
                    // Create a model and bind the table rows to this model
                    selectWerks = this.byId("werks");
                    selectWerks.removeAllItems();
                    selectWerks.destroyItems();
                    let data = json.lsObject;	            		
                    
                    for(let i in data){
                        
                        let item = new Item({
                                    text : data[i].werks + " - " + data[i].werksDesc, // string
                                    key : data[i].werks, // string
                                    tooltip : data[i].werks, // sap.ui.core.TooltipBase
                                });
                        selectWerks.addItem(item);	            			
                    } 	
                    
                    setTimeout(function() {
                        this.getView().byId("werks").focus();
                    }.bind(this),100);
                }

                return selectWerks;
		
        },
        
        selectMatnr: function(){
            
            let bukrs = this.byId("bukrs").getSelectedKey();
            let werks = this.byId("werks").getSelectedKey();
            
            if(bukrs.length == 0 || werks.length == 0){
                
                let message = 'Es necesario definir una "Sociedad" y un "Centro".'; 
                this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pExplosion"));
                
                return;
            }
            if (!this.oDialogMCMaterial) {
                
                let oDialogMCMaterialId = this.getView().createId("oDialogMaterial");
                
                this.oDialogMCMaterial = new Dialog({
                    id : oDialogMCMaterialId, // ID
                    title : "Seleccionar Material", // string
                    contentWidth : "35%", // CSSSize, since 1.12.1
                    content : [this.vMCMaterial()], // Control
                    endButton: new Button({
                        text: 'Cerrar',
                        press: function () {						
                            this.oDialogMCMaterial.close();
                            
                        }.bind(this),
                        
                    })
                })
            }
                    
            this.cleanOdialog();	
            this.oDialogMCMaterial.open();	
        },

        vMCMaterial: function(){
            let oTableMaterial = this.getView().createId("oTableMaterial");
            let fSearchMaterial = this.getView().createId("fSearchMaterial");
            let dialogTable = new Table(oTableMaterial,{
                sticky:["ColumnHeaders","HeaderToolbar"],
                fixedLayout:false,
                mode:"SingleSelectMaster",
                selectionChange:function(oEvent){
                    this.selectMaterial(oEvent);
                }.bind(this),
                headerToolbar: new Toolbar("dialogToolbar",{
                        content: [new SearchField(fSearchMaterial,{
                                width:"15rem",
                                search: function(oEvent){
                                this.loadMaterial(oEvent);
                                }.bind(this)
                            })
                        ]
                      })} );
            
            dialogTable.addColumn(new Column("cMatnr",{}).setHeader(new ObjectIdentifier({title: "Id de Material"})));
            dialogTable.addColumn(new Column("cMaktx",{}).setHeader(new ObjectIdentifier({title: "Descripción"})));

            let oTemplate = new ColumnListItem({

                cells: [
                new Text({ text: "{oModelDialogTable>matnr}",tooltip:"{oModelDialogTable>matnr}"}),
                new Text({ text: "{oModelDialogTable>maktx}",tooltip:"{oModelDialogTable>maktx}" })
                ]
                
                });

                dialogTable.bindItems("oModelDialogTable>/",oTemplate);
            
            return dialogTable;
        },
        
        editRecord: function(){
                    
            let data;
            
            try {
                data = this.byId("oTable").getModel("oModel").getData();
            } catch (e) {
                data = [];
            }	
            
            if(data.length == 0){
                this.toast("Nada que editar...", "20em");
                return;
            }
            
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(true);
            this.byId("bSave").setEnabled(true);
            
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
            
            let data;
            
            try {
                data = this.byId("oTable").getModel("oModel").getData();
            } catch (e) {
                data = [];
            }
            
            for(let i = 0; i < data.length; i++){
                
                if(data[i].relevant){
                    
                    let lgort = data[i].lgort.trim();
                    
                    if(lgort.length == 0){
                        
                        let message = 'Es necesario definir el "Almacén" para el componente ' + data[i].component + '.'; 
                        this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pExplosion"));
                        
                        return;
                    }				
                }
            }
                    
            const request = new Object();
            request.tokenObject = null;
            request.lsObject = data;

            const json = await this.execService(InveServices.SAVE_EXPLOSION_DETAIL,request,"saveExplosion",this.showLog);
                if(json){
                    this.byId("bEdit").setEnabled(true);
                    this.byId("bCancel").setEnabled(false);
                    this.byId("bSave").setEnabled(false);
                    
                    this.setOnEdit(false);            		
                    
                    let positions = this.byId("oTable").getModel("oModel").getData();
                    
                    for(let i = 0; i < positions.length; i++){
                        positions[i].editable = false;
                        if(!positions[i].relevant){
                            data[i].lgort = '';
                        }
                    }
                    
                    this.byId("oTable").getModel("oModel").refresh(true);
                                            
                    let message = 'El registro se guardó de forma exitosa.'; 
                    this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pExplosion"));
                    
                    setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();      
                    }.bind(this),3000);
                }		
            
        },

        loadLgort: async function(){
                    
            let LgortBeanView = {
                werks : this.byId("werks").getSelectedKey()
            }
    
			const request = {
				tokenObject: null,
				lsObject: LgortBeanView
			};

			const json = await this.execService(InveServices.GET_LGORT_AND_WERKS,request,"loadLgort",this.showLog);

       		if(json){
				let data = json.lsObject;	
				for(let i in data){
                    data[i].key = data[i].lgort;
                    data[i].text = data[i].lgort +" - "+ data[i].lgobe;
                }
                this.getView().setModel(new JSONModel(data),"oModelCmb");
			}
        },
        ////////////////////FUNCIONES DIALOG//////////////////////////////
        cleanOdialog: function(){
		
            let fSearchMaterial = this.byId("fSearchMaterial");
            fSearchMaterial.setValue("");				
            let oTableMaterial = this.byId("oTableMaterial");	
            oTableMaterial.setModel(new JSONModel([]),"oModelDialogTable");
        },

        selectMaterial: async function(oEvent){
		
            let oTable = oEvent.getSource();
            let item = oTable.getSelectedItem();
            let row = new Object();
            row.matnr = item.getCells()[0].getText();
            row.maktx = item.getCells()[1].getText();
            this.byId('bEdit').setEnabled(true);
            this.byId('matnr').setValue();
            this.byId('description').setValue();
            await this.loadLgort();
            this.loadMatnrExplosion(row);				
        },

        loadMaterial: async function(oEvent){
		
            let clear = oEvent.getParameters().clearButtonPressed;
            
            if(clear){
                this.cleanOdialog();
                return;
            }
            			
            let oTableMaterial = this.byId("oTableMaterial");	
            oTableMaterial.setModel(new JSONModel([]),"oModelDialogTable");
            
            let search = this.byId( "fSearchMaterial").getValue();
            
            let matnrBeanView = new Object();
            matnrBeanView.werks = this.byId('werks').getSelectedKey();
            matnrBeanView.matnr = search;
            matnrBeanView.maktx = search;
            
            const request = new Object();
            request.tokenObject = null;
            request.lsObject = matnrBeanView;	
            
            const json = await this.execService(InveServices.GET_MATNR,request,"get Matnr",this.showLog);

       		if(json){           		            		
                oTableMaterial.setModel(new JSONModel(json.lsObject),"oModelDialogTable");
                
               }
            
            
    
        },

        loadMatnrExplosion: async function(row){
		
            this.row = row;		
            let explosionDetail = new Object();
            explosionDetail.werks = this.byId('werks').getSelectedKey();
            explosionDetail.matnr = row.matnr;
            
            let request = new Object();
            request.tokenObject = null;
            request.lsObject = explosionDetail;		

            const json = await this.execService(InveServices.GET_EXPLOSION_DETAIL,request,"get Explosion",this.showLog);

       		if(json){
                   //Create a model and bind the table rows to this model            		
                   console.log(json);
                        
                   let arr = json.lsObject;
                   
                   for(let i = 0; i < arr.length; i++){
                       arr[i].editable = false;
                   }
                   
                   try {
                                               
                       let oModelPotisions = new JSONModel(arr);
                       
                       let oTable = this.byId('oTable');
                       oTable.setModel(oModelPotisions,"oModel");
                                                                                   
                   } catch (e) {
                       console.warn(e);
                   }
                   
                   this.oDialogMCMaterial.close();
               }
            
        },
     })
    }
);