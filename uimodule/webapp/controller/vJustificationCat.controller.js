sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
  "sap/m/MessageStrip",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/FilterType",
  "sap/ui/core/MessageType",
  "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV"
], function(Controller,MessageBox,BusyIndicator,JSONModel,MessageToast,MessageStrip,Filter,FilterOperator,FilterType,MessageType, Export, ExportTypeCSV) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vJustificationCat", {
    onInit: function() {

      this.getView().addDelegate({
          
        onBeforeShow: function(evt) {   
          this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
          
          this.cleanView();
          this.backupRecord = {};
          this.loadJustify();
        
          //BusyIndicator.hide();
        }.bind(this)
      });
    }	,


	returnAction : function() {
		
		this.flag = false;
    window.history.go(-1);
		
	},
	
	eraseNotification : function() {
		this.byId("vbFrame").setVisible(false);		
	},
	
	cleanView: function(){
		
    if (!this.ADMIN_ROLE) {
      this.removeMenuItems();
    }
		
    this.byId("bNew")?.setEnabled(true);
    this.byId("bEdit")?.setEnabled(false);
		this.byId("bCancel")?.setEnabled(false);
		this.byId("bSave")?.setEnabled(false);
		this.byId("bDelete")?.setEnabled(false);
		this.byId("jsId").setValue("");
		this.byId("justification").setValue("");
		this.byId("fSearch").setValue("");
		
		// Empty table
		let oModel = new JSONModel([]);
		
		let oTable = this.byId("oTable");
		oTable.setModel(oModel,"oModel");
		
	},

  removeMenuItems: function() {
    const toolbar = this.byId('tbJustify');
    toolbar.removeContent(this.byId('bNew'));
    toolbar.removeContent(this.byId('bEdit'));
    toolbar.removeContent(this.byId('bCancel'));
    toolbar.removeContent(this.byId('bSave'));
    toolbar.removeContent(this.byId('bDelete'));
  },
	
	getData: function(oEvent){

          this.setOnEdit(false);
           console.log("oEvent",oEvent);
                console.log("oEvent.getParameters()",oEvent.getParameters());
                
                let listItems = oEvent.getParameters().listItem;
                    let cells;
                    try {
                        cells = listItems.mAggregations.cells;
                    } catch (error) {
                        cells = undefined;
                    }
                    console.log("cells", cells);

                    let row = {
                      jsId : cells[0].getText(),
                      justification : cells[1].getText(),
                      }
                      this.backupRecord = row;

                      let jsId = this.byId("jsId");	
                      let justification = this.byId("justification");
                          jsId.setValue(row.jsId);
                          justification.setValue(row.justification);	

          let oTable = this.byId("oTable");  
          console.log("row",row);
          let selectedItems = oTable.getSelectedItems();

          if(selectedItems.length >0 ){
            this.byId("bDelete")?.setEnabled(true);
            
            if(selectedItems.length == 1){
                      this.byId("bEdit")?.setEnabled(true);

                  }
                  // else{
                  //   this.byId("bEdit")?.setEnabled(false);
                    
                  // } 
            
          }else{
            this.byId("bDelete")?.setEnabled(false);
            this.byId("bEdit")?.setEnabled(false);
            let jsId = this.byId("jsId");
            jsId.setValue("");
                    
            let justification = this.byId("justification");
            justification.setValue("");
            justification.setEditable(false); 
          }
	},
	
	filterTable: function(){
		
		let fSearch = this.byId("fSearch");
		let value = fSearch.getValue();
		let oFilterJustification = new Filter("justification",  FilterOperator.Contains, value);
        let allFilter = new Filter([oFilterJustification]);        
        let oTable = this.byId("oTable");
        oTable.getBinding("items").filter(allFilter, FilterType.Application);
	},
		
	loadJustify: async function(){
		const request = {
      tokenObject: null,
      lsObject: ""
    };

		let json = await this.execService(InveServices.GET_JUSTIFIES,request,"getJustifies",this.showLog);

    if(json){
      for(let i in json.lsObject) {
        json.lsObject[i].jsIdAux = String(json.lsObject[i].jsId);
        json.lsObject[i].createdDate = this.formatDate(new Date(json.lsObject[i].createdDate));
        json.lsObject[i].modifiedDate = this.formatDate(new Date(json.lsObject[i].modifiedDate));
      }
      let oModel = new JSONModel(json.lsObject);
 
      let oTable = this.byId("oTable");
      oTable.setModel(oModel, "oModel");
      BusyIndicator.hide();
    }
	},
	
	newRecord: function(){
		
        this.backupRecord = {};
        this.byId("jsId").setValue("");
        this.byId("justification").setValue("");
        this.byId("justification").setEditable(true);
        this.byId("pJustificationCat").scrollToElement(this.byId("justification"));
        this.byId("bNew")?.setEnabled(false);
        this.byId("bEdit")?.setEnabled(false);
        this.byId("bCancel")?.setEnabled(true);
        this.byId("bSave")?.setEnabled(true);
        this.byId("bDelete")?.setEnabled(false);
	},
	
	editRecord: function(){
        
        this.byId("justification").setEditable(true);
        
        this.byId("bNew")?.setEnabled(true);
        this.byId("bEdit")?.setEnabled(false);
        this.byId("bCancel")?.setEnabled(true);
        this.byId("bSave")?.setEnabled(true);
        this.byId("bDelete")?.setEnabled(false);
	},
	
	cancelEdition: function(){
		
    this.eraseNotification();		
		
    MessageBox.confirm(
         "¿Desea cancelar la edición?", {
                icon: MessageBox.Icon.QUESTION,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) { 
                  
                if(oAction == 'YES'){
                  this.flag = false;
                  this.setOnEdit(false);
                                    
                  let jsId = this.byId("jsId").getValue();
                  this.byId("bNew")?.setEnabled(true);
                  
                  if(jsId.length == 0){
                    this.byId("bEdit")?.setEnabled(false);
                    this.byId("bDelete")?.setEnabled(false);
                  }else{			        			
                    this.byId("bEdit")?.setEnabled(true);
                    this.byId("bDelete")?.setEnabled(true);
                  }
                                    
                  // Disable/Enable controls
                  this.byId("bCancel")?.setEnabled(false);			        		
                  this.byId("bSave")?.setEnabled(false);
                                                                        
                  this.byId("justification").setValueState("None");
                      
                  // Reset the values and disable inputs
                  try {
                    this.byId("justification").setValue(this.backupRecord.justification);
                 }catch (e) {
                this.byId("justification").setValue("");
              }   
                   this.byId("justification").setEditable(false);
          
              try {								
                    // Restore table positions
                    for(let i in this.backupRecord.positions){
                       this.backupRecord.positions[i].editable = false;
                       }
                    
                    let positions = JSON.parse(JSON.stringify(this.backupRecord.positions));
                    this.oModel.setProperty("/",positions);
                this.getView().getModel("oModel").refresh(true);
              } catch (e) {
                console.warn(e);
              }			        					        					        					        					        		
                }  			        	  			        	  
              }.bind(this)						
        }
      );
	},

	saveEdition: async function(){
    if (!this.ADMIN_ROLE) {
      this.message("No tiene permiso para realizar esta acción.", MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pJustificationCat"));
      return;
    }
				
		this.eraseNotification();
				
		let value;
		value = this.byId("justification").getValue();
		value = value.trim();
        if(value.length == 0){
          
          let message = 'Es necesario introducir la "Justificación".'; 
          this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pJustificationCat"));
          
            return;
        }
		
		let justify = new Object();
		justify.jsId = this.byId("jsId").getValue().length > 0 ? this.byId("jsId").getValue(): 0;
		justify.justification = this.byId("justification").getValue();

    const request = {
      tokenObject: null,
      lsObject: justify
    };

    let json = await this.execService(InveServices.ADD_JUSTIFY,request,"addJustify",this.showLog);

    if(json){
      this.byId("bNew")?.setEnabled(true);
      this.byId("bEdit")?.setEnabled(true);
      this.byId("bCancel")?.setEnabled(false);
      this.byId("bSave")?.setEnabled(false);
      this.byId("bDelete")?.setEnabled(true);		
      this.byId("jsId").setValue(json.lsObject.jsId)
      this.byId("justification").setEditable(false);            		
    
      let oTable = this.byId("oTable");
      let data = oTable.getModel("oModel").getData();
      let oObj = {};            		
      let state = this.backupRecord.jsId === undefined ? true : false;
                
      if(!state){//It's an edited record			
            let items = oTable.getItems();
            let jsId = this.byId("jsId").getValue();
            for(let i in items){
              let cells = items[i].getCells();
              if(cells[0].getText() == jsId){
                cells[1].setText(this.byId("justification").getValue());
                break;
              }
            } 
      }else{//It's a new record
                            
            oObj = {'jsId': json.lsObject.jsId,					
                'justification': this.byId("justification").getValue(),
                };
            data.push(oObj);
            }		
            
      let oModel = new JSONModel(data);           
      oTable.setModel(oModel,"oModel");
      let items = oTable.getItems();
      //Select the new / edited row
      for(let i in items){
        let cells = items[i].getCells();
        if(cells[0].getText() == json.lsObject.jsId){
          oTable.setSelectedItem(items[i]);
          break;
        }
      }   
        this.message('Se guardó el registro de forma exitosa.', MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pJustificationCat"));
        
        setTimeout(function() {
          this.byId("messagesBox").getItems()[0].close();  
        }.bind(this),3000)	
        BusyIndicator.hide();	
    }
	
	}, 
	
	deleteRecord: function(){
		
          //Clean messages
          let messagesBox = this.byId("messagesBox");
            messagesBox.removeAllItems();		
            
            
            MessageBox.confirm(
                "¿Desea eliminar los registros seleccionados?", {
                      icon: MessageBox.Icon.QUESTION,
                      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                      onClose: function(oAction) { 
                      if(oAction == 'YES'){
                        
                        //Empty backup record
                        this.backupRecord = {};
                        //Delete data
                        let arrToDelete = "";
                        let arr = [];
                        let oTable = this.getView().byId("oTable");
                        let selectedItems = oTable.getSelectedItems();
                        let data = oTable.getModel("oModel").getData();
                                          
                        for(let i = 0; i < data.length; i++){
                            if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
                            arr.push(data[i]);
                          }else{
                            arrToDelete += data[i].jsId + ",";
                          }			    			        			
                        }			        			
                        
                        this.deleteAction(arrToDelete, arr);
                        
                      }  			        	  			        	  
                    }.bind(this)			
                  }
			);
	}, 
	
	deleteAction: async function(arrToDelete, arr){
    if (!this.ADMIN_ROLE) {
      this.message("No tiene permiso para realizar esta acción.", MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pJustificationCat"));
      return;
    }
    
    const request = {
      tokenObject: null,
      lsObject: arrToDelete
    };

    let json = await this.execService(InveServices.DELETE_JUSTIFIES,request,"deleteJustifies",this.showLog);

    if(json){
      this.byId("bNew")?.setEnabled(true);
      this.byId("bEdit")?.setEnabled(false);
      this.byId("bCancel")?.setEnabled(false);
      this.byId("bSave")?.setEnabled(false);
      this.byId("bDelete")?.setEnabled(false);		
      this.byId("jsId").setValue("");
      this.byId("justification").setValue("");
                        
      let oModel = new JSONModel(arr);
                        
      let oTable = this.byId("oTable");
      oTable.setModel(oModel, "oModel");

      let message = 'Se elimino de forma exitosa.'; 
      this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pJustificationCat")); 
      
      setTimeout(function() {
        this.byId("messagesBox").getItems()[0].close();  
      }.bind(this),3000)
      BusyIndicator.hide(); 
    }
	},

  downloadTable: function() {
    this.exportTableToCSV(this.byId("oTable"));
  },

  exportTableToCSV: async function(oTable) {
    await BusyIndicator.show(0);

    if (oTable.getModel('oModel') == undefined || oTable.getModel('oModel').getData() == undefined || oTable.getModel('oModel').getData().length == 0) {
      MessageBox.show('Sin información para exportar.', MessageBox.Icon.Error, 'Sin datos');
      BusyIndicator.hide();
      return;
    }

    let modelData = oTable.getModel("oModel").getData();
    let columns = [];
    let attribute_column_Map = new Map();
    for (const i in modelData[0]) {
      if (this.getColumnByAttribute(i)) {
        attribute_column_Map.set(this.getColumnByAttribute(i), i)
      }
    }

    let columnsTable = oTable.getColumns();
    for (const i in columnsTable) {
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

    oExport.saveFile("Justificaciones").catch(function(oError) {
      console.error("Error al exportar csv",oError);
    }).then(function() {
      oExport.destroy();
            
    });
    BusyIndicator.hide();
  },

  getColumnByAttribute: function(att) {
    let columns = new Map();

    // Set Map Values
    columns.set("jsId", "Id");
    columns.set("justification", "Justificación");
    columns.set("createdBy", "Creado por");
    columns.set("createdDate", "Fecha C.");
    columns.set("modifiedBy", "Modificado por");
    columns.set("modifiedDate", "Fecha M.");

    return columns.get(att);
  },
    
  })
});